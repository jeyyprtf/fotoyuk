// ponytail: anonymous events only — never image bytes / PII
import { track as vaTrack } from '@vercel/analytics'

type Props = Record<string, string | number | boolean | undefined>

export function track(name: string, props?: Props) {
  try {
    vaTrack(name, props)
  } catch {
    /* ignore */
  }
  if (import.meta.env.DEV) {
    console.debug('[telemetry]', name, props ?? {})
  }
}
