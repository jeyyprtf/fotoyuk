import { useEffect } from 'react'

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone, message])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 safe-bottom">
      <div className="toast-in toast-cute rounded-full px-4 py-3 text-sm font-bold text-cream shadow-lift">
        <span className="mr-1.5">✦</span>{message}
      </div>
    </div>
  )
}

export function Confetti() {
  const bits = Array.from({ length: 18 }, (_, i) => i)
  const colors = ['#e8b4b8', '#c4b5e0', '#a8c5b0', '#f0d0c0', '#2a2a2e']
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden">
      {bits.map((i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{
            left: `${6 + (i * 5.2) % 88}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.05}s`,
            borderRadius: i % 3 === 0 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
