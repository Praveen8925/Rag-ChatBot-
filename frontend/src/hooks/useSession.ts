"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/lib/api';
import { Session } from '@/types/chat';

export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await api.get('/api/sessions');
      return data;
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/sessions');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/api/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
