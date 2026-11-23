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
          <span class="campaign__label"><i aria-hidden="true" />03 — The campaign</span>
          <span class="campaign__season">Autumn / Winter ’26</span>
        </div>

        <h2 id="campaign-title" class="campaign__title">
          AAROH. is everyday uniform. Built for the ones who move different. Light layers, quiet colour,
          and a cut that carries its own confidence.
        </h2>

        <div class="campaign__foot">
          <p class="campaign__note">
            Considered silhouettes, softened colour and layers that carry their own weight. AAROH. is
            made for the in-between — the commute, the off-duty hours, the everyday that asks for more.
            Not loud. Just certain.
          </p>

          <a class="campaign__link" :href="INSTAGRAM_URL" target="_blank" rel="noopener">
            Explore the look
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
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
}

.campaign__panel {
  display: grid;
  grid-template-columns: minmax(0, 1.58fr) minmax(0, 1fr);
  min-height: clamp(500px, 44vw, 660px);
  overflow: hidden;
  border-block: 1px solid rgba(0, 0, 0, 0.08);

  background: var(--white);
  
}

.campaign__copy {
  display: flex;
  flex-direction: column;
  padding-top: clamp(28px, 3.8vw, 56px);
  padding-right: clamp(24px, 4.4vw, 64px);
  padding-bottom: clamp(24px, 3.4vw, 48px);
  padding-left: max(var(--gutter), calc((100vw - var(--max)) / 2 + var(--gutter)));
}

.campaign__kicker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: rgba(11, 18, 32, 0.54);
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.14em;
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
  background: var(--blue);
}

.campaign__title {
  max-width: 31ch;
  margin-top: clamp(34px, 4.6vw, 64px);
  color: var(--ink);
  font-size: clamp(1.5rem, 2.62vw, 2.85rem);
  font-stretch: 80%;
  font-weight: 720;
  letter-spacing: -0.012em;
  line-height: 0.99;
  text-transform: uppercase;
}

.campaign__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-top: auto;
  padding-top: clamp(40px, 6vw, 92px);
}

.campaign__note {
  max-width: 47ch;
  color: var(--rust);
  font-size: clamp(0.72rem, 0.82vw, 0.82rem);
  font-weight: 500;
  letter-spacing: 0.005em;
  line-height: 1.6;
}

.campaign__link {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 7px;
  padding-bottom: 4px;
  border-bottom: 1px solid currentColor;
  color: var(--ink);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  transition: color 0.22s ease;
}

.campaign__link:hover {
  color: var(--blue);
}

.campaign__link svg {
  transition: transform 0.3s var(--ease);
}

.campaign__link:hover svg {
  transform: translate(2px, -2px);
}

.campaign__media {
  position: relative;
  min-height: 100%;
  overflow: hidden;
  background: #ecebe6;
}

.campaign__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 42%;
  user-select: none;
}

@media (max-width: 1024px) {
  .campaign__panel {
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  }

  .campaign__title {
    font-size: clamp(1.4rem, 3.4vw, 2.2rem);
  }

  .campaign__foot {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
    padding-top: clamp(34px, 5vw, 60px);
  }
}

@media (max-width: 760px) {
  .campaign__panel {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .campaign__copy {
    padding: 24px var(--gutter) 28px;
  }

  .campaign__title {
    margin-top: 30px;
    font-size: clamp(1.5rem, 6.5vw, 2.15rem);
  }

  .campaign__season {
    display: none;
  }

  .campaign__foot {
    gap: 18px;
    padding-top: 32px;
  }

  .campaign__media {
    order: -1;
    aspect-ratio: 4 / 4.4;
    min-height: 0;
  }

  .campaign__media img {
    inset: 0;
    height: 100%;
    object-position: 50% 36%;
  }
}

@media (max-width: 420px) {
  .campaign__note {
    font-size: 0.7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .campaign__link,
  .campaign__link svg {
    transition: none;
  }
}

@media (hover: none) {
  .campaign__link:active {
    color: var(--blue);
  }

  .campaign__link:active svg {
    transform: translate(2px, -2px);
  }
}
</style>
