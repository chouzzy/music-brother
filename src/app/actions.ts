"use server";

import { signIn, signOut } from "@/auth";

export async function loginWithSpotify() {
  await signIn("spotify", { redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
