"use client";

import { Document } from "@/types/document";
import { useDeleteDocument } from "@/hooks/useDocuments";
import { useDocumentStore } from "@/store/documentStore";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Trash2 } from "lucide-react";

interface DocumentCardProps {
  document: Document;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const deleteDocument = useDeleteDocument();
  const { selectedDocIds, toggleSelect } = useDocumentStore();

  const isSelected = selectedDocIds.includes(document.id);

  return (
    <div className="p-4 border rounded-lg flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Checkbox
          id={`doc-${document.id}`}
          checked={isSelected}
          onCheckedChange={() => toggleSelect(document.id)}
        />
        <div>
          <p className="font-medium">{document.filename}</p>
          <p className="text-sm text-gray-500">
            {(document.size / 1024).toFixed(2)} KB • Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => deleteDocument.mutate(document.id)}
        disabled={deleteDocument.isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}