import { useState, useEffect, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useAnimationControls } from 'motion/react';
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

  const signControls = useAnimationControls();
  useEffect(() => {
    const timer = setTimeout(() => {
      signControls.start({ pathLength: 1, transition: { duration: 2.5, ease: "easeInOut" } });
    }, 1000);
    return () => clearTimeout(timer);
  }, [signControls]);
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
      <div className="overflow-y-auto flex flex-col justify-between relative" style={{ padding: '40px 32px', borderRight: '1px solid rgba(92, 74, 46, 0.2)' }}>
        <PaperTexture contrast={0.41} roughness={0.66} fiber={0.27} fiberSize={0.2} crumples={0.3} crumpleSize={0.91} folds={0.57} foldCount={2} fade={0.54} drops={0.14} seed={0} scale={0.44} fit="cover" colorBack="#00000000" colorFront="#EAD39D" style={{ backgroundColor: '#FFFFFF', position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <div className="flex flex-col gap-5 relative z-10">
          <motion.img
            src="/eid stall.svg"
            alt="Eid stall"
            style={{ width: '30%', marginBottom: '16px' }}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          <motion.h1
            style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: '36px', color: '#5C4A2E', lineHeight: 1.2 }}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Reminiscing eid cards
          </motion.h1>
          <motion.p
            style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: '14px', color: '#5C4A2E', lineHeight: 1.7 }}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Growing up, I had a strange affliction towards Eid cards. As Ramadan came each year, these card stalls would start popping up along the streets — more and more of them as the days passed, right alongside the deep-fried monstrosities that local hotels used to sell from makeshift counters on the pavement.
          </motion.p>
          <motion.p
            style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: '14px', color: '#5C4A2E', lineHeight: 1.7 }}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            The tangible feeling of those cards — 20 to 23 years later, I oddly miss.
            That led me to create this over the entire night. If you are here, thank you. Leave a "virtual Eid card" to me or another fellow visitor. I'll be sure to read all of the wishes. And lastly, Eid Mubarak!
          </motion.p>
          <motion.svg
            width="111"
            height="66"
            viewBox="0 0 158 94"
            fill="none"
            style={{ marginTop: '16px', cursor: 'pointer' }}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.8 }}
            onHoverStart={() => {
              signControls.set({ pathLength: 0 });
              signControls.start({ pathLength: 1, transition: { duration: 2.5, ease: "easeInOut" } });
            }}
          >
            <motion.path
              animate={signControls}
              d="M6.68706 46.3387C10.3037 45.1332 14.7586 42.3961 19.4359 37.905C23.5189 33.9846 24.7858 28.2606 25.743 22.7373C26.7367 17.0039 25.148 12.3712 23.6864 10.9069C22.3513 9.56948 19.4669 9.60305 16.5384 9.94454C12.8196 10.3782 10.3296 15.4394 7.5563 21.4775C4.52337 28.0809 8.40484 32.1722 11.6748 37.1807C14.2799 41.1707 20.45 44.7658 26.157 49.9399C31.0251 54.3534 31.3465 59.429 31.9519 63.3044C33.4321 72.7803 30.3221 76.3275 27.14 82.7898C24.1658 88.8302 17.7595 90.8148 14.0264 91.9556C12.9275 92.2915 10.1588 92.3877 6.45423 92.1315C4.15965 91.9729 3.07041 90.1525 2.20893 88.8616C1.52341 87.8343 1.34228 86.7014 1.08357 85.3277C0.702596 83.3047 1.67859 81.1859 3.05488 79.6362C5.66828 76.6937 9.60522 75.8307 13.8195 75.4013C24.048 74.359 27.8799 74.7959 32.1071 73.9396C39.1464 72.5137 41.3428 68.4215 44.3566 65.5836C47.0921 63.0077 49.109 60.6605 50.0558 59.1134C51.1217 57.3719 51.1838 54.6327 50.9277 52.1336C50.8261 51.143 50.1593 50.8298 49.6393 50.5685C48.6395 50.0661 46.7134 49.9606 44.3023 50.1313C42.5044 50.2586 41.3583 51.3368 40.3261 52.1957C39.1091 53.2083 38.4246 54.7828 37.9072 57.0128C37.0164 60.8521 38.4143 64.4375 39.7906 66.3312C41.0102 68.0093 42.3827 68.7578 43.5003 69.1019C44.7748 69.4943 46.0046 69.4512 47.0368 69.0217C49.569 67.9682 50.3145 62.5749 51.1812 59.799C51.5055 58.7604 51.7012 56.3608 51.7012 54.4542C51.7012 52.6045 51.8719 58.922 52.4721 60.3836C53.2225 62.211 54.8004 63.4079 55.8327 64.3547C56.7844 65.2277 58.4171 65.4827 60.14 65.2265C62.9762 64.805 64.2844 60.8364 65.1511 58.7642C65.9939 56.749 66.1885 54.286 66.6179 47.5986C66.9358 42.6487 66.7059 33.2484 66.7913 28.1546C66.8853 22.5434 67.2233 14.6788 66.9672 4.06683C66.8881 0.787779 66.1988 1.8213 65.935 5.67854C65.217 16.1736 65.8418 23.7385 66.1859 25.4563C67.117 30.1047 68.0822 34.9248 69.3731 39.6823C70.5627 44.0662 72.0455 47.0113 72.9122 49.5208C73.3475 50.7812 73.6029 52.025 73.947 52.3742C76.5984 55.0655 71.0314 42.3961 68.7833 39.1908C67.9086 37.9437 66.7111 37.2014 65.252 36.684C64.3443 36.3621 62.9392 36.508 61.9794 36.7642C60.3751 37.1923 59.6382 38.914 58.95 40.6343C56.9325 45.6781 58.593 52.5372 59.545 55.0389C59.997 56.2266 61.0093 57.0283 62.0415 57.6311C63.0078 58.1953 64.7967 58.239 66.8637 58.0683C69.4951 57.8509 70.4933 54.6275 71.704 50.8479C74.9721 40.6457 71.3625 37.0462 71.6187 33.771C71.7163 32.5221 72.387 32.2033 72.907 31.942C73.9068 31.4395 75.3207 31.334 76.8703 31.6755C79.7432 32.3086 79.8066 35.9803 80.6732 39.1675C81.6647 42.8137 82.0521 45.9765 82.6575 47.7176C83.505 50.1551 82.228 42.0443 81.7986 37.3954C81.3104 32.1112 82.2228 28.4055 83.2551 27.8027C84.2214 27.2385 85.498 27.1948 86.7036 27.4509C89.2736 27.9969 89.8132 31.8411 90.9333 35.6311C91.7477 38.3863 92.0587 42.5203 92.9176 44.3571C94.9942 48.7981 92.0587 34.9662 91.1998 29.9784C90.905 28.2666 91.0239 26.2014 91.28 25.0605C91.5361 23.9196 92.0483 23.7489 92.5683 23.5755C94.5951 22.8999 96.705 22.7141 98.6918 22.7943C101.02 22.8882 101.538 27.0085 102.404 29.342C103.496 32.2828 104.642 35.8044 106.538 37.8818C108.121 39.6162 111.534 38.2362 113.782 37.116C117.069 35.4783 121.706 28.954 123.786 25.2235C126.081 21.1066 126.89 18.2437 127.757 14.9608C128.078 13.7462 128.277 12.7126 128.021 11.8512C127.756 10.9619 125.359 11.1553 123.033 11.326C120.176 11.5357 117.774 15.4497 115.606 20.528C113.485 25.4948 115.513 29.7766 116.027 30.7235C116.579 31.7388 118.094 32.0222 119.471 32.2809C122.03 32.762 124.127 30.651 126.629 27.6397C129.326 24.3932 128.618 20.6548 128.624 17.9772C128.628 15.6507 127.589 14.2649 127.33 14.2571C123.188 14.1328 128.618 20.7997 129.739 23.4772C129.994 24.0877 130.171 24.5974 130.515 24.9467C130.859 25.2959 131.371 25.4667 131.891 25.4692C132.411 25.4718 132.923 25.3011 133.358 24.8716C135.316 22.9365 135.521 20.4789 136.465 18.2359C138.611 13.1383 137.585 5.9864 138.617 5.21029C139.083 4.85986 139.649 4.94642 139.999 5.2879C141.875 7.12295 142.071 11.1346 142.332 15.7938C142.468 18.2121 142.935 20.4582 143.194 21.0713C145.17 25.7562 144.141 13.2352 144.746 10.6482C145.345 8.08979 146.21 5.99157 147.416 3.48993C147.986 2.3056 148.968 1.50051 150 1.06848C150.487 0.86469 151.032 1.14867 151.382 1.49275C153.193 3.2775 154.654 8.5372 155.697 11.6649C156.457 13.9443 157.252 20.7583 156.395 25.8883C155.571 30.8267 151.053 32.017 147.527 33.6546C140.537 36.9009 136.069 36.6736 130.97 37.1962C124.808 37.8277 117.639 39.0847 112.594 40.4714C110.766 40.9741 103.674 43.8914 94.2784 49.0629C88.663 52.1535 86.0361 54.0894 84.6469 56.3324C82.8974 59.157 82.0624 61.3331 79.5634 68.1292C78.9528 71.1689 78.6062 75.9653 78.6916 81.9128C78.7769 84.104 78.9477 84.6163 79.1236 86.1788"
              stroke="#5C4A2E"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
            />
          </motion.svg>
        </div>
        <motion.div
          className="pt-8 relative z-10"
          style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: '14px', color: '#5C4A2E' }}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <a href="https://www.linkedin.com/in/sadmansakibsaron/" target="_blank" rel="noopener noreferrer">
            <GoesOutComesInUnderline direction="left">
              LinkedIn
            </GoesOutComesInUnderline>
          </a>
        </motion.div>
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
            midIntensity={lerp(0.6 + throwProgress * (0.33 - 0.6), 1.2, hoverBlend)}
            density={lerp(0.15 + throwProgress * (0.3 - 0.15), 0.3, hoverBlend)}
            bloom={lerp(0.6 + throwProgress * (0.5 - 0.6), 1.5, hoverBlend)}
            speed={1}
            scale={1}
            colorBloom="#CE9855"
            colorBack="#00000000"
            colors={['#CE9855', '#CE9855']}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transition: 'opacity 0.3s' }}
          />

        </div>

        {/* Helper text */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[5] text-stone-500 text-xs font-mono uppercase tracking-[0.25em] pointer-events-none">
          Drag cards around
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
