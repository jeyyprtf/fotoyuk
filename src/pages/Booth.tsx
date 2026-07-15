import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { useCamera } from '../hooks/useCamera'
import { FilterBubble, Section } from '../components/Chip'
import { PrintAnim } from '../components/PrintAnim'
import { Confetti, Toast } from '../components/Toast'
import {
  ARS,
  EFFECTS,
  FRAMES,
  LAYOUTS,
  SKINS,
  STICKERS,
  TIMERS,
  type ArId,
  type BoothConfig,
  type EffectId,
  type FrameId,
  type LayoutId,
  type OverlayItem,
  type SkinId,
  type TimerSec,
} from '../types'
import { cssFilter } from '../lib/filters'
import { captureVideoFrame, composeStrip } from '../lib/compose'
import { drawAr, ensureAr } from '../lib/ar'
import { newId, saveGalleryItem } from '../lib/gallery'
import { downloadBlob, shareBlob } from '../lib/export'
import { track } from '../lib/telemetry'
import { playPop, playShutter, playTick, unlockAudio } from '../lib/sfx'
import { tf } from '../i18n'

type Phase = 'live' | 'shooting' | 'printing' | 'result' | 'edit'

const FRAME_SWATCH: Record<FrameId, string> = {
  polaroid: '#fffef9',
  pastel: '#fdf0f3',
  love: '#ffe4ec',
  star: '#f4f0ff',
  film: '#1a1a1c',
  doodle: '#fffaf5',
  minimal: '#2a2a2e',
}

const FRAME_EMOJI: Record<FrameId, string> = {
  polaroid: '📷',
  pastel: '🌸',
  love: '💕',
  star: '⭐',
  film: '🎬',
  doodle: '🎀',
  minimal: '⬛',
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

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
}

