// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  css: [
    '@astryxdesign/core/reset.css',
    '@astryxdesign/core/astryx.css',
    '~/assets/css/main.css',
    '~/assets/css/dashboard.css',
  ],
  devtools: { enabled: false },

  // Flat component names keep the studio primitives readable: <DashShell>, <StatCard>.
  components: [{ path: '~/components', pathPrefix: false }],
  vite: {
    resolve: {
      dedupe: ['@firebase/app', '@firebase/auth'],
    },
  },

  runtimeConfig: {
    // Private: only the Nitro server can read the database connection string.
    databaseUrl: process.env.DATABASE_URL,
    firebaseServiceAccountJson: '',
    firebaseAuthBaseUrl: '',
    studioAdminEmail: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    public: {
      // Set this to the live domain before launch. Used for canonical, Open Graph and structured data.
      siteUrl: 'https://aaroh.in',
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAC4rn9alNVXDFkbNGCM4vgBD_-aEuMae8',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'aaroh-d9cdb.firebaseapp.com',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || 'aaroh-d9cdb',
      firebaseAppId:
        process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '1:808175931485:web:b56a87cb212b1d8ecbbdb4',
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '808175931485',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#1E40FF' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap',
        },
      ],
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
  },

  // Pages read live catalogue and order data, so render them on the server
  // instead of baking a snapshot into the build.
  nitro: {
    prerender: { crawlLinks: false, routes: [] },
  },
})
