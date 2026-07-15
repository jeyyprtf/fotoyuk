import type { EffectId, FrameId, LayoutId, OverlayItem, SkinId } from '../types'
import { LAYOUTS } from '../types'
import { cssFilter, postProcess } from './filters'

const CELL_W = 480
const CELL_H = 600
const GAP = 20

type Deco = { emoji: string; x: number; y: number; size: number; rot?: number }
type FrameStyle = {
  padX: number
  padTop: number
  padBottom: number
  bg: string
  border?: string
  borderW?: number
  radius?: number
  film?: boolean
  cellRadius?: number
  footerColor?: string
  dateColor?: string
  deco?: Deco[]
  cellRing?: string
}

function frameStyle(frame: FrameId, W: number, H: number): FrameStyle {
  switch (frame) {
    case 'polaroid':
      return {
        padX: 32,
        padTop: 32,
        padBottom: 100,
        bg: '#fffef9',
        border: '#f0ebe3',
        borderW: 3,
        radius: 22,
        cellRadius: 8,
        footerColor: '#5c5c66',
        dateColor: '#9a9590',
        deco: [
          { emoji: '✦', x: 28, y: 28, size: 28 },
          { emoji: '✧', x: W - 48, y: 36, size: 22 },
          { emoji: '·', x: W - 40, y: H - 36, size: 24 },
        ],
      }
    case 'pastel':
      return {
        padX: 28,
        padTop: 36,
        padBottom: 80,
        bg: '#fdf0f3',
        border: '#e8b4b8',
        borderW: 8,
        radius: 28,
        cellRadius: 14,
        footerColor: '#c47a84',
        dateColor: '#d4a0a8',
        deco: [
          { emoji: '🌸', x: 18, y: 22, size: 42 },
          { emoji: '🦋', x: W - 58, y: 18, size: 36 },
          { emoji: '☁️', x: 24, y: H - 52, size: 34 },
          { emoji: '🌷', x: W - 54, y: H - 56, size: 38 },
          { emoji: '✨', x: W / 2 - 12, y: 16, size: 28 },
        ],
      }
    case 'love':
      return {
        padX: 30,
        padTop: 40,
        padBottom: 90,
        bg: '#ffe4ec',
        border: '#ff8fab',
        borderW: 10,
        radius: 30,
        cellRadius: 16,
        footerColor: '#e0527a',
        dateColor: '#f090a8',
        cellRing: 'rgba(255,143,171,0.35)',
        deco: [
          { emoji: '💕', x: 10, y: 8, size: 56, rot: -12 },
          { emoji: '💖', x: W - 70, y: 4, size: 64, rot: 14 },
          { emoji: '💗', x: 8, y: H - 70, size: 52, rot: 8 },
          { emoji: '💘', x: W - 64, y: H - 72, size: 58, rot: -10 },
          { emoji: '❤️', x: W / 2 - 22, y: H - 78, size: 44 },
          { emoji: '🥰', x: W / 2 - 80, y: 12, size: 36 },
          { emoji: '😍', x: W / 2 + 40, y: 14, size: 34 },
          { emoji: '💞', x: 20, y: H / 2 - 20, size: 40, rot: -20 },
          { emoji: '💓', x: W - 52, y: H / 2 - 10, size: 42, rot: 18 },
        ],
      }
    case 'star':
      return {
        padX: 28,
        padTop: 38,
        padBottom: 84,
        bg: '#f4f0ff',
        border: '#c4b5e0',
        borderW: 8,
        radius: 26,
        cellRadius: 14,
        footerColor: '#7b68a6',
        dateColor: '#a894cc',
        deco: [
          { emoji: '⭐', x: 14, y: 10, size: 48, rot: -15 },
          { emoji: '✨', x: W - 58, y: 12, size: 44 },
          { emoji: '🌟', x: 16, y: H - 64, size: 46 },
          { emoji: '💫', x: W - 56, y: H - 66, size: 48, rot: 20 },
          { emoji: '🌙', x: W / 2 - 18, y: 10, size: 36 },
          { emoji: '⭐', x: W / 2 + 30, y: H - 70, size: 32, rot: 12 },
        ],
      }
    case 'film':
      return {
        padX: 40,
        padTop: 30,
        padBottom: 36,
        bg: '#1a1a1c',
        film: true,
        radius: 12,
        cellRadius: 4,
        footerColor: '#f5f0ea',
        dateColor: '#a8a8b0',
        deco: [
          { emoji: '🎬', x: W / 2 - 16, y: H - 32, size: 28 },
        ],
      }
    case 'doodle':
      return {
        padX: 28,
        padTop: 36,
        padBottom: 86,
        bg: '#fffaf5',
        border: '#f0d0c0',
        borderW: 6,
        radius: 24,
        cellRadius: 12,
        footerColor: '#b08070',
        dateColor: '#c8a898',
        deco: [
          { emoji: '🎀', x: 12, y: 8, size: 46, rot: -8 },
          { emoji: '🍓', x: W - 56, y: 10, size: 42 },
          { emoji: '🐰', x: 14, y: H - 62, size: 44 },
          { emoji: '🍋', x: W - 54, y: H - 60, size: 40 },
          { emoji: '🌈', x: W / 2 - 18, y: 8, size: 38 },
          { emoji: '🧋', x: W / 2 + 28, y: H - 64, size: 36 },
        ],
      }
    case 'minimal':
    default:
      return {
        padX: 14,
        padTop: 14,
        padBottom: 48,
        bg: '#2a2a2e',
        radius: 16,
        cellRadius: 6,
        footerColor: '#f5f0ea',
        dateColor: '#a8a8b0',
      }
  }
}

