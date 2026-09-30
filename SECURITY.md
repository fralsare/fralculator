# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.1.x (latest release) | ✅ |

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Email the maintainer directly with a description of the issue and, if
possible, reproduction steps. Aim for a response within 7 days.

While most of Fralculator runs fully offline, the following are the
highest-risk surfaces:

- **Electron shell** (`electron/main.js`, `electron/preload.js`) — the main
  process and preload bridge.
- **Network features** — the Frankfurter API currency fetch
  (`src/units/`) and the one-time Whisper model download.
- **User-supplied expression parsing** (`src/math/engine.ts`) — all input is
  handled by a local tokenizer/parser (no `eval`), but parser bugs are still
  worth reporting.

## Out of Scope

- Vulnerabilities in third-party dependencies (report upstream)
- Social engineering (phishing, etc.)

## Process

1. You report privately → we acknowledge within 7 days.
2. We assess and work on a fix (or a mitigation) with you.
3. We publish a patch release and a public advisory describing the fix,
   crediting the reporter (unless you prefer to remain anonymous).
