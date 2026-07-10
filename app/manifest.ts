import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WishPop',
    short_name: 'WishPop',
    description: 'Create wishlists, add the gifts you want, and share one link.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F7F7',
    theme_color: '#F7F7F7',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
