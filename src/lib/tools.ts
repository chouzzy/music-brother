import { tool } from "ai";
import { z } from "zod";
import {
  addTracksToPlaylist,
  createPlaylist,
  getMe,
  searchTracks,
} from "./spotify";
import { getTimeContext, getWeather } from "./context";

const SPOTIFY_TRACK_URI_RE = /^spotify:track:[A-Za-z0-9]{22}$/;

export function buildTools(accessToken: string) {
  let loggedMe = false;
  return {
    getContext: tool({
      description:
        "Pega o contexto atual: dia da semana, hora, período do dia e (opcional) clima dado lat/lon. Sempre chame ANTES de buscar músicas, pra ajustar a vibe — sexta à noite chuvosa pede coisa diferente de segunda de manhã ensolarada.",
      inputSchema: z.object({
        latitude: z
          .number()
          .optional()
          .describe("Latitude do usuário pra puxar o clima. Opcional."),
        longitude: z
          .number()
          .optional()
          .describe("Longitude do usuário pra puxar o clima. Opcional."),
      }),
      execute: async ({ latitude, longitude }) => {
        const time = getTimeContext();
        if (latitude !== undefined && longitude !== undefined) {
          try {
            const weather = await getWeather(latitude, longitude);
            return { ...time, weather };
          } catch (e) {
            return { ...time, weather_error: String(e) };
          }
        }
        return time;
      },
    }),

    searchSpotify: tool({
      description:
        "Busca tracks no Spotify (retorna até 10 por chamada). Como cada busca traz só 10 tracks, CHAME VÁRIAS VEZES (4 a 8) com queries diferentes pra ter diversidade real. Varia gêneros, anos, moods, artistas próximos, em pt e en. Suporta filtros do Spotify: year:1970-1979, genre:rock, artist:foo.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            'Query de busca. Exemplos: "classic rock rebellious", "punk brasileiro anos 2000", "lofi hip hop study", "year:2015-2020 indie sad"',
          ),
      }),
      execute: async ({ query }) => {
        if (!loggedMe) {
          loggedMe = true;
          try {
            const me = await getMe(accessToken);
            console.log(
              `[me] id=${me.id} display_name=${me.display_name} email=${me.email ?? "(none)"} product=${me.product ?? "(none)"}`,
            );
          } catch (e) {
            console.error("[me] failed:", e);
          }
        }
        return searchTracks(accessToken, query);
      },
    }),

    proposePlaylist: tool({
      description:
        "Apresenta uma PROPOSTA de playlist ao usuário ANTES de criar de fato. SEMPRE use isso depois de buscar e curar — não cria nada no Spotify, só mostra a proposta pro usuário aprovar. Aguarda a resposta dele.",
      inputSchema: z.object({
        name: z
          .string()
          .max(100)
          .describe("Nome criativo proposto da playlist."),
        description: z
          .string()
          .max(300)
          .describe("Descrição curta da playlist (até 300 chars)."),
        vibe_summary: z
          .string()
          .max(200)
          .describe(
            "Como você interpretou a vibe — 1 frase casual. Ex: 'rock dos 70 com pegada rebelde e bluesy', 'lo-fi melancólico pra estudar'",
          ),
        tracks: z
          .array(
            z.object({
              uri: z
                .string()
                .regex(SPOTIFY_TRACK_URI_RE)
                .describe(
                  "URI EXATA do Spotify retornada pelo searchSpotify (formato spotify:track:XXXXXXXXXXXXXXXXXXXXXX, 22 chars base62). NUNCA inventar ou modificar.",
                ),
              name: z.string().describe("Nome da música"),
              artist: z.string().describe("Nome do artista principal"),
            }),
          )
          .min(10)
          .max(50)
          .describe(
            "Lista de tracks propostos com URI, nome e artista. Pegue EXATAMENTE dos resultados de searchSpotify (campo .uri). Entre 10 e 50 tracks.",
          ),
      }),
      execute: async (input) => input,
    }),

    createPlaylist: tool({
      description:
        "Cria a playlist real na conta do Spotify. SÓ chame depois que o usuário CONFIRMOU a proposta feita via proposePlaylist (ele disse 'ok', 'manda', 'fechou', 'pode criar', 'sim', 'perfeito', etc), OU se ele pediu pra criar SEM revisar. Use os MESMOS URIs da proposta — copia exatamente, não modifica.",
      inputSchema: z.object({
        name: z.string().max(100).describe("Nome da playlist."),
        description: z
          .string()
          .max(300)
          .describe("Descrição curta da playlist."),
        trackUris: z
          .array(z.string().regex(SPOTIFY_TRACK_URI_RE))
          .min(5)
          .max(50)
          .describe(
            "URIs do Spotify EXATAS da proposta (cada uma com 22 chars base62 após 'spotify:track:'). Não invente.",
          ),
      }),
      execute: async ({ name, description, trackUris }) => {
        // Sanitiza: trim, dedup, valida formato estrito.
        const seen = new Set<string>();
        const valid: string[] = [];
        const invalid: string[] = [];
        for (const raw of trackUris) {
          const uri = raw.trim();
          if (!SPOTIFY_TRACK_URI_RE.test(uri)) {
            invalid.push(raw);
            continue;
          }
          if (seen.has(uri)) continue;
          seen.add(uri);
          valid.push(uri);
        }
        if (valid.length < 5) {
          return {
            error: `Não cheguei a criar nada. Só ${valid.length} URI(s) válidas após filtrar duplicatas e formatos inválidos. ${invalid.length > 0 ? `Inválidas: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "..." : ""}.` : ""} Refaça a proposta puxando as URIs EXATAS do retorno do searchSpotify.`,
          };
        }
        const playlist = await createPlaylist(accessToken, name, description);
        await addTracksToPlaylist(accessToken, playlist.id, valid);
        return {
          playlist_id: playlist.id,
          name: playlist.name,
          url: playlist.external_urls.spotify,
          track_count: valid.length,
          filtered_out: trackUris.length - valid.length,
        };
      },
    }),
  };
}
