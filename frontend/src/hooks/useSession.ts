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
      try {
        await api.delete(`/api/sessions/${sessionId}`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Session already deleted, treat as success
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: any) => {
      console.error('Delete session error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to delete session';
      throw new Error(message);
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      try {
        const { data } = await api.put(`/api/sessions/${sessionId}`, { title });
        return data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error('Session not found or has been deleted');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: any) => {
      console.error('Update session error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to update session';
      throw new Error(message);
    },
  });
}
