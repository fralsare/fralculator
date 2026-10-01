# Changelog

All notable changes to Fralculator are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- App screenshots in the README and USER_GUIDE — 8-image set in
  `docs/screenshots/` (`main1`, `main2`, `1`–`6`): main screen, subnet,
  graph, history, and all five EHCalc tools.

### Changed
- README: "🙏 Support the Project" moved to the end with a centered,
  color-coded heading so the donation links stand out.

## [0.1.0] - 2026-09-30

### Added
- Step-by-step math evaluation with KaTeX rendering and a full PEMDAS step trace.
- Offline natural-language input ("what is 15% of 240", "two hundred and fifty
  times three", "convert 72 fahrenheit to celsius").
- Live graphing of `f(x)` expressions (Plotly).
- Unit conversion drawer: 11 categories + live ECB currency rates (Frankfurter API).
- Persistent history with search, tags, and click-to-reload.
- Share results as a styled PNG image.
- Offline "Explain This" (rule-based plain-English explanations, LLM backend slot).
- Offline voice input via Whisper-tiny (WASM); ~40 MB one-time model download.
- Autocorrect for typed input (`5x3`→`5×3`, `**`→`^`, word shorthand
  `pls`→`plus`, unbalanced parens) and voice transcripts; header toggle.
- EHCalc tab: subnet calculator, MD5/SHA-1/256/512 hashing, encoders
  (Base64, Hex, URL, ROT13, Atbash, ASCII), password strength report,
  cryptographically random password generator (strong / medium / weak rating),
  port lookup.
- Dark / light / auto themes with 8 color palettes.

[0.1.0]: https://github.com/fralsare/fralculator/releases/tag/v0.1.0
