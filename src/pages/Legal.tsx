import { useLang } from '../hooks/useLang'
import { Link } from 'react-router-dom'

export function Terms() {
  const { d } = useLang()
  return (
    <article className="prose-legal mx-auto max-w-2xl space-y-4 pb-12">
      <Link to="/" className="text-sm font-semibold text-rose-deep">
        ← {d.home}
      </Link>
      <h1 className="font-display text-3xl font-extrabold">{d.termsTitle}</h1>
      <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-ink-soft">{d.termsBody}</pre>
    </article>
  )
}

export function Privacy() {
  const { d } = useLang()
  return (
    <article className="prose-legal mx-auto max-w-2xl space-y-4 pb-12">
      <Link to="/" className="text-sm font-semibold text-rose-deep">
        ← {d.home}
      </Link>
      <h1 className="font-display text-3xl font-extrabold">{d.privacyTitle}</h1>
      <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-ink-soft">{d.privacyBody}</pre>
    </article>
  )
}
