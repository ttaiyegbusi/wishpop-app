'use client';

import { useState } from 'react';
import { useWishlists, type WishlistItem } from '@/components/product/WishlistStore';
import { ItemCardStack } from './ItemCardStack';
import { ItemStoryViewer } from './ItemStoryViewer';
import { Toast } from '@/components/ui/Toast';

// Viewer-facing page for a shared wishlist: browse the items and reserve one.
// UI-first — reads/writes the same localStorage store, so it works on the
// device the wishlist was created on (real cross-device sharing needs a
// backend, which is the planned next step).
export function PublicWishlistView({ shareToken }: { shareToken: string }) {
  const { ready, getWishlist, reserveItem, unreserveItem } = useWishlists();
  const wishlist = getWishlist(shareToken);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [reserving, setReserving] = useState<WishlistItem | null>(null);
  const [reservedId, setReservedId] = useState<string | null>(null);

  if (ready && !wishlist) {
    return (
      <main className="wishlist-view public-view">
        <div className="public-missing">
          <p>This wishlist isn’t available on this device.</p>
          <span>Open the link on the phone it was created on to reserve a gift.</span>
        </div>
      </main>
    );
  }

  const items = wishlist?.items ?? [];
  const subtitle = `${items.length} item${items.length === 1 ? '' : 's'}`;

  return (
    <main className="wishlist-view public-view">
      <div className="wishlist-view-heading public-heading">
        <p className="public-eyebrow">Reserve a gift</p>
        <h1 className="wishlist-view-title">{wishlist?.title ?? '…'}</h1>
        <p className="wishlist-view-subtitle">{subtitle}</p>
      </div>

      <div className="wishlist-view-stack">
        <ItemCardStack items={items} onOpen={setOpenIndex} />
      </div>

      {openIndex !== null ? (
        <ItemStoryViewer
          wishlistId={shareToken}
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
          onConfirm={(email) => {
            reserveItem(shareToken, reserving.id, email);
            const id = reserving.id;
            setReserving(null);
            setOpenIndex(null);
            setReservedId(id);
          }}
        />
      ) : null}

      {reservedId ? (
        <Toast
          message="Reserved"
          actionLabel="Undo"
          onAction={() => {
            unreserveItem(shareToken, reservedId);
            setReservedId(null);
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
