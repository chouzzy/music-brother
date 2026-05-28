"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  CloudSun,
  ListMusic,
  Music,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePlaylistHistory } from "@/lib/use-playlist-history";
import { PlaylistEmbed } from "./playlist-embed";
import { PlaylistProposal, type ProposedTrack } from "./playlist-proposal";

type ToolPart = {
  type: `tool-${string}`;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  output?: unknown;
  errorText?: string;
};

type MessagePart =
  | { type: "text"; text: string }
  | ToolPart;

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
};

type CreatePlaylistOutput = {
  playlist_id: string;
  name: string;
  url: string;
  track_count: number;
};

const TOOL_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "tool-getContext": { label: "lendo o contexto", icon: CloudSun },
  "tool-searchSpotify": { label: "buscando no Spotify", icon: Search },
  "tool-proposePlaylist": { label: "montando proposta", icon: ListMusic },
  "tool-createPlaylist": { label: "criando no Spotify", icon: Sparkles },
};

const SUGGESTIONS = [
  "to numa vibe badboy de sexta à noite",
  "lofi pra estudar de domingo chuvoso",
  "festa anos 2000 brasileira",
  "rock alternativo melancólico anos 90",
  "jazz pra uma jantar romântico",
];

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const { add: addToHistory } = usePlaylistHistory();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // When a playlist is created, save to history with the user's last vibe.
  const lastSavedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const typedMessages = messages as ChatMessage[];
    for (let i = typedMessages.length - 1; i >= 0; i--) {
      const m = typedMessages[i];
      if (m.role !== "assistant") continue;
      for (const part of m.parts) {
        if (
          part.type === "tool-createPlaylist" &&
          part.state === "output-available" &&
          part.output
        ) {
          const out = part.output as CreatePlaylistOutput;
          if (lastSavedIdRef.current === out.playlist_id) return;
          lastSavedIdRef.current = out.playlist_id;
          const userMsg = [...typedMessages]
            .reverse()
            .find((mm) => mm.role === "user");
          const vibe = userMsg?.parts.find(
            (p): p is { type: "text"; text: string } => p.type === "text",
          )?.text;
          addToHistory({
            id: out.playlist_id,
            name: out.name,
            url: out.url,
            trackCount: out.track_count,
            vibe,
          });
          return;
        }
      }
    }
  }, [messages, addToHistory]);

  const busy = status === "streaming" || status === "submitted";

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  const showEmpty = messages.length === 0;

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4">
      <div
        ref={scrollRef}
        className="thin-scroll flex-1 overflow-y-auto pb-6 pt-4"
      >
        {showEmpty ? (
          <EmptyState onPick={submit} />
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {(messages as ChatMessage[]).map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </AnimatePresence>

            {busy &&
              messages[messages.length - 1]?.role === "user" && <Thinking />}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
                erro: {error.message}
              </div>
            )}
          </div>
        )}
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => submit(input)}
        busy={busy}
      />
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full flex-col items-center justify-center gap-8 py-16 text-center"
    >
      <div className="space-y-3">
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-violet-500/20 shadow-[0_0_60px_-12px_rgba(52,211,153,0.6)]"
        >
          <Music className="h-7 w-7 text-emerald-300" />
        </motion.div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Que <span className="gradient-text">vibe</span> é essa hoje?
        </h2>
        <p className="text-sm text-zinc-500">
          Descreve um mood, contexto, ou referência. Eu monto a playlist.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            onClick={() => onPick(s)}
            className="glass rounded-full px-3.5 py-1.5 text-xs text-zinc-300 transition-all hover:scale-[1.03] hover:border-emerald-500/40 hover:text-zinc-100"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_4px_20px_-8px_rgba(16,185,129,0.6)]"
            : "glass text-zinc-100"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="prose-chat leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }
          if (
            part.type === "tool-createPlaylist" &&
            part.state === "output-available" &&
            part.output
          ) {
            const out = part.output as CreatePlaylistOutput;
            return (
              <PlaylistEmbed
                key={i}
                playlistId={out.playlist_id}
                name={out.name}
                url={out.url}
                trackCount={out.track_count}
              />
            );
          }
          if (
            part.type === "tool-proposePlaylist" &&
            part.state === "output-available" &&
            part.output
          ) {
            const out = part.output as {
              name: string;
              description: string;
              vibe_summary: string;
              tracks: ProposedTrack[];
            };
            return (
              <PlaylistProposal
                key={i}
                name={out.name}
                description={out.description}
                vibe_summary={out.vibe_summary}
                tracks={out.tracks}
              />
            );
          }
          if (part.type.startsWith("tool-")) {
            return <ToolStatus key={i} part={part as ToolPart} />;
          }
          return null;
        })}
      </div>
    </motion.div>
  );
}

function ToolStatus({ part }: { part: ToolPart }) {
  const meta = TOOL_META[part.type] ?? {
    label: part.type.replace("tool-", ""),
    icon: Sparkles,
  };
  const Icon = meta.icon;

  if (part.state === "output-error") {
    return (
      <div className="my-1 flex items-center gap-1.5 text-[11px] text-red-400/80">
        <span className="text-red-400">✗</span>
        <span>
          {meta.label}: {part.errorText ?? "erro"}
        </span>
      </div>
    );
  }

  if (part.state === "output-available") {
    return (
      <div className="my-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
        <Icon className="h-3 w-3 text-emerald-400/70" />
        <span>{meta.label}</span>
      </div>
    );
  }

  return (
    <div className="my-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        className="inline-flex"
      >
        <Icon className="h-3 w-3 text-emerald-300" />
      </motion.span>
      <span>{meta.label}…</span>
    </div>
  );
}

function Thinking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="glass flex items-center gap-1.5 rounded-2xl px-4 py-3">
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>
    </motion.div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="pb-6 pt-2"
    >
      <div className="glass flex items-end gap-2 rounded-3xl p-2 pl-4 transition-all focus-within:border-emerald-500/40 focus-within:shadow-[0_0_30px_-10px_rgba(52,211,153,0.5)]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="conta a vibe..."
          rows={1}
          disabled={busy}
          className="thin-scroll flex-1 resize-none border-0 bg-transparent py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 disabled:opacity-50"
          style={{ maxHeight: "8rem" }}
        />
        <motion.button
          type="submit"
          disabled={busy || !value.trim()}
          whileTap={{ scale: 0.92 }}
          className="glow-emerald flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-zinc-950 transition-all disabled:opacity-40 disabled:shadow-none"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </motion.button>
      </div>
    </form>
  );
}
