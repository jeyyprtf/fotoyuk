// ponytail: Web Audio beeps — no asset files
let ctx: AudioContext | null = null

function ac() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function unlockAudio() {
  try {
    ac()
  } catch {
    /* ignore */
  }
}

/** soft tick for countdown numbers */
export function playTick(n?: number) {
  try {
    const c = ac()
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    // higher pitch as we approach 1
    const base = n && n <= 3 ? 660 + (3 - n) * 120 : 520
    o.frequency.value = base
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(c.destination)
    const t = c.currentTime
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
    o.start(t)
    o.stop(t + 0.15)
  } catch {
    /* ignore */
  }
}

/** camera shutter / cekrek */
export function playShutter() {
  try {
    const c = ac()
    const t = c.currentTime
    // two short noise bursts
    for (let i = 0; i < 2; i++) {
      const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / data.length)
      const src = c.createBufferSource()
      src.buffer = buf
      const g = c.createGain()
      const f = c.createBiquadFilter()
      f.type = 'highpass'
      f.frequency.value = 1200
      g.gain.value = 0.35 - i * 0.1
      src.connect(f)
      f.connect(g)
      g.connect(c.destination)
      src.start(t + i * 0.05)
    }
    // click tone
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'triangle'
    o.frequency.value = 180
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(c.destination)
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
    o.start(t)
    o.stop(t + 0.09)
  } catch {
    /* ignore */
  }
}

export function playPop() {
  try {
    const c = ac()
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(420, c.currentTime)
    o.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.08)
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(c.destination)
    const t = c.currentTime
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    o.start(t)
    o.stop(t + 0.13)
  } catch {
    /* ignore */
  }
}
