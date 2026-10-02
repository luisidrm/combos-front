import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip API routes, static files and anything with a file extension
  // (next/image, favicons, manifest, etc).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
