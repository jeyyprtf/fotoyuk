import { Link, Outlet, useLocation } from 'react-router-dom'
import { useLang } from '../hooks/useLang'

export function Shell() {
  const { lang, setLang, d } = useLang()
  const { pathname } = useLocation()
  const hideFooter = pathname === '/booth'

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="group flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm shadow-sm ring-1 ring-line transition group-hover:scale-105">
              📸
            </span>
            {d.brand}
            <span className="text-rose-deep">·</span>
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link
              to="/gallery"
              className={[
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                pathname.startsWith('/gallery')
                  ? 'bg-ink text-cream'
                  : 'text-ink-soft hover:bg-white/80',
              ].join(' ')}
            >
              {d.gallery}
            </Link>
            <button
              type="button"
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="rounded-full border border-line bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft shadow-sm transition hover:border-rose/50"
              aria-label="Toggle language"
            >
              {lang === 'id' ? 'EN' : 'ID'}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-7">
        <Outlet />
      </main>
      {!hideFooter && (
        <footer className="border-t border-line/60 px-4 py-5 text-center text-xs text-ink-soft safe-bottom">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
            <Link to="/terms" className="font-medium hover:text-ink">
              {d.terms}
            </Link>
            <span className="opacity-40">·</span>
            <Link to="/privacy" className="font-medium hover:text-ink">
              {d.privacy}
            </Link>
            <span className="opacity-40">·</span>
            <span>{d.footerNote}</span>
          </div>
        </footer>
      )}
    </div>
  )
}
