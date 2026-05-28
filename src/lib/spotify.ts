const SPOTIFY_API = "https://api.spotify.com/v1";

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: string[];
  album: string;
  release_date: string;
  popularity: number;
  preview_url: string | null;
  external_url: string;
}

async function spotifyFetch<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify ${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export async function searchTracks(
  token: string,
  query: string,
  limit = 10,
): Promise<{ tracks: SpotifyTrack[] }> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(limit),
  });
  type SearchResponse = {
    tracks: {
      items: Array<{
        id: string;
        uri: string;
        name: string;
        popularity: number;
        preview_url: string | null;
        artists: Array<{ name: string }>;
        album: { name: string; release_date: string };
        external_urls: { spotify: string };
      }>;
    };
  };
  const data = await spotifyFetch<SearchResponse>(token, `/search?${params}`);
  return {
    tracks: data.tracks.items.map((t) => ({
      id: t.id,
      uri: t.uri,
      name: t.name,
      artists: t.artists.map((a) => a.name),
      album: t.album.name,
      release_date: t.album.release_date,
      popularity: t.popularity,
      preview_url: t.preview_url,
      external_url: t.external_urls.spotify,
    })),
  };
}

export async function getMe(token: string): Promise<{ id: string; display_name: string }> {
  return spotifyFetch(token, "/me");
}

export async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  description: string,
): Promise<{
  id: string;
  name: string;
  external_urls: { spotify: string };
}> {
  return spotifyFetch(token, `/users/${userId}/playlists`, {
    method: "POST",
    body: JSON.stringify({ name, description, public: false }),
  });
}

export async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  await spotifyFetch(token, `/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify({ uris: trackUris }),
  });
}
