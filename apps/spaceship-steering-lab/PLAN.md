# Spaceship Steering Lab — PLAN

Inspired by [Spaceship IDE](https://github.com/chuanqisun/spaceship) (Chuanqi Sun, MIT Media Lab). Bookmarked by Fa on 2026-11-17 (https://x.com/RileyRalmuto/status/2122579675738231170). Our own re-implementation, not a copy: credit and link the original in the README.

## Goal
A one-screen story editor where a fast LLM writes continuously and the user steers the upcoming text in real time with knobs, an attention lock, and a timeline scrubber.

## Single-user MVP
- Story editor: user writes a premise; the LLM streams a continuation sentence by sentence.
- 3-4 round knobs (tone dark↔light, tension calm↔intense, narrative distance close↔far, optionally pace). Moving a knob cancels in-flight requests, discards speculative future text, and regenerates the continuation from the current cursor with the new settings.
- Attention lock: user highlights a phrase in the existing text; it becomes a pinned constraint the model must use / build on in the next sentences (visible as a chip, removable).
- Timeline scrubber: a slider over generated sentences; scrubbing back truncates to that point and lets the user regenerate an alternative future (keep the last 2-3 discarded branches viewable).
- Simple "focus" hint (optional, cheap): ask the model to return which earlier phrase it relied on most for each new sentence, and softly highlight it. Clearly labelled as model self-report, not real attention weights.
- Settings: provider + API key typed in the browser, stored in localStorage only, never sent anywhere but the provider. No backend. Default provider: an OpenAI-compatible endpoint (Cerebras or Groq for speed); also allow Gemini if easy. A "demo mode" with canned text so the app runs and can be filmed without any key.

## Out of scope
Real transformer attention / activation steering, accounts, persistence beyond localStorage, mobile layout polish, multi-document, server.

## Tasks (vertical slices)
1. Scaffold in `apps/spaceship-steering-lab/` (bunx create-vite, React + TS), bunfig.toml with `[install] minimumReleaseAge = 259200`, shadcn/ui minimal preset.
2. Streaming continuation with cancel (AbortController) + demo mode.
3. Knobs → prompt parameters → debounced regenerate with cache invalidation.
4. Attention lock chips.
5. Timeline scrubber + alternative branches.
6. Focus hint (if time).
7. README (FR summary welcome) with `bun install && bun run dev`, credit to the original project.

## Stack
- Vite + React + TypeScript: one-screen tool, no framework needed.
- shadcn/ui: clean minimal UI; custom SVG for round knobs.
- Bun for install/scripts.
- Fetch + SSE streaming to OpenAI-compatible APIs: no SDK lock-in.

## Testing
Unit tests only for the generation state machine (cancel/invalidate on knob move, truncate on scrub). Everything else verified by running the app.

## Deliverable
One PR touching only `apps/spaceship-steering-lab/` (plus `tracking/` only if strictly needed), with at least one screenshot AND one short video of the app running (demo mode is fine) embedded/attached in the PR.
