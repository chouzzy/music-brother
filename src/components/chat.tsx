"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";

type ToolPartUI = {
  type: `tool-${string}`;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const TOOL_LABELS: Record<string, string> = {
  "tool-getContext": "lendo o contexto (dia/hora/clima)",
  "tool-searchSpotify": "buscando no Spotify",
  "tool-createPlaylist": "montando a playlist",
};

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ text });
    setInput("");
  };

  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full w-full max-w-3xl mx-auto flex-col px-4 py-6">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pb-4"
      >
        {messages.length === 0 && (
          <div className="text-zinc-500 text-sm text-center py-12">
            Manda uma vibe — ex: <em>&quot;to numa noite badboy, queria um rock n roll&quot;</em>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-100"
              }`}
            >
              {m.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p key={i} className="whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </p>
                  );
                }
                if (part.type.startsWith("tool-")) {
                  const tp = part as ToolPartUI;
                  return <ToolStatus key={i} part={tp} />;
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-400 rounded-2xl px-4 py-2.5 text-sm italic">
              pensando...
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center">
            erro: {error.message}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 pt-4 border-t border-zinc-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="conta a vibe..."
          disabled={busy}
          className="flex-1 rounded-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 px-5 py-3 text-sm font-medium text-white transition-colors"
        >
          {busy ? "..." : "manda"}
        </button>
      </form>
    </div>
  );
}

function ToolStatus({ part }: { part: ToolPartUI }) {
  const label = TOOL_LABELS[part.type] ?? part.type.replace("tool-", "");
  if (part.state === "output-available") {
    const out = part.output as Record<string, unknown> | undefined;
    if (out && typeof out === "object" && "url" in out && typeof out.url === "string") {
      return (
        <div className="my-2 rounded-xl bg-emerald-950/40 border border-emerald-800 px-3 py-2 text-xs">
          <div className="text-emerald-300 font-medium">
            playlist criada: {String(out.name ?? "")}
          </div>
          <a
            href={out.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline break-all"
          >
            {out.url}
          </a>
        </div>
      );
    }
    return (
      <div className="my-1 text-xs text-zinc-500 italic">✓ {label}</div>
    );
  }
  if (part.state === "output-error") {
    return (
      <div className="my-1 text-xs text-red-400 italic">
        ✗ {label}: {part.errorText ?? "erro"}
      </div>
    );
  }
  return (
    <div className="my-1 text-xs text-zinc-400 italic animate-pulse">
      → {label}…
    </div>
  );
}
