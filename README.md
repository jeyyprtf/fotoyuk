# FotoYuk

Browser photobooth — private, playful, client-side only.

- **Live:** https://fotoyuk.juan.web.id · https://fotoyuk.vercel.app
- Photos never leave your device (camera + compose + AR in browser)
- Anonymous telemetry only (Vercel Analytics events)

> **For coding agents:** read **[AGENTS.md](./AGENTS.md)** first — full architecture, deploy, pitfalls, and handoff memory.

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Connected to Vercel project `photobooth` from GitHub `jeyyprtf/fotoyuk` (`main`).

```bash
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```

### DNS (Cloudflare zone `juan.web.id`)

```
Type: CNAME
Name: fotoyuk
Target: cname.vercel-dns.com
Proxy: DNS only (grey cloud)
```

## Stack

Vite · React · TypeScript · Tailwind 4 · Framer Motion · MediaPipe Face Landmarker · idb-keyval · Vercel Analytics

## Features (short)

- Live camera + Instagram-style horizontal filters
- Layouts 1×1 / 2×2 / 2×3 / 2×4
- Frames (love, star, pastel, film, doodle, …)
- Effects + skin tone + AR face (dog/cat/hearts/sparkle)
- Manual shutter, timer 3/5/10, screen flash, SFX
- Print-film animation, edit text/emoji, local gallery, download/share
- Bilingual ID/EN, Terms & Privacy
