import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { useCamera } from '../hooks/useCamera'
import { Chip, PickCard, Section } from '../components/Chip'
import { PrintAnim } from '../components/PrintAnim'
import { Confetti, Toast } from '../components/Toast'
import {
  ARS,
  EFFECTS,
  FRAMES,
  LAYOUTS,
  SKINS,
  STICKERS,
  type ArId,
  type BoothConfig,
  type EffectId,
  type FrameId,
  type LayoutId,
  type OverlayItem,
  type SkinId,
} from '../types'
import { cssFilter } from '../lib/filters'
import { captureVideoFrame, composeStrip } from '../lib/compose'
import { drawAr, ensureAr } from '../lib/ar'
import { newId, saveGalleryItem } from '../lib/gallery'
import { downloadBlob, shareBlob } from '../lib/export'
import { track } from '../lib/telemetry'
import { tf } from '../i18n'

type Phase = 'setup' | 'shoot' | 'printing' | 'result' | 'edit'

const FRAME_SWATCH: Record<FrameId, string> = {
  polaroid: '#fffef9',
  pastel: '#f7e9ee',
  film: '#1a1a1c',
  doodle: '#fffaf5',
  minimal: '#2a2a2e',
}

const EFFECT_PREVIEW: Record<EffectId, string> = {
  none: 'none',
  soft: 'brightness(1.08) contrast(0.95) saturate(1.05)',
  vignette: 'brightness(0.92) contrast(1.08)',
  grain: 'contrast(1.1) brightness(1.02)',
  leak: 'saturate(1.35) contrast(1.05) hue-rotate(-8deg)',
  bw: 'grayscale(1) contrast(1.08)',
  warm: 'sepia(0.28) saturate(1.15)',
  cool: 'saturate(0.85) hue-rotate(18deg) brightness(1.04)',
}

const AR_EMOJI: Record<ArId, string> = {
  none: '🙂',
  dog: '🐶',
  cat: '🐱',
  hearts: '💕',
  sparkle: '✨',
}

