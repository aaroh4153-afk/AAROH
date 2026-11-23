<script setup lang="ts">
import { useStore } from '~/composables/useStore'

const siteUrl = useRuntimeConfig().public.siteUrl as string
const title = 'Our story · AAROH.'
const description =
  'The story of AAROH.: everyday clothing shaped by small beginnings, thoughtful making, and a process shared in public.'

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

const { activeProducts } = useStore()
const storyPieces = computed(() => activeProducts.value.slice(0, 2))
</script>

<template>
  <article class="story-page">
    <section class="story-card" aria-labelledby="story-title">
      <header class="story-card__header">
        <NuxtLink class="story-card__wordmark" to="/" aria-label="AAROH. home">AAROH.</NuxtLink>
        <nav class="story-card__navigation" aria-label="Story navigation">
          <NuxtLink to="/shop">Collection</NuxtLink>
          <NuxtLink to="/account">Profile</NuxtLink>
          <NuxtLink to="/">Home</NuxtLink>
        </nav>
      </header>

      <section class="story-card__layout">
        <section class="story-card__statement">
          <p class="story-card__eyebrow">01 / The story of AAROH.</p>
          <h1 id="story-title">
            Everyday<br />
            essentials,<br />
            <mark>made with intent.</mark>
          </h1>
          <p class="story-card__intro">
            AAROH. began with stacks of fabric, test pieces, and a simple idea: make thoughtful clothes for everyday life.
          </p>

          <ul v-if="storyPieces.length" class="story-card__pieces" aria-label="Pieces from the collection">
            <li v-for="piece in storyPieces" :key="piece.id">
              <NuxtLink :to="`/product/${piece.id}`" :aria-label="`View ${piece.name}`">
                <img :src="piece.images[0]" :alt="piece.name" loading="lazy" decoding="async" />
              </NuxtLink>
            </li>
          </ul>
        </section>

        <figure class="story-card__portrait">
          <img
            src="/images/campaign/hoodie-portrait.png"
            alt="AAROH. royal blue hoodie from the studio"
            decoding="async"
          />
          <figcaption>Made to be worn, again and again.</figcaption>
        </figure>

        <aside class="story-card__note">
          <svg class="story-card__arrow" viewBox="0 0 96 58" fill="none" aria-hidden="true">
            <path d="M4 48C29 8 58 7 87 27" />
            <path d="m71 11 17 16-22 4" />
          </svg>
          <p class="story-card__eyebrow">A note from the studio</p>
          <p>
            Harshikesh kept building, learning from each attempt, and sharing the process in public. That spirit remains in every piece: considered essentials made for real days and repeat wear.
          </p>
          <NuxtLink class="story-card__link" to="/shop">Explore the collection <span aria-hidden="true">↗</span></NuxtLink>
        </aside>

        <p class="story-card__number" aria-hidden="true">(01)</p>
      </section>
    </section>
  </article>
</template>

<style scoped>
.story-page {
  display: grid;
  min-height: calc(100vh - 7rem);
  place-items: center;
  padding: clamp(1rem, 5vw, 4rem);
  background: var(--ink);
}

.story-card {
  width: min(100%, 76rem);
  padding: clamp(1rem, 3.2vw, 2.75rem);
  border-radius: 1rem;
  background: var(--surface);
  color: var(--ink);
}

.story-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--line);
}

.story-card__wordmark {
  color: var(--ink);
  font-family: var(--font-logo);
  font-size: 0.9rem;
  font-weight: 850;
  letter-spacing: -0.07em;
  text-decoration: none;
}

.story-card__navigation {
  display: flex;
  align-items: center;
  gap: clamp(0.8rem, 2.4vw, 2.25rem);
}

.story-card__navigation a {
  color: var(--ink);
  font-size: 0.61rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-decoration: none;
  text-transform: uppercase;
}

