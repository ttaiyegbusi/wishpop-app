'use client';

import type { WishlistItem } from '@/components/product/WishlistStore';

// Vertically-scrolling column of overlapping item cards in a loose,
// hand-placed left/right scatter. Tap a card to open the item.
export function ItemCardStack({
  items,
  onOpen,
}: {
  items: WishlistItem[];
  onOpen: (item: WishlistItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="stack-empty">
        <p>No items yet.</p>
      </div>
    );
  }

  return (
    <div className="card-scatter">
      {items.map((item, i) => {
        const s = SCATTER[i % SCATTER.length];
        return (
          <button
            key={item.id}
            type="button"
            className="scatter-card"
            style={{
              zIndex: i + 1,
              marginTop: i === 0 ? 0 : -s.overlap,
              marginLeft: s.side === 'l' ? s.pad : 'auto',
              marginRight: s.side === 'r' ? s.pad : 'auto',
              transform: `rotate(${s.rot}deg)`,
              backgroundImage: item.imageDataUrl ? `url(${item.imageDataUrl})` : undefined,
            }}
            aria-label={`Open ${item.title}`}
            onClick={() => onOpen(item)}
          />
        );
      })}
    </div>
  );
}

// Loose, hand-placed scatter pattern. Cycles every 6 cards so longer lists
// keep the same rhythm without an obvious repeat. `overlap` is how far a card
// pulls up over the previous one; `pad` is its inset from the aligned edge.
const SCATTER = [
  { side: 'l', pad: 44, overlap: 0, rot: -2 },
  { side: 'r', pad: 50, overlap: 96, rot: 2.5 },
  { side: 'l', pad: 60, overlap: 104, rot: -1.5 },
  { side: 'r', pad: 44, overlap: 92, rot: 2 },
  { side: 'l', pad: 40, overlap: 100, rot: -2.5 },
  { side: 'r', pad: 56, overlap: 94, rot: 1.5 },
] as const;
