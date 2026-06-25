"use client";

import { useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";

interface Props {
  onUploaded: () => void;
}

export function DocumentUpload({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");

  const upload = useCallback(
    async (file: File) => {
      setError("");
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name.replace(/\.[^.]+$/, ""));
      if (tags.trim()) {
        formData.append("tags", tags.trim());
      }

      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
        setTitle("");
        setTags("");
        onUploaded();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        setDragging(false);
      }
    },
    [onUploaded, title, tags]
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title (optional)"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags: ai, research (optional)"
          className="w-56 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragging
            ? "border-zinc-400 bg-zinc-50"
            : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-6 animate-spin" />
            Uploading...
          </div>
        ) : (
          <>
            <Upload className="mb-2 size-6 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-600">
              Drop files here or click to browse
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              PDF, DOCX, TXT (max 10MB)
            </p>
          </>
        )}
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
          className="hidden"
        />
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
