import { useState } from 'react';
import { Dithering, HalftoneCmyk, Heatmap } from '@paper-design/shaders-react';
import WishModal from './components/WishModal';
import WishCard from './components/WishCard';

export default function App() {
  const [wishes, setWishes] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const handleAddWish = (wish) => {
    setWishes((prev) => [wish, ...prev]);
  };

  return (
    <div style={{ backgroundColor: '#E0E1CC', backgroundImage: 'linear-gradient(#FFFFFF, #FFFFFF)', boxSizing: 'border-box', position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Dithering
        speed={0.74}
        shape="warp"
        type="2x2"
        size={7.4}
        scale={1.71}
        frame={273026.5690001991}
        colorBack="#00000000"
        colorFront="#3E373A4D"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      <Heatmap
        speed={1.17}
        contour={0.528}
        angle={0}
        noise={0.23}
        innerGlow={0.78}
        outerGlow={0.45}
        scale={0.74}
        offsetX={0}
        offsetY={0}
        image="https://workers.paper.design/file-assets/01KFB0CFRX4XYRT92HEENQ7018/01KM2MXSGV8Z4HCD98GBFTP6T2.webp"
        frame={474856.969000067}
        colors={['#3F383B', '#3F383B80']}
        colorBack="#00000000"
        fit="cover"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      <HalftoneCmyk
        size={0.01}
        gridNoise={0.31}
        type="ink"
        softness={0}
        contrast={1.88}
        gainC={-0.06}
        gainM={-0.06}
        gainY={-1}
        gainK={-0.19}
        floodC={0}
        floodM={0}
        floodY={0}
        floodK={0}
        scale={0.33}
        offsetX={0}
        offsetY={0}
        image="https://workers.paper.design/file-assets/01KFB0CFRX4XYRT92HEENQ7018/01KM2MK9JBEDCJK71CSFF0ZF6X.webp"
        grainSize={1}
        fit="cover"
        grainOverlay={0}
        grainMixer={0.31}
        colorC="#73707180"
        colorM="#00000000"
        colorY="#00000000"
        colorBack="#00000000"
        colorK="#43393C"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Content layer above shaders */}
      <div className="absolute inset-0 z-10 flex flex-col">
        {/* Wishes display area */}
        {wishes.length > 0 && (
          <div className="flex-1 overflow-y-auto p-6 pb-24">
            <div className="flex flex-wrap gap-4 justify-center">
              {wishes.map((wish, i) => (
                <WishCard key={i} wish={wish} />
              ))}
            </div>
          </div>
        )}

        {/* Add Wish Button - fixed bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-white/90 border-2 border-dashed border-stone-400 rounded-sm text-xs font-mono uppercase tracking-[0.2em] text-stone-600 shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
          >
            + Add Wish to World
          </button>
        </div>
      </div>

      {/* Wish Modal */}
      {showModal && (
        <WishModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddWish}
        />
      )}
    </div>
  );
}
