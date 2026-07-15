# FotoYuk — Agent Handoff / Project Memory

> Import this file into any coding agent before changing the repo.
> Last updated: 2026-07-15

---

## 1. What this is

**FotoYuk** = browser photobooth SPA. Users take multi-shot collages on their own device with frames, filters, AR face overlays, stickers/text edit, local gallery, download/share.

**Brand:** FotoYuk  
**Owner / domain owner:** Juan (`juan.web.id`)  
**GitHub:** https://github.com/jeyyprtf/fotoyuk  
**Local path (dev machine):** `/home/ubuntu/photobooth`

### Production URLs

| URL | Role |
|-----|------|
| https://fotoyuk.juan.web.id | **Primary custom domain** |
| https://fotoyuk.vercel.app | Vercel alias |
| https://photobooth-iota-five.vercel.app | Original Vercel project URL |

### Privacy rule (non-negotiable)

- **Photos never upload.** Camera stream, AR, compose, edit, export all run client-side.
- Server only serves static assets + anonymous analytics events (no image bytes, no face data, no PII).
- Gallery = IndexedDB on device (`idb-keyval`), cap **20** items (auto-prune oldest).

---

## 2. Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | Vite 8 + React 19 + TypeScript | SPA, no SSR needed |
| CSS | Tailwind CSS 4 (`@tailwindcss/vite`) | Utility, soft Gen-Z theme |
| Motion | framer-motion | Print anim, tray transitions, micro-UX |
| Face AR | `@mediapipe/tasks-vision` Face Landmarker | Lazy-loaded on first AR pick |
| Storage | `idb-keyval` | Gallery blobs |
| Router | `react-router-dom` v7 | `/`, `/booth`, `/gallery`, `/terms`, `/privacy` |
| Analytics | `@vercel/analytics` + thin `track()` | Pageviews + custom events |
| Deploy | Vercel (static `dist/`) | SPA rewrites in `vercel.json` |
| DNS | Cloudflare zone `juan.web.id` | CNAME `fotoyuk` → `cname.vercel-dns.com` |

**No backend, no DB, no auth, no photo API.**

### Commands

```bash
npm install
npm run dev          # vite dev
npm run build        # tsc -b && vite build
npm run preview      # preview dist
npm run lint         # oxlint
npx tsx src/lib/compose.selfcheck.ts   # tiny layout assert
```

### Deploy

```bash
# needs VERCEL_TOKEN
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
# GitHub main is connected → push also triggers Vercel
```

Vercel project name: **`photobooth`** (team: juanxybers-projects).  
Git connected to `jeyyprtf/fotoyuk` `main`.

---

## 3. Architecture

```
[Home] → [Booth live] → shutter → countdown multi-shot → print anim → result/edit → gallery
              ↑ live camera + horizontal tray (filters IG-style)
```

### Routes (`src/App.tsx`)

| Path | Page | Notes |
|------|------|-------|
| `/` | `Home` | Landing, CTA |
| `/booth` | `Booth` | Core product — fullscreen cam shell (no site header) |
| `/gallery` | `Gallery` | IndexedDB list, modal detail, delete/share/download |
| `/terms` | `Legal.Terms` | Bilingual T&C |
| `/privacy` | `Legal.Privacy` | Bilingual privacy |

`Shell` hides global header/footer on `/booth` so camera can be full-bleed.

### Key modules (`src/`)

```
src/
  App.tsx, main.tsx, index.css, types.ts, i18n.ts
  components/
    Shell.tsx          # layout chrome
    Chip.tsx           # Chip, Section, PickCard, FilterBubble (IG circles)
    PrintAnim.tsx      # film eject animation
    Toast.tsx          # toast + confetti
  hooks/
    useCamera.ts       # getUserMedia, secure-context checks, typed errors
    useLang.tsx        # ID/EN + localStorage
  lib/
    compose.ts         # collage canvas compose + cute frame deco
    filters.ts         # CSS filters + postProcess (vignette/grain/leak)
    ar.ts              # MediaPipe lazy load + ear/heart/sparkle draw
    gallery.ts         # IndexedDB CRUD, cap 20
    export.ts          # download + Web Share API
    sfx.ts             # Web Audio ticks + shutter (no asset files)
    telemetry.ts       # track() → Vercel Analytics
    compose.selfcheck.ts
  pages/
    Booth.tsx          # ★ largest file — live UI + shoot pipeline
    Home.tsx, Gallery.tsx, Legal.tsx
```

### Booth phases (`Booth.tsx`)

```
live → shooting → printing → result ⇄ edit
```

- **`live`:** camera always on; options in bottom tray; **manual shutter only** (no auto-start).
- **`shooting`:** multi-shot loop with countdown; first shot uses full timer (3/5/10s); follow-ups `min(timer, 3)`.
- **`printing`:** `PrintAnim` then confetti → `result`.
- **`edit`:** drag stickers/text on base image; recompose on drop.

