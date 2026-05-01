"use client";

import DocumentList from "@/components/documents/DocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { useDocumentStore } from "@/store/documentStore";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function DocumentsPage() {
  const { selectedDocIds } = useDocumentStore();
  const ragCount = selectedDocIds.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:opacity-70"
              style={{ background: "var(--sc-surface)", border: "1px solid var(--sc-border)", color: "var(--foreground)" }}
              aria-label="Back to chat"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl sc-gradient-bg flex items-center justify-center">
                <FileText size={17} className="text-white" />
              </div>
              <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Documents</h1>
            </div>
          </div>

          {/* RAG mode badge */}
          {ragCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "var(--sc-purple-dim)",
                border: "1px solid var(--sc-purple)",
                color: "var(--sc-purple)",
              }}
            >
              RAG Mode Active ({ragCount} selected)
            </motion.div>
          )}
        </div>

        {/* Upload section */}
        <DocumentUpload />

        {/* Documents list */}
        <DocumentList />
      </div>
    </motion.div>
  );
}
