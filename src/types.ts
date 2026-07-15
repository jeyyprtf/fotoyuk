export type LayoutId = '1x1' | '2x2' | '2x3' | '2x4'
export type FrameId = 'polaroid' | 'pastel' | 'love' | 'film' | 'doodle' | 'minimal' | 'star'
export type EffectId = 'none' | 'soft' | 'vignette' | 'grain' | 'leak' | 'bw' | 'warm' | 'cool'
export type SkinId = 'none' | 'glow' | 'peach' | 'porcelain' | 'even'
export type ArId = 'none' | 'dog' | 'cat' | 'hearts' | 'sparkle'
export type TimerSec = 3 | 5 | 10
export type Lang = 'id' | 'en'

export type OverlayItem = {
  id: string
  kind: 'text' | 'emoji' | 'sticker'
  content: string
  x: number
  y: number
  scale: number
  rotation: number
  color?: string
}

export type GalleryItem = {
  id: string
  blob: Blob
  createdAt: number
  layout: LayoutId
  frame: FrameId
  effect: EffectId
  skin: SkinId
  ar: ArId
}

export type BoothConfig = {
  layout: LayoutId
  frame: FrameId
  effect: EffectId
  skin: SkinId
  ar: ArId
  mirror: boolean
  timer: TimerSec
  screenFlash: boolean
}

export const LAYOUTS: { id: LayoutId; cols: number; rows: number; shots: number }[] = [
  { id: '1x1', cols: 1, rows: 1, shots: 1 },
  { id: '2x2', cols: 2, rows: 2, shots: 4 },
  { id: '2x3', cols: 2, rows: 3, shots: 6 },
  { id: '2x4', cols: 2, rows: 4, shots: 8 },
]

export const FRAMES: FrameId[] = ['polaroid', 'pastel', 'love', 'star', 'film', 'doodle', 'minimal']
export const EFFECTS: EffectId[] = ['none', 'soft', 'vignette', 'grain', 'leak', 'bw', 'warm', 'cool']
export const SKINS: SkinId[] = ['none', 'glow', 'peach', 'porcelain', 'even']
export const ARS: ArId[] = ['none', 'dog', 'cat', 'hearts', 'sparkle']
export const TIMERS: TimerSec[] = [3, 5, 10]

export const STICKERS = ['⭐', '✨', '💕', '🌸', '🦋', '🌈', '☁️', '🍀', '🎀', '💫', '🐱', '🐶', '🐰', '🍓', '🍋', '🧋', '💖', '🥰', '💗', '💘']
