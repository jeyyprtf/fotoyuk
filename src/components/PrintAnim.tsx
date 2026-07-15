import { motion } from 'framer-motion'
import { useLang } from '../hooks/useLang'

export function PrintAnim({ src, onDone }: { src: string; onDone: () => void }) {
  const { d } = useLang()
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-ink/50 backdrop-blur-md">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 font-display text-lg font-extrabold text-white drop-shadow"
      >
        {d.printing}
      </motion.p>
      <div className="relative mb-6 h-[72dvh] w-[min(92vw,360px)] overflow-hidden rounded-t-2xl bg-gradient-to-b from-[#45454d] to-[#18181b] px-4 pt-5 shadow-2xl ring-1 ring-white/10">
        {/* printer top */}
        <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          <span>FotoYuk Print</span>
          <span className="flex gap-1">
            <i className="block h-1.5 w-1.5 rounded-full bg-rose pulse-soft" />
            <i className="block h-1.5 w-1.5 rounded-full bg-sage" />
            <i className="block h-1.5 w-1.5 rounded-full bg-lilac" />
          </span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-black/50">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose via-lilac to-sage"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
        </div>
        <div className="mt-2 h-1 rounded-full bg-black/30" />

        <motion.div
          className="absolute left-1/2 top-16 w-[88%] -translate-x-1/2 origin-top"
          initial={{ y: -80, opacity: 0.3, rotate: -1 }}
          animate={{ y: '38%', opacity: 1, rotate: 0 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={onDone}
        >
          <div className="relative rounded-md bg-white p-2.5 shadow-2xl film-grain">
            <img src={src} alt="" className="w-full rounded-sm" />
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="font-display text-xs font-extrabold text-ink-soft">{d.brand}</span>
              <span className="text-[10px] text-ink-soft/70">✦ just printed</span>
            </div>
          </div>
        </motion.div>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="mb-8 text-sm font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline"
      >
        {d.continue} →
      </button>
    </div>
  )
}
