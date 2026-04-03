# SmartChat — Backend Technical Document

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT verification) |
| LLM | NVIDIA NIM API — `nvidia/llama-3.3-nemotron-super-49b-v1` |
| Embeddings | NVIDIA NIM API — `nvidia/nv-embedqa-e5-v5` |
| Vector Store | FAISS (local, in-memory) |
| AI Orchestration | LangChain |
| Deployment | Render |

---

## Project Structure

```
smartchat-backend/
├── main.py                        # FastAPI app entry point, router registration
├── requirements.txt
├── .env
│
├── api/
│   ├── routes/
│   │   ├── chat.py                # POST /api/chat
│   │   ├── sessions.py            # GET/POST/DELETE /api/sessions
│   │   └── documents.py           # GET/POST/DELETE /api/documents
│   └── dependencies.py            # get_current_user() dependency
│
├── core/
│   ├── config.py                  # Settings from .env (pydantic BaseSettings)
│   └── supabase_client.py         # Supabase client initialization
│
├── services/
│   ├── chat_service.py            # Orchestrates Normal Mode and RAG Mode
│   ├── rag_service.py             # FAISS retrieval + context building
│   ├── document_service.py        # File parsing, chunking, embedding, FAISS insert
│   └── session_service.py         # Session CRUD logic
│
├── models/
│   ├── chat.py                    # Pydantic models for chat request/response
│   ├── document.py                # Pydantic models for document objects
│   └── session.py                 # Pydantic models for session objects
│
├── vector_store/
│   └── faiss_store.py             # FAISS index manager (load/save/search)
│
└── utils/
    ├── file_parser.py             # Extract text from PDF, TXT, DOCX
    └── text_splitter.py           # Chunk text for embedding
```

---

## Database Schema (Supabase PostgreSQL)

### `sessions` table
```sql
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New Chat',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `messages` table
```sql
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  sources     JSONB,          -- [{filename, page}] for RAG responses; NULL for Normal
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `documents` table
```sql
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  size        INTEGER,
  faiss_key   TEXT NOT NULL,   -- Key to locate chunks in FAISS store
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

> Row Level Security (RLS) must be enabled on all tables. Each user can only read/write their own rows.

---

## Authentication

All API routes are protected. The frontend sends the Supabase JWT in the `Authorization: Bearer <token>` header.

### `api/dependencies.py`
```python
from fastapi import Depends, HTTPException, Header
from core.supabase_client import supabase

async def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    response = supabase.auth.get_user(token)
    if not response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return response.user
```

Every route uses `user = Depends(get_current_user)` to authenticate.

---

## API Endpoints

### Sessions

| Method | Path | Description |
|---|---|---|
| GET | `/api/sessions` | List all sessions for current user |
| POST | `/api/sessions` | Create a new session |
| DELETE | `/api/sessions/{session_id}` | Delete a session and its messages |

### Documents

| Method | Path | Description |
|---|---|---|
| GET | `/api/documents` | List all documents for current user |
| POST | `/api/documents/upload` | Upload and process a document |
| DELETE | `/api/documents/{doc_id}` | Delete a document |

### Chat

| Method | Path | Description |
|---|---|---|
| POST | `/api/chat` | Send a message and get a response |

---

## Chat Endpoint — Core Logic

### Request Model
```python
class ChatRequest(BaseModel):
    session_id: str
    content: str
    selected_doc_ids: list[str] = []
```

### Response Model
```python
class ChatResponse(BaseModel):
    message: str
    sources: list[Source] | None = None  # Only present in RAG mode
```

### `api/routes/chat.py`
```python
@router.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user=Depends(get_current_user)):
    # 1. Save the user message to Supabase
    # 2. Fetch conversation history from Supabase (for context)
    # 3. Route to correct service based on selected_doc_ids
    if req.selected_doc_ids:
        result = await rag_service.answer(req, user.id)
    else:
        result = await chat_service.answer(req, user.id)
    # 4. Save assistant message (with sources if RAG) to Supabase
    # 5. Return response
    return result
```

---

## Normal Mode — `services/chat_service.py`

Uses the NVIDIA NIM LLM directly via LangChain.

```python
from langchain_nvidia_ai_endpoints import ChatNVIDIA

llm = ChatNVIDIA(
    model="nvidia/llama-3.3-nemotron-super-49b-v1",
    api_key=settings.NVIDIA_API_KEY,
    temperature=0.7,
)

async def answer(req: ChatRequest, user_id: str) -> ChatResponse:
    history = fetch_history(req.session_id)   # From Supabase
    messages = build_messages(history, req.content)
    response = llm.invoke(messages)
    return ChatResponse(message=response.content)