### Capture pipeline

1. `getUserMedia` via `useCamera` (prefer `facingMode: user`, fallback `video: true`).
2. Live CSS filter from `cssFilter(effect, skin)` on `<video>`.
3. AR overlay canvas via `drawAr` RAF loop when AR ≠ none.
4. On each snap: optional **screen flash** (white full-viewport) → `playShutter` SFX → `captureVideoFrame` (mirror + effect + AR baked) → thumb.
5. After all shots: `composeStrip(shots, { layout, frame, brand })` → PNG blob → print anim → gallery/export.

**Important:** effects/skin are baked into shot canvases; compose uses `effect: 'none', skin: 'none'` to avoid double-apply. Overlays (text/emoji) applied only at compose/recompose.

---

## 4. Product features (current)

### Layouts
`1x1`, `2x2`, `2x3`, `2x4` — defined in `LAYOUTS` (`types.ts`). Cell size in compose: 480×600, gap 20.

### Frames (cute, emoji-heavy)
`polaroid`, `pastel`, **`love`** (pink + big hearts), **`star`**, `film`, `doodle`, `minimal`.  
Deco emojis drawn on canvas in `compose.ts` (`frameStyle` + `deco[]`) — intentional slight photo overlap.

### Effects
`none`, `soft`, `vignette`, `grain`, `leak`, `bw`, `warm`, `cool` — CSS + pixel postProcess.

### Skin tone looks
`none`, `glow`, `peach`, `porcelain`, `even` — gentle tone curves, not heavy beauty mesh.

### AR (MediaPipe)
`none`, `dog`, `cat`, `hearts`, `sparkle` — lazy load WASM + model from CDN. Fail → manual stickers.  
Model URLs in `lib/ar.ts` (jsdelivr wasm + google storage `.task`).

### Timer
`3 | 5 | 10` seconds — first shot full; subsequent shots capped at 3s.

### Screen flash
`cfg.screenFlash` — white full-screen overlay **before** capture (~160ms) so front camera exposure brightens. Toggle 🔦/⚡ in booth top bar.

### SFX
Web Audio (`lib/sfx.ts`): countdown tick, shutter “cekrek”, pop. Toggle 🔊/🔇. `unlockAudio()` on first user gesture.

### Edit
Text + emoji stickers, drag on result, recompose export. Stickers list in `STICKERS`.

### Gallery
Save/list/delete/clear, download, share (Web Share file or fallback download). Cap 20.

### i18n
Default from `navigator.language` / `localStorage fotoyuk-lang`. Dict in `i18n.ts` (ID + EN). Toggle in header.

### Telemetry events (anonymous only)
`session_start`, `layout_select`, `filter_select`, `capture_complete`, `download`, `share`, `delete_photo`, `locale`.

---

## 5. UI/UX conventions

### Design tokens (`index.css` `@theme`)
- cream `#fbf7f2`, ink `#2a2a2e`, rose `#e8b4b8`, sage `#a8c5b0`, lilac `#c4b5e0`
- Fonts: Nunito (display), Outfit (body) — Google Fonts in `index.html`
- Soft, Gen-Z, playful, **not neon**

### Booth live layout (critical UX)
- Camera is **full-bleed upper area** (not scrolled away).
- Bottom **tray** with horizontal scroll:
  - Category tabs: Filter · Frame · Layout · AR · Timer
  - Options = **Instagram-style circular bubbles** (`FilterBubble`) or compact cards
- Sticky shutter button in tray footer
- Top floating controls: back, sound, mirror, screen flash
- Horizontal rails: class `.h-scroll` (snap, hidden scrollbar)

### Ponytail / laziness notes already in code
Search for `// ponytail:` — deliberate shortcuts with upgrade paths (gallery cap, grain density, snappy countdown, Web Audio instead of assets, etc.).

---

## 6. Infra & deploy memory

### Cloudflare
- Zone: `juan.web.id` (zone id used: `926150576fdedc1bcc98ff0850ef9d75`)
- Account id: `2ad509d84d04a89b7567a657839a9466`
- Record: `fotoyuk` **CNAME** → `cname.vercel-dns.com`, **proxied: false** (DNS only / grey cloud)
- Orange-cloud proxy can break Vercel SSL — keep grey unless you know what you're doing

### Vercel
- Project: `photobooth` / id `prj_YD5JpYfrxt0sGbeAxJHHymMkDC54`
- Framework: Vite, output `dist`
- Domains attached: `fotoyuk.juan.web.id`, `fotoyuk.vercel.app`, `photobooth-iota-five.vercel.app`
- `vercel.json`: SPA rewrite + headers (`Permissions-Policy: camera=(self)`, etc.)

