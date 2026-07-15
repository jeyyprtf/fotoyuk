import type { CSSProperties, ReactNode } from 'react'

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
  horizontal,
}: {
  title: string
  hint?: string
  children: ReactNode
  horizontal?: boolean
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <h3 className="font-display text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-ink-soft">
          {title}
        </h3>
        {hint && <span className="text-[0.7rem] font-medium text-ink-soft/70">{hint}</span>}
      </div>
      {horizontal ? (
        <div className="h-scroll -mx-1 px-1">{children}</div>
      ) : (
        <div className="flex flex-wrap gap-2">{children}</div>
      )}
    </section>
  )
}

/** Instagram-style circular filter bubble */
export function FilterBubble({
  active,
  onClick,
  label,
  previewStyle,
  emoji,
}: {
  active?: boolean
  onClick?: () => void
  label: string
  previewStyle?: CSSProperties
  emoji?: string
}) {
  return (
    <button type="button" onClick={onClick} className="filter-bubble group shrink-0">
      <span className={['filter-ring', active ? 'filter-ring-on' : ''].join(' ')}>
        <span className="filter-circle" style={previewStyle}>
          {emoji && <span className="text-lg leading-none drop-shadow">{emoji}</span>}
        </span>
      </span>
      <span className={['filter-label', active ? 'filter-label-on' : ''].join(' ')}>{label}</span>
    </button>
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
