<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { INSTAGRAM_URL } from '../data/products'
import { useMotion } from '../composables/useMotion'

const root = ref<HTMLElement | null>(null)
const { load, prefersReducedMotion } = useMotion()

let cleanupMotion: (() => void) | null = null

onMounted(async () => {
  if (prefersReducedMotion()) return

  const { gsap } = await load()
  const section = root.value
  if (!section) return

  const ctx = gsap.context(() => {
    gsap.from('.campaign__kicker > *', {
      y: 12,
      opacity: 0,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.campaign__panel', start: 'top 84%' },
    })

    gsap.from('.campaign__title', {
      y: 38,
      opacity: 0,
      duration: 0.95,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.campaign__panel', start: 'top 82%' },
    })

    gsap.from('.campaign__foot > *', {
      y: 18,
      opacity: 0,
      duration: 0.65,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.campaign__panel', start: 'top 74%' },
    })
  }, section)

  cleanupMotion = () => ctx.revert()
})

onBeforeUnmount(() => {
  cleanupMotion?.()
})
</script>

<template>
  <section id="campaign" ref="root" class="campaign" aria-labelledby="campaign-title">
    <div class="campaign__panel">
      <div class="campaign__copy">
        <div class="campaign__kicker">
          <span class="campaign__label"><i aria-hidden="true" />03 — THE CAMPAIGN</span>
          <span class="campaign__season">AUTUMN / WINTER ’26</span>
        </div>

        <h2 id="campaign-title" class="campaign__title">
          ARCHITECTURAL CUTS. WEIGHT WITHOUT COMPROMISE. SILHOUETTES CRAFTED FOR DAILY REPETITION.
        </h2>

        <div class="campaign__foot">
          <p class="campaign__note">
            Engineered with structured drop shoulders, custom-dyed royal blue 480 GSM fleece, and obsessive stitch density. Every piece is cut in small studio batches to age gracefully and become your primary wardrobe foundation.
          </p>

          <NuxtLink class="campaign__link" to="/shop">
            EXPLORE THE COLLECTION
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <figure class="campaign__media">
        <img
          src="/images/campaign/hoodie-portrait.png"
          alt="AAROH. campaign model wearing the royal blue hoodie"
          width="1080"
          height="1440"
          loading="lazy"
          decoding="async"
        />
      </figure>
    </div>
  </section>
</template>

<style scoped>
.campaign {
  width: 100%;
  padding: 0;
  background: #ffffff;
}

.campaign__panel {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  min-height: clamp(480px, 42vw, 640px);
  overflow: hidden;
  border-block: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
}

.campaign__copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: clamp(32px, 4vw, 64px);
  padding-right: clamp(24px, 4.4vw, 64px);
  padding-bottom: clamp(28px, 3.6vw, 56px);
  padding-left: max(var(--gutter), calc((100vw - var(--max)) / 2 + var(--gutter)));
  background: #ffffff;
}

.campaign__kicker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: #666666;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
}

.campaign__label {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.campaign__label i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0012db;
}

.campaign__title {
  max-width: 32ch;
  margin-top: clamp(28px, 4vw, 54px);
  margin-bottom: clamp(20px, 3vw, 40px);
  color: #111111;
  font-family: var(--font-logo), 'Space Grotesk', -apple-system, sans-serif;
  font-size: clamp(1.6rem, 2.8vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  text-transform: uppercase;
}

.campaign__foot {
  display: grid;
  gap: 24px;
}

.campaign__note {
  max-width: 48ch;
  margin: 0;
  color: #444444;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: clamp(0.78rem, 0.95vw, 0.88rem);
  line-height: 1.68;
}

.campaign__link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #111111;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  transition: color 0.15s ease, transform 0.15s ease;
}

.campaign__link:hover {
  color: #0012db;
  transform: translateX(3px);
}

.campaign__media {
  position: relative;
  margin: 0;
  overflow: hidden;
  background: #ffffff;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.campaign__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

@media (max-width: 900px) {
  .campaign__panel {
    grid-template-columns: 1fr;
  }

  .campaign__copy {
    padding-inline: var(--gutter);
  }

  .campaign__media {
    aspect-ratio: 4 / 3;
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}
</style>
