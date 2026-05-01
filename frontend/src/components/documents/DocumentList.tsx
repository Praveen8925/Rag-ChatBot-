"use client";

import { useDocuments } from "@/hooks/useDocuments";
import DocumentCard from "./DocumentCard";
import { motion } from "framer-motion";
import { FileQuestion } from "lucide-react";

export default function DocumentList() {
  const { data: documents, isLoading, error } = useDocuments();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl animate-pulse"
            style={{ background: "var(--sc-surface)" }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-6 rounded-2xl text-center"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
      >
        <p className="text-sm text-red-400">Error loading documents. Please try again.</p>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 flex flex-col items-center gap-4 text-center"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--sc-surface)" }}
        >
          <FileQuestion size={26} style={{ color: "var(--sc-text-muted)" }} />
        </div>
        <div>
          <p className="font-medium" style={{ color: "var(--foreground)" }}>No documents yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--sc-text-muted)" }}>
            Upload your first document above to get started
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--sc-text-muted)" }}>
        Your Documents ({documents.length})
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc, index) => (
          <DocumentCard key={doc.id} document={doc} index={index} />
        ))}
      </div>
    </div>
  );
}