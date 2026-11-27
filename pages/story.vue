<script setup lang="ts">
import { INSTAGRAM_URL } from '~/data/products'
import { useStore } from '~/composables/useStore'

const siteUrl = useRuntimeConfig().public.siteUrl as string
const title = 'Our story · AAROH.'
const { activeProducts, settings } = useStore()
const story = computed(() => settings.value.story)
const description = computed(() => story.value.intro || 'The story of AAROH.')

interface Shot {
  src: string
  alt: string
  to: string
}

/** Every frame on the page comes from the live catalogue, deduplicated by image. */
const gallery = computed<Shot[]>(() => {
  const seen = new Set<string>()
  const shots: Shot[] = []

  for (const product of activeProducts.value) {
    const src = product.images?.[0]
    if (!src) continue
    const key = src.startsWith('data:') ? `${product.id}:${product.name}` : src
    if (seen.has(key)) continue
    seen.add(key)
    shots.push({ src, alt: product.name, to: `/product/${product.id}` })
  }

  // Campaign photography first, then catalogue renders, then uploaded copies.
  const rank = (shot: Shot) =>
    shot.src.includes('/campaign/') ? 0 : shot.src.startsWith('data:') ? 2 : 1
  const ordered = [...shots].sort((a, b) => rank(a) - rank(b))

  if (!ordered.length && story.value.image) {
    ordered.push({ src: story.value.image, alt: story.value.imageAlt, to: '/shop' })
  }

  return ordered
})

function frames(start: number, size: number): Shot[] {
  const shots = gallery.value
  if (!shots.length) return []
  return Array.from({ length: size }, (_, index) => shots[(start + index) % shots.length]!)
}

const heroShots = computed(() => frames(0, 3))
const collageShots = computed(() => frames(3, 6))

