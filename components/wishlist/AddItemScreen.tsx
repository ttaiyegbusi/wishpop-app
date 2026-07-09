'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ImagePlus, TriangleAlert, ChevronDown } from 'lucide-react';
import { useWishlists } from '@/components/product/WishlistStore';
import { fileToDownscaledDataUrl } from '@/lib/product/image';
import { uploadImage } from '@/actions/image.actions';

const DRAFT_TITLE_KEY = 'wishpop:wishlistDraft:title';
const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'CAD'];

export function AddItemScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, getWishlist, createWishlist, addItem, updateItem } = useWishlists();

  // Adding to an existing wishlist (?wishlist=id) or starting one from the draft.
  const existingId = params.get('wishlist');
  const existing = existingId ? getWishlist(existingId) : undefined;

  // Editing an existing item (?item=id): pre-fill the form and save in place.
  const editItemId = params.get('item');
  const editItem = editItemId ? existing?.items.find((it) => it.id === editItemId) : undefined;

  const [headerTitle, setHeaderTitle] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    if (existing) {
      setHeaderTitle(existing.title);
    } else {
      setHeaderTitle(localStorage.getItem(DRAFT_TITLE_KEY) ?? 'New wishlist');
    }
  }, [existing]);

  // Pre-fill the form once when editing an existing item.
  useEffect(() => {
    if (!editItem || prefilled.current) return;
    prefilled.current = true;
    setImage(editItem.imageDataUrl);
    setTitle(editItem.title);
    setPrice(editItem.price);
    setCurrency(editItem.currency ?? 'NGN');
    setLink(editItem.link);
    setNotes(editItem.notes);
  }, [editItem]);

  // Keep the Next CTA above the keyboard while it's open (see folder screen).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setKeyboardInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const linkInvalid = link.trim().length > 0 && !isValidUrl(link);
  // Any content lets the user proceed; an invalid link only warns.
  const isValid =
    image !== null ||
    title.trim().length > 0 ||
    price.trim().length > 0 ||
    link.trim().length > 0 ||
    notes.trim().length > 0;

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

  async function handleNext() {
    if (!isValid || !ready || saving) return;
    setSaving(true);

    // Move a freshly-picked image into Storage (returns a URL); keep the inline
    // data URL when the backend isn't configured or the upload fails.
    let imageValue = image;
    if (image && image.startsWith('data:')) {
      imageValue = (await uploadImage(image)) ?? image;
    }

    // Editing in place: save changes and return to the wishlist.
    if (existing && editItem) {
      updateItem(existing.id, editItem.id, {
        title: title.trim(),
        imageDataUrl: imageValue,
        price: price.trim(),
        currency,
        link: link.trim(),
        notes: notes.trim(),
      });
      router.push(`/wishlists/${existing.id}`);
      return;
    }

    let wishlistId = existing?.id;
    if (!wishlistId) {
      const draftTitle = localStorage.getItem(DRAFT_TITLE_KEY) ?? 'New wishlist';
      wishlistId = createWishlist({ title: draftTitle }).id;
      localStorage.removeItem(DRAFT_TITLE_KEY);
    }

    const newItemId = addItem(wishlistId, {
      title: title.trim(),
      imageDataUrl: imageValue,
      price: price.trim(),
      currency,
      link: link.trim(),
      notes: notes.trim(),
    });

    // Signal the "New Item added" toast to the wishlist view without touching
    // the URL (manual history edits desync the App Router).
    sessionStorage.setItem('wishpop:justAddedItem', newItemId);
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
        <span className="create-title-header-spacer" aria-hidden="true" />
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
          placeholder="Item name"
          aria-label="Item name"
          maxLength={80}
          autoComplete="off"
        />

        <div className="item-fields">
          {/* price + currency */}
          <div className="add-field add-field--price">
            <label className="add-field-main">
              <span className="add-field-label">Add a Price</span>
              <input
                className="add-field-input"
                value={price}
                onChange={(e) => setPrice(formatPrice(e.target.value))}
                placeholder="0"
                inputMode="numeric"
                aria-label="Price"
              />
            </label>
            <div className="currency-picker">
              <select
                className="currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} strokeWidth={2} className="currency-chevron" aria-hidden="true" />
            </div>
          </div>

          {/* link */}
          <label className={`add-field ${linkInvalid ? 'is-invalid' : ''}`}>
            <span className="add-field-label">Add a Link</span>
            <input
              className="add-field-input"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://"
              inputMode="url"
              aria-label="Link"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          {linkInvalid ? (
            <p className="add-field-error" role="alert">
              <TriangleAlert size={15} strokeWidth={2} />
              Invalid URL Link
            </p>
          ) : null}

          {/* notes */}
          <label className="add-field add-field--notes">
            <span className="add-field-label">Notes</span>
            <textarea
              className="add-field-input add-field-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write something"
              aria-label="Notes"
              rows={2}
            />
          </label>
        </div>
      </form>

      <div className="create-title-actions" style={{ bottom: keyboardInset }}>
        <button
          type="button"
          className={`create-title-next ${isValid ? 'is-active' : ''}`}
          disabled={!isValid || saving}
          onClick={handleNext}
        >
          {saving ? 'Saving…' : editItem ? 'Save' : 'Next'}
        </button>
      </div>
    </main>
  );
}

// Keep only digits and group with commas as the user types.
function formatPrice(raw: string) {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString('en-US') : '';
}

// Empty is treated as valid (not an error); otherwise require a parseable
// URL with a dotted hostname, tolerating a missing scheme.
function isValidUrl(value: string) {
  const s = value.trim();
  if (!s) return true;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.hostname.includes('.') && !u.hostname.startsWith('.') && !u.hostname.endsWith('.');
  } catch {
    return false;
  }
}
