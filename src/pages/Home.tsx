import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { track } from '../lib/telemetry'
import { useEffect } from 'react'

const features = [
  { e: '🎞️', k: 'layout' },
  { e: '🖼️', k: 'frame' },
  { e: '✨', k: 'fx' },
  { e: '🐶', k: 'ar' },
] as const

export function Home() {
  const { d, lang } = useLang()
  useEffect(() => {
    track('session_start')
  }, [])

  const blurb =
    lang === 'id'
      ? ['Pilih layout & frame', 'Filter + AR lucu', 'Print anim & edit', 'Simpan / share lokal']
      : ['Pick layout & frame', 'Filters + cute AR', 'Print anim & edit', 'Save / share locally']

  return (
    <div className="flex flex-col items-center gap-9 pb-10 pt-2 text-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-3"
      >
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold text-sage-deep shadow-soft ring-1 ring-line">
          <span className="h-1.5 w-1.5 rounded-full bg-sage-deep pulse-soft" />
          {d.privacyBadge}
        </div>
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">
          {d.brand}
          <span className="text-rose-deep">.</span>
        </h1>
        <p className="mx-auto max-w-md text-base leading-relaxed text-ink-soft sm:text-lg">{d.tagline}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.06, duration: 0.45 }}
        className="relative w-full max-w-sm"
      >
        <div className="absolute -inset-4 rounded-[2.2rem] bg-gradient-to-br from-rose/35 via-lilac/25 to-sage/35 blur-2xl" />
        <div className="relative card overflow-hidden p-4">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { e: '🐶', bg: 'linear-gradient(145deg,#f7e9ee,#fff)' },
              { e: '💕', bg: 'linear-gradient(145deg,#efe8f8,#fff)' },
              { e: '✨', bg: 'linear-gradient(145deg,#e8f2eb,#fff)' },
              { e: '🐱', bg: 'linear-gradient(145deg,#f5ebe4,#fff)' },
            ].map((cell, i) => (
              <motion.div
                key={i}
                className="floaty flex aspect-[4/5] items-center justify-center rounded-2xl text-4xl"
                style={{ background: cell.bg, animationDelay: `${i * 0.25}s` }}
                whileHover={{ scale: 1.03 }}
              >
                {cell.e}
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {features.map((f, i) => (
              <span
                key={f.k}
                className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-ink-soft ring-1 ring-line"
              >
                <span>{f.e}</span>
                {blurb[i]}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <Link to="/booth" className="btn-primary py-4 text-lg">
          <span>📸</span> {d.start}
        </Link>
        <Link to="/gallery" className="btn-secondary py-3.5">
          {d.gallery}
        </Link>
      </motion.div>

      <p className="max-w-xs text-xs leading-relaxed text-ink-soft/80">
        {lang === 'id'
          ? 'Kamera + filter + export 100% di browser kamu. Zero upload drama.'
          : 'Camera + filters + export stay 100% in your browser. Zero upload drama.'}
      </p>
    </div>
  )
}
