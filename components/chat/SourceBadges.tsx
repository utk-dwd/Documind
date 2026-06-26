import { FileText } from "lucide-react";

interface SourceDoc {
  documentId: string;
  fileName: string;
  title: string;
}

export function SourceBadges({ sources }: { sources: SourceDoc[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-3">
      <span className="text-xs text-zinc-400">Sources:</span>
      {sources.map((s) => (
        <span
          key={s.documentId}
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
        >
          <FileText className="size-3 shrink-0" />
          {s.title || s.fileName}
        </span>
      ))}
    </div>
  );
}
