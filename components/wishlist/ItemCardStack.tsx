'use client';

import type { WishlistItem } from '@/components/product/WishlistStore';

// Vertically-scrolling column of overlapping item cards in a strict
// two-position zig-zag (alternating left / right). Tap a card to open it.
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
        const left = i % 2 === 0;
        return (
          <button
            key={item.id}
            type="button"
            className="scatter-card"
            style={{
              zIndex: i + 1,
              marginTop: i === 0 ? 0 : -CARD_OVERLAP,
              // cards are centred, then nudged left/right by a fixed offset,
              // so the corner overlap stays constant across screen widths.
              transform: `translateX(${left ? -CARD_OFFSET : CARD_OFFSET}px)`,
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

const CARD_OFFSET = 72; // horizontal nudge from centre for each column
const CARD_OVERLAP = 74; // how far each card pulls up over the previous one
