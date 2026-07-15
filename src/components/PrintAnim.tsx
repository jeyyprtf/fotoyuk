import { motion } from 'framer-motion'

export function PrintAnim({ src, onDone }: { src: string; onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-ink/40 backdrop-blur-sm">
      <div className="relative mb-8 h-[70dvh] w-[min(92vw,340px)] overflow-hidden rounded-t-lg bg-gradient-to-b from-[#3a3a40] to-[#1e1e22] px-4 pt-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50">
          <span>FotoYuk Print</span>
          <span>●●●</span>
        </div>
        <div className="h-2 rounded-full bg-black/40" />
        <motion.div
          className="absolute left-1/2 top-10 w-[88%] -translate-x-1/2 origin-top"
          initial={{ y: -40, opacity: 0.4 }}
          animate={{ y: '42%', opacity: 1 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={onDone}
        >
          <div className="rounded-sm bg-white p-2 shadow-xl film-grain relative">
            <img src={src} alt="" className="w-full rounded-sm" />
            <div className="mt-2 text-center font-display text-xs font-bold text-ink-soft">FotoYuk</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
