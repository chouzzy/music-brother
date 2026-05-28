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
        "Busca tracks no Spotify. Use queries variadas (em pt e en) explorando gêneros, anos, moods e artistas próximos da vibe. Chame VÁRIAS VEZES com queries diferentes pra ter diversidade. Suporta filtros do Spotify: year:1970-1979, genre:rock, artist:foo.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            'Query de busca. Exemplos: "classic rock rebellious", "punk brasileiro anos 2000", "lofi hip hop study", "year:2015-2020 indie sad"',
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(10)
          .describe("Quantas tracks retornar (1-20)."),
      }),
      execute: async ({ query, limit }) => {
        return searchTracks(accessToken, query, limit);
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
        const me = await getMe(accessToken);
        const playlist = await createPlaylist(
          accessToken,
          me.id,
          name,
          description,
        );
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
