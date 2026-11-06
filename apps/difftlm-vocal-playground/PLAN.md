# PLAN — difftlm-vocal-playground

## Goal
One-screen playground that lets the user shape an acoustic tube (a simplified vocal tract), hear the vowel it produces, and see its formants — an educational recreation of the tube idea behind diffTLM (Chen, Lee & Sitzmann, NeurIPS 2026).

## Single-user MVP
- Tube editor: several cross-section area sliders along the tract, plus tract length and source pitch.
- Live synthesis: hear the vowel via Web Audio when geometry or pitch changes (play/stop control; no server).
- Frequency view: plot the tube's frequency response and label the first formants (at least F1 and F2).
- Vowel presets (/a/, /i/, /u/, /e/, /o/) as starting shapes, so the effect is obvious without expertise.
- Optional slice: record a short clip in the browser and run a simplified spectrum fit that updates the tube (WebGPU if available; otherwise a CPU fallback or a clear "indisponible" state — never a crash).
- French UI labels and short help text. Credit the paper and link to the authors' official demo.
- Self-contained: from `apps/difftlm-vocal-playground/`, `bun install && bun run dev`.

## Explicitly out of scope
- Faithful reimplementation of the paper's full differentiable simulator, MFN/RFF neural fields, speech-to-MRI, or LibriTTS autoencoder.
- Copying or vendoring the authors' WebGPU demo internals (https://echen01.github.io/vocal-tract/).
- Deploy / extra Cloudflare Pages project (monorepo already covers previews).
- Accounts, uploads to a server, or saving recordings.

## Outcome-oriented tasks
1. Scaffold Vite + React + TypeScript via `bunx create-vite` (skip initial install), add app-level `bunfig.toml` with `[install] minimumReleaseAge = 259200`, then `bun install`.
2. Minimalist UI layer: hand-rolled sliders/buttons styled with plain CSS (one-screen utility — no design-system dependency needed).
3. Implement a small in-browser acoustic-tube forward model (piecewise cylindrical sections, frequency-domain chain-matrix transfer function, simple glottal source) and derive formant peaks from the response.
4. Build the editor + play/stop + frequency/formant view, wired to the model, with vowel presets.
5. Add the optional short-record + simplified fit path, gated on capability detection (WebGPU when available, CPU fallback otherwise; "indisponible" state when neither applies).
6. French copy, paper credits, and a link to the authors' demo; smoke-check `bun run dev`.
7. Open one PR that includes at least one screenshot AND one video of the running app.

## Stack
- **Bun** — runtime / package manager / scripts (monorepo rule).
- **Vite + React + TS** — one-screen SPA; official scaffold, low ceremony.
- **Plain CSS** — a one-screen utility doesn't justify a component library; custom sliders keep the bundle tiny.
- **Web Audio** — hear the vowel locally; no backend.
- **WebGPU (optional)** — only for the simplified fit when the browser supports it, with a CPU path as fallback.

## Deferred
- Paper-accurate inverse optimization and neural-field parameterization — the official demo already does that; this app teaches the forward tube.
- Cloudflare preview path — monorepo concern after the app works.
- Fine-grained consonant / noise-source modeling — vowels are enough for MVP.

## Source bookmark
- https://x.com/vincesitzmann/status/2118057889432514691 (4 Nov 2026)
- Authors' WebGPU demo: https://echen01.github.io/vocal-tract/
- Paper: Chen, Eric Ming; Lee, Jin Woo; Sitzmann, Vincent. "Reconstructing the Vocal Tract with Differentiable Acoustic Simulation." NeurIPS 2026.
