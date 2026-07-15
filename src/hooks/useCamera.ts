import { useCallback, useEffect, useRef, useState } from 'react'

export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setReady(false)
  }, [])

  const attach = useCallback(async () => {
    const v = videoRef.current
    const stream = streamRef.current
    if (!v || !stream) return
    if (v.srcObject !== stream) v.srcObject = stream
    v.playsInline = true
    v.muted = true
    try {
      await v.play()
      setReady(true)
    } catch {
      // autoplay race — retry once
      try {
        await v.play()
        setReady(true)
      } catch {
        setReady(false)
      }
    }
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        })
      }
      await attach()
    } catch {
      setError('camera')
      setReady(false)
    }
  }, [attach])

  useEffect(() => {
    if (active) void start()
    else stop()
    return () => {
      // only stop when leaving active for real (unmount / active=false)
    }
  }, [active, start, stop])

  useEffect(() => {
    if (!active) return
    return () => stop()
  }, [active, stop])

  return { videoRef, ready, error, restart: start, stop, reattach: attach }
}