export function Booth() {
  const { d, lang } = useLang()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('live')
  const [cfg, setCfg] = useState<BoothConfig>({
    layout: '2x2',
    frame: 'love',
    effect: 'none',
    skin: 'none',
    ar: 'none',
    mirror: true,
    timer: 3,
    screenFlash: false,
  })
  const [sound, setSound] = useState(true)
  const camActive = phase === 'live' || phase === 'shooting'
  const { videoRef, ready, error, errorDetail, restart } = useCamera(camActive)
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
  const [screenFlashLit, setScreenFlashLit] = useState(false)
  const [overlays, setOverlays] = useState<OverlayItem[]>([])
  const [saved, setSaved] = useState(false)
  const [textDraft, setTextDraft] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [shutterPulse, setShutterPulse] = useState(false)
  const [trayTab, setTrayTab] = useState<'filter' | 'frame' | 'layout' | 'ar' | 'timer'>('filter')
  const lmRef = useRef<Awaited<ReturnType<typeof ensureAr>>>(null)
  const rafRef = useRef(0)
  const shootGen = useRef(0)
  const soundRef = useRef(sound)
  soundRef.current = sound
  const cfgRef = useRef(cfg)
  cfgRef.current = cfg

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
    if (!camActive || cfg.ar === 'none') return
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
  }, [camActive, cfg.ar, ready, videoRef])

  const sfx = useCallback((fn: () => void) => {
    if (soundRef.current) fn()
  }, [])

  const takeShot = useCallback(() => {
    const v = videoRef.current
    if (!v) return null
    const c = cfgRef.current
    return captureVideoFrame(
      v,
      c.mirror,
      c.effect,
      c.skin,
      c.ar !== 'none' ? arCanvasRef.current : null,
    )
  }, [videoRef])

  const runCountdown = useCallback(
    async (from: number) => {
      for (let n = from; n >= 1; n--) {
        setCountdown(n)
        sfx(() => playTick(n))
        await sleep(n <= 3 ? 520 : 700)
      }
      setCountdown(0)
      // screen flash: light up BEFORE capture so face is lit
      const useFlash = cfgRef.current.screenFlash
      if (useFlash) {
        setScreenFlashLit(true)
        await sleep(160) // let exposure adapt to white screen
      }
      sfx(playShutter)
      setFlash(true)
      await sleep(useFlash ? 40 : 100)
      const frame = takeShot()
      if (useFlash) {
        await sleep(80)
        setScreenFlashLit(false)
      }
      setFlash(false)
      setCountdown(null)
      if (!frame) return
      shotsRef.current.push(frame)
      const url = frame.toDataURL('image/jpeg', 0.72)
      setPreviewThumbs((t) => [...t, url])
      setShotIdx(shotsRef.current.length)
    },
    [takeShot, sfx],
  )

  const pressShutter = () => {
    if (!ready || error || phase !== 'live') return
    unlockAudio()
    sfx(playPop)
    track('layout_select', { layout: cfg.layout })
    track('filter_select', { type: 'effect', id: cfg.effect })
    track('filter_select', { type: 'skin', id: cfg.skin })
    track('filter_select', { type: 'ar', id: cfg.ar })
    track('filter_select', { type: 'timer', id: cfg.timer })
    setOverlays([])
    setSaved(false)
    setShowConfetti(false)
    setShutterPulse(true)
    setTimeout(() => setShutterPulse(false), 300)
    setPhase('shooting')
  }

  // Manual shutter → only then run multi-shot sequence
  useEffect(() => {
    if (phase !== 'shooting' || !ready) return
    const gen = ++shootGen.current
    const c = cfgRef.current
    const shots = LAYOUTS.find((l) => l.id === c.layout)!.shots
    shotsRef.current = []
    setPreviewThumbs([])
    setShotIdx(0)
    ;(async () => {
      await sleep(280)
      if (shootGen.current !== gen) return
      for (let i = 0; i < shots; i++) {
        if (shootGen.current !== gen) return
        // first shot uses full timer; follow-ups stay snappy but still use timer if ≤3 else min 3
        const from = i === 0 ? c.timer : Math.min(c.timer, 3)
        await runCountdown(from)
        if (shootGen.current !== gen) return
        if (i < shots - 1) await sleep(200)
      }
      if (shootGen.current !== gen) return
      try {
        const blob = await composeStrip(shotsRef.current, {
          layout: c.layout,
          frame: c.frame,
          effect: 'none',
          skin: 'none',
          brand: d.brand,
        })
        if (shootGen.current !== gen) return
        const url = URL.createObjectURL(blob)
        setResultBlob(blob)
        setResultUrl(url)
        setBaseUrl(url)
        track('capture_complete', { shots })
        setPhase('printing')
      } catch (e) {
        console.error(e)
        if (shootGen.current === gen) {
          setToast(lang === 'id' ? 'Gagal compose — coba lagi ya' : 'Compose failed — try again')
          setPhase('live')
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
    const c = cfgRef.current
    const blob = await composeStrip(shotsRef.current, {
      layout: c.layout,
      frame: c.frame,
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
    sfx(playPop)
    setTimeout(() => setShowConfetti(false), 1600)
  }

  const save = async () => {
    if (!resultBlob) return
    const c = cfgRef.current
    await saveGalleryItem({
      id: newId(),
      blob: resultBlob,
      createdAt: Date.now(),
      layout: c.layout,
      frame: c.frame,
      effect: c.effect,
      skin: c.skin,
      ar: c.ar,
    })
    setSaved(true)
    setToast(d.saved)
    sfx(playPop)
  }

  const addEmoji = (emoji: string) => {
    const item: OverlayItem = {
      id: newId(),
      kind: 'emoji',
      content: emoji,
      x: 0.5 + (Math.random() - 0.5) * 0.25,
      y: 0.45 + (Math.random() - 0.5) * 0.25,
      scale: 1,
      rotation: 0,
    }
    const next = [...overlays, item]
    setOverlays(next)
    sfx(playPop)
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
    setScreenFlashLit(false)
    setPhase('live')
  }

  const retake = () => {
    shootGen.current++
    setPhase('live')
    if (resultUrl && resultUrl !== baseUrl) URL.revokeObjectURL(resultUrl)
    if (baseUrl) URL.revokeObjectURL(baseUrl)
    setResultUrl(null)
    setBaseUrl(null)
    setResultBlob(null)
    setOverlays([])
    setSaved(false)
  }

  const pick = <K extends keyof BoothConfig>(key: K, value: BoothConfig[K]) => {
    setCfg((c) => ({ ...c, [key]: value }))
    sfx(playPop)
  }

  const showCam = phase === 'live' || phase === 'shooting'

  const tabs: { id: typeof trayTab; label: string }[] = [
    { id: 'filter', label: d.effectsLabel },
    { id: 'frame', label: d.frameLabel },
    { id: 'layout', label: d.layoutLabel },
    { id: 'ar', label: d.arLabel },
    { id: 'timer', label: d.timerLabel },
  ]

  return (
    <div
      className={[
        phase === 'live' || phase === 'shooting' ? 'min-h-dvh bg-ink' : 'space-y-4 px-4 pb-16 pt-3',
      ].join(' ')}
    >
      {/* ===== LIVE / SHOOTING: sticky preview + horizontal tray ===== */}
      {showCam && (
        <div className="flex min-h-dvh flex-col">
          {/* top bar over camera */}
          <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-full bg-black/35 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md"
            >
              ← {d.back}
            </Link>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  unlockAudio()
                  setSound((s) => !s)
                }}
                className="rounded-full bg-black/35 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-md"
              >
                {sound ? '🔊' : '🔇'}
              </button>
              <button
                type="button"
                onClick={() => pick('mirror', !cfg.mirror)}
                className={[
                  'rounded-full px-2.5 py-1.5 text-xs font-bold backdrop-blur-md',
                  cfg.mirror ? 'bg-white text-ink' : 'bg-black/35 text-white',
                ].join(' ')}
                aria-label={d.mirror}
                title={d.mirror}
              >
                🪞
              </button>
              <button
                type="button"
                onClick={() => pick('screenFlash', !cfg.screenFlash)}
                className={[
                  'rounded-full px-2.5 py-1.5 text-xs font-bold backdrop-blur-md',
                  cfg.screenFlash ? 'bg-white text-ink' : 'bg-black/35 text-white',
                ].join(' ')}
                aria-label={cfg.screenFlash ? d.flashOn : d.flashOff}
                title={cfg.screenFlash ? d.flashOn : d.flashOff}
              >
                {cfg.screenFlash ? '⚡' : '🔦'}
              </button>
              {phase === 'shooting' && (
                <button
                  type="button"
                  onClick={cancelShoot}
                  className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md"
                >
                  {d.back}
                </button>
              )}
            </div>
          </div>

          {/* camera fills upper viewport — stays visible while tray scrolls */}
          <div className="relative flex-1 min-h-[48dvh]">
            <div className="absolute inset-0 bg-ink">
              {error ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-cream">
                  <span className="text-4xl">📷</span>
                  <p className="font-display font-bold">
                    {error === 'secure'
                      ? d.cameraSecure
                      : error === 'denied'
                        ? d.cameraDenied
                        : error === 'busy'
                          ? d.cameraBusy
                          : error === 'notfound'
                            ? d.cameraNotFound
                            : error === 'unsupported'
                              ? d.cameraUnsupported
                              : d.cameraError}
                  </p>
                  <p className="max-w-xs text-sm text-white/75">
                    {error === 'denied' ? d.cameraDeniedHint : d.permissionHint}
                  </p>
                  <p className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono text-white/60">
                    {typeof location !== 'undefined' ? location.host : ''}
                  </p>
                  {errorDetail && (
                    <p className="max-w-xs break-all text-[10px] text-white/40">{errorDetail}</p>
                  )}
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
                    className={[
                      'absolute inset-0 h-full w-full object-cover transition-[filter] duration-300',
                      cfg.mirror ? 'mirror' : '',
                    ].join(' ')}
                    style={{ filter: cssFilter(cfg.effect, cfg.skin) }}
                  />
                  <canvas
                    ref={arCanvasRef}
                    className={[
                      'pointer-events-none absolute inset-0 h-full w-full object-cover',
                      cfg.mirror ? 'mirror' : '',
                    ].join(' ')}
                  />
                  {/* frame tint edge */}
                  <div
                    className="pointer-events-none absolute inset-0 transition-colors duration-300"
                    style={{ boxShadow: `inset 0 0 0 6px ${FRAME_SWATCH[cfg.frame]}99` }}
                  />

                  {phase === 'live' && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent px-4 pb-4 pt-16">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                          {d.layouts[cfg.layout]}
                        </span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                          {FRAME_EMOJI[cfg.frame]} {d.frames[cfg.frame]}
                        </span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                          ⏱ {cfg.timer}s
                        </span>
                        {cfg.effect !== 'none' && (
                          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                            {d.effects[cfg.effect]}
                          </span>
                        )}
                        {cfg.skin !== 'none' && (
                          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                            {d.skins[cfg.skin]}
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

                  {phase === 'shooting' && (
                    <div className="absolute inset-x-0 top-14 z-10 flex flex-col items-center gap-2">
                      <p className="rounded-full bg-black/40 px-3 py-1 font-display text-sm font-extrabold text-white backdrop-blur">
                        {tf(d.shotOf, { n: Math.min(shotIdx + 1, meta.shots), total: meta.shots })}
                      </p>
                      <div className="flex items-center justify-center gap-1.5">
                        {Array.from({ length: meta.shots }).map((_, i) => (
                          <span
                            key={i}
                            className={[
                              'shot-dot',
                              i < shotIdx ? 'shot-dot-done' : '',
                              i === shotIdx ? 'shot-dot-active' : '',
                            ].join(' ')}
                            style={{ background: i < shotIdx ? '#a8c5b0' : i === shotIdx ? '#fff' : 'rgba(255,255,255,0.35)' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {phase === 'shooting' && countdown !== null && (
                      <motion.div
                        key={countdown}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-ink/30"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="countdown-pop font-display text-8xl font-extrabold text-white drop-shadow-lg">
                          {countdown === 0 ? '📸' : countdown}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {flash && !cfg.screenFlash && (
                    <div className="flash-out absolute inset-0 z-20 bg-white" />
                  )}
                </>
              )}
            </div>
          </div>

          {/* full-viewport white torch when screen flash is on */}
          <div
            className={[
              'screen-flash',
              screenFlashLit ? 'screen-flash-on' : 'screen-flash-off',
            ].join(' ')}
            aria-hidden
          />

          {phase === 'shooting' && previewThumbs.length > 0 && (
            <div className="h-scroll bg-ink px-3 py-2">
              {previewThumbs.map((u, i) => (
                <motion.img
                  key={i}
                  src={u}
                  alt=""
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-14 w-11 shrink-0 rounded-lg object-cover ring-1 ring-white/20"
                />
              ))}
            </div>
          )}

          {/* bottom tray — horizontal pickers; preview stays above */}
          {phase === 'live' && (
            <div className="booth-tray relative z-20 shrink-0 safe-bottom">
              {/* category tabs — swipe horizontal */}
              <div className="h-scroll border-b border-line/70 px-3 py-2.5">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTrayTab(t.id)
                      sfx(playPop)
                    }}
                    className={['tab-pill', trayTab === t.id ? 'tab-pill-on' : 'tab-pill-off'].join(' ')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* IG-style horizontal option rail */}
              <div className="px-2 py-3">
                <AnimatePresence mode="wait">
                  {trayTab === 'filter' && (
                    <motion.div
                      key="filter"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div className="h-scroll px-1">
                        {EFFECTS.map((e) => (
                          <FilterBubble
                            key={e}
                            active={cfg.effect === e}
                            onClick={() => pick('effect', e as EffectId)}
                            label={d.effects[e]}
                            previewStyle={{
                              background:
                                e === 'none'
                                  ? 'linear-gradient(145deg,#f5f0ea,#e8e0d8)'
                                  : 'linear-gradient(145deg,#f7e9ee,#efe8f8 50%,#e8f2eb)',
                              filter: EFFECT_PREVIEW[e],
                            }}
                          />
                        ))}
                      </div>
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                        {d.skinLabel}
                      </p>
                      <div className="h-scroll px-1">
                        {SKINS.map((s) => (
                          <FilterBubble
                            key={s}
                            active={cfg.skin === s}
                            onClick={() => pick('skin', s as SkinId)}
                            label={d.skins[s]}
                            previewStyle={{
                              background:
                                s === 'peach'
                                  ? 'linear-gradient(145deg,#f5c9a8,#ffe8d6)'
                                  : s === 'porcelain'
                                    ? 'linear-gradient(145deg,#e8eef5,#f8fafc)'
                                    : s === 'glow'
                                      ? 'linear-gradient(145deg,#fff6e8,#ffe0c8)'
                                      : s === 'even'
                                        ? 'linear-gradient(145deg,#f0e6dc,#e8d8cc)'
                                        : 'linear-gradient(145deg,#f5f0ea,#e8e0d8)',
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {trayTab === 'frame' && (
                    <motion.div
                      key="frame"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="h-scroll px-1"
                    >
                      {FRAMES.map((f) => (
                        <FilterBubble
                          key={f}
                          active={cfg.frame === f}
                          onClick={() => pick('frame', f as FrameId)}
                          label={d.frames[f]}
                          emoji={FRAME_EMOJI[f]}
                          previewStyle={{ background: FRAME_SWATCH[f] }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {trayTab === 'layout' && (
                    <motion.div
                      key="layout"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="h-scroll px-1"
                    >
                      {LAYOUTS.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => pick('layout', l.id as LayoutId)}
                          className={[
                            'shrink-0 rounded-2xl p-2.5 ring-2 transition',
                            cfg.layout === l.id ? 'bg-ink ring-ink' : 'bg-cream ring-transparent',
                          ].join(' ')}
                        >
                          <div
                            className="mb-1.5 grid w-14 gap-0.5 rounded-md bg-white p-1"
                            style={{ gridTemplateColumns: `repeat(${l.cols}, 1fr)` }}
                          >
                            {Array.from({ length: l.shots }).map((_, i) => (
                              <div
                                key={i}
                                className="aspect-[3/4] rounded-[2px]"
                                style={{ background: cfg.layout === l.id ? '#e8b4b8' : '#e8b4b888' }}
                              />
                            ))}
                          </div>
                          <div
                            className={[
                              'text-center text-[11px] font-bold',
                              cfg.layout === l.id ? 'text-cream' : 'text-ink',
                            ].join(' ')}
                          >
                            {d.layouts[l.id]}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {trayTab === 'ar' && (
                    <motion.div
                      key="ar"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="space-y-2"
                    >
                      <div className="h-scroll px-1">
                        {ARS.map((a) => (
                          <FilterBubble
                            key={a}
                            active={cfg.ar === a}
                            onClick={() => pick('ar', a as ArId)}
                            label={d.ars[a]}
                            emoji={AR_EMOJI[a]}
                            previewStyle={{
                              background: 'linear-gradient(145deg,#fff,#f7e9ee)',
                            }}
                          />
                        ))}
                      </div>
                      {cfg.ar !== 'none' && !arReady && !arFail && (
                        <p className="px-2 text-xs font-medium text-ink-soft pulse-soft">{d.loadingAr}</p>
                      )}
                      {arFail && <p className="px-2 text-xs font-medium text-rose-deep">{d.arFail}</p>}
                    </motion.div>
                  )}

                  {trayTab === 'timer' && (
                    <motion.div
                      key="timer"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="h-scroll px-1"
                    >
                      {TIMERS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => pick('timer', t as TimerSec)}
                          className={[
                            'flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-full transition',
                            cfg.timer === t
                              ? 'bg-ink text-cream scale-105'
                              : 'bg-cream text-ink ring-1 ring-line',
                          ].join(' ')}
                        >
                          <span className="font-display text-2xl font-extrabold">{t}</span>
                          <span className="text-[10px] font-bold opacity-70">sec</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* shutter row */}
              <div className="flex items-center justify-between gap-3 border-t border-line/60 px-4 py-3">
                <div className="min-w-0 flex-1 text-[11px] font-semibold leading-tight text-ink-soft">
                  {d.layouts[cfg.layout]} · {FRAME_EMOJI[cfg.frame]} · ⏱{cfg.timer}s
                  <br />
                  <span className="opacity-70">{meta.shots}× shots</span>
                </div>
                <motion.button
                  type="button"
                  onClick={pressShutter}
                  disabled={!!error || !ready}
                  whileTap={{ scale: 0.92 }}
                  animate={shutterPulse ? { scale: [1, 0.9, 1.06, 1] } : {}}
                  className="btn-primary relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full p-0 text-2xl shadow-lift disabled:opacity-50"
                  aria-label={d.shutter}
                >
                  <span className="absolute inset-1.5 rounded-full border-2 border-cream/35" />
                  📸
                </motion.button>
                <div className="flex-1 text-right text-xs font-bold text-ink">{d.shutter}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'printing' && resultUrl && <PrintAnim src={resultUrl} onDone={finishPrint} />}

      {(phase === 'result' || phase === 'edit') && resultUrl && (
        <motion.div className="relative space-y-4" {...fadeUp}>
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
            <motion.img
              src={phase === 'edit' ? (baseUrl ?? resultUrl) : resultUrl}
              alt=""
              className="w-full rounded-2xl shadow-lift ring-1 ring-line"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
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
        </motion.div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
