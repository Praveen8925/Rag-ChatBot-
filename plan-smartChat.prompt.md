# Plan: Build SmartChat Web Application

## TL;DR
Build a full-stack chatbot with dual modes (Normal & RAG). Start with backend API (FastAPI + Supabase + FAISS), then build frontend UI (Next.js + Tailwind). Prioritize backend authentication and document processing first, then add frontend chat/document management interfaces. Deploy to Render (backend) and Vercel (frontend).

---

## Phase 1: Backend Foundation (Weeks 1–2)

### 1.1 Project Setup & Environment
- **1.1.1** Create GitHub repo: `smartchat-backend`
- **1.1.2** Initialize FastAPI project with folder structure
- **1.1.3** Set up Python virtual environment & `requirements.txt`
- **1.1.4** Configure environment variables (`.env` template with placeholders)
- **1.1.5** Set up CORS middleware and basic error handling

**Dependencies:**
- fastapi, uvicorn, python-dotenv, pydantic-settings
- supabase (for auth + database)
- langchain, langchain-nvidia-ai-endpoints (for LLM/embeddings)
- faiss-cpu, pdfplumber, python-docx, python-multipart (for document processing)

### 1.2 Supabase Configuration
- **1.2.1** Create Supabase project (from .env config)
- **1.2.2** Set up authentication with email/password + Google OAuth
- **1.2.3** Create database schema:
  - `sessions` table (id, user_id, title, created_at)
  - `messages` table (id, session_id, role, content, sources, created_at)
  - `documents` table (id, user_id, filename, size, faiss_key, uploaded_at)
- **1.2.4** Enable Row Level Security (RLS) on all tables
- **1.2.5** Add RLS policies to enforce user-data isolation

### 1.3 Authentication Service
- **1.3.1** Implement `api/dependencies.py` → `get_current_user()` (JWT verification)
- **1.3.2** Protect all API routes with auth dependency
- **1.3.3** Add Supabase client initialization in `core/supabase_client.py`
- **1.3.4** Test JWT token flow (valid/expired/invalid cases)

---

## Phase 2: API Endpoints & Core Services (Weeks 2–3)

### 2.1 Session Management API
- **2.1.1** `GET /api/sessions` — List all user sessions
- **2.1.2** `POST /api/sessions` — Create new session
- **2.1.3** `DELETE /api/sessions/{session_id}` — Delete session + cascade messages
- **2.1.4** Implement `services/session_service.py` for CRUD logic

### 2.2 Document Processing Pipeline
- **2.2.1** Implement `utils/file_parser.py` (extract text from PDF/DOCX/TXT)
- **2.2.2** Implement `utils/text_splitter.py` (chunk text with overlap: 500 tokens, 50 overlap)
- **2.2.3** Implement `vector_store/faiss_store.py` (add/search/save/load FAISS index)
  - Dimension: 1024 (NVIDIA embedding size)
  - Store metadata (doc_id, filename, page, text)
- **2.2.4** Set up in-memory FAISS instance with disk persistence

### 2.3 Document API & Service
- **2.3.1** `POST /api/documents/upload` — Upload file, parse, embed, store
  - Parse file → Chunk text → Embed chunks (NVIDIA API) → Add to FAISS → Save metadata to DB
- **2.3.2** `GET /api/documents` — List user's uploaded documents
- **2.3.3** `DELETE /api/documents/{doc_id}` — Delete document + remove from FAISS
- **2.3.4** Implement `services/document_service.py` orchestrating the pipeline
- **2.3.5** Test embedding API integration with NVIDIA NIM

### 2.4 LLM Service Setup
- **2.4.1** Configure NVIDIA NIM LLM via LangChain (`ChatNVIDIA`)
- **2.4.2** Configure NVIDIA NIM Embeddings via LangChain (`NVIDIAEmbeddings`)
- **2.4.3** Test API key and connection to NVIDIA integrate.api.nvidia.com

---

## Phase 3: Chat Logic — Normal & RAG Modes (Week 3–4)

### 3.1 Normal Mode Chat Service
- **3.1.1** Implement `services/chat_service.py` → `answer()` method
  - Fetch conversation history from Supabase
  - Build message list (system + history + user query)
  - Call NVIDIA LLM
  - Return response without sources

### 3.2 RAG Mode Chat Service
- **3.2.1** Implement `services/rag_service.py` → `answer()` method
  - Embed user query using NVIDIA embeddings
  - Search FAISS for top-5 chunks from selected documents
  - Build context from chunks
  - Call LLM with strict system prompt (context-only rule)
  - Extract and return source references (filename, page)
- **3.2.2** Enforce "I don't have enough information..." response when no chunks found

### 3.3 Chat Endpoint
- **3.3.1** `POST /api/chat` — Main chat route
  - Request: `{ session_id, content, selected_doc_ids }`
  - Save user message to DB
  - Route to Normal or RAG service based on `selected_doc_ids`
  - Save assistant response (+ sources if RAG) to DB
  - Return response
