import { Suspense } from 'react';
import { AddItemScreen } from '@/components/wishlist/AddItemScreen';

// Intercepts a soft navigation to /wishlists/new/items so the add-item flow
// opens as a modal over the current page. A hard load uses the real page.
export default function AddItemModal() {
  return (
    <Suspense fallback={null}>
      <AddItemScreen />
    </Suspense>
  );
}
