import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import {
  createDocument,
  deleteDocument,
  DocumentRow,
  ingestDocument,
  listDocuments,
} from "@/lib/documents.functions";
import { useServerFn } from "@tanstack/react-start";

export function DocumentLibrary() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fetchDocs = useServerFn(listDocuments);
  const create = useServerFn(createDocument);
  const ingest = useServerFn(ingestDocument);
  const remove = useServerFn(deleteDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await fetchDocs();
      setDocs(rows as DocumentRow[]);
    } catch {
      toast.error("Could not load your library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [user]);

  const kindFromFile = (file: File): "pdf" | "text" | "epub" | "other" => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "epub") return "epub";
    if (["txt", "md", "json", "csv", "xml"].includes(ext ?? "")) return "text";
    return "other";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to upload documents.");
      return;
    }
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    const name = title.trim() || file.name;
    setUploading(true);
    try {
      const { document, signedUrl } = await create({
        data: { title: name, kind: kindFromFile(file) },
      });
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!res.ok) throw new Error("Upload failed");
      await ingest({ data: { id: document.id } });
      toast.success("Document uploaded and indexing.");
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove({ data: { id } });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document removed.");
    } catch {
      toast.error("Could not remove document.");
    }
  };

  const statusBadge = (status: string, error: string | null) => {
    if (status === "ready") return <span className="text-[10px] font-medium text-leaf">Ready</span>;
    if (status === "processing")
      return <span className="text-[10px] font-medium text-saffron">Indexing…</span>;
    if (status === "error")
      return (
        <span className="text-[10px] font-medium text-crimson" title={error ?? ""}>
          Error
        </span>
      );
    return <span className="text-[10px] font-medium text-cream/40">Pending</span>;
  };

  return (
    <div className="rounded-3xl bg-ink p-6 text-cream shadow-2xl shadow-ink/20">
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (defaults to file name)"
            className="flex-1 rounded-xl border border-cream/10 bg-cream/5 px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:border-saffron focus:outline-none"
          />
          <label className="relative cursor-pointer rounded-xl border border-cream/10 bg-cream/5 px-4 py-2.5 text-sm text-cream/70 hover:bg-cream/10">
            {file ? file.name : "Choose file"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.epub,.txt,.md,.json,.csv,.xml"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
          <button
            type="submit"
            disabled={uploading || !file}
            className="rounded-xl bg-crimson px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-crimson/90 disabled:opacity-40"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        <p className="font-mono text-[10px] text-cream/40">
          Supported: PDF, EPUB, TXT, MD, JSON, CSV, XML. Files stay private to your account.
        </p>
      </form>

      {loading && docs.length === 0 ? (
        <div className="py-8 text-center text-sm text-cream/50">Loading your library…</div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl border border-cream/10 bg-cream/5 p-8 text-center text-sm text-cream/50">
          Your library is empty. Upload books, PDFs, or scripture files and Svarga will search them
          for answers.
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-cream/10 bg-cream/5 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-cream/90">{doc.title}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase text-cream/40">
                  {doc.kind} · {statusBadge(doc.status, doc.error)}
                </p>
              </div>
              <button
                onClick={() => void handleDelete(doc.id)}
                className="ml-3 shrink-0 rounded-lg px-2 py-1 text-xs text-crimson hover:bg-crimson/10"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
