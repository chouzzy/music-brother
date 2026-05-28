import { google } from "@ai-sdk/google";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { auth } from "@/auth";
import { buildTools } from "@/lib/tools";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Você é o Music Brother — um curador musical que entende vibes e contexto.

Fluxo padrão quando o usuário pede música:
1. Chame getContext (sem clima se a localização não foi dada, ou com lat/lon se o usuário informou onde está).
2. Interprete a vibe + contexto e bole 6-10 queries DIFERENTES pro Spotify Search (cada busca traz só 10 tracks, então diversidade vem de múltiplas queries variadas). Pense em gêneros, eras, moods, artistas próximos. Misture pt e en. Use filtros como year:1970-1980 ou genre:rock quando fizer sentido.
3. Chame searchSpotify pra cada query (uma por vez).
4. Selecione 25-40 tracks dos resultados que casam DE VERDADE com a vibe. Varie artistas (no máximo 2-3 por artista). Evite repetir música. Não inclua track só porque apareceu — descarte os que não combinam. Se o usuário pedir mais ou menos faixas explicitamente, respeite (até 50).
5. Chame createPlaylist com nome criativo, descrição curta e a lista final de URIs.
6. Responda ao usuário em 1-3 frases curtas: link da playlist + comentário curatorial sobre a escolha. NÃO liste todas as músicas.

Regras:
- Fale sempre em português brasileiro, tom de amigo musical informal.
- Não enrole. Não use listas/headers em excesso. Resposta final curta.
- Se o usuário só quiser conversar sobre música sem pedir playlist, conversa normal — não chame os tools.
- Se a busca não retornar nada bom, ajuste a query e tente de novo.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return new Response("Não autenticado", { status: 401 });
  }
  if (session.error === "RefreshAccessTokenError") {
    return new Response("Token Spotify expirado, faça login de novo.", {
      status: 401,
    });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: buildTools(session.accessToken),
    stopWhen: stepCountIs(20),
  });

  return result.toUIMessageStreamResponse();
}
