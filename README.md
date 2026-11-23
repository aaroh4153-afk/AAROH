# AAROH. site

Vue 3 on Nuxt 3, with a Three.js clothes rail. The home page is prerendered to static HTML, so search engines get the headings, product names and copy without running any JavaScript. The 3D rail only loads in the browser.

## Run it

    npm install
    npm run dev        # local preview at http://localhost:3000
    npm run generate   # static site in .output/public, deployable to any static host

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
