# SmartChat — Frontend Technical Document

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Library | Shadcn/ui + Radix UI |
| State Management | Zustand |
| Data Fetching | TanStack Query (React Query) |
| Form Handling | React Hook Form |
| Deployment | Vercel |

---

## Project Structure

```
smartchat-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + main layout
│   │   ├── chat/
│   │   │   ├── page.tsx            # Default chat landing
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx        # Individual chat session
│   │   └── documents/
│   │       └── page.tsx            # Document management screen
│   ├── layout.tsx                  # Root layout (fonts, providers)
│   └── page.tsx                    # Redirect to /chat
│
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx          # Main chat message area
│   │   ├── ChatInput.tsx           # Message input + send button
│   │   ├── ChatMessage.tsx         # Individual message bubble
│   │   ├── ChatSessionList.tsx     # Sidebar list of sessions
│   │   ├── ModeIndicator.tsx       # "RAG Mode Active" banner
│   │   └── SourceReference.tsx     # "report.pdf · Page 7" tag
│   ├── documents/
│   │   ├── DocumentUpload.tsx      # Upload dropzone
│   │   ├── DocumentList.tsx        # List of uploaded documents
│   │   ├── DocumentCard.tsx        # Single document card
│   │   └── DocumentSelector.tsx    # Checkbox selection for RAG
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── MobileNav.tsx
│   └── ui/                         # Shadcn/ui generated components
│
├── store/
│   ├── chatStore.ts                # Zustand: sessions, active session, messages
│   ├── documentStore.ts            # Zustand: uploaded docs, selected docs
│   └── modeStore.ts                # Zustand: normal/RAG mode derived state
│
├── hooks/
│   ├── useChat.ts                  # TanStack Query: send message, fetch history
│   ├── useDocuments.ts             # TanStack Query: upload, delete, list docs
│   └── useSession.ts               # TanStack Query: create/list/delete sessions
│
├── lib/
│   ├── api.ts                      # Axios instance with base URL + auth header
│   ├── supabase.ts                 # Supabase client (auth)
│   └── utils.ts                    # cn() and shared helpers
│
├── types/
│   ├── chat.ts                     # Message, Session types
│   ├── document.ts                 # Document, UploadResponse types
│   └── api.ts                      # API request/response shapes
│
└── middleware.ts                   # Supabase auth route protection
```

---

## Pages

### `/login` and `/signup`
Authentication pages using Supabase Auth. React Hook Form handles input validation. On success, redirects to `/chat`.

### `/chat` (Dashboard)
Main application shell. Left sidebar shows chat sessions. Main area renders the active chat window. A persistent mode indicator appears when documents are selected.

### `/chat/[sessionId]`
Loads and renders messages for a specific session. Each message renders differently based on role (user / assistant) and mode (normal / RAG with source references).

### `/documents`
Document management screen. Users can upload files (PDF, TXT, DOCX), view uploaded documents, delete them, and select which documents to activate for RAG mode.

---

## State Management (Zustand)

### `chatStore.ts`
```ts
interface ChatState {
  sessions: Session[]
  activeSessionId: string | null
  messages: Record<string, Message[]>
  setActiveSession: (id: string) => void
  addMessage: (sessionId: string, message: Message) => void
  createSession: () => void
  deleteSession: (id: string) => void
}
```

### `documentStore.ts`
```ts
interface DocumentState {
  documents: Document[]
  selectedDocIds: string[]
  toggleSelect: (id: string) => void
  clearSelection: () => void
  setDocuments: (docs: Document[]) => void
}
```

### Mode is Derived (not stored separately)
```ts
// If selectedDocIds.length > 0  →  RAG Mode
// If selectedDocIds.length === 0 →  Normal Mode
const useMode = () => {
  const selectedDocIds = useDocumentStore(s => s.selectedDocIds)
  return selectedDocIds.length > 0 ? 'rag' : 'normal'
}
```

---

## Data Fetching (TanStack Query)

All server interactions go through TanStack Query for caching, loading states, and error handling.

### Key Query Keys
```ts
['sessions']                          // All chat sessions
['messages', sessionId]               // Messages for a session
['documents']                         // All uploaded documents
```

### Key Mutations
```ts
sendMessage({ sessionId, content, selectedDocIds })   // POST /api/chat
uploadDocument(formData)                               // POST /api/documents/upload
deleteDocument(docId)                                  // DELETE /api/documents/:id
createSession()                                        // POST /api/sessions
deleteSession(sessionId)                               // DELETE /api/sessions/:id
```

---

## API Integration

### `lib/api.ts`
```ts
import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  config.headers.Authorization = `Bearer ${data.session?.access_token}`
  return config
})

export default api
```

---

## Key Components

### `ModeIndicator.tsx`
Displays a persistent banner when RAG mode is active, listing the selected document names.

```tsx
{mode === 'rag' && (
  <div className="border rounded-lg px-4 py-2 text-sm bg-amber-50">
    <span className="font-medium">RAG Mode Active</span>
    <span className="ml-2 text-muted-foreground">
      {selectedDocNames.join(', ')}
    </span>
  </div>
)}
```

### `SourceReference.tsx`
Renders source attribution tags below RAG responses.

```tsx
<Badge variant="outline" className="text-xs">
  {source.filename} · Page {source.page}
</Badge>
```

### `DocumentUpload.tsx`
Drag-and-drop file upload using React Hook Form + a native file input. On submit, calls the `uploadDocument` mutation. Accepted formats: PDF, TXT, DOCX.

---

## Forms (React Hook Form + Zod)

Used for login, signup, and document upload forms.

```ts
const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
  resolver: zodResolver(loginSchema)
})
```

Zod schemas validate all form inputs client-side before any API call is made.

---

## Authentication Flow (Supabase Auth)

1. User submits login form → `supabase.auth.signInWithPassword()`
2. Session token is stored automatically by the Supabase client
3. `middleware.ts` checks the session on every protected route; redirects to `/login` if missing
4. All API requests attach the token via the Axios request interceptor
5. Logout → `supabase.auth.signOut()` → redirect to `/login`

---

## TypeScript Types

### `types/chat.ts`
```ts
export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]     // Only present in RAG mode responses
  created_at: string
}

export interface Source {
  filename: string
  page: number
}

export interface Session {
  id: string
  title: string
  created_at: string
}
```

### `types/document.ts`
```ts
export interface Document {
  id: string
  filename: string
  size: number
  uploaded_at: string
}
```

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Deployment (Vercel)

- Connect the GitHub repo to Vercel
- Set all environment variables in Vercel project settings
- Vercel auto-deploys on every push to `main`
- Preview deployments are created automatically for all PRs

---

## UI/UX Rules

- **Mode always visible** — The current mode (Normal / RAG) must always be shown. Never hidden.
- **Source always shown** — Every RAG response must display which document and page it came from.
- **No ambiguity** — If the backend returns "not enough information", display it clearly as-is.
- **Loading states** — All async actions (send message, upload file) must show a spinner or skeleton.
- **Optimistic UI** — User messages appear immediately in the chat; a loading bubble shows while waiting for the assistant response.
- **Empty states** — Show helpful prompts when there are no sessions or no documents yet.
