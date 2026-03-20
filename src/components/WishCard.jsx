import { useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'motion/react';
import TessellatedPattern from './TessellatedPattern';

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
        className="w-[280px] bg-[#f5f0eb] rounded shadow-md relative flex group/wish"
        style={{
          minHeight: '160px',
          rotateX: springX,
          rotateY: springY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Left side — message */}
        <div className="w-[60%] min-w-0 p-4 flex flex-col justify-between overflow-hidden">
          <p
            className="text-[18px] text-stone-600 leading-none flex-1 break-words overflow-hidden"
            style={{ fontFamily: 'Caveat, Georgia, "Times New Roman", serif' }}
          >
            {wish.message}
          </p>
          <div className="mt-3 pt-2 border-t border-stone-200/60 shrink-0">
            <span className="text-[8px] font-mono uppercase tracking-[0.15em] text-stone-400">
              — {wish.name}
            </span>
          </div>
        </div>

        {/* Right side — pattern */}
        {wish.patternSeed && (
          <div className="w-[40%] flex flex-col">
            <div className="flex-1 p-2">
              <div className="w-full h-full rounded overflow-hidden">
                <TessellatedPattern
                  seed={wish.patternSeed}
                  mode={wish.patternMode}
                  gridSize={4}
                  density={2}
                  lineWeight={0.6}
                />
              </div>
            </div>
          </div>
        )}

        {/* Shine / glare overlay */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded">
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
