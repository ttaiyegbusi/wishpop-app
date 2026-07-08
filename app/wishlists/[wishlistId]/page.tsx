'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Share, Pencil, Trash2, Share2 } from 'lucide-react';
import { useWishlists, type WishlistItem } from '@/components/product/WishlistStore';
import { ItemCardStack } from '@/components/wishlist/ItemCardStack';

export default function WishlistDetailPage({
  params,
}: {
  params: Promise<{ wishlistId: string }>;
}) {
  const { wishlistId } = use(params);
  const router = useRouter();
  const { ready, getWishlist, renameWishlist, deleteWishlist } = useWishlists();
  const wishlist = getWishlist(wishlistId);
  const [toast, setToast] = useState('');
  const [openItem, setOpenItem] = useState<WishlistItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      <div className="wishlist-scroll">
        <div className="wishlist-scroll-inner">
          <ItemCardStack items={items} onOpen={setOpenItem} />
        </div>
      </div>

      <div className="wishlist-topbar">
        <header className="wishlist-view-header">
          <button className="round-btn light" aria-label="Go back" onClick={() => router.push('/')}>
            <BackIcon />
          </button>
          <div className="wishlist-view-header-actions">
            <button className="round-btn light" aria-label="Share" onClick={handleShare}>
              <Share size={17} strokeWidth={1.9} />
            </button>
            <div className="folder-menu-wrap">
              <button
                className="round-btn light"
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <MoreIcon />
              </button>
              {menuOpen ? (
                <FolderMenu
                  onClose={() => setMenuOpen(false)}
                  onRename={() => {
                    setMenuOpen(false);
                    setRenaming(true);
                  }}
                  onDelete={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                  onShare={() => {
                    setMenuOpen(false);
                    handleShare();
                  }}
                />
              ) : null}
            </div>
          </div>
        </header>

        <div className="wishlist-view-heading">
          <h1 className="wishlist-view-title">{wishlist?.title ?? '…'}</h1>
          {wishlist ? <p className="wishlist-view-subtitle">{subtitle}</p> : null}
        </div>
      </div>

      {openItem ? (
        <ItemDetailOverlay item={openItem} onClose={() => setOpenItem(null)} />
      ) : null}

      {renaming ? (
        <RenameFolderModal
          currentTitle={wishlist?.title ?? ''}
          onCancel={() => setRenaming(false)}
          onSave={(name) => {
            renameWishlist(wishlistId, name);
            setRenaming(false);
          }}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDeleteModal
          title={wishlist?.title ?? ''}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteWishlist(wishlistId);
            router.push('/');
          }}
        />
      ) : null}

      <div className="wishlist-view-bar">
        <button className="done-btn" onClick={() => router.push('/')}>Done</button>
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

function FolderMenu({
  onClose,
  onRename,
  onDelete,
  onShare,
}: {
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  return (
    <div className="folder-menu" role="menu" ref={ref}>
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

function RenameFolderModal({
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
          <button
            className="folder-modal-btn primary"
            disabled={!canSave}
            onClick={() => onSave(value)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
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
              {`${item.currency ?? ''} ${item.price}`.trim()}
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
