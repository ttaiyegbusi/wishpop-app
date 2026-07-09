'use client';

import { useEffect, useState } from 'react';
import type { DraftWishlist, WishlistItem } from '@/components/product/WishlistStore';
import { fetchPublicWishlist } from '@/actions/wishlist.actions';
import { reserveItem, unreserveItem } from '@/actions/reservation.actions';
import { ItemCardStack } from './ItemCardStack';
import { ItemStoryViewer } from './ItemStoryViewer';
import { Toast } from '@/components/ui/Toast';

// Viewer-facing page for a shared wishlist: fetch it from Supabase by its share
// token, browse the items, and reserve one (writes go through server actions).
export function PublicWishlistView({ shareToken }: { shareToken: string }) {
  // undefined = loading, null = not found
  const [wishlist, setWishlist] = useState<DraftWishlist | null | undefined>(undefined);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [reserving, setReserving] = useState<WishlistItem | null>(null);
  const [reservedId, setReservedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPublicWishlist(shareToken).then((w) => {
      if (alive) setWishlist(w ?? null);
    });
    return () => {
      alive = false;
    };
  }, [shareToken]);

  function patchItem(itemId: string, reservation: WishlistItem['reservation']) {
    setWishlist((w) =>
      w ? { ...w, items: w.items.map((it) => (it.id === itemId ? { ...it, reservation } : it)) } : w,
    );
  }

  if (wishlist === undefined) {
    return <main className="wishlist-view public-view" />;
  }

  if (wishlist === null) {
    return (
      <main className="wishlist-view public-view">
        <div className="public-missing">
          <p>This wishlist isn’t available.</p>
          <span>The link may be wrong, or the list was deleted.</span>
        </div>
      </main>
    );
  }

  const items = wishlist.items;
  const subtitle = `${items.length} item${items.length === 1 ? '' : 's'}`;

  return (
    <main className="wishlist-view public-view">
      <div className="wishlist-view-heading public-heading">
        <p className="public-eyebrow">Reserve a gift</p>
        <h1 className="wishlist-view-title">{wishlist.title}</h1>
        <p className="wishlist-view-subtitle">{subtitle}</p>
      </div>

      <div className="wishlist-view-stack">
        <ItemCardStack items={items} onOpen={setOpenIndex} />
      </div>

      {openIndex !== null ? (
        <ItemStoryViewer
          wishlistId={shareToken}
          items={items}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          mode="reserve"
          onReserve={(item) => setReserving(item)}
        />
      ) : null}

      {reserving ? (
        <ReserveEmailModal
          item={reserving}
          onCancel={() => setReserving(null)}
          onConfirm={async (email) => {
            const item = reserving;
            setReserving(null);
            const ok = await reserveItem(shareToken, item.id, email);
            if (ok) {
              patchItem(item.id, { email, createdAt: Date.now() });
              setOpenIndex(null);
              setReservedId(item.id);
            } else {
              // someone else got there first — refresh to show the real state
              const fresh = await fetchPublicWishlist(shareToken);
              if (fresh) setWishlist(fresh);
            }
          }}
        />
      ) : null}

      {reservedId ? (
        <Toast
          message="Reserved"
          actionLabel="Undo"
          onAction={async () => {
            const id = reservedId;
            setReservedId(null);
            patchItem(id, null);
            await unreserveItem(shareToken, id);
          }}
          onDismiss={() => setReservedId(null)}
        />
      ) : null}
    </main>
  );
}

function ReserveEmailModal({
  item,
  onCancel,
  onConfirm,
}: {
  item: WishlistItem;
  onCancel: () => void;
  onConfirm: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <div className="folder-modal" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="folder-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="folder-modal-title">Reserve this gift</h2>
        <p className="folder-modal-text">
          Enter your email to reserve “{item.title || 'this item'}”. We’ll use it to keep the gift
          held for you.
        </p>
        <input
          className="folder-modal-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Your email"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid) onConfirm(email);
          }}
        />
        <div className="folder-modal-actions">
          <button className="folder-modal-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="folder-modal-btn primary"
            disabled={!valid}
            onClick={() => onConfirm(email)}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
