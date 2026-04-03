import faiss
import numpy as np
import pickle
from uuid import UUID
from typing import List, Tuple

class FAISSStore:
    def __init__(self, dimension: int = 1024):
        self.index = faiss.IndexFlatL2(dimension)
        self.metadata = []  # Stores dicts of {doc_id, filename, page, text}

    def add(self, vectors: np.ndarray, metadata_list: List[dict]):
        if vectors.shape[0] != len(metadata_list):
            raise ValueError("Number of vectors and metadata items must be the same.")
        self.index.add(vectors)
        self.metadata.extend(metadata_list)

    def search(self, query_vector: np.ndarray, doc_ids: List[UUID], top_k: int = 5) -> List[dict]:
        if self.index.ntotal == 0:
            return []
            
        distances, indices = self.index.search(query_vector, self.index.ntotal)
        
        results = []
        for i in range(indices.shape[1]):
            idx = indices[0][i]
            if self.metadata[idx]['doc_id'] in doc_ids:
                results.append({
                    "text": self.metadata[idx]['text'],
                    "filename": self.metadata[idx]['filename'],
                    "page": self.metadata[idx]['page'],
                    "distance": distances[0][i]
                })
            if len(results) == top_k:
                break
        return results

    def delete_by_doc_id(self, doc_id: UUID):
        """Delete all vectors associated with a document ID by rebuilding the index."""
        indices_to_remove = [i for i, meta in enumerate(self.metadata) if meta['doc_id'] == doc_id]
        if not indices_to_remove:
            return

        # Get current dimension
        dimension = self.index.d

        # Keep only the vectors and metadata that should not be removed
        indices_to_keep = [i for i in range(len(self.metadata)) if i not in indices_to_remove]

        if not indices_to_keep:
            # If all vectors are removed, create a new empty index
            self.index = faiss.IndexFlatL2(dimension)
            self.metadata = []
            return

        # Extract vectors to keep
        vectors_to_keep = []
        for i in indices_to_keep:
            # Reconstruct vector from index
            vector = faiss.vector_to_array(self.index.reconstruct(int(i)))
            vectors_to_keep.append(vector)

        # Keep metadata for remaining documents
        new_metadata = [self.metadata[i] for i in indices_to_keep]

        # Recreate the index with remaining vectors
        self.index = faiss.IndexFlatL2(dimension)
        if vectors_to_keep:
            vectors_array = np.array(vectors_to_keep).astype('float32')
            self.index.add(vectors_array)

        self.metadata = new_metadata

    def save(self, index_path: str, metadata_path: str):
        faiss.write_index(self.index, index_path)
        with open(metadata_path, 'wb') as f:
            pickle.dump(self.metadata, f)

    def load(self, index_path: str, metadata_path: str):
        try:
            self.index = faiss.read_index(index_path)
            with open(metadata_path, 'rb') as f:
                self.metadata = pickle.load(f)
        except FileNotFoundError:
            print("FAISS index or metadata not found. Starting with a new empty store.")
        except Exception as e:
            print(f"Error loading FAISS store: {e}. Starting with a new empty store.")

# Global instance
faiss_store = FAISSStore()
