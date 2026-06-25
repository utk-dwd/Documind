"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Archive, Trash2, Loader2 } from "lucide-react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";

interface DocItem {
  id: string;
  title: string;
  fileType: string;
  status: string;
  chunks: number;
  uploadedAt: string;
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    const res = await fetch("/api/documents?limit=100");
    if (res.ok) {
      const data = await res.json();
      setDocs(data.documents);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const toggleArchive = async (doc: DocItem) => {
    await fetch(`/api/documents/${doc.id}/archive`, { method: "POST" });
    fetchDocs();
  };

  const deleteDoc = async (doc: DocItem) => {
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    fetchDocs();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Documents</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload, manage, and archive documents
          </p>
        </div>
      </div>

      <div className="mt-6">
        <DocumentUpload onUploaded={fetchDocs} />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="px-4 py-3 font-medium text-zinc-600">Name</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Type</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Chunks</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Uploaded</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {docs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                  No documents yet. Upload one above.
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-zinc-400" />
                      <span className="font-medium text-zinc-700">
                        {doc.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      {doc.fileType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{doc.chunks}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        doc.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleArchive(doc)}
                        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                        title={doc.status === "ACTIVE" ? "Archive" : "Restore"}
                      >
                        <Archive className="size-4" />
                      </button>
                      <button
                        onClick={() => deleteDoc(doc)}
                        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
