import { useState } from 'react';

export default function WishModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return;
    onSubmit({ name: name.trim() || 'Anonymous', message: message.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Postcard */}
      <div
        className="relative w-full max-w-md bg-white/90 border-2 border-dashed border-stone-400 rounded-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Stamp area */}
        <div className="absolute top-3 right-3 w-12 h-14 border-2 border-dotted border-stone-300 flex items-center justify-center">
          <span className="text-[10px] text-stone-400 font-mono">STAMP</span>
        </div>

        {/* Postcard content */}
        <div className="p-6 pt-8">
          {/* Header */}
          <div className="border-b border-stone-300 pb-3 mb-4">
            <h2 className="text-lg font-serif text-stone-700 tracking-wide">Eid Mubarak Wish</h2>
            <p className="text-xs text-stone-400 font-mono mt-1">Send your blessings to the world</p>
          </div>

          {/* Horizontal rule lines (like a real postcard) */}
          <div className="space-y-4">
            {/* Name field */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-mono">From</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full mt-1 px-0 py-1 bg-transparent border-b border-stone-300 text-stone-700 text-sm font-serif placeholder:text-stone-300 focus:outline-none focus:border-stone-500"
              />
            </div>

            {/* Message field */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-stone-400 font-mono">Your Wish</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your Eid wish here..."
                rows={4}
                maxLength={200}
                className="w-full mt-1 px-0 py-1 bg-transparent border-b border-stone-300 text-stone-700 text-sm font-serif placeholder:text-stone-300 focus:outline-none focus:border-stone-500 resize-none"
              />
              <div className="text-right text-[10px] text-stone-400 font-mono mt-1">
                {message.length}/200
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4 pt-3 border-t border-stone-200">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-xs font-mono uppercase tracking-widest text-stone-400 border border-stone-300 rounded-sm hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="flex-1 py-2 text-xs font-mono uppercase tracking-widest text-white bg-stone-700 rounded-sm hover:bg-stone-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Wish to World
            </button>
          </div>
        </div>

        {/* Postcard edge decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300 opacity-30" />
      </div>
    </div>
  );
}
