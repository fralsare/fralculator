# Contributing to Fralculator

Thanks for your interest! Fralculator is a small, dependency-light Electron app —
contributions are welcome for math features, NL phrases, unit categories,
EHCalc tools, and bug fixes.

## Getting started

Requires **Node.js 18+**.

```bash
git clone https://github.com/fralsare/fralculator.git
cd fralculator
npm install
npm run dev:electron   # two terminals: Vite on :5173, then Electron against it
```

Useful scripts:

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server only |
| `npm run dev:electron` | Build + launch Electron against the dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Typecheck + Vite production build |
| `npm start` | Build + run the production app |
| `npm run dist:win` / `dist:linux` | Package installers (NSIS / AppImage + .deb) |

## Before you commit

- `npm run typecheck` must pass.
- Follow the existing code style: TypeScript, 2-space indent, no external
  frameworks beyond React + zustand, no new runtime dependencies without a
  discussion in the issue first.
- Everything must work **offline** after first launch. Features that need the
  network (e.g. currency rates) should degrade gracefully.
- New EHCalc tools live in `src/cyber/` (pure logic) + a component in
  `src/components/Cyber.tsx` (UI). Keep them dependency-free and deterministic
  where possible.
- Math engine changes (`src/math/engine.ts`) need a manual check of the step
  trace output — the UI renders whatever strings it emits.

## Where to look

| Topic | File(s) |
|---|---|
| Math parsing/evaluation + step trace | `src/math/engine.ts` |
| Natural-language phrases (add yours here) | `src/math/naturalLanguage.ts` |
| Typed-input + voice autocorrect | `src/math/autocorrect.ts` |
| "Explain This" backends | `src/ai/explain.ts` |
| Unit categories & rates | `src/units/` |
| EHCalc (subnet, hash, encode, password, ports) | `src/cyber/` |
| State / persistence | `src/store.ts` |
| Themes & palettes | `src/theme.ts`, `src/styles.css` |
| Voice (Whisper WASM worker) | `src/components/VoiceButton.tsx`, `src/workers/` |

## Pull requests

1. Create an issue first for anything non-trivial (new feature, new dependency,
   UX changes).
2. Keep PRs focused — one feature or one fix per PR.
3. In the PR description: what changed, why, and how you tested it
   (screenshots for UI changes are great).
4. A maintainer review + passing typecheck is required to merge.

## Questions?

Open a GitHub issue — or just start a PR and mark it `[WIP]`.