export function Booth() {
  const { d, lang } = useLang()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('setup')
  const [cfg, setCfg] = useState<BoothConfig>({
    layout: '2x2',
    frame: 'polaroid',
    effect: 'none',
    skin: 'none',
    ar: 'none',
    mirror: true,
  })
  // live preview cam on setup too
  const camActive = phase === 'setup' || phase === 'shoot'
  const { videoRef, ready, error, restart } = useCamera(camActive)
  const arCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [arReady, setArReady] = useState(false)
  const [arFail, setArFail] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [shotIdx, setShotIdx] = useState(0)
  const shotsRef = useRef<HTMLCanvasElement[]>([])
  const [previewThumbs, setPreviewThumbs] = useState<string[]>([])
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [baseUrl, setBaseUrl] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [overlays, setOverlays] = useState<OverlayItem[]>([])
  const [saved, setSaved] = useState(false)
  const [textDraft, setTextDraft] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const lmRef = useRef<Awaited<ReturnType<typeof ensureAr>>>(null)
  const rafRef = useRef(0)
  const shootGen = useRef(0)

  const meta = useMemo(() => LAYOUTS.find((l) => l.id === cfg.layout)!, [cfg.layout])

  useEffect(() => {
    if (cfg.ar === 'none') return
    let cancelled = false
    void ensureAr().then((lm) => {
      if (cancelled) return
      lmRef.current = lm
      if (!lm) setArFail(true)
      else {
        setArReady(true)
        setArFail(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [cfg.ar])

  useEffect(() => {
    if ((phase !== 'shoot' && phase !== 'setup') || cfg.ar === 'none') return
    const loop = () => {
      const v = videoRef.current
      const c = arCanvasRef.current
      if (v && c && ready) {
        const ctx = c.getContext('2d')
        if (ctx) drawAr(ctx, v, cfg.ar, lmRef.current)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, cfg.ar, ready, videoRef])

  const takeShot = useCallback(() => {
    const v = videoRef.current
    if (!v) return null
    return captureVideoFrame(
      v,
      cfg.mirror,
      cfg.effect,
      cfg.skin,
      cfg.ar !== 'none' ? arCanvasRef.current : null,
    )
  }, [cfg, videoRef])

  const runCountdown = useCallback(
    async (from = 3) => {
      for (let n = from; n >= 1; n--) {
        setCountdown(n)
        await sleep(720)
      }
      setCountdown(0)
      setFlash(true)
      await sleep(140)
      setFlash(false)
      setCountdown(null)
      const frame = takeShot()
      if (!frame) return
      shotsRef.current.push(frame)
      const url = frame.toDataURL('image/jpeg', 0.72)
      setPreviewThumbs((t) => [...t, url])
      setShotIdx(shotsRef.current.length)
    },
    [takeShot],
  )

  const startShoot = () => {
    track('layout_select', { layout: cfg.layout })
    track('filter_select', { type: 'effect', id: cfg.effect })
    track('filter_select', { type: 'skin', id: cfg.skin })
    track('filter_select', { type: 'ar', id: cfg.ar })
    setOverlays([])
    setSaved(false)
    setShowConfetti(false)
    setPhase('shoot')
  }

  useEffect(() => {
    if (phase !== 'shoot' || !ready) return
    const gen = ++shootGen.current
    shotsRef.current = []
    setPreviewThumbs([])
    setShotIdx(0)
    ;(async () => {
      await sleep(500)
      if (shootGen.current !== gen) return
      for (let i = 0; i < meta.shots; i++) {
        if (shootGen.current !== gen) return
        await runCountdown(3)
        if (shootGen.current !== gen) return
        if (i < meta.shots - 1) await sleep(550)
      }
      if (shootGen.current !== gen) return
      try {
        const blob = await composeStrip(shotsRef.current, {
          layout: cfg.layout,
          frame: cfg.frame,
          effect: 'none',
          skin: 'none',
          brand: d.brand,
        })
        if (shootGen.current !== gen) return
        const url = URL.createObjectURL(blob)
        setResultBlob(blob)
        setResultUrl(url)
        setBaseUrl(url)
        track('capture_complete', { shots: meta.shots })
        setPhase('printing')
      } catch (e) {
        console.error(e)
        if (shootGen.current === gen) {
          setToast(lang === 'id' ? 'Gagal compose — coba lagi ya' : 'Compose failed — try again')
          setPhase('setup')
        }
      }
    })()
    return () => {
      shootGen.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ready])

  const recomposeWithOverlays = async (ovs: OverlayItem[]) => {
    if (!shotsRef.current.length) return
    const blob = await composeStrip(shotsRef.current, {
      layout: cfg.layout,
      frame: cfg.frame,
      effect: 'none',
      skin: 'none',
      overlays: ovs,
      brand: d.brand,
    })
    if (resultUrl && resultUrl !== baseUrl) URL.revokeObjectURL(resultUrl)
    const url = URL.createObjectURL(blob)
    setResultBlob(blob)
    setResultUrl(url)
  }

  const finishPrint = () => {
    setPhase('result')
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1600)
  }

  const save = async () => {
    if (!resultBlob) return
    await saveGalleryItem({
      id: newId(),
      blob: resultBlob,
      createdAt: Date.now(),
      layout: cfg.layout,
      frame: cfg.frame,
      effect: cfg.effect,
      skin: cfg.skin,
      ar: cfg.ar,
    })
    setSaved(true)
    setToast(d.saved)
  }

  const addEmoji = (emoji: string) => {
    const item: OverlayItem = {
      id: newId(),
      kind: 'emoji',
      content: emoji,
      x: 0.5 + (Math.random() - 0.5) * 0.2,
      y: 0.45 + (Math.random() - 0.5) * 0.2,
      scale: 1,
      rotation: 0,
    }
    const next = [...overlays, item]
    setOverlays(next)
    void recomposeWithOverlays(next)
  }

  const addText = () => {
    if (!textDraft.trim()) return
    const item: OverlayItem = {
      id: newId(),
      kind: 'text',
      content: textDraft.trim(),
      x: 0.5,
      y: 0.88,
      scale: 1,
      rotation: 0,
      color: '#2a2a2e',
    }
    const next = [...overlays, item]
    setOverlays(next)
    setTextDraft('')
    void recomposeWithOverlays(next)
  }

  const overlaysRef = useRef(overlays)
  overlaysRef.current = overlays

  const onPointerDown = (id: string) => setDragId(id)
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    setOverlays((ovs) => ovs.map((o) => (o.id === dragId ? { ...o, x, y } : o)))
  }
  const onPointerUp = () => {
    if (!dragId) return
    setDragId(null)
    void recomposeWithOverlays(overlaysRef.current)
  }

  const cancelShoot = () => {
    shootGen.current++
    setCountdown(null)
    setFlash(false)
    setPhase('setup')
  }

  const retake = () => {
    shootGen.current++
    setPhase('setup')
    if (resultUrl && resultUrl !== baseUrl) URL.revokeObjectURL(resultUrl)
    if (baseUrl) URL.revokeObjectURL(baseUrl)
    setResultUrl(null)
    setBaseUrl(null)
    setResultBlob(null)
    setOverlays([])
    setSaved(false)
  }

  const showCam = phase === 'setup' || phase === 'shoot'

  return (
    <div className="space-y-5 pb-28">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold text-ink-soft ring-1 ring-line transition hover:bg-white"
        >
          ← {d.back}
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-sage-deep ring-1 ring-line">
          <span className="h-1.5 w-1.5 rounded-full bg-sage-deep pulse-soft" />
          {d.privacyBadge}
        </span>
      </div>

      {/* Shared camera stage — stays mounted across setup→shoot so stream doesn't drop */}
      {showCam && (
        <div className="space-y-4">
          {phase === 'setup' && (
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {lang === 'id' ? 'Siapin look kamu' : 'Set your look'}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                {lang === 'id'
                  ? 'Preview live · pilih layout, frame, filter, AR'
                  : 'Live preview · pick layout, frame, filters, AR'}
              </p>
            </div>
          )}

          {phase === 'shoot' && (
            <>
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-extrabold text-ink">
                  {tf(d.shotOf, { n: Math.min(shotIdx + 1, meta.shots), total: meta.shots })}
                </p>
                <button
                  type="button"
                  onClick={cancelShoot}
                  className="rounded-full px-3 py-1 text-xs font-bold text-ink-soft ring-1 ring-line"
                >
                  {d.back}
                </button>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: meta.shots }).map((_, i) => (
                  <span
                    key={i}
                    className={[
                      'shot-dot',
                      i < shotIdx ? 'shot-dot-done' : '',
                      i === shotIdx ? 'shot-dot-active' : '',
                    ].join(' ')}
                  />
                ))}
              </div>
            </>
          )}

          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[1.75rem] bg-ink shadow-lift ring-1 ring-line">
            {error ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-cream">
                <span className="text-4xl">📷</span>
                <p className="font-display font-bold">{d.cameraError}</p>
                <p className="text-sm text-white/70">{d.permissionHint}</p>
                <button type="button" onClick={() => void restart()} className="btn-secondary mt-1 px-5 py-2 text-sm">
                  {d.continue}
                </button>
              </div>
            ) : (
              <>
                {!ready && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/80 text-sm font-semibold text-white/80">
                    <span className="pulse-soft">{lang === 'id' ? 'Buka kamera…' : 'Opening camera…'}</span>
                  </div>
                )}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={['absolute inset-0 h-full w-full object-cover', cfg.mirror ? 'mirror' : ''].join(' ')}
                  style={{ filter: cssFilter(cfg.effect, cfg.skin) }}
                />
                <canvas
                  ref={arCanvasRef}
                  className={[
                    'pointer-events-none absolute inset-0 h-full w-full object-cover',
                    cfg.mirror ? 'mirror' : '',
                  ].join(' ')}
                />
                {phase === 'setup' && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/55 to-transparent p-4 pt-12">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                        {d.layouts[cfg.layout]}
                      </span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                        {d.frames[cfg.frame]}
                      </span>
                      {cfg.effect !== 'none' && (
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                          {d.effects[cfg.effect]}
                        </span>
                      )}
                      {cfg.ar !== 'none' && (
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                          {AR_EMOJI[cfg.ar]} {d.ars[cfg.ar]}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <AnimatePresence mode="wait">
                  {phase === 'shoot' && countdown !== null && (
                    <motion.div
                      key={countdown}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-ink/25"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <span className="countdown-pop font-display text-8xl font-extrabold text-white drop-shadow-lg">
                        {countdown === 0 ? '📸' : countdown}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {flash && <div className="flash-out absolute inset-0 z-20 bg-white" />}
              </>
            )}
          </div>

          {phase === 'shoot' && previewThumbs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {previewThumbs.map((u, i) => (
                <motion.img
                  key={i}
                  src={u}
                  alt=""
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-[4.5rem] w-14 rounded-xl object-cover shadow-soft ring-1 ring-line"
                />
              ))}
              {Array.from({ length: meta.shots - previewThumbs.length }).map((_, i) => (
                <div
                  key={`e-${i}`}
                  className="flex h-[4.5rem] w-14 items-center justify-center rounded-xl bg-white/70 text-xs text-ink-soft ring-1 ring-dashed ring-line"
                >
                  ·
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETUP options (below live preview) */}
      {phase === 'setup' && (
        <div className="space-y-5">

          {/* Layout visual cards */}
          <Section title={d.layoutLabel} hint={`${meta.shots} shots`}>
            <div className="grid w-full grid-cols-4 gap-2">
              {LAYOUTS.map((l) => (
                <PickCard
                  key={l.id}
                  active={cfg.layout === l.id}
                  onClick={() => setCfg((c) => ({ ...c, layout: l.id as LayoutId }))}
                  className="p-2"
                >
                  <div
                    className="mb-1.5 grid gap-0.5 rounded-md bg-cream p-1"
                    style={{ gridTemplateColumns: `repeat(${l.cols}, 1fr)` }}
                  >
                    {Array.from({ length: l.shots }).map((_, i) => (
                      <div key={i} className="aspect-[3/4] rounded-[2px] bg-rose/50" />
                    ))}
                  </div>
                  <div className="text-center text-[11px] font-bold text-ink">{d.layouts[l.id]}</div>
                </PickCard>
              ))}
            </div>
          </Section>

          <Section title={d.frameLabel}>
            <div className="flex w-full gap-2 overflow-x-auto pb-1">
              {FRAMES.map((f) => (
                <PickCard
                  key={f}
                  active={cfg.frame === f}
                  onClick={() => setCfg((c) => ({ ...c, frame: f as FrameId }))}
                  className="min-w-[4.75rem] p-2"
                >
                  <div
                    className="mb-1.5 flex aspect-[3/4] items-center justify-center rounded-md"
                    style={{ background: FRAME_SWATCH[f] }}
                  >
                    <div
                      className="h-[55%] w-[55%] rounded-sm"
                      style={{
                        background: f === 'film' || f === 'minimal' ? '#555' : '#e8b4b8',
                        boxShadow: f === 'polaroid' ? '0 2px 0 #eee' : undefined,
                      }}
                    />
                  </div>
                  <div className="text-center text-[11px] font-bold">{d.frames[f]}</div>
                </PickCard>
              ))}
            </div>
          </Section>

          <Section title={d.effectsLabel}>
            <div className="flex w-full gap-2 overflow-x-auto pb-1">
              {EFFECTS.map((e) => (
                <PickCard
                  key={e}
                  active={cfg.effect === e}
                  onClick={() => setCfg((c) => ({ ...c, effect: e as EffectId }))}
                  className="min-w-[4.5rem] p-2"
                >
                  <div
                    className="mb-1.5 aspect-square rounded-lg bg-gradient-to-br from-rose via-peach to-lilac"
                    style={{ filter: EFFECT_PREVIEW[e] }}
                  />
                  <div className="text-center text-[11px] font-bold">{d.effects[e]}</div>
                </PickCard>
              ))}
            </div>
          </Section>

          <Section title={d.skinLabel}>
            {SKINS.map((s) => (
              <Chip
                key={s}
                active={cfg.skin === s}
                onClick={() => setCfg((c) => ({ ...c, skin: s as SkinId }))}
              >
                {d.skins[s]}
              </Chip>
            ))}
          </Section>

          <Section title={d.arLabel}>
            <div className="grid w-full grid-cols-5 gap-2">
              {ARS.map((a) => (
                <PickCard
                  key={a}
                  active={cfg.ar === a}
                  onClick={() => setCfg((c) => ({ ...c, ar: a as ArId }))}
                  className="p-2.5"
                >
                  <div className="text-center text-2xl">{AR_EMOJI[a]}</div>
                  <div className="mt-1 text-center text-[10px] font-bold leading-tight">{d.ars[a]}</div>
                </PickCard>
              ))}
            </div>
            {cfg.ar !== 'none' && !arReady && !arFail && (
              <p className="mt-2 text-xs font-medium text-ink-soft pulse-soft">{d.loadingAr}</p>
            )}
            {arFail && <p className="mt-2 text-xs font-medium text-rose-deep">{d.arFail}</p>}
          </Section>

          <button
            type="button"
            onClick={() => setCfg((c) => ({ ...c, mirror: !c.mirror }))}
            className={[
              'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold ring-1 transition',
              cfg.mirror ? 'bg-white ring-ink/20' : 'bg-white/60 ring-line',
            ].join(' ')}
          >
            <span>{d.mirror}</span>
            <span
              className={[
                'relative h-7 w-12 rounded-full transition',
                cfg.mirror ? 'bg-ink' : 'bg-line',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
                  cfg.mirror ? 'left-5' : 'left-0.5',
                ].join(' ')}
              />
            </span>
          </button>

          {/* sticky CTA */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-cream/90 px-4 py-3 backdrop-blur-xl safe-bottom">
            <div className="mx-auto max-w-3xl">
              <button
                type="button"
                onClick={startShoot}
                disabled={!!error}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50"
              >
                <span>📸</span> {d.capture}
                <span className="ml-1 text-sm font-semibold opacity-70">· {meta.shots}×</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'printing' && resultUrl && <PrintAnim src={resultUrl} onDone={finishPrint} />}

      {/* RESULT / EDIT */}
      {(phase === 'result' || phase === 'edit') && resultUrl && (
        <div className="relative space-y-4">
          {showConfetti && <Confetti />}
          <div className="text-center">
            <h2 className="font-display text-2xl font-extrabold">
              {phase === 'edit'
                ? lang === 'id'
                  ? 'Hias fotomu ✨'
                  : 'Decorate it ✨'
                : lang === 'id'
                  ? 'Mantap! 🎉'
                  : 'Looks good! 🎉'}
            </h2>
            <p className="text-sm text-ink-soft">
              {phase === 'edit'
                ? lang === 'id'
                  ? 'Drag stiker · tambah teks'
                  : 'Drag stickers · add text'
                : lang === 'id'
                  ? 'Download, share, atau simpan ke galeri'
                  : 'Download, share, or save to gallery'}
            </p>
          </div>

          <div
            className="relative mx-auto max-w-sm touch-none"
            onPointerMove={phase === 'edit' ? onPointerMove : undefined}
            onPointerUp={phase === 'edit' ? onPointerUp : undefined}
            onPointerLeave={phase === 'edit' ? onPointerUp : undefined}
          >
            <img
              src={phase === 'edit' ? (baseUrl ?? resultUrl) : resultUrl}
              alt=""
              className="w-full rounded-2xl shadow-lift ring-1 ring-line"
            />
            {phase === 'edit' &&
              overlays.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab select-none drop-shadow active:cursor-grabbing"
                  style={{
                    left: `${o.x * 100}%`,
                    top: `${o.y * 100}%`,
                    fontSize: o.kind === 'text' ? 18 : 32,
                    color: o.color,
                    fontWeight: o.kind === 'text' ? 800 : undefined,
                    fontFamily: o.kind === 'text' ? 'Nunito, sans-serif' : undefined,
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    onPointerDown(o.id)
                  }}
                >
                  {o.content}
                </button>
              ))}
          </div>

          {phase === 'edit' && (
            <div className="card space-y-3 p-4">
              <div className="flex gap-2">
                <input
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addText()}
                  placeholder={d.textPlaceholder}
                  className="flex-1 rounded-xl border border-line bg-cream/80 px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-lilac/50"
                />
                <button type="button" onClick={addText} className="btn-primary px-4 py-2 text-sm">
                  {d.addText}
                </button>
              </div>
              <Section title={d.stickers}>
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addEmoji(s)}
                    className="rounded-xl bg-cream px-2.5 py-1.5 text-xl ring-1 ring-line transition hover:scale-110 active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </Section>
              {overlays.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOverlays([])
                    void recomposeWithOverlays([])
                  }}
                  className="text-sm font-semibold text-ink-soft underline-offset-2 hover:underline"
                >
                  {lang === 'id' ? 'Reset stiker & teks' : 'Reset stickers & text'}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {phase === 'result' ? (
              <button type="button" onClick={() => setPhase('edit')} className="btn-secondary py-3.5">
                ✏️ {d.edit}
              </button>
            ) : (
              <button type="button" onClick={() => setPhase('result')} className="btn-secondary py-3.5">
                ✓ {d.done}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (resultBlob) {
                  downloadBlob(resultBlob)
                  track('download')
                  setToast(lang === 'id' ? 'Downloaded ✨' : 'Downloaded ✨')
                }
              }}
              className="btn-primary py-3.5"
            >
              ⬇️ {d.download}
            </button>
            <button
              type="button"
              onClick={() => {
                if (resultBlob)
                  void shareBlob(resultBlob).then((r) => {
                    if (r === 'shared') {
                      track('share')
                      setToast(lang === 'id' ? 'Shared!' : 'Shared!')
                    } else if (r === 'downloaded') track('download')
                  })
              }}
              className="btn-secondary py-3.5"
            >
              🔗 {d.share}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              className={[
                'rounded-2xl py-3.5 font-display font-bold transition',
                saved
                  ? 'bg-sage/50 text-ink ring-1 ring-sage/60'
                  : 'bg-sage/35 text-ink ring-1 ring-sage/40 hover:bg-sage/50',
              ].join(' ')}
            >
              {saved ? `✓ ${d.saved}` : `💾 ${d.saveToGallery}`}
            </button>
            <button type="button" onClick={retake} className="col-span-2 py-3 font-display font-bold text-ink-soft">
              ↺ {d.retake}
            </button>
            <button
              type="button"
              onClick={() => navigate('/gallery')}
              className="col-span-2 text-sm font-bold text-rose-deep"
            >
              {d.gallery} →
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
