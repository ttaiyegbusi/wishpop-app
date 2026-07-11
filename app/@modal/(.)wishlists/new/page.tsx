import { CreateWishlistTitleScreen } from '@/components/wishlist/CreateWishlistTitleScreen';

// Intercepts a soft navigation to /wishlists/new so it opens as a modal over
// the current page (e.g. the home). A hard load falls through to the real page.
export default function CreateWishlistModal() {
  return <CreateWishlistTitleScreen />;
}
