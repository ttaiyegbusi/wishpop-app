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
              marginLeft: left ? CARD_PAD : 'auto',
              marginRight: left ? 'auto' : CARD_PAD,
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

const CARD_PAD = 70; // inset from the left/right edge (columns overlap toward center)
const CARD_OVERLAP = 104; // how far each card pulls up over the previous one
