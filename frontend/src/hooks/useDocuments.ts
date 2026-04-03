"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/lib/api';
import { Document } from '@/types/document';

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data } = await api.get('/api/documents');
      return data;
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/api/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
