export type Wishlist = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  occasion_date: string | null;
  share_token: string;
  notifications_muted: boolean;
  created_at: string;
  updated_at: string;
};

export type WishlistItem = {
  id: string;
  wishlist_id: string;
  name: string;
  link_url: string;
  price_amount: number | null;
  price_currency: string | null;
  notes: string | null;
  image_url: string | null;
  priority: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