.story-card__layout {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(14rem, 1fr) minmax(0, 0.68fr);
  align-items: center;
  gap: clamp(1rem, 2.4vw, 2rem);
  min-height: clamp(32rem, 53vw, 42rem);
  padding: clamp(1.8rem, 4vw, 3.25rem) 0 1.5rem;
}

.story-card__statement {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-self: stretch;
  justify-content: center;
  padding-bottom: 0.25rem;
}

.story-card__eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 0.58rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.story-card__statement h1 {
  margin: 0.75rem 0 0;
  font-family: var(--font-logo);
  font-size: clamp(2.2rem, 4.1vw, 4.25rem);
  font-weight: 550;
  letter-spacing: -0.075em;
  line-height: 0.98;
}

.story-card__statement mark {
  padding-inline: 0.07em;
  background: var(--lime-strong);
  color: var(--ink);
}

.story-card__intro {
  max-width: 31ch;
  margin: 1rem 0 0;
  color: color-mix(in srgb, var(--ink) 76%, transparent);
  font-size: 0.72rem;
  line-height: 1.55;
}

.story-card__pieces {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 5rem));
  gap: 0.55rem;
  margin: auto 0 0;
  padding: 1.5rem 0 0;
  list-style: none;
}

.story-card__pieces a {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--bg-subtle);
}

.story-card__pieces img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.story-card__portrait {
  position: relative;
  align-self: stretch;
  min-width: 0;
  min-height: 28rem;
  margin: 0;
  overflow: hidden;
  background: var(--bg-subtle);
}

.story-card__portrait img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 26%;
}

.story-card__portrait figcaption {
  position: absolute;
  right: 0.6rem;
  bottom: 0.6rem;
  left: 0.6rem;
  padding: 0.45rem 0.55rem;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  color: var(--ink);
  font-size: 0.56rem;
  letter-spacing: 0.02em;
}

.story-card__note {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 2rem 0 3rem;
}

.story-card__arrow {
  width: clamp(3rem, 5vw, 4.5rem);
  margin-bottom: 1.2rem;
  stroke: var(--ink);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.story-card__note > p:not(.story-card__eyebrow) {
  max-width: 28ch;
  margin: 0.65rem 0 0;
  color: color-mix(in srgb, var(--ink) 80%, transparent);
  font-size: 0.68rem;
  line-height: 1.6;
}

.story-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  margin-top: 1.2rem;
  color: var(--ink);
  font-size: 0.62rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.25rem;
  text-transform: uppercase;
}

.story-card__number {
  position: absolute;
  right: 0;
  bottom: 0;
  margin: 0;
  color: color-mix(in srgb, var(--ink) 65%, var(--surface));
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 3.5rem);
  letter-spacing: -0.08em;
}

@media (max-width: 58rem) {
  .story-card__layout {
    grid-template-columns: minmax(0, 0.85fr) minmax(13rem, 1fr);
    min-height: auto;
  }

  .story-card__statement {
    min-height: 28rem;
  }

  .story-card__note {
    grid-column: 1 / -1;
    max-width: 38rem;
    padding: 1rem 0 3rem;
  }

  .story-card__note > p:not(.story-card__eyebrow) {
    max-width: 55ch;
  }
}

@media (max-width: 38rem) {
  .story-page {
    min-height: 0;
    padding: 1rem;
  }

  .story-card {
    padding: 1rem;
    border-radius: 0.65rem;
  }

  .story-card__header {
    align-items: flex-start;
  }

  .story-card__navigation {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem 0.8rem;
  }

  .story-card__navigation a {
    font-size: 0.53rem;
  }

  .story-card__layout {
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding-top: 1.5rem;
  }

  .story-card__statement {
    min-height: 0;
  }

  .story-card__statement h1 {
    font-size: clamp(2.45rem, 12vw, 4rem);
  }

  .story-card__pieces {
    margin-top: 0;
  }

  .story-card__portrait {
    min-height: 0;
    aspect-ratio: 0.82;
  }

  .story-card__note {
    grid-column: auto;
    padding: 0.5rem 0 2.5rem;
  }
}
</style>
