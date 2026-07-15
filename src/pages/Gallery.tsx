import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { clearGallery, deleteGalleryItem, listGallery } from '../lib/gallery'
import type { GalleryItem } from '../types'
import { downloadBlob, shareBlob } from '../lib/export'
import { track } from '../lib/telemetry'
import { Toast } from '../components/Toast'

export function Gallery() {
  const { d, lang } = useLang()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [active, setActive] = useState<GalleryItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    const list = await listGallery()
    setItems(list)
    const map: Record<string, string> = {}
    for (const it of list) map[it.id] = URL.createObjectURL(it.blob)
    setUrls((prev) => {
      Object.values(prev).forEach(URL.revokeObjectURL)
      return map
    })
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const remove = async (id: string) => {
    if (!confirm(d.confirmDelete)) return
    await deleteGalleryItem(id)
    track('delete_photo')
    if (active?.id === id) setActive(null)
    setToast(lang === 'id' ? 'Dihapus' : 'Deleted')
    await reload()
  }

  const clear = async () => {
    if (!confirm(d.confirmClear)) return
    await clearGallery()
    track('delete_photo', { all: true })
    setActive(null)
    setToast(lang === 'id' ? 'Galeri dikosongkan' : 'Gallery cleared')
    await reload()
  }

  return (
    <div className="gallery-page space-y-7 pb-12">
      <div className="gallery-heading flex items-end justify-between gap-3 px-5 py-5 sm:px-7">
        <div>
          <span className="section-kicker">your keepsakes</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">🎞️ {d.gallery}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {d.privacyBadge}
            {items.length > 0 && (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold ring-1 ring-line">
                {items.length}
              </span>
            )}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => void clear()}
            className="gallery-clear rounded-full px-3 py-2 text-xs font-bold text-rose-deep transition"
          >
            {d.clearAll}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white/70 ring-1 ring-line" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-album flex flex-col items-center gap-4 p-10 text-center sm:p-14">
          <div className="empty-photo"><span>♡</span><span>✦</span><span>☻</span></div>
          <div>
            <h2 className="font-display text-xl font-extrabold">{lang === 'id' ? 'Albummu masih kosong' : 'Your album is still empty'}</h2>
            <p className="mt-1 max-w-xs text-sm text-ink-soft">{d.emptyGallery}</p>
          </div>
          <Link to="/booth" className="btn-primary px-6 py-3">
            📸 {d.start}
          </Link>
        </div>
      ) : (
        <div className="gallery-grid grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
          {items.map((it, i) => (
            <motion.button
              key={it.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.24) }}
              onClick={() => setActive(it)}
              className="gallery-polaroid group bg-white text-left transition hover:z-10 hover:-translate-y-1 hover:rotate-0 hover:shadow-lift"
            >
              <img
                src={urls[it.id]}
                alt=""
                className="aspect-[4/5] w-full object-cover transition group-hover:scale-[1.015]"
              />
              <span className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-2 font-display text-[10px] font-extrabold text-ink-soft sm:text-xs">
                <span>{new Date(it.createdAt).toLocaleDateString()}</span>
                <span>{it.layout} ♡</span>
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {active && urls[active.id] && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 backdrop-blur-md sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              className="gallery-modal max-h-[92dvh] w-full max-w-md overflow-auto p-4 shadow-2xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="gallery-modal-photo"><img src={urls[active.id]} alt="" className="w-full" /></div>
              <p className="mt-2 text-center text-[11px] font-semibold text-ink-soft">
                {new Date(active.createdAt).toLocaleString()} · {active.layout} · {active.frame}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-primary py-3"
                  onClick={() => {
                    downloadBlob(active.blob)
                    track('download')
                    setToast(lang === 'id' ? 'Downloaded ✨' : 'Downloaded ✨')
                  }}
                >
                  ⬇️ {d.download}
                </button>
                <button
                  type="button"
                  className="btn-secondary py-3"
                  onClick={() => {
                    void shareBlob(active.blob).then((r) => {
                      if (r === 'shared') track('share')
                      else if (r === 'downloaded') track('download')
                    })
                  }}
                >
                  🔗 {d.share}
                </button>
                <button
                  type="button"
                  className="rounded-2xl py-3 font-display font-bold text-rose-deep ring-1 ring-rose/35"
                  onClick={() => void remove(active.id)}
                >
                  {d.delete}
                </button>
                <button
                  type="button"
                  className="rounded-2xl py-3 font-display font-bold text-ink-soft"
                  onClick={() => setActive(null)}
                >
                  {d.back}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
