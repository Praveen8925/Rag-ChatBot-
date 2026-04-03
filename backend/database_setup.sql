-- 1. Create 'sessions' table
CREATE TABLE public.sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL DEFAULT 'New Chat'::text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 2. Create 'documents' table
CREATE TABLE public.documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    filename text NOT NULL,
    size integer,
    faiss_key text NOT NULL,
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT documents_pkey PRIMARY KEY (id),
    CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3. Create 'messages' table
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    sources jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions (id) ON DELETE CASCADE,
    CONSTRAINT messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- 4. RLS Policies for 'sessions' table
CREATE POLICY "Allow ALL for users based on user_id" ON public.sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 5. RLS Policies for 'documents' table
CREATE POLICY "Allow ALL for users based on user_id" ON public.documents
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 6. RLS Policies for 'messages' table
CREATE POLICY "Allow ALL for users based on session ownership" ON public.messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = messages.session_id AND s.user_id = auth.uid()
  )
);
