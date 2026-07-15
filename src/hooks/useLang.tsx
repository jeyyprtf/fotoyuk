import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Lang } from '../types'
import { t, type Dict } from '../i18n'
import { track } from '../lib/telemetry'

type Ctx = { lang: Lang; setLang: (l: Lang) => void; d: Dict }

const LangCtx = createContext<Ctx | null>(null)

function initialLang(): Lang {
  const saved = localStorage.getItem('fotoyuk-lang')
  if (saved === 'id' || saved === 'en') return saved
  return navigator.language.startsWith('id') ? 'id' : 'en'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('fotoyuk-lang', l)
    track('locale', { lang: l })
  }
  const value = useMemo(() => ({ lang, setLang, d: t(lang) }), [lang])
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}

export function useLang() {
  const ctx = useContext(LangCtx)
  if (!ctx) throw new Error('useLang outside provider')
  return ctx
}
