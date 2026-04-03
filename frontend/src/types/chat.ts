export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  created_at: string;
}

export interface Source {
  filename: string;
  page: number;
}

export interface Session {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}
