"use client";

import { useUploadDocument } from "@/hooks/useDocuments";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, UploadCloud } from "lucide-react";

export default function DocumentUpload() {
  const uploadDocument = useUploadDocument();
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Upload files one by one
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file); // Backend expects "file" not "files"

      try {
        await uploadDocument.mutateAsync(formData);
      } catch (error) {
        console.error(`Upload failed for ${file.name}`, error);
        // Continue with next file even if one fails
      }
    }

    setFiles([]); // Clear files after all uploads
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        id="document-dropzone"
        className="relative cursor-pointer rounded-2xl p-10 transition-all duration-200 group"
        style={{
          border: `2px dashed ${isDragActive ? "var(--sc-purple)" : "var(--sc-border)"}`,
          background: isDragActive ? "var(--sc-purple-dim)" : "var(--sc-surface)",
        }}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={isDragActive ? { scale: 1.12, y: -4 } : { scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center sc-gradient-bg"
          >
            <UploadCloud size={24} className="text-white" />
          </motion.div>
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>
              {isDragActive ? "Drop the files here..." : "Drag and drop files"}
            </p>
            <p className="text-sm" style={{ color: "var(--sc-text-muted)" }}>
              or click to browse from your computer
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--sc-text-muted)" }}>
              Supports PDF, DOCX, TXT
            </p>
          </div>

          <button
            id="browse-files-btn"
            type="button"
            className="mt-1 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200
              hover:opacity-90"
            style={{
              border: "1px solid var(--sc-border)",
              background: "var(--sc-surface-raised)",
              color: "var(--foreground)",
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Browse Files
          </button>
        </div>
      </div>

      {/* Selected files list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl p-4 space-y-3"
            style={{ background: "var(--sc-surface)", border: "1px solid var(--sc-border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Selected files ({files.length})
            </p>
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center gap-3 p-2 rounded-xl"
                  style={{ background: "var(--sc-surface-raised)" }}
                >
                  <FileText size={16} style={{ color: "var(--sc-purple)" }} />
                  <span className="flex-1 text-sm truncate" style={{ color: "var(--foreground)" }}>
                    {file.name}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: "var(--sc-text-muted)" }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeFile(file.name)}
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors
                      hover:bg-red-500/10 hover:text-red-400"
                    style={{ color: "var(--sc-text-muted)" }}
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>

            <button
              id="upload-btn"
              onClick={handleUpload}
              disabled={uploadDocument.isPending}
              className="w-full h-10 rounded-xl text-sm font-semibold transition-all duration-200
                text-white sc-gradient-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {uploadDocument.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Upload {files.length} file{files.length > 1 ? "s" : ""}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}