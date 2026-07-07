import { PublicWishlistView } from '@/components/wishlist/PublicWishlistView';

export default async function PublicWishlistPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;

  return <PublicWishlistView shareToken={shareToken} />;
}
