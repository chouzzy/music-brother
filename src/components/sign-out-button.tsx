import { logout } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        sair
      </button>
    </form>
  );
}
