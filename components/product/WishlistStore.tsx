'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { THEME_COLORS, type ThemeColorId } from '@/lib/product/colors';

// UI-first client store. Persists to localStorage so the create flow feels
// real without a backend. Swap for Supabase-backed server actions later.

export type WishlistItem = {
  id: string;
  title: string;
  imageDataUrl: string | null;
  price: string;
  currency: string;
  link: string;
  notes: string;
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
  addItem: (wishlistId: string, item: Omit<WishlistItem, 'id'>) => void;
  updateItem: (
    wishlistId: string,
    itemId: string,
    patch: Partial<Omit<WishlistItem, 'id'>>,
  ) => void;
  deleteItem: (wishlistId: string, itemId: string) => void;
  renameWishlist: (id: string, title: string) => void;
  deleteWishlist: (id: string) => void;
  getWishlist: (id: string) => DraftWishlist | undefined;
};

const STORAGE_KEY = 'wishpop.wishlists.v1';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

const Ctx = createContext<WishlistStore | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlists, setWishlists] = useState<DraftWishlist[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWishlists(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
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
      return wishlist;
    },
    [wishlists.length],
  );

  const addItem: WishlistStore['addItem'] = useCallback((wishlistId, item) => {
    setWishlists((prev) =>
      prev.map((w) =>
        w.id === wishlistId
          ? { ...w, items: [...w.items, { ...item, id: newId() }] }
          : w,
      ),
    );
  }, []);

  const updateItem: WishlistStore['updateItem'] = useCallback((wishlistId, itemId, patch) => {
    setWishlists((prev) =>
      prev.map((w) =>
        w.id === wishlistId
          ? { ...w, items: w.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
          : w,
      ),
    );
  }, []);

  const deleteItem: WishlistStore['deleteItem'] = useCallback((wishlistId, itemId) => {
    setWishlists((prev) =>
      prev.map((w) =>
        w.id === wishlistId ? { ...w, items: w.items.filter((it) => it.id !== itemId) } : w,
      ),
    );
  }, []);

  const renameWishlist: WishlistStore['renameWishlist'] = useCallback((id, title) => {
    const next = title.trim();
    if (!next) return;
    setWishlists((prev) =>
      prev.map((w) => (w.id === id ? { ...w, title: next } : w)),
    );
  }, []);

  const deleteWishlist: WishlistStore['deleteWishlist'] = useCallback((id) => {
    setWishlists((prev) => prev.filter((w) => w.id !== id));
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
