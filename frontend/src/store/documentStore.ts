import { create } from 'zustand';
import { Document } from '@/types/document';

interface DocumentState {
  documents: Document[];
  selectedDocIds: string[];
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setDocuments: (docs: Document[]) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  selectedDocIds: [],
  toggleSelect: (id) =>
    set((state) => ({
      selectedDocIds: state.selectedDocIds.includes(id)
        ? state.selectedDocIds.filter((docId) => docId !== id)
        : [...state.selectedDocIds, id],
    })),
  clearSelection: () => set({ selectedDocIds: [] }),
  setDocuments: (docs) => set({ documents: docs }),
}));