### Known infra lessons
1. **Camera permission is per-origin.** Allow on `*.vercel.app` ≠ allow on `fotoyuk.juan.web.id`. UI shows host + typed errors (`denied`, `secure`, `busy`, …).
2. Custom domain needs valid DNS **and** SSL issued; if HTTPS hangs after DNS add, remove/re-add domain on Vercel to force cert.
3. Old CF token may have zone **read** but not DNS **edit** — need `Zone → DNS → Edit`.
4. Local DNS resolvers on some servers can lag; public DoH (`cloudflare-dns.com/dns-query`) is reliable for checks.

### OpenCode MCP (this environment)
- Cloudflare remote MCP in `~/.config/opencode/opencode.json` (`https://mcp.cloudflare.com/mcp`) — needs `opencode mcp auth cloudflare` (OAuth).
- Ponytail plugin often active; intensity was **lite** during build.

---

## 7. Important bugs fixed / pitfalls for agents

| Issue | Fix / rule |
|-------|------------|
| StrictMode double multi-shot | `shootGen` ref generation counter cancels stale loops |
| Video remount kills stream | Single shared camera stage for live+shooting; don't mount two `<video>` refs |
| Edit drag stale overlays | `overlaysRef` on pointer up before recompose |
| Double filters on strip | Bake effect into shots; compose with effect none |
| Grain lag | Sparse pixel step in `postProcess` |
| Auto-shoot felt rushed/bad | Manual shutter only; user prepares look first |
| Long wait multi-shot | Faster ticks; follow-up shots timer capped at 3s |
| i18n key clash `effects` string vs map | Labels use `effectsLabel` / `layoutLabel` etc. |
| Camera on custom domain “broken” | Almost always per-origin permission or non-HTTPS — not compose bug |

---

## 8. File map for common tasks

| Task | Touch |
|------|-------|
| Add frame style | `types.ts` FRAMES + `i18n` frames + `compose.ts` frameStyle + Booth FRAME_SWATCH/EMOJI |
| Add effect | `types.ts` EFFECTS + `filters.ts` + i18n + Booth EFFECT_PREVIEW |
| Change collage cell size | `compose.ts` CELL_W/H/GAP |
| Shoot timing / timer | `Booth.tsx` `runCountdown` + shoot loop |
| Screen flash | `cfg.screenFlash`, `screenFlashLit`, CSS `.screen-flash*` |
| AR landmark overlay | `lib/ar.ts` |
| Gallery cap | `lib/gallery.ts` `MAX` |
| Legal copy | `i18n.ts` termsBody / privacyBody |
| Analytics event | `lib/telemetry.ts` + call sites |
| Deploy headers | `vercel.json` |
| Theme colors | `index.css` `@theme` |

---

## 9. Out of scope (intentionally not built)

- User accounts / cloud photo album
- Server-side image processing
- Beauty face reshape / mesh morph
- Payments / watermark tiers
- Admin dashboard
- Heavy PWA service worker (only light `manifest.webmanifest`)

---

## 10. Agent operating rules for this repo

1. **Privacy first** — never add photo upload, face telemetry, or remote image storage without explicit user request + privacy doc update.
2. **Prefer client-only** solutions.
3. **Fewest files** — extend existing modules before scaffolding.
4. After non-trivial changes: `npm run build` must pass.
5. Don't commit secrets (tokens). Tokens may exist in chat history only; rotate if leaked.
6. Don't force-push; don't change git config.
7. Keep UI soft Gen-Z (cream/rose/sage/lilac), mobile-first booth.
8. When changing booth layout, **keep camera visible while options scroll** (horizontal tray pattern).
9. Mark deliberate shortcuts with `// ponytail: …`.

---

## 11. Quick verification checklist

- [ ] `npm run build` green
- [ ] Booth: camera opens on HTTPS
- [ ] Live filter/frame/AR visible before shutter
- [ ] Shutter manual; timer 3/5/10 works
- [ ] Screen flash whites out then captures
- [ ] Multi-shot count matches layout
- [ ] Print anim → download/share/save
- [ ] Gallery persist + delete
- [ ] ID/EN toggle
- [ ] Network tab: no photo uploads
- [ ] Custom domain camera permission prompt (per-origin)

---

## 12. Suggested next improvements (if asked)

- PWA install prompt + icons
- Optional mute default for SFX on first visit
- Event templates (birthday, soft wedding)
- More AR packs (still client MediaPipe)
- QR on strip linking to FotoYuk
- Better iOS share reliability testing

---

## 13. One-liner for new agent

> FotoYuk is a privacy-first Vite/React photobooth SPA on Vercel + Cloudflare DNS (`fotoyuk.juan.web.id`). All photo work is client-side; `Booth.tsx` is the core (live cam + IG-style horizontal tray + manual shutter + compose). Never upload photos. Build with `npm run build`; deploy via Vercel on `main`.
