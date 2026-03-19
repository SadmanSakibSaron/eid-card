import { useState, useEffect } from 'react';
import { useDialKit } from 'dialkit';
import { DotGrid, GodRays } from '@paper-design/shaders-react';
import DragElements from './components/fancy/blocks/drag-elements';
import WishModal from './components/WishModal';
import WishCard from './components/WishCard';

export default function App() {
  const [wishes, setWishes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);

  const scatter = useDialKit('Scatter', {
    xSpread: [70, 0, 90, 1],
    ySpread: [60, 0, 80, 1],
    maxRotation: [25, 0, 90, 1],
  });

  const drag = useDialKit('Drag', {
    elastic: [0.5, 0, 1],
    bounceStiffness: [200, 50, 600, 10],
    bounceDamping: [300, 10, 600, 10],
  });

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
      .then((rows) => setWishes(rows.map(addScatter)))
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
      setWishes((prev) => [addScatter(saved), ...prev]);
    } catch (err) {
      console.error('Failed to save wish:', err);
      // Still show locally even if save fails
      setWishes((prev) => [addScatter(wish), ...prev]);
    }
  };

  return (
    <div className="grain" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* SVG filter for paper grain texture */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="5" stitchTiles="stitch" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="white" surfaceScale="1.5" result="lit">
            <feDistantLight azimuth="45" elevation="55" />
          </feDiffuseLighting>
        </filter>
      </svg>
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
          intensity={hovering ? 2 : 0.57}
          spotty={0.77}
          midSize={hovering ? 0.4 : 0.16}
          midIntensity={hovering ? 1.2 : 0.6}
          density={hovering ? 0.3 : 0.15}
          bloom={hovering ? 1.5 : 0.6}
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
              style={{
                left: `${wish.scatter.x}%`,
                top: `${wish.scatter.y}%`,
                transform: `rotate(${wish.scatter.rotate}deg)`,
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
      />
    </div>
  );
}
