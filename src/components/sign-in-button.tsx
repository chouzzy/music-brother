import { loginWithSpotify } from "@/app/actions";

export function SignInButton() {
  return (
    <form action={loginWithSpotify}>
      <button
        type="submit"
        className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition-colors"
      >
        Entrar com Spotify
      </button>
    </form>
  );
}
