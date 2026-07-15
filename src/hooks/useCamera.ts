import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraErrorKind =
  | 'secure' // not https / insecure context
  | 'unsupported' // no mediaDevices
  | 'denied' // NotAllowedError / PermissionDenied
  | 'notfound' // no camera
  | 'busy' // NotReadableError / TrackStartError
  | 'camera' // generic

export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<CameraErrorKind | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

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
    v.setAttribute('playsinline', 'true')
    v.playsInline = true
    v.muted = true
    v.autoplay = true
    try {
      await v.play()
      setReady(true)
    } catch {
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
    setErrorDetail(null)

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('secure')
      setErrorDetail(location.protocol + '//' + location.host)
      setReady(false)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unsupported')
      setReady(false)
      return
    }

    try {
      if (!streamRef.current) {
        // try ideal first, then looser constraints (some mobile browsers fail strict ideal)
        try {
          streamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: 'user' },
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
          })
        } catch {
          streamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          })
        }
      }
      await attach()
    } catch (e) {
      const err = e as DOMException
      const name = err?.name || 'Error'
      const msg = err?.message || String(e)
      setErrorDetail(`${name}: ${msg}`)
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        setError('denied')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('notfound')
      } else if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
        setError('busy')
      } else {
        setError('camera')
      }
      setReady(false)
      streamRef.current = null
    }
  }, [attach])

  useEffect(() => {
    if (active) void start()
    else stop()
  }, [active, start, stop])

  useEffect(() => {
    if (!active) return
    return () => stop()
  }, [active, stop])

  return { videoRef, ready, error, errorDetail, restart: start, stop, reattach: attach }
}
