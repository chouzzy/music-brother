# Music Brother

Chatbot que monta playlists do Spotify a partir de uma vibe descrita em linguagem natural, considerando dia/hora e (opcional) clima.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind · Vercel AI SDK · Gemini 2.5 Flash · NextAuth v5 · Spotify Web API · Open-Meteo.

## Setup

### 1. Credenciais Spotify

1. Acessa [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → **Create app**.
2. Em **Redirect URIs**, adiciona: `http://localhost:3000/api/auth/callback/spotify`
3. Copia o **Client ID** e o **Client Secret**.

### 2. API key do Gemini

1. Acessa [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Cria uma key (free tier sobra pra uso pessoal: 1500 req/dia no 2.5 Flash).

### 3. Variáveis de ambiente

Copia `.env.example` pra `.env.local` e preenche:

```bash
AUTH_SPOTIFY_ID=<client id do spotify>
AUTH_SPOTIFY_SECRET=<client secret do spotify>
AUTH_SECRET=<gera com: npx auth secret>
AUTH_URL=http://localhost:3000
GOOGLE_GENERATIVE_AI_API_KEY=<key do google ai studio>
```

### 4. Rodar

```bash
npm install
npm run dev
```

Abre [localhost:3000](http://localhost:3000), entra com Spotify, manda uma vibe.

## Como funciona

O fluxo de uma mensagem:

1. **`getContext`** — pega dia da semana, hora e período do dia. Se o usuário passou lat/lon, puxa clima do Open-Meteo (sem API key).
2. **`searchSpotify`** — o LLM gera 2-4 queries diferentes (gêneros/eras/moods) e busca.
3. **Curadoria** — o LLM filtra/ranqueia os resultados, descarta o que não combina.
4. **`createPlaylist`** — cria uma playlist privada na conta do usuário e adiciona as tracks.

## Estrutura

```
src/
├── auth.ts                          # NextAuth v5 + Spotify provider + token refresh
├── app/
│   ├── page.tsx                     # Server component (auth gate + chat)
│   ├── layout.tsx
│   ├── actions.ts                   # Server actions: signIn/signOut
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── chat/route.ts            # streamText + tools
│   └── globals.css
├── components/
│   ├── chat.tsx                     # Cliente: useChat hook + UI
│   ├── sign-in-button.tsx
│   └── sign-out-button.tsx
├── lib/
│   ├── spotify.ts                   # Cliente da Spotify Web API
│   ├── context.ts                   # Tempo + Open-Meteo
│   └── tools.ts                     # Tools do AI SDK
└── types/next-auth.d.ts             # Augment Session/JWT
```

## Trocar de modelo

Editar [src/app/api/chat/route.ts](src/app/api/chat/route.ts) e mudar o `model`:

```ts
// free tier:
model: google("gemini-2.5-flash"),

// se ficar curto em qualidade:
model: google("gemini-2.5-pro"),
```

## Limitações conhecidas

- **Spotify `/recommendations` deprecado em nov/2024** pra apps novos. A curadoria é 100% LLM + Search API, não usa `audio-features`/seeds.
- **Dev mode do Spotify** permite só 25 users sem review. Pra abrir geral precisa pedir Extended Quota Mode.
- **Refresh de token** implementado, mas se falhar, o front mostra erro 401 e o usuário precisa reentrar.

## Deploy na Vercel

1. Push do projeto pra um repo.
2. **Import** na Vercel.
3. Configura as mesmas env vars no dashboard (troca `AUTH_URL` pro domínio prod).
4. Na Spotify Dashboard, adiciona o redirect URI de produção: `https://<seu-dominio>/api/auth/callback/spotify`.
