<script setup lang="ts">
import type { StoreBanner } from '~/data/banners'
import type { Product } from '~/data/products'
import { useStore } from '~/composables/useStore'
import { useMotion } from '~/composables/useMotion'

interface EditorialPanel {
  image: string
  altText: string
  index: number
  title: string
  note: string
}

const root = ref<HTMLElement | null>(null)
const { activeProducts } = useStore()
const { data: uploadedBanners, error } = await useFetch<StoreBanner[]>('/api/banners', {
  default: () => [],
})
const { load, prefersReducedMotion } = useMotion()

const copy = [
  {
    title: 'The pieces you reach for first.',
    note: 'Quiet colour. Considered shape. Made for the everyday.',
  },
  {
    title: 'An easier kind of uniform.',
    note: 'Layers that move with you, from first light to last.',
  },
]

const panels = computed<EditorialPanel[]>(() => {
  const result: EditorialPanel[] = (uploadedBanners.value ?? []).slice(0, 2).map((banner, index) => ({
    image: banner.image,
    altText: banner.altText,
    index,
    ...copy[index]!,
  }))

  const productsWithImages = activeProducts.value.filter((product: Product) => product.images[0])

  for (const product of productsWithImages) {
    if (result.length >= 2) break
    result.push({
      image: product.images[0]!,
      altText: `${product.name} from the AAROH. collection`,
      index: result.length,
      ...copy[result.length]!,
    })
  }

  return result
})

watch(
  error,
  (value) => {
    if (value) console.error('[aaroh/banners] Could not load the editorial banners.', value)
  },
  { immediate: true },
)

let cleanupMotion: (() => void) | null = null

onMounted(async () => {
  if (prefersReducedMotion() || !root.value) return

  const { gsap } = await load()
  const ctx = gsap.context(() => {
    gsap.from('.editorial-banners__panel', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.editorial-banners__grid', start: 'top 86%' },
    })

    gsap.from('.editorial-banners__image', {
      scale: 1.045,
      duration: 1.25,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.editorial-banners__grid', start: 'top 86%' },
    })
  }, root.value)

  cleanupMotion = () => ctx.revert()
})

onBeforeUnmount(() => {
  cleanupMotion?.()
})
</script>

<template>
  <section
    v-if="panels.length"
    ref="root"
    class="editorial-banners"
    aria-labelledby="editorial-banners-title"
  >
    <header class="editorial-banners__head">
      <p class="editorial-banners__eyebrow">Studio notes <span>—</span> 01</p>
      <h2 id="editorial-banners-title">A closer look at <em>everyday.</em></h2>
      <NuxtLink to="/shop" class="editorial-banners__all">
        Explore all pieces
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </NuxtLink>
    </header>

    <section
      class="editorial-banners__grid"
      :class="{ 'editorial-banners__grid--single': panels.length === 1 }"
      aria-label="AAROH. editorial banners"
    >
      <figure
        v-for="panel in panels"
        :key="`${panel.image}-${panel.index}`"
        class="editorial-banners__panel"
      >
        <img
          class="editorial-banners__image"
          :src="panel.image"
          :alt="panel.altText"
          loading="lazy"
          decoding="async"
        />
        <figcaption class="editorial-banners__copy">
          <p>0{{ panel.index + 1 }} <span>/</span> The everyday edit</p>
          <h3>{{ panel.title }}</h3>
          <span>{{ panel.note }}</span>
          <NuxtLink to="/shop" :aria-label="`Shop the collection: ${panel.title}`">
            Discover the edit
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </NuxtLink>
        </figcaption>
      </figure>
    </section>
  </section>
</template>

<style scoped>
.editorial-banners {
  padding: clamp(2.75rem, 6vw, 5.5rem) var(--gutter);
  color: var(--ink);
}

.editorial-banners__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 1rem 2rem;
  max-width: var(--max);
  margin: 0 auto clamp(1.25rem, 2.4vw, 2rem);
}

.editorial-banners__eyebrow {
  grid-column: 1 / -1;
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.editorial-banners__eyebrow span {
  color: var(--red);
}

.editorial-banners__head h2 {
  font-family: var(--font-logo);
  font-size: clamp(1.65rem, 3.2vw, 3rem);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 0.98;
}

.editorial-banners__head h2 em {
  color: var(--heading-red);
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 400;
}

.editorial-banners__all,
.editorial-banners__copy a {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: inherit;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-decoration: none;
  text-transform: uppercase;
}

.editorial-banners__all svg,
.editorial-banners__copy a svg {
  width: 1rem;
  height: 1rem;
  transition: transform 0.25s var(--ease);
}

.editorial-banners__all:hover svg,
.editorial-banners__copy a:hover svg {
  transform: translateX(0.2rem);
}

.editorial-banners__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(0.65rem, 1.5vw, 1.25rem);
  max-width: var(--max);
  margin-inline: auto;
}

.editorial-banners__grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.editorial-banners__panel {
  position: relative;
  min-height: clamp(27rem, 48vw, 43rem);
  overflow: hidden;
  isolation: isolate;
  background: var(--bg-deep);
}

.editorial-banners__panel::after {
  position: absolute;
  z-index: 0;
  background: linear-gradient(180deg, transparent 32%, color-mix(in srgb, var(--bg-deep) 82%, transparent));
  content: '';
  inset: 0;
}

.editorial-banners__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
  transition: transform 1.2s var(--ease);
}

@media (hover: hover) and (pointer: fine) {
  .editorial-banners__panel:hover .editorial-banners__image {
    transform: scale(1.035);
  }
}

.editorial-banners__copy {
  position: absolute;
  z-index: 1;
  right: clamp(1.25rem, 3.4vw, 3rem);
  bottom: clamp(1.5rem, 3.4vw, 3rem);
  left: clamp(1.25rem, 3.4vw, 3rem);
  display: grid;
  justify-items: start;
  gap: 0.8rem;
  color: var(--white);
}

.editorial-banners__copy p {
  color: color-mix(in srgb, var(--white) 74%, transparent);
  font-size: 0.64rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.editorial-banners__copy p span {
  padding-inline: 0.3rem;
  color: var(--lime-strong);
}

.editorial-banners__copy h3 {
  max-width: 13ch;
  font-family: var(--font-logo);
  font-size: clamp(2rem, 4vw, 4.5rem);
  font-weight: 550;
  letter-spacing: -0.055em;
  line-height: 0.95;
}

.editorial-banners__copy > span {
  max-width: 38ch;
  color: color-mix(in srgb, var(--white) 78%, transparent);
  font-size: 0.85rem;
  line-height: 1.55;
}

.editorial-banners__copy a {
  margin-top: 0.6rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid color-mix(in srgb, var(--white) 55%, transparent);
}

@media (max-width: 700px) {
  .editorial-banners__head {
    grid-template-columns: 1fr;
  }

  .editorial-banners__all {
    justify-self: start;
  }

  .editorial-banners__grid {
    grid-template-columns: 1fr;
  }

  .editorial-banners__panel {
    min-height: clamp(24rem, 120vw, 38rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .editorial-banners__image,
  .editorial-banners__all svg,
  .editorial-banners__copy a svg {
    transition: none;
  }
}
</style>
