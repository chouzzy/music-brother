"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Trash2, X } from "lucide-react";
import {
  usePlaylistHistory,
  type PlaylistHistoryEntry,
} from "@/lib/use-playlist-history";

interface Props {
  open: boolean;
  onClose: () => void;
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(ts).toLocaleDateString("pt-BR");
}

export function HistoryDrawer({ open, onClose }: Props) {
  const { history, remove, clear } = usePlaylistHistory();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="glass-strong fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Histórico</h2>
                <p className="text-xs text-zinc-500">
                  {history.length === 0
                    ? "nenhuma playlist ainda"
                    : `${history.length} playlist${history.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="thin-scroll flex-1 overflow-y-auto p-3">
              {history.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="space-y-2">
                  {history.map((entry) => (
                    <HistoryItem
                      key={entry.id}
                      entry={entry}
                      onRemove={() => remove(entry.id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {history.length > 0 && (
              <footer className="border-t border-white/10 px-5 py-3">
                <button
                  onClick={() => {
                    if (confirm("Apagar todo o histórico?")) clear();
                  }}
                  className="text-xs text-zinc-500 transition-colors hover:text-red-400"
                >
                  limpar histórico
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function HistoryItem({
  entry,
  onRemove,
}: {
  entry: PlaylistHistoryEntry;
  onRemove: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      className="group rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-zinc-100">
            {entry.name}
          </h3>
          {entry.vibe && (
            <p className="mt-0.5 truncate text-xs italic text-zinc-500">
              &quot;{entry.vibe}&quot;
            </p>
          )}
          <p className="mt-1 text-[11px] text-zinc-500">
            {entry.trackCount} faixas · {timeAgo(entry.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onRemove}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
            title="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <iframe
        src={`https://open.spotify.com/embed/playlist/${entry.id}?utm_source=generator&theme=0`}
        width="100%"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="mt-2 rounded-lg"
      />
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
      >
        abrir no Spotify <ExternalLink className="h-3 w-3" />
      </a>
    </motion.li>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 text-3xl">♪</div>
      <p className="text-sm text-zinc-400">
        Suas playlists aparecem aqui depois que o Music Brother criar a primeira.
      </p>
    </div>
  );
}
