'use client';

import Link from 'next/link';
import type { WishlistItem } from '@/components/product/WishlistStore';

// Vertically-scrolling column of overlapping item cards in a strict
// two-position zig-zag (alternating left / right). Tap a card to open it.
// On the wide desktop layout the same cards flow into a grid (see CSS), with
// an optional "Add item" tile when `addHref` is given.
export function ItemCardStack({
  items,
  onOpen,
  addHref,
}: {
  items: WishlistItem[];
  onOpen: (index: number) => void;
  addHref?: string;
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
            className={`scatter-card ${item.reservation ? 'is-reserved' : ''}`}
            style={{
              zIndex: i + 1,
              marginTop: i === 0 ? 0 : -CARD_OVERLAP,
              // cards are centred, then nudged left/right by a fixed offset
              // (constant corner overlap across widths) and tilted, leaning
              // left / right alternately down the column.
              transform: `translateX(${left ? -CARD_OFFSET : CARD_OFFSET}px) rotate(${left ? -CARD_TILT : CARD_TILT}deg)`,
            }}
            aria-label={`Open ${item.title}`}
            onClick={() => onOpen(i)}
          >
            <span
              className="scatter-card-photo"
              style={item.imageDataUrl ? { backgroundImage: `url(${item.imageDataUrl})` } : undefined}
            />
            {item.reservation ? <span className="scatter-card-reserved">Reserved</span> : null}
          </button>
        );
      })}
      {addHref ? (
        <Link className="scatter-add" href={addHref} aria-label="Add item">
          <span className="scatter-add-plus">+</span>
          <span className="scatter-add-label">Add item</span>
        </Link>
      ) : null}
    </div>
  );
}

const CARD_OFFSET = 60; // horizontal nudge from centre for each column
const CARD_OVERLAP = 106; // how far each card pulls up over the previous one
const CARD_TILT = 6; // degrees; leans left on even rows, right on odd rows
