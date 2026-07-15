import type { EffectId, FrameId, LayoutId, OverlayItem, SkinId } from '../types'
import { LAYOUTS } from '../types'
import { cssFilter, postProcess } from './filters'

const CELL_W = 480
const CELL_H = 600
const GAP = 16

type FrameStyle = {
  padX: number
  padTop: number
  padBottom: number
  bg: string
  border?: string
  accent?: string
  doodle?: boolean
  film?: boolean
}

function frameStyle(frame: FrameId): FrameStyle {
  switch (frame) {
    case 'polaroid':
      return { padX: 28, padTop: 28, padBottom: 88, bg: '#fffef9' }
    case 'pastel':
      return { padX: 22, padTop: 22, padBottom: 64, bg: '#f7e9ee', border: '#e8b4b8' }
    case 'film':
      return { padX: 36, padTop: 28, padBottom: 28, bg: '#1a1a1c', film: true }
    case 'doodle':
      return { padX: 24, padTop: 24, padBottom: 72, bg: '#fffaf5', accent: '#c4b5e0', doodle: true }
    case 'minimal':
    default:
      return { padX: 12, padTop: 12, padBottom: 40, bg: '#2a2a2e' }
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
  const fs = frameStyle(opts.frame)
  const gridW = meta.cols * CELL_W + (meta.cols - 1) * GAP
  const gridH = meta.rows * CELL_H + (meta.rows - 1) * GAP
  const W = gridW + fs.padX * 2
  const H = gridH + fs.padTop + fs.padBottom

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // background
  ctx.fillStyle = fs.bg
  roundRect(ctx, 0, 0, W, H, 18)
  ctx.fill()

  if (fs.border) {
    ctx.strokeStyle = fs.border
    ctx.lineWidth = 6
    roundRect(ctx, 3, 3, W - 6, H - 6, 16)
    ctx.stroke()
  }

  // film sprockets
  if (fs.film) {
    ctx.fillStyle = '#2a2a2e'
    for (let y = 16; y < H - 10; y += 28) {
      roundRect(ctx, 8, y, 14, 16, 3)
      ctx.fill()
      roundRect(ctx, W - 22, y, 14, 16, 3)
      ctx.fill()
    }
  }

  const filter = cssFilter(opts.effect, opts.skin)

  for (let i = 0; i < meta.shots; i++) {
    const col = i % meta.cols
    const row = Math.floor(i / meta.cols)
    const x = fs.padX + col * (CELL_W + GAP)
    const y = fs.padTop + row * (CELL_H + GAP)
    const shot = shots[i]
    if (!shot) {
      ctx.fillStyle = '#ddd5cc'
      ctx.fillRect(x, y, CELL_W, CELL_H)
      continue
    }

    // cell bg
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, CELL_W, CELL_H)
    ctx.clip()

    // draw with filter on temp
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

    if (fs.film) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2)
    }
  }

  // doodle accents
  if (fs.doodle) {
    ctx.font = '28px serif'
    const marks = ['✦', '♡', '✧', '·']
    marks.forEach((m, i) => {
      ctx.fillStyle = i % 2 ? '#e8b4b8' : '#c4b5e0'
      ctx.fillText(m, 12 + i * 18, H - 28)
      ctx.fillText(m, W - 80 + i * 16, 36)
    })
  }

  // brand footer
  const brand = opts.brand ?? 'FotoYuk'
  ctx.fillStyle = opts.frame === 'film' || opts.frame === 'minimal' ? '#f5f0ea' : '#5c5c66'
  ctx.font = '600 22px Nunito, sans-serif'
  ctx.textAlign = 'center'
  const footerY = H - fs.padBottom / 2 + 6
  if (fs.padBottom >= 40) {
    ctx.fillText(brand, W / 2, footerY)
    ctx.font = '400 14px Outfit, sans-serif'
    ctx.fillStyle = opts.frame === 'film' || opts.frame === 'minimal' ? '#a8a8b0' : '#9a9590'
    ctx.fillText(new Date().toLocaleDateString(), W / 2, footerY + 20)
  }

  // overlays (relative to full canvas)
  if (opts.overlays?.length) {
    for (const o of opts.overlays) {
      drawOverlay(ctx, o, W, H)
    }
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
    ctx.font = '700 36px Nunito, sans-serif'
    ctx.fillStyle = o.color || '#2a2a2e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.strokeText(o.content, 0, 0)
    ctx.fillText(o.content, 0, 0)
  } else {
    ctx.font = '64px serif'
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
  const iw = (img as HTMLVideoElement).videoWidth || (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width
  const ih = (img as HTMLVideoElement).videoHeight || (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height
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
