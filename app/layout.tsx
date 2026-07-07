import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { WishlistProvider } from '@/components/product/WishlistStore';
import './globals.css';

export const metadata: Metadata = {
  title: 'WishPop',
  description: 'Create wishlists, add the gifts you want, and share one link.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://app.wishpop.online'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* the whole app is the product: store + mobile-first phone frame */}
        <WishlistProvider>
          <div className="app-frame">{children}</div>
        </WishlistProvider>
        <Analytics />
      </body>
    </html>
  );
}
