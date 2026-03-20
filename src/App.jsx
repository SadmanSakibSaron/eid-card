import { useState, useEffect, useCallback } from 'react';
import { useSpring, useMotionValue } from 'motion/react';
import { DotGrid, GodRays, PaperTexture } from '@paper-design/shaders-react';
import DragElements from './components/fancy/blocks/drag-elements';
import GoesOutComesInUnderline from './components/fancy/text/underline-goes-out-comes-in';
import WishModal from './components/WishModal';
import WishCard from './components/WishCard';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function App() {
  const [wishes, setWishes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);
  const [throwProgress, setThrowProgress] = useState(0);

  const hoverTarget = useMotionValue(0);
  const hoverSpring = useSpring(hoverTarget, { stiffness: 80, damping: 18 });
  const [hoverBlend, setHoverBlend] = useState(0);

  useEffect(() => {
    hoverTarget.set(hovering ? 1 : 0);
  }, [hovering]);

  useEffect(() => {
    return hoverSpring.on('change', setHoverBlend);
  }, [hoverSpring]);

  const lerp = useCallback((a, b, t) => a + (b - a) * t, []);

  const scatter = { xSpread: 85, ySpread: 75, maxRotation: 25 };
  const drag = { elastic: 0.5, bounceStiffness: 200, bounceDamping: 300 };

  const addScatter = (wish) => ({
    ...wish,
    scatter: {
      x: (100 - scatter.xSpread) / 2 + Math.random() * scatter.xSpread,
      y: (100 - scatter.ySpread) / 2 + Math.random() * scatter.ySpread,
      rotate: -scatter.maxRotation + Math.random() * scatter.maxRotation * 2,
    },
  });

  // Load existing wishes from DB on mount
  useEffect(() => {
    fetch('/api/wishes')
      .then((r) => r.json())
      .then((rows) => setWishes(shuffle(rows).slice(0, 10).map(addScatter)))
      .catch(console.error);
  }, []);

  const handleAddWish = async (wish) => {
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wish),
      });
      const saved = await res.json();
      const newWish = { ...addScatter(saved), enterFromTop: true };
      setWishes((prev) => [newWish, ...prev].slice(0, 10));
      // Clear flag after animation so re-renders don't replay it
      setTimeout(() => { newWish.enterFromTop = false; }, 500);
    } catch (err) {
      console.error('Failed to save wish:', err);
      // Still show locally even if save fails
      const newWish = { ...addScatter(wish), id: wish.id || `local-${Date.now()}`, enterFromTop: true };
      setWishes((prev) => [newWish, ...prev].slice(0, 10));
      setTimeout(() => { newWish.enterFromTop = false; }, 500);
    }
  };

  return (
    <div className="grain" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* SVG filter for paper grain texture */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="5" stitchTiles="stitch" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="white" surfaceScale="1.5" result="lit">
            <feDistantLight azimuth="45" elevation="55" />
          </feDiffuseLighting>
        </filter>
      </svg>

      {/* Left column — description */}
      <div className="overflow-y-auto flex flex-col justify-between relative" style={{ padding: '40px 32px' }}>
        <PaperTexture contrast={0.41} roughness={0.66} fiber={0.27} fiberSize={0.2} crumples={0.3} crumpleSize={0.91} folds={0.57} foldCount={2} fade={0.54} drops={0.14} seed={0} scale={0.44} fit="cover" colorBack="#00000000" colorFront="#EAD39D" style={{ backgroundColor: '#FFFFFF', position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <div className="flex flex-col gap-5 relative z-10">
          <img src="/eid stall.svg" alt="Eid stall" style={{ width: '30%', marginBottom: '16px' }} />
          <h1 style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: '36px', color: '#5C4A2E', lineHeight: 1.2 }}>
            Reminiscing eid cards
          </h1>
          <p style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: '14px', color: '#5C4A2E', lineHeight: 1.7 }}>
            Growing up, I had a strange affliction towards Eid cards. As Ramadan came each year, these card stalls would start popping up along the streets — more and more of them as the days passed, right alongside the deep-fried monstrosities that local hotels used to sell from makeshift counters on the pavement.
          </p>
          <p style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: '14px', color: '#5C4A2E', lineHeight: 1.7 }}>
            The tangible feeling of those cards — 20 to 23 years later, I oddly miss.
            That led me to create this over the entire night. If you are here, thank you. Leave a "virtual Eid card" to me or another fellow visitor. I'll be sure to read all of the wishes. And lastly, Eid Mubarak!
          </p>
        </div>
        <div className="pt-8 relative z-10" style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: '14px', color: '#5C4A2E' }}>
          <a href="https://www.linkedin.com/in/sadmansakibsaron/" target="_blank" rel="noopener noreferrer">
            <GoesOutComesInUnderline direction="left">
              LinkedIn
            </GoesOutComesInUnderline>
          </a>
        </div>
      </div>

      {/* Right column — cards area */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          className="absolute inset-0 transition-[filter] duration-300"
          style={{ filter: cardFocused ? 'blur(12px)' : 'blur(0px)' }}
        >
          <DotGrid
            size={2}
            gapY={32}
            gapX={32}
            strokeWidth={0}
            sizeRange={0}
            opacityRange={0}
            shape="circle"
            colorFill="#C5BFBE"
            colorStroke="#FFAA00"
            colorBack="#00000000"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          {/* Divine Light */}
          <GodRays
            offsetX={0}
            offsetY={-0.59}
            intensity={lerp(0.57 + throwProgress * (0.87 - 0.57), 2, hoverBlend)}
            spotty={0.77}
            midSize={lerp(0.16 + throwProgress * (0.4 - 0.16), 0.4, hoverBlend)}
            midIntensity={lerp(0.6 + throwProgress * (1.2 - 0.6), 1.2, hoverBlend)}
            density={lerp(0.15 + throwProgress * (0.3 - 0.15), 0.3, hoverBlend)}
            bloom={lerp(0.6 + throwProgress * (0.18 - 0.6), 1.5, hoverBlend)}
            speed={1}
            scale={1}
            colorBloom="#CE9855"
            colorBack="#00000000"
            colors={['#CE9855', '#CE9855']}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transition: 'opacity 0.3s' }}
          />

          {/* Eid Mubarak title */}
          <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
            <div
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className="pointer-events-auto"
              style={{ color: '#E4BB5B', fontFamily: '"AdorNoakhali-Bold", "Ador Noakhali", system-ui, sans-serif', fontSize: '132.25px', fontWeight: 700, lineHeight: 'round(up, 100%, 1px)', textAlign: 'center', whiteSpace: 'pre', cursor: 'default' }}
            >
              ঈদ মোবারক
            </div>
          </div>
        </div>

        {/* Draggable wishes layer — 60px inset bounding box */}
        <div className="absolute z-10" style={{ inset: 60 }}>
          <DragElements
            dragMomentum={true}
            dragElastic={drag.elastic}
            dragTransition={{ bounceStiffness: drag.bounceStiffness, bounceDamping: drag.bounceDamping }}
            onFocusChange={setCardFocused}
            className=""
          >
            {wishes.map((wish, i) => (
              <div
                key={wish.id || i}
                data-rotate={wish.scatter.rotate}
                data-enter-from-top={wish.enterFromTop ? 'true' : undefined}
                style={{
                  left: `${wish.scatter.x}%`,
                  top: `${wish.scatter.y}%`,
                }}
              >
                <WishCard wish={wish} />
              </div>
            ))}
          </DragElements>
        </div>

        {/* Wish Modal / Button */}
        <WishModal
          isOpen={showModal}
          onToggle={() => setShowModal((v) => !v)}
          onSubmit={handleAddWish}
          onThrowProgress={setThrowProgress}
        />
      </div>
    </div>
  );
}
