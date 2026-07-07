import { Suspense } from 'react';
import { AddItemScreen } from '@/components/wishlist/AddItemScreen';

export default function NewWishlistItemsPage() {
  return (
    <Suspense fallback={null}>
      <AddItemScreen />
    </Suspense>
  );
}