- **3.3.2** Add request/response models in `models/chat.py`
- **3.3.3** Test both modes with real documents

### 3.4 Database Integration
- **3.4.1** Implement message fetch logic (conversation history)
- **3.4.2** Implement message save logic (user + assistant messages)
- **3.4.3** Add created_at timestamps

---

## Phase 4: Backend Testing & Refinement (Week 4)

### 4.1 Unit & Integration Tests
- **4.1.1** Test document parsing for all file types
- **4.1.2** Test FAISS CRUD operations
- **4.1.3** Test Normal Mode chat endpoint
- **4.1.4** Test RAG Mode chat with real documents
- **4.1.5** Test authentication & RLS enforcement
- **4.1.6** Test error handling (invalid tokens, missing docs, API timeouts)

### 4.2 Performance & Load Testing (Optional)
- **4.2.1** Test FAISS search speed with large indexes
- **4.2.2** Test concurrent requests

### 4.3 Backend Deployment to Render
- **4.3.1** Push backend repo to GitHub
- **4.3.2** Connect Render as Web Service
- **4.3.3** Configure build command: `pip install -r requirements.txt`
- **4.3.4** Configure start command: `uvicorn main:app --host 0.0.0.0`
- **4.3.5** Set environment variables in Render
- **4.3.6** Test in production (health checks, endpoints)

---

## Phase 5: Frontend Setup & Pages (Weeks 5–6)

### 5.1 Next.js Project Initialization
- **5.1.1** Create GitHub repo: `smartchat-frontend`
- **5.1.2** `npx create-next-app@latest` with TypeScript, App Router, Tailwind
- **5.1.3** Set up folder structure (app, components, store, hooks, lib, types)
- **5.1.4** Install dependencies: zustand, @tanstack/react-query, react-hook-form, zod, shadcn/ui

### 5.2 Authentication Pages
- **5.2.1** Set up Supabase client (`lib/supabase.ts`)
- **5.2.2** Build `/login` page (email/password + Google OAuth)
- **5.2.3** Build `/signup` page
- **5.2.4** Implement authentication middleware (`middleware.ts`) — protect routes
- **5.2.5** Test login/signup flow

### 5.3 State Management (Zustand)
- **5.3.1** Create `store/chatStore.ts` (sessions, activeSessionId, messages)
- **5.3.2** Create `store/documentStore.ts` (documents, selectedDocIds)
- **5.3.3** Create derived mode selector (RAG if selectedDocIds.length > 0)

### 5.4 API Integration
- **5.4.1** Set up Axios instance with auth header (`lib/api.ts`)
- **5.4.2** Configure TanStack Query with caching & error handling
- **5.4.3** Create hooks:
  - `useChat()` — send message, fetch history
  - `useDocuments()` — upload, list, delete
  - `useSession()` — create, list, delete sessions

### 5.5 Core UI Components
- **5.5.1** Build `components/chat/ChatWindow.tsx` (message list)
- **5.5.2** Build `components/chat/ChatMessage.tsx` (user + assistant bubbles)
- **5.5.3** Build `components/chat/ChatInput.tsx` (input + send button, optimistic UI)
- **5.5.4** Build `components/chat/ModeIndicator.tsx` (RAG Mode banner)
- **5.5.5** Build `components/chat/SourceReference.tsx` (source tags)

### 5.6 Document Management Components
- **5.6.1** Build `components/documents/DocumentUpload.tsx` (drag-drop upload)
- **5.6.2** Build `components/documents/DocumentList.tsx`
- **5.6.3** Build `components/documents/DocumentCard.tsx`
- **5.6.4** Build `components/documents/DocumentSelector.tsx` (checkboxes for RAG)

### 5.7 Layout Components
- **5.7.1** Build `components/layout/Sidebar.tsx` (chat sessions list)
- **5.7.2** Build `components/layout/TopBar.tsx` (logo, user menu, logout)
- **5.7.3** Build `components/layout/MobileNav.tsx` (responsive)

---

## Phase 6: Pages & Routing (Week 6)

### 6.1 Chat Pages
- **6.1.1** `/chat` landing page (recent sessions or empty state)
- **6.1.2** `/chat/[sessionId]` (chat window + messages)
- **6.1.3** Implement session switching in sidebar

### 6.2 Documents Page
- **6.2.1** `/documents` (upload area + document list + selector)
- **6.2.2** Connect to document store and TanStack Query

### 6.3 Root Layout
- **6.3.1** Set up providers (Supabase, TanStack Query, Zustand)
- **6.3.2** Global fonts & styling

---

## Phase 7: Frontend Testing & Polish (Week 7)

### 7.1 Functional Testing
- **7.1.1** Test create new session
- **7.1.2** Test send message in Normal Mode
- **7.1.3** Test upload document
- **7.1.4** Test select/deselect documents → RAG mode activation
- **7.1.5** Test send message in RAG Mode → verify sources appear
- **7.1.6** Test delete session
- **7.1.7** Test delete document
- **7.1.8** Test logout

