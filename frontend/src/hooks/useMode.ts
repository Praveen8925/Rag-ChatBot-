import { useDocumentStore } from '@/store/documentStore';

export const useMode = () => {
  const selectedDocIds = useDocumentStore((s) => s.selectedDocIds);
  return selectedDocIds.length > 0 ? 'rag' : 'normal';
};