const instagramUrl = computed(() => settings.value.brand.instagram || INSTAGRAM_URL)
const instagramHandle = computed(() => {
  const handle = instagramUrl.value
    .replace(/\/+$/, '')
    .split('/')
    .filter(Boolean)
    .pop() || 'aaroh'
  return handle.startsWith('@') ? handle : `@${handle}`
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: `${siteUrl}/story`,
  ogSiteName: 'AAROH.',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}/story` }],
})
</script>

<template>
  <article class="story-page">
    <div v-if="heroShots.length" class="story-tiles">
      <NuxtLink
        v-for="(shot, index) in heroShots"
        :key="`hero-${index}`"
        class="story-tile"
        :to="shot.to"
        :aria-label="`View ${shot.alt}`"
      >
        <img
          :src="shot.src"
          :alt="shot.alt"
          :loading="index === 0 ? 'eager' : 'lazy'"
          decoding="async"
        />
      </NuxtLink>
    </div>

    <section class="story-statement">
      <p class="story-kicker">{{ story.caption }}</p>
      <p class="story-lede">{{ story.intro }}</p>
      <div class="story-aside">
        <p>{{ story.note }}</p>
        <a class="story-handle" :href="instagramUrl" target="_blank" rel="noopener noreferrer">
          {{ instagramHandle }}
        </a>
      </div>
    </section>

    <section class="story-headline">
      <h1 id="story-title" class="story-display">
        {{ story.title }} <span>{{ story.titleAccent }}</span>
      </h1>
      <div class="story-caption">
        <p>[ {{ story.noteEyebrow }} ]</p>
        <p>{{ story.lead }}</p>
      </div>
    </section>

    <section class="story-grid" aria-label="Pieces from the studio">
      <NuxtLink
        v-for="(shot, index) in collageShots"
        :key="`cell-${index}`"
        class="story-cell"
        :to="shot.to"
        :aria-label="`View ${shot.alt}`"
      >
        <img :src="shot.src" :alt="shot.alt" loading="lazy" decoding="async" />
      </NuxtLink>

      <aside class="story-card">
        <p class="story-card__copy">{{ story.heading }}</p>
        <div class="story-card__actions">
          <NuxtLink class="story-card__cta" to="/shop">Shop the collection</NuxtLink>
          <p class="story-card__foot">{{ story.eyebrow }}</p>
        </div>
      </aside>
    </section>
  </article>
</template>

<style scoped>
.story-page {
  --story-x: var(--gutter);

  min-height: 100svh;
  padding-bottom: clamp(20px, 3vw, 40px);
  background: var(--surface);
  color: var(--ink);
}

/* Three-up image row */
.story-tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
  padding-inline: var(--story-x);
}

.story-tile {
  display: block;
  overflow: hidden;
  aspect-ratio: 0.9;
  background: var(--bg-subtle);
}

.story-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 28%;
  transition: transform 0.5s ease;
}

.story-tile:hover img {
  transform: scale(1.015);
}

/* Statement row */
.story-statement {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.35fr) minmax(0, 1fr);
  gap: clamp(14px, 3.2vw, 54px);
  padding: clamp(16px, 2.4vw, 34px) var(--story-x) clamp(36px, 6.4vw, 92px);
}

.story-kicker {
  margin: 0;
  padding-top: 0.35em;
  color: var(--muted);
  font-size: 0.62rem;
  line-height: 1.4;
}

.story-lede {
  max-width: 24ch;
  margin: 0;
  font-family: var(--font-outfit);
  font-size: clamp(1.4rem, 2.75vw, 2.75rem);
  font-weight: 400;
  letter-spacing: -0.022em;
  line-height: 1.2;
}

.story-aside {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: clamp(10px, 1.6vw, 18px);
  min-width: 0;
}

.story-aside p {
  max-width: 26ch;
  margin: 0;
  color: var(--muted);
  font-size: 0.68rem;
  line-height: 1.55;
}

.story-handle {
  align-self: flex-end;
  color: var(--muted);
  font-size: 0.62rem;
  text-decoration: none;
}

.story-handle:hover {
  color: var(--ink);
}

/* Two-tone display headline */
.story-headline {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  align-items: start;
  gap: clamp(16px, 4vw, 64px);
  padding: 0 var(--story-x) clamp(22px, 2.6vw, 36px);
}

.story-display {
  max-width: 18ch;
  margin: 0;
  font-family: var(--font-logo);
  font-size: clamp(2rem, 4vw, 3.6rem);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.06;
}

.story-display span {
  color: color-mix(in srgb, var(--primary) 58%, var(--muted));
}

.story-caption {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  justify-self: end;
  width: min(100%, 30ch);
  padding-top: 0.5em;
}

.story-caption p {
  max-width: 34ch;
  margin: 0;
  color: var(--muted);
  font-size: 0.66rem;
  line-height: 1.5;
}

/* Collage */
.story-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.32fr);
  gap: clamp(4px, 0.55vw, 9px);
  padding-inline: var(--story-x);
}

.story-cell {
  display: block;
  overflow: hidden;
  aspect-ratio: 1.2;
  background: var(--bg-subtle);
}

.story-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  transition: transform 0.5s ease;
}

.story-cell:hover img {
  transform: scale(1.02);
}

.story-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(12px, 1.6vw, 22px);
  grid-column: 4;
  grid-row: 1 / span 2;
  padding: clamp(4px, 0.6vw, 10px) 0 0 clamp(10px, 1.8vw, 26px);
}

.story-card__copy {
  margin: 0;
  font-size: clamp(0.82rem, 1vw, 0.98rem);
  font-weight: 600;
  letter-spacing: -0.012em;
  line-height: 1.35;
}

.story-card__actions {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.4vw, 14px);
  align-items: flex-start;
}

.story-card__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.62rem 1.15rem;
  border-radius: 999px;
  background: var(--ink);
  color: var(--surface);
  font-size: 0.68rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.18s ease;
}

.story-card__cta:hover {
  background: color-mix(in srgb, var(--ink) 82%, var(--surface));
}

.story-card__foot {
  margin: 0;
  color: var(--muted);
  font-size: 0.6rem;
  line-height: 1.4;
}

@media (max-width: 62rem) {
  .story-headline {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
    gap: clamp(14px, 3vw, 34px);
  }

  .story-caption {
    padding-top: 0.35em;
  }

  .story-display {
    max-width: 20ch;
  }

  .story-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.15fr);
  }

  .story-card__copy {
    font-size: 0.82rem;
  }
}

@media (max-width: 40rem) {
  .story-tile {
    aspect-ratio: 0.86;
  }

  .story-statement {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 2.2fr) minmax(0, 1fr);
    gap: 9px;
    padding-top: 12px;
    padding-bottom: 26px;
  }

  .story-kicker {
    padding-top: 2px;
    font-size: 0.5rem;
  }

  .story-lede {
    max-width: none;
    font-size: clamp(0.98rem, 5vw, 1.35rem);
    line-height: 1.24;
  }

  .story-aside {
    gap: 6px;
  }

  .story-aside p {
    max-width: none;
    font-size: 0.48rem;
    line-height: 1.5;
  }

  .story-handle {
    font-size: 0.48rem;
  }

  .story-headline {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 9px;
    padding-bottom: 16px;
  }

  .story-display {
    max-width: none;
    font-size: clamp(1.1rem, 5.9vw, 1.9rem);
  }

  .story-caption {
    width: auto;
    gap: 4px;
    padding-top: 1px;
  }

  .story-caption p {
    max-width: none;
    font-size: 0.5rem;
  }

  .story-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.3fr);
    gap: 4px;
  }

  .story-cell {
    aspect-ratio: 1.05;
  }

  .story-card {
    grid-column: 4;
    grid-row: 1 / span 2;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    gap: 6px;
    padding: 2px 0 2px 6px;
  }

  .story-card__copy {
    font-size: 0.52rem;
    line-height: 1.3;
  }

  .story-card__actions {
    gap: 5px;
    align-items: flex-start;
  }

  .story-card__cta {
    padding: 0.38rem 0.55rem;
    font-size: 0.46rem;
  }

  .story-card__foot {
    font-size: 0.44rem;
  }
}
</style>
