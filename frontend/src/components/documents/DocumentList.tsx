"use client";

import { useDocuments } from "@/hooks/useDocuments";
import DocumentCard from "./DocumentCard";

export default function DocumentList() {
  const { data: documents, isLoading, error } = useDocuments();

  if (isLoading) {
    return <p>Loading documents...</p>;
  }

  if (error) {
    return <p>Error loading documents.</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Your Documents</h2>
      {documents && documents.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-gray-500">No documents uploaded yet.</p>
      )}
    </div>
  );
}