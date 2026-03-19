import { useState, useEffect, useCallback } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useMotionTemplate } from 'motion/react';
import { useDialKit } from 'dialkit';

const GENIE_SLICES = 15;

// Each horizontal slice of the card during genie animation
function GenieSlice({ index, total, progress, genie, children }) {
  const t = index / (total - 1); // 0=top, 1=bottom

  const scaleX = useTransform(progress, (p) => {
    // Bottom slices lead the animation — they pinch first
    const ep = Math.min(1, p + p * t * genie.lead);
    // Apply power curve so sides bow inward (concave) instead of straight diagonal
    const curved = Math.pow(ep, genie.curve);
    return 1 - curved * genie.pinch;
  });

  const y = useTransform(progress, (p) => {
    const ep = Math.min(1, p + p * t * genie.lead);
    const curved = Math.pow(ep, genie.curve);
    return curved * genie.targetY;
  });

  const opacity = useTransform(progress, (p) => {
    const ep = Math.min(1, p + p * t * genie.lead);
    return ep > 0.85 ? 1 - (ep - 0.85) / 0.15 : 1;
  });

  const clipTop = (index / total) * 100;
  const clipBottom = 100 - ((index + 1) / total) * 100;

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        scaleX,
        y,
        opacity,
        clipPath: `inset(${clipTop}% 0 ${clipBottom}% 0)`,
        transformOrigin: 'center center',
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </motion.div>
  );
}

