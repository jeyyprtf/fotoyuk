import { get, set, del, keys } from 'idb-keyval'
import type { GalleryItem } from '../types'

const PREFIX = 'fotoyuk:'
const MAX = 20 // ponytail: cap 20, prune oldest

function key(id: string) {
  return `${PREFIX}${id}`
}

export async function listGallery(): Promise<GalleryItem[]> {
  const all = await keys()
  const ids = all
    .map(String)
    .filter((k) => k.startsWith(PREFIX))
    .map((k) => k.slice(PREFIX.length))
  const items = (
    await Promise.all(ids.map(async (id) => (await get<GalleryItem>(key(id))) ?? null))
  ).filter(Boolean) as GalleryItem[]
  return items.sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveGalleryItem(item: GalleryItem): Promise<void> {
  await set(key(item.id), item)
  const items = await listGallery()
  if (items.length > MAX) {
    const drop = items.slice(MAX)
    await Promise.all(drop.map((i) => del(key(i.id))))
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await del(key(id))
}

export async function clearGallery(): Promise<void> {
  const items = await listGallery()
  await Promise.all(items.map((i) => del(key(i.id))))
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
