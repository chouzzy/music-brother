"use client";

import { motion } from "framer-motion";
import { ListMusic, Sparkles } from "lucide-react";

export interface ProposedTrack {
  uri: string;
  name: string;
  artist: string;
}

interface Props {
  name: string;
  description: string;
  vibe_summary: string;
  tracks: ProposedTrack[];
}

const PREVIEW_COUNT = 8;

export function PlaylistProposal({
  name,
  description,
  vibe_summary,
  tracks,
}: Props) {
  const preview = tracks.slice(0, PREVIEW_COUNT);
  const rest = Math.max(0, tracks.length - PREVIEW_COUNT);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="my-3 overflow-hidden rounded-2xl border border-dashed border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-zinc-950/60 to-emerald-950/20 shadow-[0_0_40px_-16px_rgba(168,85,247,0.5)]"
    >
      <div className="border-b border-white/5 px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
            <Sparkles className="h-2.5 w-2.5" />
            proposta
          </span>
          <span className="text-[10px] text-zinc-500">
            aguardando seu OK pra criar
          </span>
        </div>
        <h3 className="text-base font-semibold text-zinc-100">{name}</h3>
        <p className="mt-0.5 text-xs italic text-zinc-400">{vibe_summary}</p>
      </div>

      <div className="px-4 py-3">
        <ol className="space-y-1.5">
          {preview.map((t, i) => (
            <motion.li
              key={t.uri}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className="flex items-center gap-2.5 text-xs"
            >
              <span className="w-5 shrink-0 text-right font-mono text-[10px] text-zinc-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="truncate text-zinc-200">{t.name}</span>
              <span className="shrink-0 text-zinc-500">·</span>
              <span className="truncate text-zinc-400">{t.artist}</span>
            </motion.li>
          ))}
        </ol>
        {rest > 0 && (
          <p className="mt-2 pl-7 text-[11px] text-zinc-500">
            + {rest} {rest === 1 ? "outra" : "outras"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-white/5 bg-white/[0.02] px-4 py-2.5 text-[11px] text-zinc-400">
        <ListMusic className="h-3 w-3 text-violet-400/70" />
        <span>
          <span className="text-zinc-200">{tracks.length}</span> faixas ·{" "}
          {description}
        </span>
      </div>
    </motion.div>
  );
}
