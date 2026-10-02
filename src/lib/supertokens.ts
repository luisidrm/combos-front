import SuperTokens from 'supertokens-web-js';
import EmailPassword from 'supertokens-web-js/recipe/emailpassword';
import Session from 'supertokens-web-js/recipe/session';

// Guarded for SSR: Next.js renders "use client" components once on the
// server too, and the web-js SDK touches `window` immediately on init.
if (typeof window !== 'undefined') {
  SuperTokens.init({
    appInfo: {
      appName: 'Combo Shop',
      apiDomain: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',
      apiBasePath: '/auth',
    },
    recipeList: [EmailPassword.init(), Session.init()],
  });
}