// The card content (rendered once in open state, or N times during genie)
function CardContent({ name, setName, message, setMessage, onCancel, onSubmit, interactive }) {
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 400, damping: 30 });
  const springY = useSpring(tiltY, { stiffness: 400, damping: 30 });

  // Shine effect — gradient offset follows cursor tilt
  const shineOffset = useTransform(springY, (v) => (v / 8) * 120);
  const shineTransform = useMotionTemplate`translateX(${shineOffset}%)`;

  const handleMouseMove = useCallback((e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(y * -8);
    tiltY.set(x * 8);
  }, [interactive, tiltX, tiltY]);

  const handleMouseLeave = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
  }, [tiltX, tiltY]);

  return (
    <motion.div
      className="w-[560px] bg-[#f5f0eb] rounded shadow-2xl relative flex group/card"
      style={{
        minHeight: '320px',
        rotateX: springX,
        rotateY: springY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left side — message area */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <textarea
          value={message}
          onChange={interactive ? (e) => setMessage(e.target.value) : undefined}
          readOnly={!interactive}
          tabIndex={interactive ? 0 : -1}
          placeholder="Write your Eid wish here..."
          maxLength={200}
          className="w-full flex-1 bg-transparent text-stone-600 text-[15px] leading-relaxed placeholder:text-stone-300 focus:outline-none resize-none"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        />
        <div className="mt-4 pt-3 border-t border-stone-200/60">
          <input
            type="text"
            value={name}
            onChange={interactive ? (e) => setName(e.target.value) : undefined}
            readOnly={!interactive}
            tabIndex={interactive ? 0 : -1}
            placeholder="Your name"
            className="w-full bg-transparent text-stone-500 text-xs font-mono uppercase tracking-[0.15em] placeholder:text-stone-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-stone-300/60 my-5" />

      {/* Right side — stamp + address + send */}
      <div className="w-[220px] p-5 flex flex-col justify-between">
        {/* Stamp */}
        <div className="flex justify-end">
          <div className="w-[72px] h-[84px] bg-stone-200 border border-stone-300 flex flex-col items-center justify-center gap-1 relative">
            <span className="text-[7px] font-mono uppercase tracking-widest text-stone-400 absolute top-1.5">Postage</span>
            <svg className="w-7 h-7 text-stone-400 mt-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3l1.5 3.5L17 8l-3 2.5.5 4L12 13l-2.5 1.5.5-4L7 8l3.5-1.5z" />
            </svg>
            <span className="text-[6px] font-mono text-stone-400">EID MUBARAK</span>
          </div>
        </div>

        {/* Address lines */}
        <div className="space-y-2.5 mt-6">
          <div className="border-b border-stone-300/50 pb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-stone-400">To the world</span>
          </div>
          <div className="border-b border-stone-300/50 pb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-stone-400">With love & blessings</span>
          </div>
          <div className="border-b border-stone-300/50 pb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-stone-400">Eid al-Fitr 2026</span>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-6 pt-3 border-t border-stone-200/60">
          <button
            onClick={interactive ? onCancel : undefined}
            tabIndex={interactive ? 0 : -1}
            className="text-[10px] font-mono uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={interactive ? onSubmit : undefined}
            tabIndex={interactive ? 0 : -1}
            disabled={!message.trim()}
            className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white bg-[#D4944A] rounded-sm hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>

      {/* Shine / glare overlay — follows cursor tilt */}
      {interactive && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded">
          <motion.div
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            style={{
              mixBlendMode: 'soft-light',
              maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)',
              background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 45%, transparent 70%)',
              filter: 'blur(2px)',
              transform: shineTransform,
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default function WishModal({ isOpen, onToggle, onSubmit }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState('closed'); // closed | animating | open

  const genie = useDialKit('Genie', {
    stiffness: [50, 10, 400, 5],
    damping: [12, 5, 50, 1],
    pinch: [0.92, 0, 1],
    lead: [0.8, 0, 2],
    curve: [2.5, 1, 6, 0.1],
    targetY: [420, 100, 800, 10],
  });

  const spring = useSpring(1, {
    stiffness: genie.stiffness,
    damping: genie.damping,
  });

  // Backdrop blur derived from spring (spring=0 → open/blurred, spring=1 → closed/clear)
  const backdropBlur = useTransform(spring, (p) => `blur(${(1 - p) * 12}px)`);

  // Track when spring settles
  useEffect(() => {
    const unsub = spring.on('change', (v) => {
      if (phase !== 'animating') return;
      if (isOpen && v < 0.005) setPhase('open');
      if (!isOpen && v > 0.995) setPhase('closed');
    });
    return unsub;
  }, [phase, isOpen, spring]);

  // Trigger animations on isOpen change
  useEffect(() => {
    if (isOpen && phase === 'closed') {
      setPhase('animating');
      spring.set(0);
    } else if (!isOpen && phase === 'open') {
      setPhase('animating');
      spring.set(1);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!message.trim()) return;
    onSubmit({ name: name.trim() || 'Anonymous', message: message.trim() });
    setName('');
    setMessage('');
    onToggle();
  };

  const button = (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
      <button
        onClick={onToggle}
        className="px-6 py-3 bg-[#D4944A] rounded-full text-xs font-mono uppercase tracking-[0.2em] text-white shadow-lg hover:brightness-110 hover:shadow-xl cursor-pointer whitespace-nowrap"
      >
        + Add Wish to World
      </button>
    </div>
  );

  // --- CLOSED: show button only ---
  if (phase === 'closed') {
    return button;
  }

  // --- OPEN: normal interactive card at center ---
  if (phase === 'open') {
    return (
      <>
        {button}
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="absolute inset-0"
            style={{ backdropFilter: backdropBlur, WebkitBackdropFilter: backdropBlur }}
            onClick={onToggle}
          />
          <div className="relative z-10" style={{ perspective: '1200px' }}>
            <CardContent
              name={name}
              setName={setName}
              message={message}
              setMessage={setMessage}
              onCancel={onToggle}
              onSubmit={handleSubmit}
              interactive={true}
            />
          </div>
        </div>
      </>
    );
  }

  // --- ANIMATING: genie effect with sliced card ---
  return (
    <>
      {button}
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ backdropFilter: backdropBlur, WebkitBackdropFilter: backdropBlur }}
        />
        {Array.from({ length: GENIE_SLICES }).map((_, i) => (
          <GenieSlice key={i} index={i} total={GENIE_SLICES} progress={spring} genie={genie}>
            <CardContent
              name={name}
              setName={setName}
              message={message}
              setMessage={setMessage}
              onCancel={onToggle}
              onSubmit={handleSubmit}
              interactive={false}
            />
          </GenieSlice>
        ))}
      </div>
    </>
  );
}
