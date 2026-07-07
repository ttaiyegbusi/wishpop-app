'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WishlistFolderPreview } from './WishlistFolderPreview';

const DRAFT_TITLE_KEY = 'wishpop:wishlistDraft:title';

export function CreateWishlistTitleScreen() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');

  const isValid = title.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleNext() {
    if (!isValid) return;
    localStorage.setItem(DRAFT_TITLE_KEY, title.trim());
    router.push('/wishlists/new/items');
  }

  return (
    <main className="create-title-screen">
      <header className="create-title-header">
        <button
          type="button"
          className="create-title-back"
          aria-label="Go back"
          onClick={() => router.back()}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M11 4l-5 5 5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <p className="create-title-heading">Create wishlist folder</p>

        <button
          type="button"
          className={`next-button ${isValid ? 'is-active' : ''}`}
          disabled={!isValid}
          onClick={handleNext}
        >
          Next
        </button>
      </header>

      <form
        className="create-title-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleNext();
        }}
      >
        <WishlistFolderPreview title={title} />

        <input
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Folder name"
          aria-label="Wishlist folder name"
          className="create-title-input"
          maxLength={40}
          autoFocus
          enterKeyHint="next"
          autoComplete="off"
        />
      </form>
    </main>
  );
}
