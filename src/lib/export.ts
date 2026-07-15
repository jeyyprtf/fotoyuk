export function downloadBlob(blob: Blob, filename = `fotoyuk-${Date.now()}.png`) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function shareBlob(blob: Blob, title = 'FotoYuk'): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], `fotoyuk-${Date.now()}.png`, { type: 'image/png' })
  try {
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text: 'Made with FotoYuk ✨' })
      return 'shared'
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'cancelled'
  }
  downloadBlob(blob)
  return 'downloaded'
}
