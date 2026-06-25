"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Archive, Trash2, Loader2, X, Tag } from "lucide-react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";

interface DocItem {
  id: string;
  title: string;
  fileType: string;
  status: string;
  tags: string[];
  chunks: number;
  uploadedAt: string;
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/documents?${params}`);
    if (res.ok) {
      const data = await res.json();
      setDocs(data.documents);
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const toggleArchive = async (doc: DocItem) => {
    await fetch(`/api/documents/${doc.id}/archive`, { method: "POST" });
    fetchDocs();
  };

  const deleteDoc = async (doc: DocItem) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    fetchDocs();
  };

  const updateTags = async (doc: DocItem) => {
    const input = prompt("Enter tags (comma-separated):", doc.tags.join(", "));
    if (input === null) return;
    const tags = input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await fetch(`/api/documents/${doc.id}/tags`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    fetchDocs();
  };

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

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-8 text-sm text-zinc-400">
            <Loader2 className="size-4 animate-spin" /> Loading...
          </div>
        ) : docs.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-400">
            No documents found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Type</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Tags</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Chunks</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Uploaded</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {docs.map((doc) => (
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {doc.tags?.length > 0 ? (
                        doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                      <button
                        onClick={() => updateTags(doc)}
                        className="ml-1 rounded p-0.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500"
                        title="Edit tags"
                      >
                        <Tag className="size-3" />
                      </button>
                    </div>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
