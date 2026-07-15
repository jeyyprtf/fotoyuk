import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { track } from '../lib/telemetry'
import { useEffect } from 'react'

export function Home() {
  const { d } = useLang()
  useEffect(() => {
    track('session_start')
  }, [])

  return (
    <div className="flex flex-col items-center gap-8 pb-8 pt-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-sage-deep ring-1 ring-line shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />
          {d.privacyBadge}
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          {d.brand}
        </h1>
        <p className="mx-auto max-w-md text-base text-ink-soft sm:text-lg">{d.tagline}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="relative w-full max-w-sm"
      >
        <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-rose/40 via-lilac/30 to-sage/40 blur-2xl" />
        <div className="relative overflow-hidden rounded-[1.75rem] bg-white p-4 shadow-lg ring-1 ring-line">
          <div className="grid grid-cols-2 gap-2">
            {['🐶', '💕', '✨', '🐱'].map((e, i) => (
              <div
                key={i}
                className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-cream text-4xl"
                style={{
                  background:
                    i === 0
                      ? 'linear-gradient(145deg,#f7e9ee,#fff)'
                      : i === 1
                        ? 'linear-gradient(145deg,#efe8f8,#fff)'
                        : i === 2
                          ? 'linear-gradient(145deg,#e8f2eb,#fff)'
                          : 'linear-gradient(145deg,#f5ebe4,#fff)',
                }}
              >
                {e}
              </div>
            ))}
          </div>
          <p className="mt-3 font-display text-sm font-bold text-ink-soft">2×2 · frames · AR · edit</p>
        </div>
      </motion.div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          to="/booth"
          className="rounded-2xl bg-ink px-6 py-4 text-center font-display text-lg font-bold text-cream shadow-md transition hover:scale-[1.02] active:scale-[0.99]"
        >
          {d.start}
        </Link>
        <Link
          to="/gallery"
          className="rounded-2xl bg-white px-6 py-3.5 text-center font-display font-bold text-ink ring-1 ring-line transition hover:bg-cream"
        >
          {d.gallery}
        </Link>
      </div>
    </div>
  )
}
