"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/lib/api';
import { Message } from '@/types/chat';

interface ChatRequest {
  session_id: string;
  content: string;
  selected_doc_ids?: string[];
}

export function useMessages(sessionId: string) {
  return useQuery<Message[]>({
    queryKey: ['messages', sessionId],
    queryFn: async () => {
      // This endpoint needs to be implemented in the backend
      const { data } = await api.get(`/api/sessions/${sessionId}/messages`);
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: ChatRequest) => {
      const { data } = await api.post('/api/chat', request, {
        responseType: 'stream',
      });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.session_id] });
    },
  });
}
