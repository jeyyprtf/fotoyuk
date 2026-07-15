import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import { clearGallery, deleteGalleryItem, listGallery } from '../lib/gallery'
import type { GalleryItem } from '../types'
import { downloadBlob, shareBlob } from '../lib/export'
import { track } from '../lib/telemetry'

export function Gallery() {
  const { d } = useLang()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [active, setActive] = useState<GalleryItem | null>(null)

  const reload = async () => {
    const list = await listGallery()
    setItems(list)
    const map: Record<string, string> = {}
    for (const it of list) map[it.id] = URL.createObjectURL(it.blob)
    setUrls((prev) => {
      Object.values(prev).forEach(URL.revokeObjectURL)
      return map
    })
  }

  useEffect(() => {
    void reload()
    return () => {
      // revoke on unmount via state cleanup pattern
    }
  }, [])

  const remove = async (id: string) => {
    if (!confirm(d.confirmDelete)) return
    await deleteGalleryItem(id)
    track('delete_photo')
    if (active?.id === id) setActive(null)
    await reload()
  }

  const clear = async () => {
    if (!confirm(d.confirmClear)) return
    await clearGallery()
    track('delete_photo', { all: true })
    setActive(null)
    await reload()
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">{d.gallery}</h1>
          <p className="text-sm text-ink-soft">{d.privacyBadge}</p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => void clear()}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-deep ring-1 ring-rose/40"
          >
            {d.clearAll}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-line">
          <p className="text-ink-soft">{d.emptyGallery}</p>
          <Link
            to="/booth"
            className="mt-4 inline-block rounded-2xl bg-ink px-5 py-3 font-display font-bold text-cream"
          >
            {d.start}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setActive(it)}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line transition hover:scale-[1.02]"
            >
              <img src={urls[it.id]} alt="" className="aspect-[3/4] w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {active && urls[active.id] && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90dvh] w-full max-w-md overflow-auto rounded-3xl bg-cream p-4 shadow-2xl">
            <img src={urls[active.id]} alt="" className="w-full rounded-2xl" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="flex-1 rounded-2xl bg-ink py-3 font-display font-bold text-cream"
                onClick={() => {
                  downloadBlob(active.blob)
                  track('download')
                }}
              >
                {d.download}
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-white py-3 font-display font-bold ring-1 ring-line"
                onClick={() => {
                  void shareBlob(active.blob).then((r) => {
                    if (r === 'shared') track('share')
                    else if (r === 'downloaded') track('download')
                  })
                }}
              >
                {d.share}
              </button>
              <button
                type="button"
                className="rounded-2xl px-4 py-3 font-display font-bold text-rose-deep ring-1 ring-rose/40"
                onClick={() => void remove(active.id)}
              >
                {d.delete}
              </button>
              <button
                type="button"
                className="w-full rounded-2xl py-2 text-sm font-semibold text-ink-soft"
                onClick={() => setActive(null)}
              >
                {d.back}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
