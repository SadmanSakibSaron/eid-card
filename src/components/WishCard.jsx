export default function WishCard({ wish }) {
  return (
    <div className="w-64 bg-white/85 border border-stone-300 rounded-sm shadow-lg p-4 relative shrink-0">
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
    </div>
  );
}
