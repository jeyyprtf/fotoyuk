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
      className={['chip', active ? 'chip-on' : 'chip-off'].join(' ')}
    >
      {children}
    </button>
  )
}

export function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-end justify-between gap-2">
        <h3 className="font-display text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-ink-soft">
          {title}
        </h3>
        {hint && <span className="text-[0.7rem] font-medium text-ink-soft/70">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

export function PickCard({
  active,
  onClick,
  children,
  className = '',
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={['pick-card', active ? 'pick-card-on' : '', className].join(' ')}
    >
      {children}
      {active && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-cream">
          ✓
        </span>
      )}
    </button>
  )
}
