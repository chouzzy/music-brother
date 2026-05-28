import { auth } from "@/auth";
import { getMe, searchTracks } from "@/lib/spotify";

export const maxDuration = 30;

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "not authenticated" }, { status: 401 });
  }

  const result: Record<string, unknown> = {
    session: {
      hasAccessToken: !!session.accessToken,
      tokenPrefix: session.accessToken.slice(0, 10) + "...",
      tokenLength: session.accessToken.length,
      error: session.error ?? null,
    },
  };

  try {
    const me = await getMe(session.accessToken);
    result.me = me;
  } catch (e) {
    result.me_error = String(e);
  }

  try {
    const search = await searchTracks(session.accessToken, "test", 5);
    result.search = {
      ok: true,
      tracks_count: search.tracks.length,
      first_track: search.tracks[0]?.name,
    };
  } catch (e) {
    result.search_error = String(e);
  }

  try {
    const directRes = await fetch(
      "https://api.spotify.com/v1/search?q=test&type=track",
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    );
    result.direct_search = {
      status: directRes.status,
      statusText: directRes.statusText,
      body: await directRes.text(),
    };
  } catch (e) {
    result.direct_search_error = String(e);
  }

  return Response.json(result, { status: 200 });
}
