import { Link, Outlet } from 'react-router-dom'
import { useLang } from '../hooks/useLang'

export function Shell() {
  const { lang, setLang, d } = useLang()
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tight text-ink">
            {d.brand}
            <span className="ml-1 text-rose-deep">·</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/gallery"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-white/70"
            >
              {d.gallery}
            </Link>
            <button
              type="button"
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft shadow-sm"
              aria-label="Toggle language"
            >
              {lang === 'id' ? 'EN' : 'ID'}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-line/80 px-4 py-5 text-center text-xs text-ink-soft">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
          <Link to="/terms" className="hover:text-ink">
            {d.terms}
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-ink">
            {d.privacy}
          </Link>
          <span>·</span>
          <span>{d.footerNote}</span>
        </div>
      </footer>
    </div>
  )
}
