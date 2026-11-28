<script setup lang="ts">
import type { Product } from '~/data/products'

const active = ref(0)
const { activeProducts } = useStore()

// Only live pieces that are marked for the hero rail.
const railProducts = computed<Product[]>(() =>
  activeProducts.value.filter((product) => product.rail && product.images[0]).slice(0, 6),
)

const root = ref<HTMLElement | null>(null)
const { load, prefersReducedMotion } = useMotion()

let cleanupMotion: (() => void) | null = null

onMounted(async () => {
  if (prefersReducedMotion()) return

  const { gsap } = await load()
  const section = root.value
  if (!section) return

  const ctx = gsap.context(() => {
    const intro = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.12 })

    intro
      .from('.hero__top > *', { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 })
      .from('.hero__title .line', { yPercent: 112, opacity: 0, duration: 0.95, stagger: 0.09 }, '-=0.28')
      .from('.hero__lede', { y: 16, opacity: 0, duration: 0.55 }, '-=0.55')
      .from('.hero__shop', { y: 14, opacity: 0, duration: 0.5 }, '-=0.45')
      .from('.hero__stage-wrap', { opacity: 0, y: 18, duration: 0.8 }, '-=0.4')
  }, section)

  cleanupMotion = () => ctx.revert()
})

onBeforeUnmount(() => {
  cleanupMotion?.()
})
</script>

<template>
  <section id="top" ref="root" class="hero" aria-labelledby="hero-title">
    <WayglimBackground />

    <div class="hero__head">
      <div class="hero__top">
        <p class="eyebrow hero__eyebrow">New collection</p>
        <p class="hero__season">Autumn / Winter ’26</p>
      </div>

      <h1 id="hero-title" class="hero__title">
        <span class="line">Everyday essentials,</span>
        <span class="line">made to be <em>worn.</em></span>
      </h1>

      <div class="hero__lower">
        <p class="hero__lede">
          A live edit from the AAROH. collection. Hover a piece to see it face front, then make it yours.
        </p>

        <NuxtLink class="hero__shop" to="/shop">
          Shop the collection
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <div class="hero__stage-wrap">
      <div class="hero__stage">
        <RailStage v-model:active="active" :products="railProducts" />
      </div>

      <p class="hero__hint">
        <span class="hero__hint-desktop">Hover a piece to explore</span>
        <span class="hero__hint-mobile">Swipe the rail to explore</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </p>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  max-width: var(--max);
  margin-inline: auto;
  padding: clamp(26px, 3.4vw, 54px) var(--gutter) clamp(20px, 3vw, 40px);
  overflow: hidden;
  background: var(--surface);
}

/* The shader sits behind the hero copy. */
.hero__head,
.hero__stage-wrap {
  position: relative;
  z-index: 1;
}

.hero__head {
  display: grid;
  gap: clamp(26px, 4vw, 52px);
}

.hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.hero__eyebrow {
  color: var(--text-secondary);
  font-weight: 600;
}

.hero__eyebrow::before {
  display: none;
}

.hero__season {
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero__title {
  max-width: 20ch;
  margin-inline: auto;
  color: var(--heading-ink);
  font-family: var(--font-outfit);
  font-size: clamp(3.1rem, 7.4vw, 8.6rem);
  font-weight: 500;
  line-height: 0.94;
  letter-spacing: -0.052em;
  text-align: center;
}

.hero__title .line {
  display: block;
  overflow: hidden;
  padding-bottom: 0.04em;
}

.hero__title em {
  color: var(--blue);
  font-style: normal;
}

.hero__lower {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: clamp(26px, 8vw, 150px);
  max-width: 1100px;
  margin-inline: auto;
}

.hero__lede {
  max-width: 34ch;
  color: var(--text-secondary);
  font-size: clamp(0.94rem, 1.05vw, 1.02rem);
  line-height: 1.62;
}

.hero__shop {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding-bottom: 4px;
  border-bottom: 1px solid currentColor;
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.hero__shop svg {
  color: var(--blue);
}

.hero__shop:hover {
  color: var(--blue);
}

.hero__stage-wrap {
  position: relative;
  margin-top: clamp(10px, 2vw, 26px);
  overflow: hidden;
}

.hero__stage {
  position: relative;
  z-index: 1;
  height: clamp(340px, 34vw, 500px);
}

.hero__hint {
  position: absolute;
  bottom: 4px;
  left: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  transform: translateX(-50%);
  color: var(--text-muted);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
}

.hero__hint svg {
  color: var(--blue);
}

.hero__hint-mobile {
  display: none;
}

@media (max-width: 900px) {
  .hero__title {
    font-size: clamp(2.9rem, 11vw, 5.8rem);
  }

  .hero__lower {
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .hero__stage {
    height: clamp(320px, 62vw, 500px);
  }

  .hero__hint-desktop {
    display: none;
  }

  .hero__hint-mobile {
    display: inline;
  }
}

@media (max-width: 560px) {
  .hero {
    padding-top: 22px;
  }

  .hero__top {
    align-items: flex-start;
  }

  .hero__eyebrow {
    font-size: 0.63rem;
    letter-spacing: 0.1em;
  }

  .hero__season {
    font-size: 0.56rem;
  }

  .hero__title {
    max-width: 100%;
    font-size: clamp(2.55rem, 12.4vw, 3.6rem);
    line-height: 0.98;
  }

  .hero__stage {
    height: 360px;
  }

  .hero__hint {
    font-size: 0.55rem;
  }
}
</style>
