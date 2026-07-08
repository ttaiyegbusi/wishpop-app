'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlists, type WishlistItem } from '@/components/product/WishlistStore';
import { ItemCardStack } from '@/components/wishlist/ItemCardStack';

export default function WishlistDetailPage({
  params,
}: {
  params: Promise<{ wishlistId: string }>;
}) {
  const { wishlistId } = use(params);
  const router = useRouter();
  const { ready, getWishlist } = useWishlists();
  const wishlist = getWishlist(wishlistId);
  const [toast, setToast] = useState('');
  const [openItem, setOpenItem] = useState<WishlistItem | null>(null);

  const items = wishlist?.items ?? [];
  const subtitle = wishlist
    ? `${items.length} item${items.length === 1 ? '' : 's'} • ${formatDate(wishlist.createdAt)}`
    : '';

  async function handleShare() {
    const url = `${window.location.origin}/w/${wishlistId}`;
    const shareData = {
      title: wishlist?.title ?? 'WishPop wishlist',
      text: `See my wishlist "${wishlist?.title ?? ''}" on WishPop`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      return; // user dismissed the share sheet
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied');
      setTimeout(() => setToast(''), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (ready && !wishlist) {
    return (
      <main className="wishlist-view">
        <header className="wishlist-view-header">
          <button className="round-btn light" aria-label="Go back" onClick={() => router.push('/')}>
            <BackIcon />
          </button>
          <span className="header-spacer" />
        </header>
        <div className="wishlist-view-missing">
          <p>This wishlist couldn’t be found.</p>
          <Link href="/" className="btn">Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-view">
      <header className="wishlist-view-header">
        <button className="round-btn light" aria-label="Go back" onClick={() => router.push('/')}>
          <BackIcon />
        </button>
        <button className="round-btn light" aria-label="More options">
          <MoreIcon />
        </button>
      </header>

      <div className="wishlist-view-heading">
        <h1 className="wishlist-view-title">{wishlist?.title ?? '…'}</h1>
        {wishlist ? <p className="wishlist-view-subtitle">{subtitle}</p> : null}
      </div>

      <div className="wishlist-view-stack">
        <ItemCardStack items={items} onOpen={setOpenItem} />
      </div>

      {openItem ? (
        <ItemDetailOverlay item={openItem} onClose={() => setOpenItem(null)} />
      ) : null}

      <div className="wishlist-view-bar">
        <button className="share-btn" onClick={handleShare}>Share</button>
        <Link
          href={`/wishlists/new/items?wishlist=${wishlistId}`}
          className="round-btn dark"
          aria-label="Add item"
        >
          <PlusIcon />
        </Link>
      </div>

      {toast ? <div className="wishlist-toast" role="status">{toast}</div> : null}
    </main>
  );
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${day}${suffix} ${month}`;
}

function ItemDetailOverlay({
  item,
  onClose,
}: {
  item: WishlistItem;
  onClose: () => void;
}) {
  return (
    <div className="item-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="item-overlay-card" onClick={(e) => e.stopPropagation()}>
        <button className="round-btn light item-overlay-close" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
        <div
          className="item-overlay-image"
          style={item.imageDataUrl ? { backgroundImage: `url(${item.imageDataUrl})` } : undefined}
        />
        <div className="item-overlay-body">
          <h2 className="item-overlay-title">{item.title}</h2>
          {item.price ? (
            <p className="item-overlay-price">
              {/^\$/.test(item.price) ? item.price : `$${item.price}`}
            </p>
          ) : null}
          {item.notes ? <p className="item-overlay-notes">{item.notes}</p> : null}
          {item.link ? (
            <a
              className="item-overlay-link"
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              View item
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5 5l8 8M13 5l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="4" r="1.4" fill="currentColor" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" />
      <circle cx="9" cy="14" r="1.4" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
