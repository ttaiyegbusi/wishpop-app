'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useWishlists, type WishlistItem } from '@/components/product/WishlistStore';

// Full-image, swipeable "stories" viewer for a wishlist's items. Opens on the
// tapped item and lets the user page through all of them. In 'owner' mode the
// actions are edit/delete; in 'reserve' mode they are Reserve + close.
export function ItemStoryViewer({
  wishlistId,
  items,
  startIndex,
  onClose,
  mode = 'owner',
  onReserve,
}: {
  wishlistId: string;
  items: WishlistItem[];
  startIndex: number;
  onClose: () => void;
  mode?: 'owner' | 'reserve';
  onReserve?: (item: WishlistItem) => void;
}) {
  const router = useRouter();
  const { deleteItem } = useWishlists();
  const count = items.length;

  const [index, setIndex] = useState(startIndex);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const startX = useRef<number | null>(null);

  // Keep the index in range as items are deleted; close when none remain.
  useEffect(() => {
    if (count === 0) {
      onClose();
    } else if (index > count - 1) {
      setIndex(count - 1);
    }
  }, [count, index, onClose]);

  if (count === 0) return null;
  const safeIndex = Math.min(index, count - 1);
  const item = items[safeIndex];

  const go = (dir: number) => setIndex((i) => (Math.min(i, count - 1) + dir + count) % count);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (dx < -50) go(1);
    else if (dx > 50) go(-1);
  }

  function handleDelete() {
    deleteItem(wishlistId, item.id);
    setConfirmDelete(false);
    // the effect above clamps the index / closes when the list is empty
  }

  return (
    <div className="item-story" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="item-story-stage">
        <div
          className="item-story-card"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div
            className="item-story-image"
            style={item.imageDataUrl ? { backgroundImage: `url(${item.imageDataUrl})` } : undefined}
          />
          <div className="item-story-scrim" />

          {item.reservation ? <span className="item-story-reserved">Reserved</span> : null}

          <div className="item-story-progress" aria-hidden="true">
            {items.map((it, i) => (
              <span
                key={it.id}
                className={`item-story-seg ${i === safeIndex ? 'is-active' : ''}`}
              />
            ))}
          </div>

          {count > 1 ? (
            <>
              <button
                type="button"
                className="item-story-arrow left"
                aria-label="Previous item"
                onClick={() => go(-1)}
              >
                <ChevronLeft size={20} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className="item-story-arrow right"
                aria-label="Next item"
                onClick={() => go(1)}
              >
                <ChevronRight size={20} strokeWidth={2.2} />
              </button>
            </>
          ) : null}

          <div className="item-story-body">
            <h2 className="item-story-name">{item.title || 'Untitled item'}</h2>
            {item.price ? (
              <p className="item-story-price">{`${item.currency ?? ''} ${item.price}`.trim()}</p>
            ) : null}
            {item.notes ? <p className="item-story-note">{item.notes}</p> : null}
          </div>
        </div>

        {mode === 'reserve' ? (
          <div className="item-story-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="item-story-reserve"
              disabled={!!item.reservation}
              onClick={() => onReserve?.(item)}
            >
              {item.reservation ? 'Reserved' : 'Reserve'}
            </button>
            <button
              type="button"
              className="item-story-action"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="item-story-actions">
            <button
              type="button"
              className="item-story-action"
              aria-label="Edit item"
              onClick={() =>
                router.push(`/wishlists/new/items?wishlist=${wishlistId}&item=${item.id}`)
              }
            >
              <Pencil size={18} strokeWidth={1.9} />
            </button>
            <button
              type="button"
              className="item-story-action"
              aria-label="Delete item"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={18} strokeWidth={1.9} />
            </button>
          </div>
        )}
      </div>

      {confirmDelete ? (
        <div
          className="folder-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(false);
          }}
        >
          <div className="folder-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="folder-modal-title">Delete item?</h2>
            <p className="folder-modal-text">
              “{item.title || 'This item'}” will be removed from the wishlist. This can’t be undone.
            </p>
            <div className="folder-modal-actions">
              <button className="folder-modal-btn ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="folder-modal-btn danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
