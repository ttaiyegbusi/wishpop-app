'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ImagePlus } from 'lucide-react';
import { useWishlists } from '@/components/product/WishlistStore';
import { fileToDownscaledDataUrl } from '@/lib/product/image';

const DRAFT_TITLE_KEY = 'wishpop:wishlistDraft:title';

export function AddItemScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, getWishlist, createWishlist, addItem } = useWishlists();

  // Adding to an existing wishlist (?wishlist=id) or starting one from the draft.
  const existingId = params.get('wishlist');
  const existing = existingId ? getWishlist(existingId) : undefined;

  const [headerTitle, setHeaderTitle] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing) {
      setHeaderTitle(existing.title);
    } else {
      setHeaderTitle(localStorage.getItem(DRAFT_TITLE_KEY) ?? 'New wishlist');
    }
  }, [existing]);

  const isValid = image !== null && title.trim().length > 0;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImage(await fileToDownscaledDataUrl(file));
    } catch {
      /* ignore unreadable files */
    } finally {
      e.target.value = '';
    }
  }

  function handleNext() {
    if (!isValid || !ready) return;

    let wishlistId = existing?.id;
    if (!wishlistId) {
      const draftTitle = localStorage.getItem(DRAFT_TITLE_KEY) ?? 'New wishlist';
      wishlistId = createWishlist({ title: draftTitle }).id;
      localStorage.removeItem(DRAFT_TITLE_KEY);
    }

    addItem(wishlistId, {
      title: title.trim(),
      imageDataUrl: image,
      price: price.trim(),
      link: link.trim(),
      notes: notes.trim(),
    });

    router.push(`/wishlists/${wishlistId}`);
  }

  return (
    <main className="add-item-screen">
      <header className="add-item-header">
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
        <p className="add-item-heading">{headerTitle}</p>
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
        className="add-item-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <button
          type="button"
          className={`item-image ${image ? 'has-image' : ''}`}
          onClick={() => fileRef.current?.click()}
          aria-label="Add item image"
          style={image ? { backgroundImage: `url(${image})` } : undefined}
        >
          <span className="item-image-badge" aria-hidden="true">
            <ImagePlus size={16} strokeWidth={1.8} color="#171717" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={onPickFile}
        />

        <input
          className="item-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a Title"
          aria-label="Item title"
          maxLength={80}
          autoComplete="off"
        />

        <div className="item-fields">
          <label className="item-field">
            <span className="item-field-label">$ Price</span>
            <input
              className="item-field-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Add a Price"
              inputMode="decimal"
              aria-label="Price"
            />
          </label>
          <label className="item-field">
            <span className="item-field-label">Link</span>
            <input
              className="item-field-input"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Add a Link"
              inputMode="url"
              aria-label="Link"
            />
          </label>
          <label className="item-field">
            <span className="item-field-label">Notes</span>
            <input
              className="item-field-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write something"
              aria-label="Notes"
            />
          </label>
        </div>
      </form>
    </main>
  );
}
