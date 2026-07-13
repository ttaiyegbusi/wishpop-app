'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, Plus, Pencil, Share2, Trash2 } from 'lucide-react';
import { useWishlists, type DraftWishlist } from '@/components/product/WishlistStore';
import { Toast } from '@/components/ui/Toast';

export default function HomePage() {
  const { ready, wishlists, renameWishlist, deleteWishlist } = useWishlists();
  const [navOpen, setNavOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [renaming, setRenaming] = useState<DraftWishlist | null>(null);
  const [deleting, setDeleting] = useState<DraftWishlist | null>(null);
  const [toast, setToast] = useState('');

  const isEmpty = ready && wishlists.length === 0;

  async function share(w: DraftWishlist) {
    const url = `${window.location.origin}/w/${w.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: w.title, text: `See my wishlist "${w.title}" on WishPop`, url });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied');
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <main className="screen home-screen">
      <header className="home-header">
        <img className="home-logo" src="/assets/wordmark.png" alt="WishPop" />
        <div className="home-header-actions">
          <Link href="/wishlists/new" className="home-new-btn">
            <Plus size={17} strokeWidth={2.6} />
            New wishlist
          </Link>
          <button
            className="home-hamburger"
            aria-label="Menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>
      </header>

      {isEmpty ? (
        <div className="home-empty">
          <img className="home-empty-art" src="/assets/empty-folder.svg" alt="" aria-hidden="true" />
          <p className="home-empty-text">You have no Wishlist</p>
        </div>
      ) : (
        <div className="home-grid-scroll">
          <h1 className="home-heading">Your wishlists</h1>
          <div className="home-grid">
            {wishlists.map((w) => (
              <HomeFolderCard
                key={w.id}
                wishlist={w}
                onOpenMenu={(rect) =>
                  setMenuFor((cur) => (cur?.id === w.id ? null : { id: w.id, rect }))
                }
              />
            ))}
            <Link href="/wishlists/new" className="hf-create-card" aria-label="Create wishlist">
              <span className="hf-create-plus">
                <Plus size={24} strokeWidth={2.4} />
              </span>
              <span className="hf-create-label">New wishlist</span>
            </Link>
          </div>
        </div>
      )}

      <Link href="/wishlists/new" className="home-fab" aria-label="Create wishlist">
        <Plus size={24} strokeWidth={2.4} />
      </Link>

      {menuFor ? (
        <CardMenu
          rect={menuFor.rect}
          onClose={() => setMenuFor(null)}
          onRename={() => {
            const w = wishlists.find((x) => x.id === menuFor.id);
            setMenuFor(null);
            if (w) setRenaming(w);
          }}
          onShare={() => {
            const w = wishlists.find((x) => x.id === menuFor.id);
            setMenuFor(null);
            if (w) share(w);
          }}
          onDelete={() => {
            const w = wishlists.find((x) => x.id === menuFor.id);
            setMenuFor(null);
            if (w) setDeleting(w);
          }}
        />
      ) : null}

      {navOpen ? (
        <NavMenu
          onClose={() => setNavOpen(false)}
          onPick={(label) => {
            setNavOpen(false);
            setToast(`${label} — coming soon`);
          }}
        />
      ) : null}

      {renaming ? (
        <RenameModal
          currentTitle={renaming.title}
          onCancel={() => setRenaming(null)}
          onSave={(name) => {
            renameWishlist(renaming.id, name);
            setRenaming(null);
          }}
        />
      ) : null}

      {deleting ? (
        <DeleteModal
          title={deleting.title}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteWishlist(deleting.id);
            setDeleting(null);
          }}
        />
      ) : null}

      {toast ? (
        <Toast message={toast} onDismiss={() => setToast('')} duration={2200} />
      ) : null}
    </main>
  );
}

function HomeFolderCard({
  wishlist,
  onOpenMenu,
}: {
  wishlist: DraftWishlist;
  onOpenMenu: (rect: DOMRect) => void;
}) {
  const photos = wishlist.items
    .map((it) => it.imageDataUrl)
    .filter((src): src is string => !!src)
    .slice(0, 2);
  const count = wishlist.items.length;

  return (
    <div className="hf-card">
      {/* A Link (not a button) so Next prefetches the detail route as the card
          scrolls into view — tapping a folder then opens it with no round-trip. */}
      <Link
        href={`/wishlists/${wishlist.id}`}
        className="hf-open"
        aria-label={`Open ${wishlist.title}`}
      >
        <img className="hf-back-img" src="/assets/folder-card-back.svg" alt="" aria-hidden="true" />
        <span className="hf-photos" aria-hidden="true">
          {photos.map((src, i) => (
            <span key={i} className="hf-photo" style={{ backgroundImage: `url(${src})` }} />
          ))}
        </span>
        <img className="hf-front-img" src="/assets/folder-card-front.svg" alt="" aria-hidden="true" />
        <span className="hf-front-text">
          <span className="hf-title">{wishlist.title}</span>
          <span className="hf-count">
            {count} item{count === 1 ? '' : 's'}
          </span>
        </span>
      </Link>

      <button
        type="button"
        className="hf-menu-btn"
        aria-label="Folder options"
        onClick={(e) => onOpenMenu(e.currentTarget.getBoundingClientRect())}
      >
        <VDots />
      </button>
    </div>
  );
}

function CardMenu({
  rect,
  onClose,
  onRename,
  onShare,
  onDelete,
}: {
  rect: DOMRect;
  onClose: () => void;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  // Fixed, anchored above and right-aligned to the ⋮ button so it never gets
  // clipped by the scrolling grid.
  // Right-align to the ⋮ button, clamped within the viewport (cards are narrow).
  // Open downward when there's room below, upward otherwise.
  const width = 190;
  const menuH = 150;
  const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
  const openUp = rect.bottom + menuH > window.innerHeight;
  const style = {
    position: 'fixed' as const,
    left,
    right: 'auto' as const,
    ...(openUp
      ? { bottom: window.innerHeight - rect.top + 6, top: 'auto' as const }
      : { top: rect.bottom + 6, bottom: 'auto' as const }),
  };
  return (
    <div className="folder-menu hf-menu" role="menu" ref={ref} style={style}>
      <button className="folder-menu-item" role="menuitem" onClick={onRename}>
        <Pencil size={16} strokeWidth={1.8} />
        Rename folder
      </button>
      <button className="folder-menu-item" role="menuitem" onClick={onShare}>
        <Share2 size={16} strokeWidth={1.8} />
        Share folder
      </button>
      <button className="folder-menu-item is-danger" role="menuitem" onClick={onDelete}>
        <Trash2 size={16} strokeWidth={1.8} />
        Delete folder
      </button>
    </div>
  );
}

function NavMenu({ onClose, onPick }: { onClose: () => void; onPick: (label: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  return (
    <div className="folder-menu home-nav-menu" role="menu" ref={ref}>
      {['Sign up', 'Account', 'How it works', 'Sign out'].map((label) => (
        <button key={label} className="folder-menu-item" role="menuitem" onClick={() => onPick(label)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function RenameModal({
  currentTitle,
  onCancel,
  onSave,
}: {
  currentTitle: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [value, setValue] = useState(currentTitle);
  const canSave = value.trim().length > 0;
  return (
    <div className="folder-modal" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="folder-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="folder-modal-title">Rename folder</h2>
        <input
          className="folder-modal-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Folder name"
          aria-label="Folder name"
          maxLength={60}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSave) onSave(value);
          }}
        />
        <div className="folder-modal-actions">
          <button className="folder-modal-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="folder-modal-btn primary" disabled={!canSave} onClick={() => onSave(value)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="folder-modal" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="folder-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="folder-modal-title">Delete folder?</h2>
        <p className="folder-modal-text">
          “{title}” and all its items will be permanently deleted. This can’t be undone.
        </p>
        <div className="folder-modal-actions">
          <button className="folder-modal-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="folder-modal-btn danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function VDots() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="4" r="1.4" fill="currentColor" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" />
      <circle cx="9" cy="14" r="1.4" fill="currentColor" />
    </svg>
  );
}
