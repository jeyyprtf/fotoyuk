import type { ArId } from '../types'

// ponytail: MediaPipe lazy-loaded; landmark draw only, no server
type FaceLandmarker = {
  detectForVideo: (
    video: HTMLVideoElement,
    ts: number,
  ) => { faceLandmarks?: { x: number; y: number; z: number }[][] }
  close: () => void
}

let landmarker: FaceLandmarker | null = null
let loading: Promise<FaceLandmarker | null> | null = null

export async function ensureAr(): Promise<FaceLandmarker | null> {
  if (landmarker) return landmarker
  if (loading) return loading
  loading = (async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision')
      const { FaceLandmarker, FilesetResolver } = vision
      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
      )
      landmarker = (await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 2,
      })) as unknown as FaceLandmarker
      return landmarker
    } catch (e) {
      console.warn('AR load failed', e)
      landmarker = null
      return null
    }
  })()
  return loading
}

const L_EAR = 127
const R_EAR = 356
const FOREHEAD = 10
const L_CHEEK = 50
const R_CHEEK = 280

export function drawAr(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  ar: ArId,
  lm: FaceLandmarker | null,
): boolean {
  if (ar === 'none' || !lm) return false
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return false
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  // canvas should match video
  if (ctx.canvas.width !== w) ctx.canvas.width = w
  if (ctx.canvas.height !== h) ctx.canvas.height = h

  const res = lm.detectForVideo(video, performance.now())
  const faces = res.faceLandmarks
  if (!faces?.length) return true

  for (const face of faces) {
    const le = face[L_EAR]
    const re = face[R_EAR]
    const fh = face[FOREHEAD]
    if (!le || !re || !fh) continue
    const faceW = Math.hypot((re.x - le.x) * w, (re.y - le.y) * h)
    const earSize = faceW * 0.45
    const angle = Math.atan2((re.y - le.y) * h, (re.x - le.x) * w)

    if (ar === 'dog' || ar === 'cat') {
      drawEar(ctx, le.x * w, le.y * h - earSize * 0.35, earSize, angle - 0.35, ar, 'L')
      drawEar(ctx, re.x * w, re.y * h - earSize * 0.35, earSize, angle + 0.35, ar, 'R')
      const nose = face[1]
      if (nose) {
        ctx.font = `${Math.round(faceW * (ar === 'dog' ? 0.28 : 0.22))}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ar === 'dog' ? '🟤' : '💗', nose.x * w, nose.y * h + (ar === 'cat' ? faceW * 0.05 : 0))
      }
    }

    if (ar === 'hearts') {
      const t = performance.now() / 500
      for (let i = 0; i < 5; i++) {
        const ox = Math.sin(t + i) * faceW * 0.25
        const oy = -faceW * 0.55 - i * faceW * 0.12 + Math.cos(t + i * 0.7) * 8
        ctx.font = `${Math.round(faceW * 0.22)}px serif`
        ctx.textAlign = 'center'
        ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t + i)
        ctx.fillText(i % 2 ? '💕' : '💖', fh.x * w + ox, fh.y * h + oy)
        ctx.globalAlpha = 1
      }
    }

    if (ar === 'sparkle') {
      const lc = face[L_CHEEK]
      const rc = face[R_CHEEK]
      const t = performance.now() / 300
      for (const c of [lc, rc, fh]) {
        if (!c) continue
        ctx.font = `${Math.round(faceW * 0.18)}px serif`
        ctx.textAlign = 'center'
        ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t + c.x * 10))
        ctx.fillText('✨', c.x * w + Math.sin(t) * 6, c.y * h + Math.cos(t) * 4)
        ctx.globalAlpha = 1
      }
    }
  }
  return true
}

function drawEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  kind: 'dog' | 'cat',
  side: 'L' | 'R',
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle + (side === 'L' ? -0.4 : 0.4))
  if (kind === 'dog') {
    // floppy oval
    ctx.fillStyle = '#c48a5a'
    ctx.beginPath()
    ctx.ellipse(0, 0, size * 0.35, size * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e8b89a'
    ctx.beginPath()
    ctx.ellipse(0, size * 0.05, size * 0.18, size * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // triangle cat
    ctx.fillStyle = '#f0c070'
    ctx.beginPath()
    ctx.moveTo(0, -size * 0.55)
    ctx.lineTo(-size * 0.38, size * 0.25)
    ctx.lineTo(size * 0.38, size * 0.25)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f5a0b8'
    ctx.beginPath()
    ctx.moveTo(0, -size * 0.35)
    ctx.lineTo(-size * 0.18, size * 0.12)
    ctx.lineTo(size * 0.18, size * 0.12)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}
