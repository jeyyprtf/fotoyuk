import type { ReactNode } from 'react'

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition',
        active
          ? 'bg-ink text-cream shadow-sm'
          : 'bg-white text-ink-soft ring-1 ring-line hover:ring-rose/50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-soft">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}
