# PLAN — botdirectory-explorer

## Goal
One-screen explorer that browses the public botdirectory.ai catalog so Fa can filter bots, peek at prompts, and copy them without leaving a local Bun app.

## Single-user MVP
- Fetch listings from the keyless API `GET https://api.botdirectory.ai/api/bots` (page mode).
- Card grid: name, category, integrations, short blurb.
- Filters: category (Productivity / Sales / Marketing / Ops / Success / Personal), free-text `q`, optional integration string.
- Detail panel / modal: full prompt when present, else description + link to `grokShareUrl` / canonical detail URL; one-click copy of prompt text.
- Loading / empty / error states (incl. 429 Retry-After).
- Self-contained: from `apps/botdirectory-explorer/`, `bun install && bun run dev`.

## Explicitly out of scope
- Auth, signup, submit-bot PRs, feedback, newsletter, copy-metrics writes.
- Cursor sync / offline mirror persistence.
- Deploy / Cloudflare Pages wiring.
- Multi-user accounts.

## Outcome-oriented tasks
1. Scaffold Vite + React + TypeScript via `bunx create-vite` (skip initial install), add root `bunfig.toml` with `[install] minimumReleaseAge = 259200`, then `bun install`.
2. Init shadcn/ui (minimalist) and pull only Card, Input, Select/Combobox, Badge, Button, Dialog/Sheet, ScrollArea as needed.
3. Thin API client for `listBots` (q, category, integration, page, limit, sort=newest) against `https://api.botdirectory.ai`.
4. Build filter bar + paginated card grid wired to the client.
5. Build detail view with copy-to-clipboard for prompt (fallback when `prompt` is null).
6. Polish empty/error/loading; smoke-check `bun run dev`.

## Stack
- **Bun** — runtime / package manager / scripts (monorepo rule).
- **Vite + React + TS** — one-screen SPA; official scaffold, low ceremony.
- **shadcn/ui** — boring, consistent controls without inventing a design system.
- **Native `fetch`** — API is CORS-friendly public JSON; no SDK needed.

## Deferred
- Infinite scroll / cursor sync — page mode is enough for MVP browse.
- Local favorites — nice later, not required to prove the API.
- Cloudflare preview path — monorepo concern after the app works.
- French UI strings — optional; content from the API is mostly English.

## Source bookmark
- https://x.com/sairahul1/status/2095153247367651534
- Catalog: https://botdirectory.ai
- OpenAPI: https://botdirectory.ai/openapi.json
