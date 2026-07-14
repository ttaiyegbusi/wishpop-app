import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '@/components/product/AuthProvider';
import { WishlistProvider } from '@/components/product/WishlistStore';
import './globals.css';

// Self-hosted so the font ships from our own domain (no render-blocking
// third-party request to Google Fonts). Variable weight axis covers 400-800.
const baloo = localFont({
  src: './fonts/Baloo2-VariableFont_wght.ttf',
  variable: '--font-baloo',
  weight: '400 800',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'WishPop',
  description: 'Create wishlists, add the gifts you want, and share one link.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://app.wishpop.online'),
  manifest: '/manifest.webmanifest',
  applicationName: 'WishPop',
  appleWebApp: {
    capable: true,
    title: 'WishPop',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

// viewport-fit=cover for the notch; interactiveWidget=resizes-content makes the
// layout (and our keyboard-aware CTAs) resize when the on-screen keyboard opens.
export const viewport: Viewport = {
  themeColor: '#F7F7F7',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="en" className={baloo.variable}>
      <body>
        {/* the whole app is the product: store + mobile-first phone frame.
            `modal` is the intercepting-route slot (create / add-item) that
            overlays the current page. */}
        <AuthProvider>
          <WishlistProvider>
            <div className="app-frame">
              {children}
              {modal}
            </div>
          </WishlistProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
