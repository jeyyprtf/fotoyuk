import type { EffectId, SkinId } from '../types'

/** CSS filter string for live preview video */
export function cssFilter(effect: EffectId, skin: SkinId): string {
  const parts: string[] = []
  switch (effect) {
    case 'soft':
      parts.push('brightness(1.05) contrast(0.95) saturate(1.05)')
      break
    case 'bw':
      parts.push('grayscale(1) contrast(1.05)')
      break
    case 'warm':
      parts.push('sepia(0.25) saturate(1.15) brightness(1.03)')
      break
    case 'cool':
      parts.push('saturate(0.9) hue-rotate(15deg) brightness(1.02)')
      break
    case 'leak':
      parts.push('saturate(1.2) contrast(1.05) brightness(1.05)')
      break
    case 'vignette':
      parts.push('brightness(0.98) contrast(1.05)')
      break
    case 'grain':
      parts.push('contrast(1.04) brightness(1.02)')
      break
    default:
      break
  }
  switch (skin) {
    case 'glow':
      parts.push('brightness(1.06) contrast(0.96) saturate(1.04)')
      break
    case 'peach':
      parts.push('sepia(0.12) saturate(1.1) brightness(1.04)')
      break
    case 'porcelain':
      parts.push('brightness(1.08) saturate(0.92) contrast(0.97)')
      break
    case 'even':
      parts.push('contrast(0.94) brightness(1.03) saturate(0.98)')
      break
    default:
      break
  }
  return parts.join(' ') || 'none'
}

/** Apply pixel-level extras after draw (vignette, grain, leak) */
export function postProcess(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  effect: EffectId,
) {
  if (effect === 'vignette' || effect === 'soft') {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, effect === 'soft' ? 'rgba(40,30,30,0.18)' : 'rgba(0,0,0,0.42)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  if (effect === 'leak') {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, 'rgba(255,160,120,0.22)')
    g.addColorStop(0.5, 'rgba(255,255,255,0)')
    g.addColorStop(1, 'rgba(180,120,255,0.18)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  if (effect === 'grain') {
    // ponytail: sparse noise — full-pixel scan was laggy on multi-shot compose
    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    for (let i = 0; i < d.length; i += 48) {
      const n = (Math.random() - 0.5) * 32
      d[i] = clamp(d[i] + n)
      d[i + 1] = clamp(d[i + 1] + n)
      d[i + 2] = clamp(d[i + 2] + n)
    }
    ctx.putImageData(img, 0, 0)
  }
}

function clamp(v: number) {
  return Math.max(0, Math.min(255, v))
}
