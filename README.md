# AAROH. site

Vue 3 on Nuxt 3, with a Three.js clothes rail and a Neon-backed studio. Catalogue, orders and settings are stored in PostgreSQL and read on the server, so the storefront and dashboard always show live data.

## Run it

    npm install
    npm run dev        # local preview at http://localhost:3000
    npm run build      # production server bundle in .output
    npm run start      # serve the built site

Copy `.env.example` to `.env` and fill in `DATABASE_URL` before starting the studio. The schema is created automatically on first request; the store starts empty and only holds data you add. The dashboard signs in with the studio owner email and password (`NUXT_STUDIO_EMAIL` / `NUXT_STUDIO_PASSWORD`).

## Deploy to Render

Use a **Node Web Service**, not a static site: the API routes, Neon reads and writes, auth sync and dashboard updates all need the Nitro server.

1. Create a Blueprint from this repo, or point Render at it manually. `render.yaml` is included.
2. Build command: `npm ci && npm run build`
3. Start command: `npm run start`
4. Health check path: `/api/health` (verifies the PostgreSQL connection)
5. Add these environment variables in the Render dashboard:
   - `DATABASE_URL` — the Neon pooled connection string, including `sslmode=require`
   - `NUXT_PUBLIC_SITE_URL` — the live origin, for example `https://aaroh.in`
   - `NUXT_FIREBASE_SERVICE_ACCOUNT_JSON`, `NUXT_STUDIO_ADMIN_EMAIL` and the `NUXT_SMTP_*` values when email verification is enabled
6. Deploy. Public files in `public/` (including the hanger photography) are served from the same Node service, so no separate static site or rewrite rule is needed.

The old `RENDER_STATIC_SITE=true` path only produces a frontend preview and omits the API, account and dashboard routes. Do not use it for the live store.

## Where things live

- `components/RailStage.client.vue`: the Three.js rail. Hover or tap a tee to highlight it and update the caption.
- `components/HeroSection.vue`: headline, caption and buttons.
- `components/ProductGrid.vue`: the product list. Real HTML, so it is indexable.
- `components/StorySection.vue`: founder and brand story.
- `data/products.ts`: product data. Prices are placeholders.
- `app.vue`: title, description, Open Graph, canonical URL and organization schema.
- `public/`: robots.txt, sitemap.xml and favicon.svg.

## Before launch

1. Replace the placeholder prices, product names and story copy. The story was drafted from the Instagram profile and reels, not from facts you supplied.
2. Set `siteUrl` in `nuxt.config.ts`, and update the domain in `public/sitemap.xml` and `public/robots.txt`.
3. Add `public/og-image.png` (1200 x 630) and `public/logo.png` (square, at least 512 px). Both are referenced by the SEO tags.
4. When you have real product pages (Shopify or elsewhere), point each product's `url` at it and add Product structured data with real prices and availability. Until then the schema is left out on purpose.
5. Submit the sitemap in Google Search Console and check the page with PageSpeed Insights and the Rich Results Test.

## Design notes

- Palette: paper #E9EBF1, ink #0A0E24, cobalt #1528C9 (from the logo), chrome #C9CED8, ivory #EFEDE6.
- Type: Archivo, a variable face with a width axis. Display headings use the widest setting, body text the regular width.
- Motion: the tees drop onto the rail once on load, the rail turns as you scroll past it, and a hovered tee lifts and gets a blue frame. Visitors with reduced motion see a still rail.