export function layoutMeta(layout: LayoutId) {
  return LAYOUTS.find((l) => l.id === layout)!
}

export async function composeStrip(
  shots: HTMLCanvasElement[] | HTMLImageElement[],
  opts: {
    layout: LayoutId
    frame: FrameId
    effect: EffectId
    skin: SkinId
    overlays?: OverlayItem[]
    brand?: string
  },
): Promise<Blob> {
  const meta = layoutMeta(opts.layout)
  const gridW = meta.cols * CELL_W + (meta.cols - 1) * GAP
  const gridH = meta.rows * CELL_H + (meta.rows - 1) * GAP
  // provisional size for deco placement
  let padX = 28
  let padTop = 32
  let padBottom = 80
  const rough = frameStyle(opts.frame, gridW + padX * 2, gridH + padTop + padBottom)
  padX = rough.padX
  padTop = rough.padTop
  padBottom = rough.padBottom
  const W = gridW + padX * 2
  const H = gridH + padTop + padBottom
  const fs = frameStyle(opts.frame, W, H)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const r = fs.radius ?? 18
  ctx.fillStyle = fs.bg
  roundRect(ctx, 0, 0, W, H, r)
  ctx.fill()

  // soft inner shadow for non-minimal
  if (opts.frame !== 'minimal' && opts.frame !== 'film') {
    ctx.save()
    roundRect(ctx, 0, 0, W, H, r)
    ctx.clip()
    const g = ctx.createLinearGradient(0, 0, 0, 40)
    g.addColorStop(0, 'rgba(255,255,255,0.45)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, 40)
    ctx.restore()
  }

  if (fs.border) {
    ctx.strokeStyle = fs.border
    ctx.lineWidth = fs.borderW ?? 6
    roundRect(ctx, 4, 4, W - 8, H - 8, Math.max(8, r - 4))
    ctx.stroke()
  }

  if (fs.film) {
    ctx.fillStyle = '#2a2a2e'
    for (let y = 16; y < H - 10; y += 28) {
      roundRect(ctx, 10, y, 16, 18, 3)
      ctx.fill()
      roundRect(ctx, W - 26, y, 16, 18, 3)
      ctx.fill()
      ctx.fillStyle = '#0e0e10'
      roundRect(ctx, 13, y + 4, 10, 10, 2)
      ctx.fill()
      roundRect(ctx, W - 23, y + 4, 10, 10, 2)
      ctx.fill()
      ctx.fillStyle = '#2a2a2e'
    }
  }

  const filter = cssFilter(opts.effect, opts.skin)

  for (let i = 0; i < meta.shots; i++) {
    const col = i % meta.cols
    const row = Math.floor(i / meta.cols)
    const x = fs.padX + col * (CELL_W + GAP)
    const y = fs.padTop + row * (CELL_H + GAP)
    const shot = shots[i]
    const cr = fs.cellRadius ?? 6

    // cell shadow
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.12)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 4
    ctx.fillStyle = '#ddd5cc'
    roundRect(ctx, x, y, CELL_W, CELL_H, cr)
    ctx.fill()
    ctx.restore()

    if (!shot) continue

    ctx.save()
    roundRect(ctx, x, y, CELL_W, CELL_H, cr)
    ctx.clip()
    const tmp = document.createElement('canvas')
    tmp.width = CELL_W
    tmp.height = CELL_H
    const tctx = tmp.getContext('2d')!
    tctx.filter = filter
    drawCover(tctx, shot, 0, 0, CELL_W, CELL_H)
    tctx.filter = 'none'
    postProcess(tctx, CELL_W, CELL_H, opts.effect)
    ctx.drawImage(tmp, x, y)
    ctx.restore()

    if (fs.cellRing) {
      ctx.strokeStyle = fs.cellRing
      ctx.lineWidth = 4
      roundRect(ctx, x + 2, y + 2, CELL_W - 4, CELL_H - 4, cr)
      ctx.stroke()
    }

    if (fs.film) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2)
    }
  }

  // big cute emojis (can overlap photos a bit — intentional)
  if (fs.deco?.length) {
    for (const d of fs.deco) {
      ctx.save()
      ctx.translate(d.x + d.size / 2, d.y + d.size / 2)
      if (d.rot) ctx.rotate((d.rot * Math.PI) / 180)
      ctx.font = `${d.size}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = 0.95
      ctx.fillText(d.emoji, 0, 0)
      ctx.restore()
    }
  }

  const brand = opts.brand ?? 'FotoYuk'
  ctx.fillStyle = fs.footerColor ?? '#5c5c66'
  ctx.font = '800 24px Nunito, sans-serif'
  ctx.textAlign = 'center'
  const footerY = H - fs.padBottom / 2 + 4
  if (fs.padBottom >= 40) {
    ctx.fillText(brand, W / 2, footerY)
    ctx.font = '500 14px Outfit, sans-serif'
    ctx.fillStyle = fs.dateColor ?? '#9a9590'
    ctx.fillText(new Date().toLocaleDateString(), W / 2, footerY + 22)
  }

  if (opts.overlays?.length) {
    for (const o of opts.overlays) drawOverlay(ctx, o, W, H)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

function drawOverlay(ctx: CanvasRenderingContext2D, o: OverlayItem, W: number, H: number) {
  const x = o.x * W
  const y = o.y * H
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((o.rotation * Math.PI) / 180)
  ctx.scale(o.scale, o.scale)
  if (o.kind === 'text') {
    ctx.font = '800 36px Nunito, sans-serif'
    ctx.fillStyle = o.color || '#2a2a2e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.strokeText(o.content, 0, 0)
    ctx.fillText(o.content, 0, 0)
  } else {
    ctx.font = '72px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(o.content, 0, 0)
  }
  ctx.restore()
}

export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw =
    (img as HTMLVideoElement).videoWidth ||
    (img as HTMLImageElement).naturalWidth ||
    (img as HTMLCanvasElement).width
  const ih =
    (img as HTMLVideoElement).videoHeight ||
    (img as HTMLImageElement).naturalHeight ||
    (img as HTMLCanvasElement).height
  if (!iw || !ih) return
  const scale = Math.max(w / iw, h / ih)
  const sw = w / scale
  const sh = h / scale
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.src = url
  await img.decode()
  URL.revokeObjectURL(url)
  return img
}

export function captureVideoFrame(
  video: HTMLVideoElement,
  mirror: boolean,
  effect: EffectId,
  skin: SkinId,
  arCanvas?: HTMLCanvasElement | null,
): HTMLCanvasElement {
  const w = video.videoWidth || 640
  const h = video.videoHeight || 480
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.filter = cssFilter(effect, skin)
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, w, h)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.filter = 'none'
  if (arCanvas) {
    if (mirror) {
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(arCanvas, 0, 0, w, h)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
  postProcess(ctx, w, h, effect)
  return c
}
