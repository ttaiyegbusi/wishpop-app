'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlists } from '@/components/product/WishlistStore';
import { getThemeColor } from '@/lib/product/colors';

type Filter = 'all' | 'reserved' | 'unreserved';

export default function HomePage() {
  const { ready, wishlists } = useWishlists();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const isEmpty = ready && wishlists.length === 0;

  return (
    <main className="screen home-screen">
      <header className="home-header">
        <h1 className="home-title">Home</h1>
        <Link href="/wishlists/new" className="icon-btn" aria-label="Create wishlist">
          <PlusIcon />
        </Link>
      </header>

      <div className="filter-tabs" role="tablist" aria-label="Filter wishlists">
        {(['all', 'reserved', 'unreserved'] as Filter[]).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`filter-tab ${filter === key ? 'is-active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'All' : key === 'reserved' ? 'Reserved' : 'Unreserved'}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="home-empty">
          <img
            className="home-empty-art"
            src="/assets/hero-folders-mobile.svg"
            alt=""
            aria-hidden="true"
          />
          <p className="home-empty-text">You have no Wishlist</p>
          <button className="btn btn-block" onClick={() => router.push('/wishlists/new')}>
            Create Wishlist
          </button>
        </div>
      ) : (
        <ul className="wishlist-list">
          {wishlists.map((w) => {
            const theme = getThemeColor(w.color);
            return (
              <li key={w.id}>
                <Link
                  href={`/wishlists/${w.id}`}
                  className="wishlist-card"
                  style={{ background: theme.bg }}
                >
                  <span className="wishlist-card-title">{w.title}</span>
                  <span className="wishlist-card-count">
                    {w.items.length} {w.items.length === 1 ? 'item' : 'items'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
