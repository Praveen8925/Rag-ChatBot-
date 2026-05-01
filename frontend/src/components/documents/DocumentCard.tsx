"use client";

import { Document } from "@/types/document";
import { useDeleteDocument } from "@/hooks/useDocuments";
import { useDocumentStore } from "@/store/documentStore";
import { Trash2, FileText, FileType, File } from "lucide-react";
import { motion } from "framer-motion";

interface DocumentCardProps {
  document: Document;
  index?: number;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText size={18} className="text-red-400" />;
  if (ext === "docx") return <FileType size={18} className="text-blue-400" />;
  return <File size={18} style={{ color: "var(--sc-text-muted)" }} />;
}

export default function DocumentCard({ document, index = 0 }: DocumentCardProps) {
  const deleteDocument = useDeleteDocument();
  const { selectedDocIds, toggleSelect } = useDocumentStore();

  const isSelected = selectedDocIds.includes(document.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      onClick={() => toggleSelect(document.id)}
      id={`doc-card-${document.id}`}
      className="relative p-4 rounded-2xl cursor-pointer group transition-all duration-200"
      style={{
        background: isSelected ? "var(--sc-purple-dim)" : "var(--sc-surface)",
        border: `1px solid ${isSelected ? "var(--sc-purple)" : "var(--sc-border)"}`,
        boxShadow: isSelected ? "0 0 0 1px var(--sc-purple)" : "none",
      }}
    >
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--sc-surface-raised)" }}
        >
          {getFileIcon(document.filename)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--foreground)" }}
          >
            {document.filename}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--sc-text-muted)" }}>
            {(document.size / 1024).toFixed(2)} KB
          </p>
          <p className="text-xs" style={{ color: "var(--sc-text-muted)" }}>
            {new Date(document.uploaded_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Selection circle / delete */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Selection indicator */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: isSelected ? "var(--sc-purple)" : "transparent",
              border: `1.5px solid ${isSelected ? "var(--sc-purple)" : "var(--sc-border)"}`,
            }}
          >
            {isSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Delete button */}
          <button
            id={`delete-doc-${document.id}`}
            onClick={(e) => {
              e.stopPropagation();
              deleteDocument.mutate(document.id);
            }}
            disabled={deleteDocument.isPending}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
              opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
            style={{ color: "var(--sc-text-muted)" }}
            aria-label="Delete document"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}