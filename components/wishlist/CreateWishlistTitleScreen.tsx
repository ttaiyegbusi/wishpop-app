'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WishlistFolderPreview } from './WishlistFolderPreview';

const DRAFT_TITLE_KEY = 'wishpop:wishlistDraft:title';

export function CreateWishlistTitleScreen() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  // Height of the on-screen keyboard, so the Next CTA can ride just above it
  // while it's open and drop flush to the bottom once it's dismissed.
  const [keyboardInset, setKeyboardInset] = useState(0);

  const isValid = title.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  function handleNext() {
    if (!isValid) return;
    localStorage.setItem(DRAFT_TITLE_KEY, title.trim());
    router.push('/wishlists/new/items');
  }

  return (
    <main className="create-title-screen">
      <button
        type="button"
        className="screen-backdrop"
        aria-label="Close"
        onClick={() => router.back()}
      />
      <div className="screen-panel">
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
        <span className="create-title-header-spacer" aria-hidden="true" />
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

      <div className="create-title-actions" style={{ bottom: keyboardInset }}>
        <button
          type="button"
          className={`create-title-next ${isValid ? 'is-active' : ''}`}
          disabled={!isValid}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
      </div>
    </main>
  );
}
