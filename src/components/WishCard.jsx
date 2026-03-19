import { useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'motion/react';

export default function WishCard({ wish }) {
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 400, damping: 30 });
  const springY = useSpring(tiltY, { stiffness: 400, damping: 30 });

  const shineOffset = useTransform(springY, (v) => (v / 8) * 120);
  const shineTransform = useMotionTemplate`translateX(${shineOffset}%)`;

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(y * -10);
    tiltY.set(x * 10);
  }, [tiltX, tiltY]);

  const handleMouseLeave = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
  }, [tiltX, tiltY]);

  return (
    <div style={{ perspective: '800px' }}>
      <motion.div
        className="w-64 bg-white/85 border border-stone-300 rounded-sm shadow-lg p-4 relative shrink-0 group/wish"
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Mini stamp */}
        <div className="absolute top-2 right-2 w-6 h-7 border border-dotted border-stone-300" />

        {/* Message */}
        <p className="text-sm font-serif text-stone-700 leading-relaxed pr-8 line-clamp-4">
          "{wish.message}"
        </p>

        {/* Divider */}
        <div className="border-t border-stone-200 mt-3 pt-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
            — {wish.name}
          </span>
        </div>

        {/* Shine / glare overlay */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-sm">
          <motion.div
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/wish:opacity-100"
            style={{
              mixBlendMode: 'soft-light',
              maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)',
              background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.2) 45%, transparent 70%)',
              filter: 'blur(2px)',
              transform: shineTransform,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
