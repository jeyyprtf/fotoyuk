# FotoYuk

Browser photobooth — private, playful, client-side only.

- **Live:** https://fotoyuk.juan.web.id (custom domain) · https://photobooth-iota-five.vercel.app (Vercel)
- Photos never leave your device (camera + compose + AR in browser)
- Anonymous telemetry only (Vercel Analytics events)

### DNS (Cloudflare)

```
Type: CNAME
Name: fotoyuk
Target: cname.vercel-dns.com
Proxy: DNS only (grey cloud)
```

Vercel project already has domain `fotoyuk.juan.web.id` attached.

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

## Stack

Vite · React · TypeScript · Tailwind 4 · Framer Motion · MediaPipe Face Landmarker · idb-keyval · Vercel Analytics
