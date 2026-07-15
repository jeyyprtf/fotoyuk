import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { track } from '../lib/telemetry'
import { useEffect } from 'react'

export function Home() {
  const { d, lang } = useLang()
  useEffect(() => {
    track('session_start')
  }, [])

  const steps = lang === 'id'
    ? [
        ['01', 'Pilih gayamu', 'Atur layout, frame, filter, dan AR sebelum mulai.'],
        ['02', 'Pose sesukamu', 'Timer memandu setiap jepretan tanpa bikin buru-buru.'],
        ['03', 'Bawa pulang', 'Hias, download, share, atau simpan lokal di perangkat.'],
      ]
    : [
        ['01', 'Pick your vibe', 'Set your layout, frame, filters, and AR before you start.'],
        ['02', 'Strike a pose', 'A friendly timer guides every shot without the rush.'],
        ['03', 'Take it home', 'Decorate, download, share, or keep it locally.'],
      ]

  return (
    <div className="home-page pb-12">
      <section className="hero-grid items-center gap-8 sm:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48 }}
          className="relative z-10 text-center lg:text-left"
        >
          <div className="privacy-stamp mx-auto mb-5 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-sage-deep lg:mx-0">
            <span className="h-2 w-2 rounded-full bg-sage-deep pulse-soft" />
            {d.privacyBadge}
          </div>
          <p className="mb-2 font-display text-sm font-extrabold uppercase tracking-[0.2em] text-rose-deep">
            your pocket photo studio
          </p>
          <h1 className="hero-title font-display font-extrabold text-ink">
            Keep the<br />
            <span className="hero-script">silly little</span><br />
            moments.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg lg:mx-0">
            {d.tagline} {lang === 'id' ? 'Pilih vibe, pose, lalu bawa pulang fotonya.' : 'Pick a vibe, pose, and take the memory home.'}
          </p>
          <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 sm:flex-row lg:mx-0 lg:max-w-none">
            <Link to="/booth" className="btn-primary hero-cta px-6 py-4 text-lg">
              <span className="text-xl">📸</span> {d.start} <span aria-hidden>→</span>
            </Link>
            <Link to="/gallery" className="btn-secondary px-5 py-4">
              🎞️ {d.gallery}
            </Link>
          </div>
          <p className="mt-4 text-xs font-semibold text-ink-soft/75">
            🔒 {lang === 'id' ? 'Tanpa akun · tanpa upload · langsung jadi' : 'No account · no uploads · ready in seconds'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="hero-collage relative mx-auto w-full max-w-[430px]"
        >
          <span className="doodle doodle-star" aria-hidden>✦</span>
          <span className="doodle doodle-heart" aria-hidden>♡</span>
          <div className="photo-strip photo-strip-back" aria-hidden>
            <div /><div /><div />
          </div>
          <div className="photo-strip relative z-10">
            <div className="tape tape-top">besties only</div>
            {[
              ['🐶', '✦', 'bg-rose/25'],
              ['😙', '♡', 'bg-lilac/25'],
              ['🐱', '✿', 'bg-sage/25'],
            ].map(([face, mark, bg], i) => (
              <motion.div
                key={i}
                className={`photo-cell ${bg}`}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="photo-face">{face}</span>
                <span className="photo-mark">{mark}</span>
              </motion.div>
            ))}
            <div className="strip-caption">
              <span>{d.brand}!</span>
              <span>15.07.26 ♡</span>
            </div>
          </div>
          <div className="hero-sticker hero-sticker-one">✨ cute mode</div>
          <div className="hero-sticker hero-sticker-two">100% local!</div>
        </motion.div>
      </section>

      <section className="mt-16 sm:mt-24">
        <div className="mb-7 text-center">
          <span className="section-kicker">easy peasy</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            {lang === 'id' ? 'Tiga langkah, satu kenangan ♡' : 'Three steps, one little memory ♡'}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, copy], i) => (
            <motion.article
              key={number}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08 }}
              className={`step-card step-card-${i + 1}`}
            >
              <span className="step-number">{number}</span>
              <span className="mb-4 block text-3xl">{['🎨', '📸', '🎞️'][i]}</span>
              <h3 className="font-display text-xl font-extrabold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{copy}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  )
}
