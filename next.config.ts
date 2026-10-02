import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    // In development the pictures come from MinIO on 127.0.0.1, which Next refuses to fetch by default
    // (it blocks private addresses to stop server-side request forgery). Production reads a public CDN.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    // Product/tenant picture derivatives are served from MinIO (dev) or the
    // media CDN (prod) — a different host than the app itself, so next/image
    // needs it allow-listed. Both envs read the same origin the API hands
    // back in picture URLs.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_MEDIA_HOSTNAME || 'media.example.com',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
