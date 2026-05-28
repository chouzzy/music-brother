import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { Header } from "@/components/header";
import { Landing } from "@/components/landing";

export default async function Home() {
  const session = await auth();
  const authed = !!session?.accessToken;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-aurora" aria-hidden="true" />
      {authed && <Header />}
      <main className="flex flex-1 flex-col overflow-hidden">
        {authed ? <Chat /> : <Landing />}
      </main>
    </div>
  );
}
