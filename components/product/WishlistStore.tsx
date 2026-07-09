'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { THEME_COLORS, type ThemeColorId } from '@/lib/product/colors';
import {
  backendConfigured,
  deleteWishlistCloud,
  fetchOwnerWishlists,
  pushWishlist,
} from '@/actions/wishlist.actions';

// UI-first client store. Persists to localStorage so the create flow feels
// real without a backend. Swap for Supabase-backed server actions later.

export type Reservation = {
  email: string;
  createdAt: number;
};

export type WishlistItem = {
  id: string;
  title: string;
  imageDataUrl: string | null;
  price: string;
  currency: string;
  link: string;
  notes: string;
  reservation?: Reservation | null;
};

export type DraftWishlist = {
  id: string;
  title: string;
  color: ThemeColorId;
  items: WishlistItem[];
  createdAt: number;
};

type WishlistStore = {
  ready: boolean;
  wishlists: DraftWishlist[];
  createWishlist: (input: { title: string; color?: ThemeColorId }) => DraftWishlist;
  addItem: (wishlistId: string, item: Omit<WishlistItem, 'id'>) => string;
  updateItem: (
    wishlistId: string,
    itemId: string,
    patch: Partial<Omit<WishlistItem, 'id'>>,
  ) => void;
  deleteItem: (wishlistId: string, itemId: string) => void;
  reserveItem: (wishlistId: string, itemId: string, email: string) => void;
  unreserveItem: (wishlistId: string, itemId: string) => void;
  renameWishlist: (id: string, title: string) => void;
  deleteWishlist: (id: string) => void;
  getWishlist: (id: string) => DraftWishlist | undefined;
};

const STORAGE_KEY = 'wishpop.wishlists.v1';
const OWNER_KEY_KEY = 'wishpop.ownerKey';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

// Per-device secret proving ownership of the wishlists this device created.
function getOwnerKey() {
  let key = localStorage.getItem(OWNER_KEY_KEY);
  if (!key) {
    key = newId();
    localStorage.setItem(OWNER_KEY_KEY, key);
  }
  return key;
}

