"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface Props {
  playlistId: string;
  name: string;
  url: string;
  trackCount: number;
}

export function PlaylistEmbed({ playlistId, name, url, trackCount }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="my-3 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-zinc-950/60 to-violet-950/40 shadow-[0_0_40px_-12px_rgba(16,185,129,0.4)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="text-emerald-400">♪</span>
          <span className="truncate font-medium text-zinc-100">{name}</span>
          <span className="shrink-0 text-zinc-500">· {trackCount} faixas</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-300 transition-colors hover:bg-emerald-500/20"
        >
          abrir <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <iframe
        src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
        width="100%"
        height="232"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block"
      />
    </motion.div>
  );
}
