"use client";

import { useUploadDocument } from "@/hooks/useDocuments";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "../ui/button";

export default function DocumentUpload() {
  const uploadDocument = useUploadDocument();
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    }
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Upload files one by one
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);  // Backend expects "file" not "files"

      try {
        await uploadDocument.mutateAsync(formData);
      } catch (error) {
        console.error(`Upload failed for ${file.name}`, error);
        // Continue with next file even if one fails
      }
    }

    setFiles([]); // Clear files after all uploads
  };

  return (
    <div className="space-y-4">
        <div
            {...getRootProps()}
            className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
        >
            <input {...getInputProps()} />
            {isDragActive ? (
            <p>Drop the files here ...</p>
            ) : (
            <p>Drag 'n' drop some files here, or click to select files</p>
            )}
        </div>
        {files.length > 0 && (
            <div>
                <h4 className="font-semibold">Selected files:</h4>
                <ul>
                    {files.map(file => (
                        <li key={file.name}>{file.name}</li>
                    ))}
                </ul>
                <Button onClick={handleUpload} disabled={uploadDocument.isPending} className="mt-4">
                    {uploadDocument.isPending ? "Uploading..." : "Upload"}
                </Button>
            </div>
        )}
    </div>
  );
}