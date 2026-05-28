import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 text-xl">♪</span>
          <h1 className="text-lg font-semibold tracking-tight">music brother</h1>
        </div>
        {session && <SignOutButton />}
      </header>

      <main className="flex-1 overflow-hidden">
        {session?.accessToken ? (
          <Chat />
        ) : (
          <div className="flex flex-col h-full items-center justify-center gap-6 px-6 text-center">
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-semibold">
                Seu curador musical pessoal
              </h2>
              <p className="text-zinc-400 text-sm">
                Conecta sua conta Spotify e descreve a vibe. Eu monto a playlist
                considerando o dia, hora e o que você tá sentindo.
              </p>
            </div>
            <SignInButton />
          </div>
        )}
      </main>
    </div>
  );
}
