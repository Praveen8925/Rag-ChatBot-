import DocumentList from "@/components/documents/DocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Documents</h1>
      <DocumentUpload />
      <DocumentList />
    </div>
  );
}
