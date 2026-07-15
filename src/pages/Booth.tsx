import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import { useCamera } from '../hooks/useCamera'
import { Chip, Section } from '../components/Chip'
import { PrintAnim } from '../components/PrintAnim'
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

export function Booth() {
  const { d } = useLang()
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
  const activeCam = phase === 'shoot'
  const { videoRef, ready, error, restart } = useCamera(activeCam)
  const arCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [arReady, setArReady] = useState(false)
  const [arFail, setArFail] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [shotIdx, setShotIdx] = useState(0)
  const shotsRef = useRef<HTMLCanvasElement[]>([])
  const [previewThumbs, setPreviewThumbs] = useState<string[]>([])
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [baseUrl, setBaseUrl] = useState<string | null>(null) // without overlays — for edit UI
  const [flash, setFlash] = useState(false)
  const [overlays, setOverlays] = useState<OverlayItem[]>([])
  const [saved, setSaved] = useState(false)
  const [textDraft, setTextDraft] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const lmRef = useRef<Awaited<ReturnType<typeof ensureAr>>>(null)
  const rafRef = useRef(0)

  const meta = useMemo(() => LAYOUTS.find((l) => l.id === cfg.layout)!, [cfg.layout])

  // load AR when selected
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

  // AR draw loop
  useEffect(() => {
    if (phase !== 'shoot' || cfg.ar === 'none') return
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
    const frame = captureVideoFrame(
      v,
      cfg.mirror,
      cfg.effect,
      cfg.skin,
      cfg.ar !== 'none' ? arCanvasRef.current : null,
    )
    return frame
  }, [cfg, videoRef])

  const runCountdown = useCallback(
    async (from = 3) => {
      for (let n = from; n >= 1; n--) {
        setCountdown(n)
        await sleep(700)
      }
      setCountdown(0)
      setFlash(true)
      await sleep(120)
      setFlash(false)
      setCountdown(null)
      const frame = takeShot()
      if (!frame) return
      shotsRef.current.push(frame)
      const url = frame.toDataURL('image/jpeg', 0.7)
      setPreviewThumbs((t) => [...t, url])
      setShotIdx(shotsRef.current.length)
    },
    [takeShot],
  )

  const startShoot = async () => {
    track('layout_select', { layout: cfg.layout })
    track('filter_select', { type: 'effect', id: cfg.effect })
    track('filter_select', { type: 'skin', id: cfg.skin })
    track('filter_select', { type: 'ar', id: cfg.ar })
    setOverlays([])
    setSaved(false)
    setPhase('shoot')
  }

  const shootGen = useRef(0)

  // auto multi-shot once camera ready
  useEffect(() => {
    if (phase !== 'shoot' || !ready) return
    const gen = ++shootGen.current
    shotsRef.current = []
    setPreviewThumbs([])
    setShotIdx(0)
    ;(async () => {
      await sleep(400)
      if (shootGen.current !== gen) return
      for (let i = 0; i < meta.shots; i++) {
        if (shootGen.current !== gen) return
        await runCountdown(3)
        if (shootGen.current !== gen) return
        if (i < meta.shots - 1) await sleep(600)
      }
      if (shootGen.current !== gen) return
      try {
        const blob = await composeStrip(shotsRef.current, {
          layout: cfg.layout,
          frame: cfg.frame,
          effect: 'none', // already baked into shots
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
        if (shootGen.current === gen) setPhase('setup')
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
    // keep baseUrl; only swap final export blob/url
    if (resultUrl && resultUrl !== baseUrl) URL.revokeObjectURL(resultUrl)
    const url = URL.createObjectURL(blob)
    setResultBlob(blob)
    setResultUrl(url)
  }

  const finishPrint = () => setPhase('result')

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
  }

  const addEmoji = (emoji: string) => {
    const item: OverlayItem = {
      id: newId(),
      kind: 'emoji',
      content: emoji,
      x: 0.5,
      y: 0.5,
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
      y: 0.85,
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

  return (
    <div className="space-y-5 pb-16">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold text-ink-soft">
          ← {d.back}
        </Link>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sage-deep ring-1 ring-line">
          {d.privacyBadge}
        </span>
      </div>

      {phase === 'setup' && (
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-extrabold">{d.start}</h1>

          <Section title={d.layoutLabel}>
            {LAYOUTS.map((l) => (
              <Chip
                key={l.id}
                active={cfg.layout === l.id}
                onClick={() => setCfg((c) => ({ ...c, layout: l.id as LayoutId }))}
              >
                {d.layouts[l.id]}
              </Chip>
            ))}
          </Section>

          <Section title={d.frameLabel}>
            {FRAMES.map((f) => (
              <Chip
                key={f}
                active={cfg.frame === f}
                onClick={() => setCfg((c) => ({ ...c, frame: f as FrameId }))}
              >
                {d.frames[f]}
              </Chip>
            ))}
          </Section>

          <Section title={d.effectsLabel}>
            {EFFECTS.map((e) => (
              <Chip
                key={e}
                active={cfg.effect === e}
                onClick={() => setCfg((c) => ({ ...c, effect: e as EffectId }))}
              >
                {d.effects[e]}
              </Chip>
            ))}
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
            {ARS.map((a) => (
              <Chip
                key={a}
                active={cfg.ar === a}
                onClick={() => setCfg((c) => ({ ...c, ar: a as ArId }))}
              >
                {d.ars[a]}
              </Chip>
            ))}
          </Section>

          <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={cfg.mirror}
              onChange={(e) => setCfg((c) => ({ ...c, mirror: e.target.checked }))}
              className="size-4 accent-ink"
            />
            {d.mirror}
          </label>

          <button
            type="button"
            onClick={() => void startShoot()}
            className="w-full rounded-2xl bg-ink py-4 font-display text-lg font-bold text-cream shadow-md transition hover:scale-[1.01] active:scale-[0.99]"
          >
            {d.capture}
          </button>
        </div>
      )}

      {phase === 'shoot' && (
        <div className="space-y-4">
          <p className="text-center font-display font-bold text-ink-soft">
            {tf(d.shotOf, { n: Math.min(shotIdx + 1, meta.shots), total: meta.shots })}
          </p>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl bg-ink shadow-lg ring-1 ring-line">
            {error ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-cream">
                <p>{d.cameraError}</p>
                <p className="text-sm text-white/70">{d.permissionHint}</p>
                <button
                  type="button"
                  onClick={() => void restart()}
                  className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink"
                >
                  {d.continue}
                </button>
              </div>
            ) : (
              <>
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
                {cfg.ar !== 'none' && !arReady && !arFail && (
                  <div className="absolute inset-x-0 top-3 text-center text-xs font-semibold text-white drop-shadow">
                    {d.loadingAr}
                  </div>
                )}
                {arFail && (
                  <div className="absolute inset-x-0 top-3 text-center text-xs font-semibold text-white drop-shadow">
                    {d.arFail}
                  </div>
                )}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
                    <span className="font-display text-7xl font-extrabold text-white drop-shadow-lg">
                      {countdown === 0 ? '📸' : countdown}
                    </span>
                  </div>
                )}
                {flash && <div className="absolute inset-0 bg-white/80" />}
              </>
            )}
          </div>
          {previewThumbs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {previewThumbs.map((u, i) => (
                <img key={i} src={u} alt="" className="h-16 w-12 rounded-lg object-cover ring-1 ring-line" />
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'printing' && resultUrl && (
        <>
          <p className="text-center font-display text-lg font-bold">{d.printing}</p>
          <PrintAnim src={resultUrl} onDone={finishPrint} />
        </>
      )}

      {(phase === 'result' || phase === 'edit') && resultUrl && (
        <div className="space-y-4">
          <div
            className="relative mx-auto max-w-sm touch-none"
            onPointerMove={phase === 'edit' ? onPointerMove : undefined}
            onPointerUp={phase === 'edit' ? onPointerUp : undefined}
            onPointerLeave={phase === 'edit' ? onPointerUp : undefined}
          >
            <img
              src={phase === 'edit' ? (baseUrl ?? resultUrl) : resultUrl}
              alt=""
              className="w-full rounded-2xl shadow-lg ring-1 ring-line"
            />
            {phase === 'edit' &&
              overlays.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab select-none active:cursor-grabbing"
                  style={{
                    left: `${o.x * 100}%`,
                    top: `${o.y * 100}%`,
                    fontSize: o.kind === 'text' ? 18 : 28,
                    color: o.color,
                    fontWeight: o.kind === 'text' ? 700 : undefined,
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
            <div className="space-y-3 rounded-3xl bg-white p-4 ring-1 ring-line">
              <div className="flex gap-2">
                <input
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  placeholder={d.textPlaceholder}
                  className="flex-1 rounded-xl border border-line bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lilac/50"
                />
                <button
                  type="button"
                  onClick={addText}
                  className="rounded-xl bg-ink px-3 py-2 text-sm font-bold text-cream"
                >
                  {d.addText}
                </button>
              </div>
              <Section title={d.stickers}>
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addEmoji(s)}
                    className="rounded-xl bg-cream px-2 py-1 text-xl ring-1 ring-line"
                  >
                    {s}
                  </button>
                ))}
              </Section>
              <button
                type="button"
                onClick={() => {
                  setOverlays([])
                  void recomposeWithOverlays([])
                }}
                className="text-sm font-semibold text-ink-soft"
              >
                Reset overlays
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {phase === 'result' && (
              <button
                type="button"
                onClick={() => setPhase('edit')}
                className="rounded-2xl bg-white py-3 font-display font-bold ring-1 ring-line"
              >
                {d.edit}
              </button>
            )}
            {phase === 'edit' && (
              <button
                type="button"
                onClick={() => setPhase('result')}
                className="rounded-2xl bg-white py-3 font-display font-bold ring-1 ring-line"
              >
                {d.done}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (resultBlob) {
                  downloadBlob(resultBlob)
                  track('download')
                }
              }}
              className="rounded-2xl bg-ink py-3 font-display font-bold text-cream"
            >
              {d.download}
            </button>
            <button
              type="button"
              onClick={() => {
                if (resultBlob)
                  void shareBlob(resultBlob).then((r) => {
                    if (r === 'shared') track('share')
                    else if (r === 'downloaded') track('download')
                  })
              }}
              className="rounded-2xl bg-white py-3 font-display font-bold ring-1 ring-line"
            >
              {d.share}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              className="rounded-2xl bg-sage/40 py-3 font-display font-bold text-ink ring-1 ring-sage/50"
            >
              {saved ? d.saved : d.saveToGallery}
            </button>
            <button
              type="button"
              onClick={() => {
                shootGen.current++
                setPhase('setup')
                if (resultUrl && resultUrl !== baseUrl) URL.revokeObjectURL(resultUrl)
                if (baseUrl) URL.revokeObjectURL(baseUrl)
                setResultUrl(null)
                setBaseUrl(null)
                setResultBlob(null)
              }}
              className="col-span-2 rounded-2xl py-3 font-display font-bold text-ink-soft"
            >
              {d.retake}
            </button>
            <button
              type="button"
              onClick={() => navigate('/gallery')}
              className="col-span-2 text-sm font-semibold text-rose-deep"
            >
              {d.gallery} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