```

---

## RAG Mode — `services/rag_service.py`

Retrieves relevant chunks from FAISS, builds context, then calls the LLM with a strict system prompt.

```python
SYSTEM_PROMPT = """You are a document assistant. Answer ONLY using the provided context.
If the answer is not found in the context, respond with exactly:
"I don't have enough information to answer that."
Do not use outside knowledge. Do not guess."""

async def answer(req: ChatRequest, user_id: str) -> ChatResponse:
    # 1. Embed the user query using NVIDIA NIM Embeddings
    query_embedding = embed_query(req.content)

    # 2. Retrieve top-k chunks from FAISS for selected documents
    chunks = faiss_store.search(
        query_embedding,
        doc_ids=req.selected_doc_ids,
        top_k=5
    )

    if not chunks:
        return ChatResponse(message="I don't have enough information to answer that.")

    # 3. Build context string from chunks
    context = "\n\n".join([c.text for c in chunks])

    # 4. Call LLM with system prompt + context + user question
    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {req.content}")
    ])

    # 5. Return response with source references
    sources = [Source(filename=c.filename, page=c.page) for c in chunks]
    return ChatResponse(message=response.content, sources=sources)
```

---

## Document Processing — `services/document_service.py`

When a user uploads a document:

```
Upload → Parse Text → Split into Chunks → Embed Chunks → Store in FAISS → Save metadata to Supabase
```

### Step by step

1. **Parse** — Extract raw text from the file (`utils/file_parser.py`)
   - PDF → `pdfplumber`
   - DOCX → `python-docx`
   - TXT → plain read

2. **Chunk** — Split text into overlapping chunks (`utils/text_splitter.py`)
   - Chunk size: 500 tokens
   - Overlap: 50 tokens
   - Each chunk stores: `{text, filename, page_number, doc_id}`

3. **Embed** — Generate embeddings using NVIDIA NIM
   ```python
   from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings

   embeddings = NVIDIAEmbeddings(
       model="nvidia/nv-embedqa-e5-v5",
       api_key=settings.NVIDIA_API_KEY
   )
   vectors = embeddings.embed_documents([chunk.text for chunk in chunks])
   ```

4. **Store in FAISS** — Add vectors with metadata to the local FAISS index

5. **Save to Supabase** — Store document metadata (filename, size, faiss_key) in the `documents` table

---

## FAISS Store — `vector_store/faiss_store.py`

FAISS runs in-memory on the Render server. The index is persisted to disk and reloaded on startup.

```python
import faiss
import pickle

class FAISSStore:
    def __init__(self):
        self.index = faiss.IndexFlatL2(1024)   # 1024 = NVIDIA embedding dimension
        self.metadata = []                      # Parallel list: {doc_id, filename, page, text}

    def add(self, vectors, metadata_list):
        self.index.add(vectors)
        self.metadata.extend(metadata_list)

    def search(self, query_vector, doc_ids, top_k=5):
        distances, indices = self.index.search(query_vector, top_k * 10)
        results = [self.metadata[i] for i in indices[0] if self.metadata[i]['doc_id'] in doc_ids]
        return results[:top_k]

    def save(self, path="faiss_index.bin"):
        faiss.write_index(self.index, path)
        with open("faiss_meta.pkl", "wb") as f:
            pickle.dump(self.metadata, f)

    def load(self, path="faiss_index.bin"):
        self.index = faiss.read_index(path)
        with open("faiss_meta.pkl", "rb") as f:
            self.metadata = pickle.load(f)
```

> **Note**: FAISS data is stored locally on the Render instance. For a production upgrade, replace with a persistent vector DB like Pinecone or pgvector (Supabase).

---

## Configuration — `core/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    NVIDIA_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str   # Service role key (server-side only)
    ALLOWED_ORIGINS: str = "https://your-vercel-app.vercel.app"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Environment Variables

```env
NVIDIA_API_KEY=your-nvidia-nim-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

---

## CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Dependencies (`requirements.txt`)

```
fastapi
uvicorn
python-dotenv
pydantic-settings
supabase
langchain
langchain-nvidia-ai-endpoints
faiss-cpu
pdfplumber
python-docx
python-multipart
```

---

## Deployment (Render)

- Connect GitHub repo to Render as a **Web Service**
- **Build command**: `pip install -r requirements.txt`
- **Start command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Set all environment variables in Render's environment settings
- Render auto-deploys on every push to `main`

> **Free tier note**: Render's free tier spins down after inactivity. The first request after sleep will be slow (~30s). Upgrade to a paid tier for production use.

---

## Key Rules & Constraints

- The `SUPABASE_SERVICE_KEY` is **only used server-side**. Never expose it to the frontend.
- All database queries must respect user ownership. Always filter by `user_id`.
- RAG mode must **never** use the LLM's general knowledge — context is limited strictly to retrieved chunks.
- If no relevant chunks are found, return the fixed string `"I don't have enough information to answer that."` — no exceptions.
- Conversation history is fetched fresh from Supabase on every request to maintain accuracy.