### 7.2 UI/UX Refinement
- **7.2.1** Ensure mode indicator is always visible
- **7.2.2** Verify loading states (spinners, skeletons)
- **7.2.3** Verify empty states (no sessions, no documents)
- **7.2.4** Test responsive design (mobile, tablet, desktop)
- **7.2.5** Test accessibility (keyboard navigation, contrast)

### 7.3 Error Handling
- **7.3.1** Test network errors (retry logic)
- **7.3.2** Test auth expiration (refresh token logic)
- **7.3.3** Test large file uploads (progress indicator)
- **7.3.4** Test insufficient document context (display "I don't have enough information...")

---

## Phase 8: Frontend Deployment (Week 8)

### 8.1 Vercel Deployment
- **8.1.1** Push frontend repo to GitHub
- **8.1.2** Connect repo to Vercel
- **8.1.3** Set environment variables:
  - `NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **8.1.4** Configure auto-deploy on main branch
- **8.1.5** Test production build locally: `npm run build && npm start`

### 8.2 Testing in Production
- **8.2.1** Sign up with test account
- **8.2.2** Test chat, document upload, RAG mode end-to-end
- **8.2.3** Monitor Vercel analytics & errors

---

## Verification Steps

### Backend Verification
1. ✅ All API endpoints return 200/201 with correct schema
2. ✅ JWT auth rejects invalid tokens (401)
3. ✅ RLS policies prevent cross-user data access
4. ✅ Document parsing works for PDF/DOCX/TXT
5. ✅ FAISS embeds and retrieves chunks correctly
6. ✅ RAG mode returns sources; Normal mode does not
7. ✅ "I don't have enough information..." appears when needed
8. ✅ Render deployment stays live 24/7

### Frontend Verification
1. ✅ Sign up → login flow works
2. ✅ Create session → see in sidebar
3. ✅ Send message → appears optimistically, then assistant response arrives
4. ✅ Mode indicator shows only in RAG mode
5. ✅ Sources appear below RAG responses
6. ✅ Upload document → appears in list
7. ✅ Select document → RAG mode activates
8. ✅ Delete document → removed from FAISS + UI
9. ✅ Vercel deployment auto-updates on push
10. ✅ Mobile responsiveness verified

---

## Critical Files to Create/Modify

**Backend:**
- `main.py` — FastAPI app entry point
- `api/routes/chat.py`, `sessions.py`, `documents.py`
- `api/dependencies.py` — Auth middleware
- `services/chat_service.py`, `rag_service.py`, `document_service.py`, `session_service.py`
- `core/config.py`, `core/supabase_client.py`
- `vector_store/faiss_store.py`
- `utils/file_parser.py`, `utils/text_splitter.py`
- `models/chat.py`, `document.py`, `session.py`

**Frontend:**
- `app/layout.tsx`, `app/page.tsx`
- `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/chat/page.tsx`, `app/(dashboard)/chat/[sessionId]/page.tsx`
- `app/(dashboard)/documents/page.tsx`
- `components/chat/*.tsx`, `components/documents/*.tsx`, `components/layout/*.tsx`
- `store/*.ts`, `hooks/*.ts`, `lib/api.ts`, `lib/supabase.ts`
- `middleware.ts`

---

## Key Technical Decisions

1. **FAISS for MVP** — Fast, in-memory, no external infra. Plan upgrade to Pinecone/pgvector for production scale.
2. **Backend First** — Ensures stable API before frontend development; reduces rework.
3. **Render Free Tier** — 15-min cold start accepted for MVP. Upgrade to paid tier for production.
4. **Zustand + TanStack Query** — Lightweight state management + server state caching; avoids Redux complexity.
5. **Strict RAG Enforcement** — System prompt + context-only retrieval prevents hallucination; aligns with SmartChat promise.

---

## Dependencies Summary

**Backend:** fastapi, uvicorn, supabase, langchain, langchain-nvidia-ai-endpoints, faiss-cpu, pdfplumber, python-docx, pydantic-settings

**Frontend:** next@14, react, typescript, tailwind, zustand, @tanstack/react-query, react-hook-form, zod, @radix-ui/*, shadcn/ui

---

## Timeline (Estimated)
- **Weeks 1–4:** Backend (foundation, APIs, chat logic, deployment)
- **Weeks 5–7:** Frontend (auth, UI, components, testing)
- **Week 8:** Deployment & production verification
- **Total:** ~8 weeks for MVP

---

## Further Considerations

1. **Scaling FAISS** → For 100K+ documents, consider pgvector (Supabase built-in) or Pinecone
2. **LLM Selection** → Current: `openai/gpt-oss-120b`. Consider swapping to `nvidia/llama-3.3-nemotron-super-49b-v1` per docs for cost optimization
3. **Rate Limiting** → Add per-user rate limits on chat/upload endpoints before production launch