const Ctx = createContext<WishlistStore | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlists, setWishlists] = useState<DraftWishlist[]>([]);
  const [ready, setReady] = useState(false);

  // Cloud-sync plumbing: owner key, whether Supabase is configured, and a live
  // ref to the wishlists so mutations can push the affected one after render.
  const ownerKeyRef = useRef('');
  const cloudRef = useRef(false);
  const wishlistsRef = useRef<DraftWishlist[]>([]);
  const pendingSync = useRef<Set<string>>(new Set());
  // Per-wishlist promise chain: pushes for the same wishlist run strictly one
  // after another, so an in-flight push can never race a later one and wipe a
  // just-added item (which was losing items on slower networks).
  const pushChain = useRef<Map<string, Promise<void>>>(new Map());
  wishlistsRef.current = wishlists;

  // Push a wishlist to the cloud after the current render commits, coalescing
  // multiple calls for the same id into one push of the final state, and
  // serialising pushes per wishlist so they never overlap.
  const syncWishlist = useCallback((id: string) => {
    if (!cloudRef.current || !ownerKeyRef.current) return;
    if (pendingSync.current.has(id)) return;
    pendingSync.current.add(id);
    setTimeout(() => {
      pendingSync.current.delete(id);
      const wl = wishlistsRef.current.find((w) => w.id === id);
      if (!wl) return;
      const prev = pushChain.current.get(id) ?? Promise.resolve();
      const next = prev
        .catch(() => {})
        .then(() => pushWishlist(ownerKeyRef.current, wl));
      pushChain.current.set(id, next);
    }, 0);
  }, []);

  useEffect(() => {
    ownerKeyRef.current = getOwnerKey();
    let cached: DraftWishlist[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) cached = JSON.parse(raw);
    } catch {
      /* ignore corrupt storage */
    }
    setWishlists(cached);

    // If the backend is configured, cloud is the source of truth: load the
    // owner's wishlists and replace the local cache. Otherwise stay local-only.
    (async () => {
      try {
        if (await backendConfigured()) {
          cloudRef.current = true;
          const cloud = await fetchOwnerWishlists(ownerKeyRef.current);
          if (cloud) setWishlists(cloud);
        }
      } catch {
        /* offline / not configured — keep the local cache */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlists));
    } catch {
      /* ignore quota errors (images can be large) */
    }
  }, [wishlists, ready]);

  const createWishlist: WishlistStore['createWishlist'] = useCallback(
    ({ title, color }) => {
      const wishlist: DraftWishlist = {
        id: newId(),
        title: title.trim(),
        // rotate palette so Home cards stay visually varied
        color: color ?? THEME_COLORS[wishlists.length % THEME_COLORS.length].id,
        items: [],
        createdAt: Date.now(),
      };
      setWishlists((prev) => [wishlist, ...prev]);
      syncWishlist(wishlist.id);
      return wishlist;
    },
    [wishlists.length, syncWishlist],
  );

  const addItem: WishlistStore['addItem'] = useCallback(
    (wishlistId, item) => {
      const id = newId();
      setWishlists((prev) =>
        prev.map((w) =>
          w.id === wishlistId ? { ...w, items: [...w.items, { ...item, id }] } : w,
        ),
      );
      syncWishlist(wishlistId);
      return id;
    },
    [syncWishlist],
  );

  const updateItem: WishlistStore['updateItem'] = useCallback(
    (wishlistId, itemId, patch) => {
      setWishlists((prev) =>
        prev.map((w) =>
          w.id === wishlistId
            ? { ...w, items: w.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
            : w,
        ),
      );
      syncWishlist(wishlistId);
    },
    [syncWishlist],
  );

  const deleteItem: WishlistStore['deleteItem'] = useCallback(
    (wishlistId, itemId) => {
      setWishlists((prev) =>
        prev.map((w) =>
          w.id === wishlistId ? { ...w, items: w.items.filter((it) => it.id !== itemId) } : w,
        ),
      );
      syncWishlist(wishlistId);
    },
    [syncWishlist],
  );

  const reserveItem: WishlistStore['reserveItem'] = useCallback((wishlistId, itemId, email) => {
    setWishlists((prev) =>
      prev.map((w) =>
        w.id === wishlistId
          ? {
              ...w,
              items: w.items.map((it) =>
                it.id === itemId
                  ? { ...it, reservation: { email: email.trim(), createdAt: Date.now() } }
                  : it,
              ),
            }
          : w,
      ),
    );
  }, []);

  const unreserveItem: WishlistStore['unreserveItem'] = useCallback((wishlistId, itemId) => {
    setWishlists((prev) =>
      prev.map((w) =>
        w.id === wishlistId
          ? {
              ...w,
              items: w.items.map((it) => (it.id === itemId ? { ...it, reservation: null } : it)),
            }
          : w,
      ),
    );
  }, []);

  const renameWishlist: WishlistStore['renameWishlist'] = useCallback(
    (id, title) => {
      const next = title.trim();
      if (!next) return;
      setWishlists((prev) => prev.map((w) => (w.id === id ? { ...w, title: next } : w)));
      syncWishlist(id);
    },
    [syncWishlist],
  );

  const deleteWishlist: WishlistStore['deleteWishlist'] = useCallback((id) => {
    setWishlists((prev) => prev.filter((w) => w.id !== id));
    if (cloudRef.current && ownerKeyRef.current) void deleteWishlistCloud(ownerKeyRef.current, id);
  }, []);

  const getWishlist = useCallback(
    (id: string) => wishlists.find((w) => w.id === id),
    [wishlists],
  );

  return (
    <Ctx.Provider
      value={{
        ready,
        wishlists,
        createWishlist,
        addItem,
        updateItem,
        deleteItem,
        reserveItem,
        unreserveItem,
        renameWishlist,
        deleteWishlist,
        getWishlist,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWishlists(): WishlistStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWishlists must be used within WishlistProvider');
  return ctx;
}
