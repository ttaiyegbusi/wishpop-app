'use client';

import { useRef, useState } from 'react';
import type { WishlistItem } from '@/components/product/WishlistStore';

// Fanned, swipeable stack of item cards (image only, per the design).
// Tap the front card or drag horizontally to bring the next item forward.
export function ItemCardStack({ items }: { items: WishlistItem[] }) {
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const count = items.length;

  if (count === 0) {
    return (
      <div className="stack-empty">
        <p>No items yet.</p>
      </div>
    );
  }

  function advance(dir: number) {
    setActive((a) => (a + dir + count) % count);
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current === null) return;
    const dx = drag;
    startX.current = null;
    setDrag(0);
    if (dx < -60) advance(1);
    else if (dx > 60) advance(-1);
  }

  return (
    <div className="card-stack">
      {items.map((item, i) => {
        const rel = (i - active + count) % count;
        const isFront = rel === 0;
        const base = STACK_TRANSFORMS[Math.min(rel, STACK_TRANSFORMS.length - 1)];
        const dragT = isFront ? ` translateX(${drag}px) rotate(${drag * 0.02}deg)` : '';
        return (
          <button
            key={item.id}
            type="button"
            className={`stack-card ${isFront ? 'is-front' : ''}`}
            style={{
              zIndex: count - rel,
              opacity: rel > 2 ? 0 : base.opacity,
              transform: base.t + dragT,
              backgroundImage: item.imageDataUrl ? `url(${item.imageDataUrl})` : undefined,
              transition: startX.current !== null ? 'none' : undefined,
            }}
            aria-label={`${item.title}${count > 1 ? `, item ${i + 1} of ${count}` : ''}`}
            onPointerDown={isFront ? onPointerDown : undefined}
            onPointerMove={isFront ? onPointerMove : undefined}
            onPointerUp={isFront ? onPointerUp : undefined}
            onClick={() => {
              if (Math.abs(drag) < 6 && count > 1) advance(1);
            }}
          />
        );
      })}

      {count > 1 ? (
        <div className="stack-dots" aria-hidden="true">
          {items.map((item, i) => (
            <span key={item.id} className={`stack-dot ${i === active ? 'is-active' : ''}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const STACK_TRANSFORMS = [
  { t: 'rotate(7deg) translate(10px, 6px) scale(1)', opacity: 1 },
  { t: 'rotate(-5deg) translate(-18px, -8px) scale(0.96)', opacity: 1 },
  { t: 'rotate(3deg) translate(8px, -16px) scale(0.92)', opacity: 0.65 },
];
