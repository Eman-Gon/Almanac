# Deploying Almanac (hosted web)

Almanac is a Next.js App Router demo. Host it on **Vercel** for a shareable public URL. Demo progress stays in each browser's `localStorage` (`choicegrid-demo-v3`); it does not sync across users or devices.

The Expo Go companion in [`mobile/`](../mobile/) loads this same hosted URL in a WebView. See [`mobile/README.md`](../mobile/README.md).

---

## Prerequisites

- A Vercel account
- This repository connected to Vercel (GitHub import or `npx vercel`)
- Node.js matching the project's engines / local `npm run build` success

---

## Steps

1. **Import the repo** in the Vercel dashboard (or run `npx vercel` from the repo root).
2. **Build settings** (defaults are fine for Next.js 16):
   - Install: `npm install`
   - Build: `npm run build`
   - Output: Next.js (automatic)
3. **Environment variables** (all optional for the judged hero demo):

| Variable | Required? | Notes |
|---|---|---|
| `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BACKUP_MODEL`, `LLM_TIMEOUT_MS` | No | Server-only. Enables optional model explanations; never put keys behind `NEXT_PUBLIC_`. |
| `VAPI_*`, `VAPI_TEST_CALLS_ENABLED` | No | Isolated communications experiment; keep `VAPI_TEST_CALLS_ENABLED=false` unless intentionally testing. |
| `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_MAP_TILE_URL` | No | Reserved; unused by the MVP. Map stays bundled/local. |

4. **Deploy** production. Open `https://<your-project>.vercel.app/dashboard`.
5. Use **Reset scenario** in the app to clear that browser's demo state. `POST /api/demo/reset` and `npm run demo:check` do not clear browser storage.

---

## Production gate

Before promoting a deployment:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The hero path must work **without** LLM or Vapi env vars configured.

---

## Mobile and Expo Go

- Phone browsers: use the production URL directly; the shell adapts below ~920px.
- Expo Go: set `EXPO_PUBLIC_WEB_URL` to the production URL (see [`mobile/README.md`](../mobile/README.md)).

Do not treat a public demo URL as multi-tenant production software. There is no auth and no shared server session.
