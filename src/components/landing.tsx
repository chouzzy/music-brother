"use client";

import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import { loginWithSpotify } from "@/app/actions";

export function Landing() {
  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 shadow-[0_0_80px_-10px_rgba(52,211,153,0.6)]"
        >
          <Music2 className="h-9 w-9 text-zinc-950" strokeWidth={2.4} />
        </motion.div>

        <h1 className="mb-3 max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Seu curador musical{" "}
          <span className="gradient-text">por IA</span>
        </h1>

        <p className="mb-10 max-w-md text-balance text-base text-zinc-400">
          Conta a vibe, o mood, o contexto.
          <br />A gente monta a playlist real no seu Spotify.
        </p>

        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          action={loginWithSpotify}
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="glow-emerald group relative flex items-center gap-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 px-7 py-3.5 text-sm font-semibold text-zinc-950 transition-all"
          >
            <SpotifyLogo className="h-5 w-5" />
            Entrar com Spotify
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid max-w-2xl grid-cols-3 gap-4 text-xs text-zinc-500"
        >
          <FeatureChip
            emoji="🎵"
            label="Vibe → Playlist"
            description="Descreve um mood e a IA escolhe as faixas"
          />
          <FeatureChip
            emoji="🌍"
            label="Contexto real"
            description="Considera dia, hora e clima"
          />
          <FeatureChip
            emoji="✨"
            label="Direto no Spotify"
            description="Playlist criada na sua conta"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureChip({
  emoji,
  label,
  description,
}: {
  emoji: string;
  label: string;
  description: string;
}) {
  return (
    <div className="glass flex flex-col items-center gap-1 rounded-2xl px-3 py-4 text-center">
      <span className="text-lg">{emoji}</span>
      <span className="font-medium text-zinc-300">{label}</span>
      <span className="text-[10px] text-zinc-500">{description}</span>
    </div>
  );
}

function SpotifyLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.78-.179-.9-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
