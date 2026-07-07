'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlists } from '@/components/product/WishlistStore';
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

      <h1 className="wishlist-view-title">{wishlist?.title ?? '…'}</h1>

      <div className="wishlist-view-stack">
        <ItemCardStack items={wishlist?.items ?? []} />
      </div>

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
