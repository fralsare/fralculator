# ◈ Fralculator

[![CI](https://github.com/fralsare/fralculator/actions/workflows/ci.yml/badge.svg)](https://github.com/fralsare/fralculator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Platform: Windows + Linux](https://img.shields.io/badge/platform-Windows%20%2B%20Linux-blue.svg)](./README.md)

AI-ready, step-by-step desktop calculator. **Windows + Linux.**
Electron + React + Vite + TypeScript.

> Everything runs offline: the math engine, natural-language input, graphing,
> voice (Whisper WASM), and the EHCalc toolkit all work with no backend.

## Features

| Feature | Status |
|---|---|
| Step-by-step solutions (KaTeX rendered) | ✅ every intermediate step of any expression |
| Natural-language input (offline) | ✅ "what is 15% of 240", "two hundred and fifty times three", "convert 72 fahrenheit to celsius" |
| Live graphing (Plotly) | ✅ type `sin(x) * x` or any `f(x)` and it plots |
| Unit & currency conversion drawer | ✅ 11 categories (length…pressure) + live ECB currency rates (free Frankfurter API) |
| History with search & tags | ✅ persistent (localStorage), taggable, click-to-reload |
| Share as styled image | ✅ renders a branded card → PNG download |
| "Explain This" button | ✅ rule-based plain-English, real-life explanations (offline); LLM backend slot |
| Voice input | ✅ offline Whisper-tiny (WASM) in a worker; fully local after a one-time ~40 MB model download |
| Autocorrect | ✅ fixes typos in typed input (`5x3`→`5×3`, `**`→`^`, unbalanced `(`) and cleans voice transcripts; toggle in header |
| EHCalc (cyber / eth-hacking tools) | ✅ subnet calculator, MD5/SHA-1/256/512 hashing, encoders (Base64, Hex, URL, ROT13, Atbash, ASCII), password strength, password generator (strong/medium/weak rating), port lookup |
| Themes | ✅ dark / light / auto + 8 color palettes, glassmorphism UI |
| Local LLM (transformers) | 🔌 backend registry ready — see `src/math/naturalLanguage.ts` / `src/ai/explain.ts` |

## Develop

```bash
npm install
npm run dev            # Vite dev server at :5173
npm run dev:electron   # terminal 2: launches Electron pointed at the dev server
```

## Run the built app

```bash
npm start              # build + launch Electron
```

## Package installers

```bash
npm run dist:win       # NSIS .exe installer (run on Windows)
npm run dist:linux     # AppImage + .deb
```

Output lands in `release/`.

## Privacy

- Math, graphing, history, EHCalc, and explanations run **100% locally**.
- Voice: the Whisper-tiny WASM model is downloaded once (~40 MB) and cached
  in IndexedDB; audio never leaves the machine.
- The only network calls are the ECB currency rates (Frankfurter API, on
  demand) and that one-time model download. Nothing is sent to a backend.
- Generated passwords use `crypto.getRandomValues` and are never stored
  anywhere.

## Roadmap

- [ ] Plug a real local LLM into the backend registries
      (`src/math/naturalLanguage.ts`, `src/ai/explain.ts`)
- [ ] More NL phrase patterns and number words (thousands, decimals)
- [ ] Export/import history as JSON
- [ ] Mac build (arm64 + x64)
- [ ] Test suite for the math engine and EHCalc tools

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and PRs are welcome —
read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community standards and
[SECURITY.md](./SECURITY.md) for responsible vulnerability disclosure.

## License

MIT — see [LICENSE](./LICENSE).

## Architecture

```
text
electron/
  main.js        main window
  preload.js     context bridge (platform info)
src/
  math/
    engine.ts            tokenizer → parser (AST) → evaluator with step trace
    naturalLanguage.ts   offline rule engine + NLBackend registry (LLM slot)
  ai/explain.ts          "Explain This" backends (rule-based + LLM slot)
  units/data.ts          11 unit categories with base-unit conversion math
  cyber/                 subnet math, MD5/SHA hashing, encoders, password strength, ports
  store.ts               zustand + persist (history, tags, theme, angle mode)
  theme.ts               dark/light/auto + palette CSS variables
  components/            Display, Keypad, Steps (KaTeX), Graph (Plotly),
                         History, UnitsDrawer, VoiceButton, Header, Cyber (EHCalc)
```

### Math engine notes
- Grammar: `+ - × ÷ ^ %` (postfix percent), parentheses, implicit multiplication
  (`2x`, `(a)(b)`, `3sin(x)`), unary minus, functions
  `sin cos tan asin acos atan sqrt cbrt ln log abs floor ceil`, constants `pi e tau`.
- Trig defaults to **degrees** (DEG/RAD toggle in the header).
- Variables (e.g. `x`) evaluate only when provided — that's how the graph tab
  samples 600 points per plot.
- Evaluation records a human-readable step trace (PEMDAS order), skipping
  trivial steps like `x + 0` or `x × 1`.

### Upgrading to a real local LLM
`src/math/naturalLanguage.ts` and `src/ai/explain.ts` expose backend
registries. Add a backend that lazily imports
`@xenova/transformers` (WASM — no native build issues in Electron) in a worker:

```ts
import { pipeline } from '@xenova/transformers';
// e.g. Xenova/llama3.2-1B or a small instruct model, loaded on first use
```

Then register it in `backends` / `aiBackends`; the UI needs no changes.

### Offline voice
`VoiceButton` streams mic audio to a Web Worker running Whisper-tiny (WASM).
First run downloads the ~40 MB model and caches it in IndexedDB — fully
offline afterwards. Results auto-commit to history tagged `voice`.
