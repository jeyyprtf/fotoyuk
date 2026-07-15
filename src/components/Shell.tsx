import { Link, Outlet, useLocation } from 'react-router-dom'
import { useLang } from '../hooks/useLang'

export function Shell() {
  const { lang, setLang, d } = useLang()
  const { pathname } = useLocation()
  const isBooth = pathname === '/booth'
  const hideFooter = isBooth

  return (
    <div className="site-shell min-h-dvh flex flex-col">
      {!isBooth && (
        <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
          <div className="site-nav mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
            <Link
              to="/"
              className="group flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-ink"
            >
              <span className="brand-camera flex h-9 w-9 items-center justify-center text-sm transition group-hover:-rotate-6 group-hover:scale-105">
                📸
              </span>
              <span>{d.brand}<span className="text-rose-deep">!</span></span>
            </Link>
            <nav className="flex items-center gap-1.5">
              <Link
                to="/gallery"
                className={[
                  'nav-pill rounded-full px-3.5 py-2 text-sm font-bold transition',
                  pathname.startsWith('/gallery')
                    ? 'nav-pill-on text-ink'
                    : 'text-ink-soft hover:bg-white',
                ].join(' ')}
              >
                <span className="hidden sm:inline">🎞️ </span>{d.gallery}
              </Link>
              <button
                type="button"
                onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                className="lang-switch rounded-full px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft transition"
                aria-label="Toggle language"
              >
                {lang === 'id' ? 'EN' : 'ID'}
              </button>
            </nav>
          </div>
        </header>
      )}
      <main
        className={[
          'mx-auto w-full flex-1',
          isBooth ? 'max-w-3xl px-0 py-0' : 'max-w-5xl px-4 py-6 sm:px-6 sm:py-10',
        ].join(' ')}
      >
        <Outlet />
      </main>
      {!hideFooter && (
        <footer className="px-4 pb-6 pt-3 text-center text-xs text-ink-soft safe-bottom">
          <div className="footer-ticket mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 px-4 py-4">
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
