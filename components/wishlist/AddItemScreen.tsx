'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ImagePlus, TriangleAlert, ChevronDown } from 'lucide-react';
import { useWishlists } from '@/components/product/WishlistStore';
import { fileToDownscaledDataUrl } from '@/lib/product/image';

const DRAFT_TITLE_KEY = 'wishpop:wishlistDraft:title';
const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'CAD'];

const ITEMS_ROUTE = '/wishlists/new/items';

export function AddItemScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const { ready, getWishlist, createWishlist, addItem, updateItem, flagItemAdded } =
    useWishlists();

  // This add/edit form is rendered in the intercepting @modal slot. After a
  // brand-new wishlist's first item is saved we push to its detail, but Next
  // keeps this slot's instance mounted rather than resolving it to default.tsx.
  // So drive visibility off the live pathname (not a one-way flag, which would
  // leave the instance stuck-hidden and blank on the next open) — the modal
  // shows only while we're on the items route.
  const onItemsRoute = pathname === ITEMS_ROUTE;

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
  const [keyboardInset, setKeyboardInset] = useState(0);
  // True from the first Next tap until the navigation away completes. The
  // route transition to the new wishlist's detail is network-bound (seconds on
  // a slow phone), and this form stays on screen the whole time — without the
  // guard every extra tap re-ran the save and created a duplicate wishlist.
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const prefilled = useRef(false);
  // Synchronous twin of `saving`: state updates flush async, so two taps in
  // the same tick could both pass a state-only check.
  const savingRef = useRef(false);
  // Brand-new path: the wishlist id is generated up front so the detail route
  // can be prefetched while the user fills the form — otherwise the post-save
  // router.push pays a full server render (plus cold start) right when the
  // user is watching "Saving…".
  const draftWishlistIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (existingId || !onItemsRoute) return;
    if (!draftWishlistIdRef.current) {
      draftWishlistIdRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(16).slice(2);
    }
    router.prefetch(`/wishlists/${draftWishlistIdRef.current}`);
  }, [existingId, onItemsRoute, router]);

  // When we navigate away (the slot lingers), clear the form so that if Next
  // reuses this instance for a later open it starts blank; resetting `prefilled`
  // lets a subsequent edit re-populate correctly.
  useEffect(() => {
    if (onItemsRoute) return;
    prefilled.current = false;
    savingRef.current = false;
    // Next open must mint a fresh id — reusing this one would collide with the
    // wishlist just created.
    draftWishlistIdRef.current = null;
    setSaving(false);
    setImage(null);
    setTitle('');
    setPrice('');
    setCurrency('NGN');
    setLink('');
    setNotes('');
  }, [onItemsRoute]);

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

  // Upload a freshly-picked image to Storage in the background and swap the
  // item's inline data URL for the returned URL. Uses a plain fetch to the
  // upload route, NOT a server action: pending server actions serialize with
  // router navigations, so an action here held the post-save navigation (and
  // its "Saving…" state) hostage until the whole upload finished. Binary body
  // is also ~25% smaller than the base64 form.
  function uploadInBackground(wishlistId: string, itemId: string, dataUrl: string) {
    const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
    if (!match) return;
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    fetch('/api/upload', {
      method: 'POST',
      headers: { 'content-type': match[1] },
      body: bytes,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.ok && json.url) updateItem(wishlistId, itemId, { imageDataUrl: json.url });
      })
      .catch(() => {
        /* keep the inline data URL */
      });
  }

  function handleNext() {
    if (!isValid || !ready || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const hasNewImage = !!image && image.startsWith('data:');

    // Editing in place: save and just close the modal — the wishlist's detail
    // is the page behind it and re-renders with the change instantly.
    if (existing && editItem) {
      updateItem(existing.id, editItem.id, {
        title: title.trim(),
        imageDataUrl: image,
        price: price.trim(),
        currency,
        link: link.trim(),
        notes: notes.trim(),
      });
      if (hasNewImage) uploadInBackground(existing.id, editItem.id, image!);
      router.back();
      return;
    }

    let wishlistId = existing?.id;
    if (!wishlistId) {
      const draftTitle = localStorage.getItem(DRAFT_TITLE_KEY) ?? 'New wishlist';
      // Reuse the prefetched id (see above) so the push below hits the
      // already-warmed route.
      wishlistId = createWishlist({
        title: draftTitle,
        id: draftWishlistIdRef.current ?? undefined,
      }).id;
      localStorage.removeItem(DRAFT_TITLE_KEY);
    }

    const newItemId = addItem(wishlistId, {
      title: title.trim(),
      imageDataUrl: image,
      price: price.trim(),
      currency,
      link: link.trim(),
      notes: notes.trim(),
    });

    if (hasNewImage) uploadInBackground(wishlistId, newItemId, image!);

    // Flag through the store so the detail shows the "New Item added" toast
    // whether it re-mounts (new wishlist) or is just revealed (modal closed).
    flagItemAdded(wishlistId, newItemId);

    if (existing) {
      // Adding to an existing wishlist: its detail is behind this modal, so
      // just close the modal to reveal it (instant — no navigation/fetch).
      router.back();
    } else {
      // Brand-new wishlist: soft-push to its detail (which renders in the page
      // slot behind this modal). A soft push keeps the store mounted so the
      // just-created wishlist's deferred localStorage/cloud writes still land (a
      // hard reload would race and lose them). Once the pathname changes off the
      // items route, `onItemsRoute` hides this modal so the detail shows through.
      router.push(`/wishlists/${wishlistId}`);
    }
  }

  // Only render while on the items route; otherwise this lingering slot instance
  // would cover the page behind it (see onItemsRoute above).
  if (!onItemsRoute) return null;

  return (
    <main className="add-item-screen">
      <button
        type="button"
        className="screen-backdrop"
        aria-label="Close"
        onClick={() => router.back()}
      />
      <div className="screen-panel">
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
        {/* Gate on store readiness and the in-flight save: handleNext ignores
            taps in both states, so the CTA must not look active (otherwise
            "Next" appears to silently do nothing on slow connections, and
            repeat taps while the route transition is pending would duplicate
            the save). */}
        <button
          type="button"
          className={`create-title-next ${isValid && ready && !saving ? 'is-active' : ''}`}
          disabled={!isValid || !ready || saving}
          onClick={handleNext}
        >
          {saving ? 'Saving…' : !ready ? 'Loading…' : editItem ? 'Save' : 'Next'}
        </button>
      </div>
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
