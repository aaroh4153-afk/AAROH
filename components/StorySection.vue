<script setup lang="ts">
import { INSTAGRAM_URL } from '~/data/products'
import { useStore } from '~/composables/useStore'

const { activeProducts } = useStore()
const root = ref<HTMLElement | null>(null)
const { load, prefersReducedMotion } = useMotion()

const featuredPiece = computed(() => activeProducts.value[0])
const mainImage = '/images/campaign/hoodie-portrait.png'
const alternateImage = '/images/products/hoodie-hanger-front.png'

let cleanupMotion: (() => void) | null = null

onMounted(async () => {
  const section = root.value
  if (prefersReducedMotion() || !section) return

  const { gsap } = await load()
  const ctx = gsap.context(() => {
    const revealItems = section.querySelectorAll<HTMLElement>('.story-teaser__reveal')
    if (revealItems.length) {
      gsap.from(revealItems, {
        y: 22,
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 82%' },
      })
    }
  }, section)

  cleanupMotion = () => ctx.revert()
})

onBeforeUnmount(() => cleanupMotion?.())
</script>

<template>
  <section id="story" ref="root" class="story-teaser" aria-labelledby="story-teaser-title">
    <header class="story-teaser__header">
      <p class="story-teaser__eyebrow"><i aria-hidden="true" />02 — Our story</p>
      <NuxtLink class="story-teaser__index-link" to="/story">Read the story <span aria-hidden="true">↗</span></NuxtLink>
    </header>

    <article class="story-teaser__panel">
      <figure class="story-teaser__collage story-teaser__reveal">
        <img :src="mainImage" :alt="`${featuredPiece?.name ?? 'AAROH.'} studio portrait`" loading="lazy" decoding="async" />
        <img :src="alternateImage" :alt="`${featuredPiece?.name ?? 'AAROH.'} alternate view`" loading="lazy" decoding="async" />
        <figcaption>Studio notes <span>01 / AAROH.</span></figcaption>
      </figure>

      <section class="story-teaser__copy">
        <p class="story-teaser__kicker story-teaser__reveal">AAROH. — from the studio</p>
        <h2 id="story-teaser-title" class="story-teaser__title story-teaser__reveal">
          Made with intent.<br />
          <em>Worn every day.</em>
        </h2>
        <p class="story-teaser__body story-teaser__reveal">
          AAROH. began with stacks of fabric and test pieces. Harshikesh kept building; the process is still shared in public.
        </p>
        <nav class="story-teaser__actions story-teaser__reveal" aria-label="Our story links">
          <NuxtLink class="story-teaser__button" to="/story">Our story <span aria-hidden="true">↗</span></NuxtLink>
          <a class="story-teaser__text-link" :href="INSTAGRAM_URL" target="_blank" rel="noopener">Follow the build</a>
        </nav>
      </section>
    </article>
  </section>
</template>

<style scoped>
.story-teaser {
  padding: clamp(4rem, 8vw, 7rem) var(--gutter);
  overflow: hidden;
  background: var(--cream);
  color: var(--ink);
}

.story-teaser__header,
.story-teaser__panel {
  width: min(100%, var(--max));
  margin-inline: auto;
}

.story-teaser__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: clamp(1.25rem, 2.8vw, 2.5rem);
}

.story-teaser__eyebrow,
.story-teaser__index-link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  color: color-mix(in srgb, var(--ink) 70%, transparent);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-decoration: none;
  text-transform: uppercase;
}

.story-teaser__eyebrow i {
  width: 0.45rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--lime-strong);
}

.story-teaser__index-link:hover,
.story-teaser__text-link:hover {
  color: var(--primary);
}

.story-teaser__panel {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 6rem);
}

.story-teaser__collage {
  position: relative;
  min-height: clamp(20rem, 43vw, 35rem);
  margin: 0;
  isolation: isolate;
}

.story-teaser__collage img {
  position: absolute;
  width: 61%;
  height: 82%;
  object-fit: cover;
  object-position: center;
  border: 0.55rem solid var(--surface);
  box-shadow: 0 1.4rem 3rem -2rem color-mix(in srgb, var(--ink) 48%, transparent);
}

.story-teaser__collage img:first-child {
  top: 0;
  left: 4%;
  transform: rotate(-4deg);
}

.story-teaser__collage img:nth-child(2) {
  right: 3%;
  bottom: 1%;
  width: 48%;
  height: 63%;
  transform: rotate(5deg);
}

.story-teaser__collage figcaption {
  position: absolute;
  z-index: 1;
  right: 4%;
  bottom: 0;
  display: flex;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  background: var(--primary);
  color: var(--white);
  font-size: 0.61rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transform: rotate(-2deg);
}

.story-teaser__collage figcaption span {
  color: color-mix(in srgb, var(--white) 74%, transparent);
}

.story-teaser__copy {
  max-width: 35rem;
  padding-block: 1.5rem;
}

.story-teaser__kicker {
  margin: 0;
  color: var(--heading-rust);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.story-teaser__title {
  margin: clamp(1rem, 2.4vw, 2rem) 0 0;
  font-family: var(--font-logo);
  font-size: clamp(2.8rem, 6.4vw, 6rem);
  font-weight: 650;
  letter-spacing: -0.07em;
  line-height: 0.93;
}

.story-teaser__title em {
  color: var(--primary);
  font-family: var(--font-serif);
  font-weight: 400;
}

.story-teaser__body {
  max-width: 39ch;
  margin: clamp(1.2rem, 2.4vw, 2rem) 0 0;
  color: color-mix(in srgb, var(--ink) 72%, transparent);
  font-size: clamp(0.9rem, 1.1vw, 1.02rem);
  line-height: 1.65;
}

.story-teaser__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.4rem;
  margin-top: clamp(1.4rem, 2.8vw, 2.25rem);
}

.story-teaser__button {
  display: inline-flex;
  min-height: 2.9rem;
  align-items: center;
  gap: 1.3rem;
  padding-inline: 1.1rem;
  background: var(--ink);
  color: var(--white);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.story-teaser__button:hover {
  background: var(--primary);
  transform: translateY(-0.1rem);
}

.story-teaser__text-link {
  color: var(--ink);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: underline;
  text-underline-offset: 0.3em;
  text-transform: uppercase;
}

@media (max-width: 48rem) {
  .story-teaser__panel {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .story-teaser__collage {
    min-height: clamp(17rem, 72vw, 29rem);
  }

  .story-teaser__copy {
    padding-block: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-teaser__button {
    transition: none;
  }
}
</style>
