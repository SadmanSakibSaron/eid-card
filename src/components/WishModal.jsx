import { useState, useCallback, useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useMotionTemplate, useAnimationControls, AnimatePresence } from 'motion/react';

import TessellatedPattern, { modeFromSeed } from './TessellatedPattern';
import WishCard from './WishCard';

// The card content
function CardContent({ name, setName, message, setMessage, onCancel, onSubmit, interactive, patternSeed, isMobile }) {
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 400, damping: 30 });
  const springY = useSpring(tiltY, { stiffness: 400, damping: 30 });

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
      className="w-full max-w-[560px] bg-[#f5f0eb] rounded shadow-2xl relative flex group/card"
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
      <div className="w-[60%] p-6 flex flex-col justify-between">
        <textarea
          value={message}
          onChange={interactive ? (e) => setMessage(e.target.value) : undefined}
          readOnly={!interactive}
          tabIndex={interactive ? 0 : -1}
          placeholder="Write your Eid wish here..."
          maxLength={200}
          className="w-full flex-1 bg-transparent text-stone-800 text-[24px] leading-relaxed placeholder:text-stone-400 focus:outline-none resize-none"
          style={{ fontFamily: 'Caveat, Georgia, "Times New Roman", serif' }}
        />
        <div className="mt-4 pt-3 border-t border-stone-200/60">
          <input
            type="text"
            value={name}
            onChange={interactive ? (e) => setName(e.target.value) : undefined}
            readOnly={!interactive}
            tabIndex={interactive ? 0 : -1}
            placeholder="Your name"
            className="w-full bg-transparent text-stone-500 text-xs font-mono uppercase tracking-[0.15em] placeholder:text-stone-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Right side — tessellated pattern + controls */}
      <div className="w-[40%] flex flex-col">
        <div className="flex-1 p-4">
          <div className="w-full h-full rounded overflow-hidden">
            <TessellatedPattern seed={patternSeed} />
          </div>
        </div>

      </div>

      {/* Shine / glare overlay */}
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

function ThrowableCard({ wish, onThrown, shakeTrigger, onThrowProgress, isMobile }) {
  const controls = useAnimationControls();
  const [thrown, setThrown] = useState(false);
  const y = useMotionValue(0);


  useEffect(() => {
    controls.start({
      scale: isMobile ? 1.2 : 1.8,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 25 },
    });
  }, [controls]);

  // Track y position and report progress (0 = resting, 1 = top of viewport)
  useEffect(() => {
    const unsubscribe = y.on('change', (latest) => {
      const progress = Math.min(1, Math.max(0, -latest / (window.innerHeight * 0.5)));
      onThrowProgress?.(progress);
    });
    return unsubscribe;
  }, [y, onThrowProgress]);

  // Springy up-down shake when backdrop is clicked
  useEffect(() => {
    if (shakeTrigger > 0 && !thrown) {
      controls.start({
        y: [0, -30, 15, -8, 4, 0],
        transition: { duration: 0.6, ease: 'easeOut' },
      });
    }
  }, [shakeTrigger, controls, thrown]);

  const handleDragEnd = (event, info) => {
    if (thrown) return;
    if (info.velocity.y < -200) {
      setThrown(true);
      controls.start({
        y: -window.innerHeight - 200,
        opacity: 0,
        scale: 0.6,
        transition: { duration: 0.5, ease: [0.4, 0, 1, 1] },
      }).then(onThrown);
    } else {
      controls.start({
        x: 0,
        y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      });
    }
  };

  return (
    <div className="flex flex-col items-center" style={{ gap: isMobile ? '40px' : '80px' }}>
      <motion.div
        drag
        dragElastic={0.6}
        animate={controls}
        initial={{ scale: isMobile ? 1.5 : 2, opacity: 0 }}
        onDragEnd={handleDragEnd}
        className="cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none', y }}
      >
        <WishCard wish={wish} />
      </motion.div>
      {!thrown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-gray-600 text-sm font-mono uppercase tracking-[0.2em] bg-white/80 px-4 py-2 rounded-full shadow-sm">
            Flick upward to send
          </p>
        </motion.div>
      )}

    </div>
  );
}

export default function WishModal({ isOpen, onToggle, onSubmit, onThrowProgress, isMobile }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [patternSeed, setPatternSeed] = useState(() => Math.floor(Math.random() * 999999) + 1);
  const [phase, setPhase] = useState('editing'); // 'editing' | 'morphed'
  const [preparedWish, setPreparedWish] = useState(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const handleSubmit = () => {
    if (!message.trim()) return;
    const wish = {
      name: name.trim() || 'Anonymous',
      message: message.trim(),
      patternSeed,
      patternMode: modeFromSeed(patternSeed),
    };
    setPreparedWish(wish);
    setPhase('morphed');
  };

  const handleThrowComplete = () => {
    onThrowProgress?.(0);
    onSubmit(preparedWish);
    setName('');
    setMessage('');
    setPatternSeed(Math.floor(Math.random() * 999999) + 1);
    setPhase('editing');
    setPreparedWish(null);
    onToggle();
  };

  return (
    <>
      {/* Button — hide during throw phase */}
      {phase !== 'morphed' && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110]">
        <motion.button
          onClick={onToggle}
          layout
          className="px-6 py-4 rounded-full text-sm font-mono uppercase tracking-[0.2em] shadow-lg cursor-pointer whitespace-nowrap overflow-hidden relative"
          animate={{
            backgroundColor: isOpen ? '#ffffff' : '#D4944A',
            color: isOpen ? '#78716c' : '#ffffff',
            borderColor: isOpen ? '#d6d3d1' : 'transparent',
          }}
          transition={{
            layout: { type: 'spring', stiffness: 300, damping: 30 },
            backgroundColor: { duration: 0.4, ease: 'easeInOut' },
            color: { duration: 0.4, ease: 'easeInOut' },
            borderColor: { duration: 0.4, ease: 'easeInOut' },
          }}
          style={{ border: '1px solid transparent' }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={isOpen ? 'close' : 'add'}
              initial={{ opacity: 0, filter: 'blur(4px)', y: 6 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(4px)', y: -6 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="inline-block"
            >
              {isOpen ? 'Close' : '+ Add Wish to World'}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute inset-0 z-[105] flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-white/10 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={phase === 'morphed' ? () => setShakeTrigger((n) => n + 1) : onToggle}
            />

            {/* Card — springs up from bottom / throwable card */}
            <AnimatePresence mode="wait">
              {phase === 'editing' ? (
                <motion.div
                  key="editing"
                  className="relative z-10 w-full max-w-[560px] px-4"
                  style={{ perspective: '1200px' }}
                  initial={{ opacity: 0, scale: 0.5, y: 300, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.5, y: 300, filter: 'blur(8px)' }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                  }}
                >
                  <CardContent
                    name={name}
                    setName={setName}
                    message={message}
                    setMessage={setMessage}
                    onCancel={onToggle}
                    onSubmit={handleSubmit}
                    interactive={true}
                    patternSeed={patternSeed}
                    isMobile={isMobile}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim()}
                    className="w-full mt-6 py-4 text-sm font-mono uppercase tracking-[0.2em] text-white bg-[#D4944A] rounded-full hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-lg"
                  >
                    Send Wish
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="throwing"
                  className="relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ThrowableCard wish={preparedWish} onThrown={handleThrowComplete} shakeTrigger={shakeTrigger} onThrowProgress={onThrowProgress} isMobile={isMobile} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
