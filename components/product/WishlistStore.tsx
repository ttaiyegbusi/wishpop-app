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

// Cloud sync goes through /api/sync with plain fetches, NOT server actions:
// pending server actions serialize with router navigations, so sync calls
// fired around a save/delete blocked the following navigation for seconds on
// slow connections (the stuck "Saving…" bug).
async function syncFetch(op: 'push' | 'delete', ownerKey: string, payload: object): Promise<void> {
  await fetch('/api/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ op, ownerKey, ...payload }),
  });
}

// Merge the cloud snapshot into the current local state at startup. The app is
// interactive from the local cache immediately (no blocking on the network), so
// the cloud response can land after the user has already created or edited a
// wishlist. Cloud is authoritative for anything untouched this session; ids in
// `dirty` (created/edited/deleted locally in the load window) keep the local
// version so a slow response can't clobber — or resurrect — them.
function reconcileWithCloud(
  cloud: DraftWishlist[],
  local: DraftWishlist[],
  dirty: Set<string>,
): DraftWishlist[] {
  const localById = new Map(local.map((w) => [w.id, w]));
  const cloudIds = new Set(cloud.map((w) => w.id));
  const result: DraftWishlist[] = [];

  for (const cw of cloud) {
    if (!dirty.has(cw.id)) {
      result.push(cw);
      continue;
    }
    const lw = localById.get(cw.id);
    if (lw) result.push(lw); // edited locally this session — local is newer
    // else: deleted locally this session — drop it
  }
  // Keep wishlists created locally this session that the cloud hasn't caught up
  // to yet (their push may still be in flight).
  for (const lw of local) {
    if (!cloudIds.has(lw.id) && dirty.has(lw.id)) result.push(lw);
  }
  return result.sort((a, b) => b.createdAt - a.createdAt);
}

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
  createWishlist: (input: { title: string; color?: ThemeColorId; id?: string }) => DraftWishlist;
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
  // The most recently added item, so the wishlist detail can show its
  // "New Item added" toast even when it's just revealed (modal closed)
  // rather than freshly mounted.
  justAdded: { wishlistId: string; itemId: string } | null;
  flagItemAdded: (wishlistId: string, itemId: string) => void;
  clearJustAdded: () => void;
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
  const [justAdded, setJustAdded] = useState<{ wishlistId: string; itemId: string } | null>(null);

  const flagItemAdded = useCallback((wishlistId: string, itemId: string) => {
    setJustAdded({ wishlistId, itemId });
  }, []);
  const clearJustAdded = useCallback(() => setJustAdded(null), []);

  // Cloud-sync plumbing: owner key and a live ref to the wishlists so mutations
  // can push the affected one after render.
  const ownerKeyRef = useRef('');
  const wishlistsRef = useRef<DraftWishlist[]>([]);
  const pendingSync = useRef<Set<string>>(new Set());
  // Ids created/edited/deleted locally before the startup cloud reconcile lands,
  // so the merge keeps the local version rather than a stale cloud one.
  const locallyDirtyRef = useRef<Set<string>>(new Set());
  // Per-wishlist promise chain: pushes for the same wishlist run strictly one
  // after another, so an in-flight push can never race a later one and wipe a
  // just-added item (which was losing items on slower networks).
  const pushChain = useRef<Map<string, Promise<void>>>(new Map());
  wishlistsRef.current = wishlists;

  // Push a wishlist to the cloud after the current render commits, coalescing
  // multiple calls for the same id into one push of the final state, and
  // serialising pushes per wishlist so they never overlap.
  const syncWishlist = useCallback((id: string) => {
    // Always attempt the push (no local "is cloud configured" gate): the store
    // is now interactive before the config probe resolves, and the server
    // no-ops the push when the backend isn't configured. This is what lets a
    // wishlist created in the first second still reach the cloud.
    if (!ownerKeyRef.current) return;
    if (pendingSync.current.has(id)) return;
    pendingSync.current.add(id);
    setTimeout(() => {
      pendingSync.current.delete(id);
      const wl = wishlistsRef.current.find((w) => w.id === id);
      if (!wl) return;
      // Strip inline base64 images from the push: they're hundreds of KB each
      // and the same bytes are already travelling via uploadImage, which swaps
      // in the Storage URL and triggers a (tiny) follow-up push. Sending them
      // inline too doubled the upload and starved the save-time navigation on
      // slow connections.
      const payload: DraftWishlist = {
        ...wl,
        items: wl.items.map((it) =>
          it.imageDataUrl?.startsWith('data:') ? { ...it, imageDataUrl: null } : it,
        ),
      };
      const prev = pushChain.current.get(id) ?? Promise.resolve();
      const next = prev
        .catch(() => {})
        .then(() => syncFetch('push', ownerKeyRef.current, { wishlist: payload }));
      pushChain.current.set(id, next);
    }, 0);
  }, []);

  // Pull the latest cloud state and merge it in (not replace), so a slow
  // response can't wipe work done meanwhile. Reused for the initial load and for
  // refreshing when the page regains focus (picks up reservations and any
  // cross-device edits). Throttled so focus + visibilitychange don't double-fire.
  const lastSyncRef = useRef(0);
  const syncFromCloud = useCallback(async () => {
    if (!ownerKeyRef.current) return;
    const now = Date.now();
    if (now - lastSyncRef.current < 2000) return;
    lastSyncRef.current = now;
    try {
      const res = await fetch(`/api/sync?ownerKey=${encodeURIComponent(ownerKeyRef.current)}`);
      const json = res.ok ? await res.json() : null;
      if (json?.configured && json.wishlists) {
        setWishlists((local) =>
          reconcileWithCloud(json.wishlists, local, locallyDirtyRef.current),
        );
      }
    } catch {
      /* offline / not configured — keep the local cache */
    }
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
    // Local-first: the app is usable from the cache immediately — no blocking
    // on the network round-trip (which was the multi-second "Loading…" gate).
    setReady(true);
    void syncFromCloud();
  }, [syncFromCloud]);

  // Refresh from the cloud when the user comes back to the tab/app, so a
  // reservation (or a change from another device) shows up without a reload.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncFromCloud();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [syncFromCloud]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlists));
    } catch {
      /* ignore quota errors (images can be large) */
    }
  }, [wishlists, ready]);

  const createWishlist: WishlistStore['createWishlist'] = useCallback(
    ({ title, color, id }) => {
      const wishlist: DraftWishlist = {
        // Callers may pre-generate the id so the detail route can be prefetched
        // while the user is still filling the form (see AddItemScreen).
        id: id ?? newId(),
        title: title.trim(),
        // rotate palette so Home cards stay visually varied
        color: color ?? THEME_COLORS[wishlists.length % THEME_COLORS.length].id,
        items: [],
        createdAt: Date.now(),
      };
      locallyDirtyRef.current.add(wishlist.id);
      setWishlists((prev) => [wishlist, ...prev]);
      syncWishlist(wishlist.id);
      return wishlist;
    },
    [wishlists.length, syncWishlist],
  );

  const addItem: WishlistStore['addItem'] = useCallback(
    (wishlistId, item) => {
      const id = newId();
      locallyDirtyRef.current.add(wishlistId);
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
      locallyDirtyRef.current.add(wishlistId);
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
      locallyDirtyRef.current.add(wishlistId);
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
      locallyDirtyRef.current.add(id);
      setWishlists((prev) => prev.map((w) => (w.id === id ? { ...w, title: next } : w)));
      syncWishlist(id);
    },
    [syncWishlist],
  );

  const deleteWishlist: WishlistStore['deleteWishlist'] = useCallback((id) => {
    locallyDirtyRef.current.add(id);
    setWishlists((prev) => prev.filter((w) => w.id !== id));
    if (ownerKeyRef.current) void syncFetch('delete', ownerKeyRef.current, { id });
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
        justAdded,
        flagItemAdded,
        clearJustAdded,
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
