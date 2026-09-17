"use client";

import { useEffect, useState } from "react";
import { btnPrimary, btnQuiet } from "./ui";
import type { Comment } from "@/lib/types";

const NAME_KEY = "visningsrom:navn";

export default function CommentPanel({
  previewId,
  shareToken,
  initial,
  canPost = true,
  canDelete = false,
  compact = false,
}: {
  previewId: string;
  /** Settes i kundevisning. Uten token er panelet skrivebeskyttet. */
  shareToken?: string;
  initial: Comment[];
  canPost?: boolean;
  canDelete?: boolean;
  compact?: boolean;
}) {
  const [comments, setComments] = useState(initial);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setAuthor(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      /* Privat modus - da får de bare skrive navnet hver gang. */
    }
  }, []);

  async function submit() {
    if (!body.trim() || !shareToken) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/public/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: shareToken, previewId, author, body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kunne ikke lagre kommentaren.");
      setComments((current) => [...current, data.comment]);
      setBody("");
      try {
        localStorage.setItem(NAME_KEY, author);
      } catch {
        /* ignorert */
      }
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(comment: Comment) {
    setComments((current) => current.filter((item) => item.id !== comment.id));
    await fetch(
      `/api/comments?previewId=${comment.previewId}&commentId=${comment.id}`,
      { method: "DELETE" },
    );
  }

  return (
    <section className={compact ? "space-y-3" : "panel space-y-3 p-4"}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-mist-400">
        Tilbakemeldinger {comments.length > 0 && `(${comments.length})`}
      </h3>

      <ul className="space-y-2.5">
        {comments.length === 0 && (
          <li className="text-xs text-mist-400">Ingen kommentarer ennå.</li>
        )}
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-lg bg-ink-900 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-mist-200">{comment.author}</span>
              <span className="shrink-0 text-[10px] text-mist-400">
                {new Date(comment.createdAt).toLocaleString("nb-NO", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-mist-200">{comment.body}</p>
            {canDelete && (
              <button
                type="button"
                className={`${btnQuiet} mt-1 !px-1.5 !py-0.5 !text-[10px]`}
                onClick={() => remove(comment)}
              >
                Slett
              </button>
            )}
          </li>
        ))}
      </ul>

      {canPost && shareToken && (
        <div className="space-y-2 border-t border-ink-700 pt-3">
          <input
            className="field !py-1.5"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Navnet ditt"
          />
          <textarea
            className="field resize-none"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Hva tenker du om denne?"
          />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button
            type="button"
            className={`${btnPrimary} w-full`}
            onClick={submit}
            disabled={busy || !body.trim()}
          >
            {busy ? "Sender …" : "Send tilbakemelding"}
          </button>
        </div>
      )}
    </section>
  );
}
