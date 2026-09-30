# Fralculator — User Guide

A complete how-to for using Fralculator, from first launch to advanced
features. Everything in this guide assumes the app is installed
(Windows `.exe` installer or Linux AppImage / `.deb`) or running from source.

---

## Contents

1. [First run](#1-first-run)
2. [Interface tour](#2-interface-tour)
3. [Basic calculations](#3-basic-calculations)
4. [Typing expressions — full syntax reference](#4-typing-expressions--full-syntax-reference)
5. [Autocorrect](#5-autocorrect)
6. [Natural-language input](#6-natural-language-input)
7. [Voice input](#7-voice-input)
8. [Steps tab — seeing how the answer was reached](#8-steps-tab)
9. [Graph tab](#9-graph-tab)
10. [History tab](#10-history-tab)
11. [Unit & currency conversion](#11-unit--currency-conversion)
12. [EHCalc — the cybersecurity toolkit](#12-ehcalc)
13. [Themes and appearance](#13-themes-and-appearance)
14. [Keyboard shortcuts](#14-keyboard-shortcuts)
15. [Troubleshooting](#15-troubleshooting)
16. [Privacy](#16-privacy)

---

## 1. First run

- **Windows**: run the installer, launch *Fralculator* from the Start menu.
- **Linux**: double-click the AppImage, or install the `.deb`.
- **From source**: `npm install && npm start`.

The app is fully usable offline from the first launch. The only two things
that ever touch the network are (a) the one-time ~40 MB download of the
offline speech-recognition model used by Voice input, and (b) live currency
rates in the Convert drawer — both optional.

## 2. Interface tour

```
┌──────────────────────────────────────────────────────────────────┐
│ ◈ Fralculator          DEG ▾   Auto theme ▾   Aurora ▾  ⇄ ✨     │  ← Header
├───────────────────────────────┬──────────────────────────────────┤
│ [Try "what is 15% of 204"…] [🎙]  │  Steps │ Graph │ History │ EH │  ← NL row + tabs
│                               │──────────────────────────────────│
│                        Type or tap…   ← main expression input   │
│                        = 102                   ← live result    │
│  ✨ Auto-corrected: …        ← change notices (when active)     │
│  3 steps — see Steps tab     ← hint row                         │
│ ┌────┬────┬────┬────┬────┐                                   │
│ │sin │cos │√ … │ ÷ … │    │  ← on-screen keypad              │
│ └────┴────┴────┴────┴────┘                                   │
└───────────────────────────────┴──────────────────────────────────┘
```

- **Header** (top bar): angle mode (DEG/RAD), theme, palette,
  `⇄ Convert` (unit drawer), `✨ Auto-correct` toggle.
- **NL row**: a free-text box for natural language, plus the mic button.
- **Main input + result**: type an expression and the answer updates live —
  no Enter needed. Enter commits it to History.
- **Keypad**: click/tap equivalent of the keyboard; same insertions.
- **Right tabs**: Steps, Graph, History, EH (the EHCalc toolkit).
- **Convert drawer**: slides in from `⇄ Convert`.

## 3. Basic calculations

Type (or tap) any expression in the main input. The result updates as you
type:

```
2 + 3 × 4        → 14          (operator precedence respected)
(2 + 3) × 4      → 20
2 ^ 10           → 1024
10 %             → 0.10        (percent is postfix: 10% of a quantity)
15% × 240        → 36
2x3              → 6           (letter x = multiplication here)
(2+3)(4-1)       → 15          (juxtaposition = multiplication)
```

Everything evaluates **locally, instantly** — there is no server round-trip.
Trivial intermediate steps are skipped in the trace (e.g. `x + 0`, `x × 1`).

## 4. Typing expressions — full syntax reference

### Operators

| Symbol | Meaning | Notes |
|---|---|---|
| `+` `-` | add / subtract | `-5` is a unary minus |
| `*` or `×` | multiply | `x` (letter) also works: `6x2` |
| `/` or `÷` | divide | |
| `^` | power | `2^10`; Python-style `**` is auto-corrected |
| `%` | percent (postfix) | `50%` → `0.5`; `200% ^ 2` works |
| `( )` | grouping | unbalanced opens are auto-closed |

Implicit multiplication: `2x`, `3sin(x)`, `(a)(b)`, `4(2+1)`.

### Functions

`sin cos tan asin acos atan sqrt cbrt ln log abs floor ceil`

- Trig respects the **DEG / RAD** selector in the header (default DEG).
- `log` is base 10, `ln` is natural log.

### Constants

| Token | Value |
|---|---|
| `pi` or `π` | 3.14159… |
| `e` | 2.71828… |
| `tau` | 2π |

### Variables and multi-variable use

Variables like `x` do **not** error — the expression is held unevaluated
until `x` has a value. This is exactly how the Graph tab works: it samples
your expression at 600 points of `x`. To use a fixed value inline, just type
the number (e.g. `sin(30)` in DEG).

## 5. Autocorrect

The `✨ Auto-correct` button in the header (on by default) fixes common typos
before the expression is evaluated. A `✨ Auto-corrected: …` line appears
under the result whenever it made a change, so you always see what happened.

| You type | Becomes |
|---|---|
| `5x3`, `2 x 3` | `5×3`, `2×3` (standalone `x` only — words are untouched) |
| `2(3+1)` | `2×(3+1)` |
| `2**8` | `2^8` |
| `2++3`, `2//4` | `2+3`, `2/4` |
| `5--3` | `5+3` |
| `(3+2` | `(3+2)` |
| `+3+` | `3` (trailing/leading stray operators) |
| `6 pls 2` | `6 plus 2` (word shorthand: `pls`, `min`) |

Turn it off if you want to type exactly what you see (e.g. testing an
intentionally malformed expression to watch the error message).

## 6. Natural-language input

Use the **top box** (the one that says *Try "what is 15% of 240"…*). It
understands everyday phrasing, fully offline — numbers may be digits **or**
English words.

Phrases that work:

| Say / type | Interpreted as |
|---|---|
| `what is 15% of 240` | `15% × 240` → 36 |
| `15 percent of 240` | same |
| `two hundred and fifty times three` | `250 × 3` → 750 |
| `calculate 12 plus 8` | `12 + 8` |
| `7 minus 2` | `7 − 2` |
| `6 pls 2` / `6 x 2` / `6 min 2` | shorthand forms of plus / times / minus |
| `100 divided by 4` · `100 over 4` | `100 ÷ 4` |
| `square root of 144` | `sqrt(144)` → 12 |
| `9 squared` / `4 cubed` | `9^2` / `4^3` |
| `2 to the power of 8` | `2^8` |
| `convert 72 fahrenheit to celsius` | opens the Convert drawer pre-filled |
| `72 fahrenheit to celsius` | same (the word *convert* is optional) |

When an interpretation is accepted, the main input area shows the phrase with
a note (e.g. *"12 plus 8" → add*) and a **✕** — click the ✕ to discard it and
return to normal typing. Press **Enter** to commit the result to History.

## 7. Voice input

Click the **🎙 mic button** next to the NL box.

1. First use: Fralculator downloads a ~40 MB speech model (Whisper-tiny,
   runs as WebAssembly **on your machine**). Cached afterwards.
2. Click the mic → it records until you click again.
3. It transcribes locally, cleans up filler words ("um", "okay", "please"…),
   interprets the phrase like the NL box, and **commits the result straight
   to History** with a `🎙` tag — no Enter needed.

Tip: speak in full sentences, the same phrasings as §6
("two hundred and fifty times three" works best). Audio never leaves the
device.

## 8. Steps tab

Every multi-step calculation is broken into a numbered trace, rendered as
real math notation (KaTeX), in **PEMDAS order**, ending with a boxed answer:

```
1.  3 × 4
2.  12 + 5
3.  ✓  = 17
```

- Single-step inputs show a one-line note instead ("A single-step
  computation").
- **✦ Explain This in plain English** — under the steps, a button generates
  an offline, rule-based explanation of the calculation with a real-world
  framing (e.g. percentages as "out of 100"). No data is sent anywhere.

## 9. Graph tab

- The top input plots **f(x)**. Leave it empty and it auto-plots whatever is
  in the *main* expression input (if that contains `x`); otherwise it shows
  the demo `sin(x) * x`.
- Examples that look good: `x^2 - 4`, `sin(x) * x`, `sqrt(abs(x))`,
  `cos(x) + sin(x)^2`, `e^(-x^2)`.
- The window is fixed to **x ∈ [−10, 10]**, sampled at 600 points.
  Hover the plot for (x, y) readouts; drag to pan, scroll to zoom.
- Undefined regions (e.g. `sqrt(x)` for x < 0) are simply left blank —
  they are not errors.
- Trig in graphs follows the DEG/RAD setting from the header.

## 10. History tab

History persists between launches (stored locally on disk via localStorage).

- **Click a row** → the expression reloads into the main input.
- **Search box** → filters by expression, result, *or tag* (case-insensitive).
- **Expand a row (chevron)** → edit tags (comma-separated, e.g.
  `tax, work`), delete the entry, or **Share as image**.
- **Share as image** → renders a styled "Fralculator" card (expression,
  result, tags) as a **PNG download** you can post in chat/screenshots.
- Voice results appear here automatically with a `🎙 voice` tag.
- **Clear all** empties the list (a confirmation is shown).

## 11. Unit & currency conversion

Open with **⇄ Convert** in the header.

### Unit drawer

1. Pick a **category** (11 total):
   Length, Mass/Weight, Temperature, Time, Speed, Area, Volume, Energy,
   Data, Frequency, Pressure.
2. Enter a **value**, choose **from** and **to** units — the result is
   live as you type.
3. Everything is computed locally with exact base-unit factors.
   Temperature uses the proper affine formulas (not a plain scale), so
   Celsius ↔ Fahrenheit ↔ Kelvin is always exact.

### Currency panel (bottom of the drawer)

- Live **ECB reference rates** from the free Frankfurter API (no API key).
- Works only online; when offline the panel says so and unit conversion
  continues to work normally.

### Conversions from the NL box

Typing `convert 72 fahrenheit to celsius` (or `72 fahrenheit to celsius`)
opens the drawer **pre-filled** with the right category, units, and value —
handy when speaking (see §7).

## 12. EHCalc

The **EH** tab is a self-contained cybersecurity toolkit. All tools run
100% locally — nothing is transmitted.

### Subnet

Enter an IPv4 address + CIDR prefix (`/24`) or dotted mask
(`255.255.255.0`). You get: network, broadcast, mask, wildcard, first/last
host, usable host count, host range, IP class, and private/public flag.
Example: `192.168.1.42 /24` → 254 usable hosts, range
`192.168.1.1 – 192.168.1.254`.

### Hash

Type text, click an algorithm button — hashes are computed in-app
(WebCrypto + a local MD5 implementation): **MD5, SHA-1, SHA-256, SHA-512**.
Results are shown per algorithm and click-to-copy.
Use case: quick integrity checks and learning what digests look like.

### Encode

One input, ten operations:

| Button | Direction |
|---|---|
| → Base64 / ← Base64 | text ⇄ Base64 (handles Unicode) |
| → Hex / ← Hex | text ⇄ hex bytes (input may be spaced or compact) |
| → URL / ← URL | percent-encode / decode |
| ROT13 / Atbash | letter-shift ciphers (type twice to reverse) |
| → ASCII / ← ASCII | text ⇄ ASCII code lists (spaces or commas) |

Watch the arrows: `← ASCII` expects **numbers** (`60 45 45 45` → `<---`);
`→ ASCII` does the reverse. If you pick the wrong direction, the error
message tells you which button to use.

### Password

Two tools in one:

1. **Strength report** — type any password; you get entropy (bits),
   character pool, keyspace size, a 3-tier **STRONG / MEDIUM / WEAK**
   rating, a verdict, estimated brute-force crack times (offline single GPU,
   GPU cluster, online throttled), and concrete tips.
2. **Generator** — length slider (6–40), toggle character sets
   (a–z / A–Z / 0–9 / !@#$), press **Generate**. Passwords use the
   cryptographic RNG (`crypto.getRandomValues` with unbiased sampling),
   guarantee one character from each enabled set, and never touch storage.
   **Copy** copies to clipboard.

### Ports

Search by **number** (`3389`), **service name** (`smb`), or **keyword**
(`database`). Returns port, protocol, description, and a ⚠ risk note for
notoriously dangerous services (RDP, Telnet, SMB…).

## 13. Themes and appearance

Three dropdowns in the header:

- **Angle mode**: `DEG` (default) / `RAD` — affects trig everywhere.
- **Theme**: `Auto` (follows your OS), `Dark`, `Light`.
- **Palette**: 8 accent palettes — `Aurora` (default), `Sunset`, `Ocean`,
  `Forest`, `Candy`, `Gold`, `Mono`, `Grape`.

All preferences persist between launches.

## 14. Keyboard shortcuts

| Key | Where | Action |
|---|---|---|
| `Enter` | main input | commit current result to History |
| `Enter` | NL box | submit the natural-language phrase |
| `Backspace` | main input | delete last character |
| Escaping | any input | plain typing works everywhere; no other global hotkeys |

The keypad is a click/tap fallback — everything is typeable on a real
keyboard.

## 15. Troubleshooting

| Symptom | What to do |
|---|---|
| "Could not understand that" in NL box | Use one of the phrasings in §6; keep it to a single calculation per sentence |
| Voice button says "needs internet on first run" | The 40 MB model hasn't been downloaded yet — check connection, retry; it's cached forever after |
| Voice: "Could not hear anything" | Speak a bit louder/closer and avoid background noise; retry |
| Result shows `Infinity` or a huge exponent | Division by zero or a very large/small value — the display switches to scientific notation for |value| ≥ 10¹⁵ or < 10⁻⁹ |
| Graph is blank | The expression is undefined on [−10, 10] (e.g. `ln(x)` only for x > 0). Hover the plot to check the window, or try a broader function |
| Currency panel says "Offline" | Expected without internet — all unit conversions still work locally |
| `← Hex: odd number of digits` | Hex input must be whole byte pairs (`48 69`, not `486`) |
| `← ASCII: looks like text` | You typed characters into the decode direction — use `→ ASCII` (see §12) |
| Wrong trig results | Check the DEG/RAD selector in the header — the default is degrees |
| App forgets nothing / history gone | History is stored in the app's local profile; clearing browser/app data clears it. Nothing is synced to a server |

## 16. Privacy

- **No accounts, no telemetry, no analytics.**
- Math, graphing, history, EHCalc, and explanations run 100% locally.
- Voice audio is transcribed on-device (WASM) and never uploaded.
- The only network traffic: the one-time voice model download, and ECB
  currency rates when the currency panel is open.
- Generated passwords are never written to disk or clipboard except when
  you press Copy.

---

*Feedback and bug reports: GitHub Issues at
[github.com/fralsare/fralculator](https://github.com/fralsare/fralculator).*
