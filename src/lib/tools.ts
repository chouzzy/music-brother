import { tool } from "ai";
import { z } from "zod";
import {
  addTracksToPlaylist,
  createPlaylist,
  getMe,
  searchTracks,
} from "./spotify";
import { getTimeContext, getWeather } from "./context";

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

    createPlaylist: tool({
      description:
        "Cria uma playlist privada na conta do usuário com as tracks escolhidas. Chame DEPOIS de já ter buscado e selecionado as músicas via searchSpotify. Dá um nome criativo e bem-humorado que reflita a vibe pedida.",
      inputSchema: z.object({
        name: z
          .string()
          .max(100)
          .describe("Nome da playlist. Criativo, reflete a vibe."),
        description: z
          .string()
          .max(300)
          .describe(
            "Descrição curta da playlist (até 300 chars). Estilo casual.",
          ),
        trackUris: z
          .array(z.string().regex(/^spotify:track:[A-Za-z0-9]+$/))
          .min(5)
          .max(50)
          .describe(
            "Lista de URIs do Spotify (formato spotify:track:ID). Pegue dos resultados de searchSpotify. Entre 5 e 50 tracks.",
          ),
      }),
      execute: async ({ name, description, trackUris }) => {
        const playlist = await createPlaylist(accessToken, name, description);
        await addTracksToPlaylist(accessToken, playlist.id, trackUris);
        return {
          playlist_id: playlist.id,
          name: playlist.name,
          url: playlist.external_urls.spotify,
          track_count: trackUris.length,
        };
      },
    }),
  };
}
