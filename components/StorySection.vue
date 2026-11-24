<script setup lang="ts">
import { INSTAGRAM_URL } from '~/data/products'
import { useStore } from '~/composables/useStore'
import { useMotion } from '~/composables/useMotion'

const { activeProducts } = useStore()
const root = ref<HTMLElement | null>(null)
const { load, prefersReducedMotion } = useMotion()

const featuredPiece = computed(() => activeProducts.value[0])
const mainImage = '/images/campaign/hoodie-portrait.png'

const reviews = [
  {
    stars: 5,
    text: 'These hoodies completely set a new benchmark for quality. The 480 GSM fleece drape is structured and heavy without feeling stiff. Clean silhouette and zero shrinkage after weeks of wear.',
    name: 'Rohit Sharma',
    role: 'Shopify Developer, Mumbai',
  },
  {
    stars: 5,
    text: "I've bought luxury hoodies from high-end labels, but AAROH beats them on construction. The double-layered hood and rib cuffs stay pristine after dozens of washes. Definitely worth it.",
    name: 'Emily Carter',
    role: 'Ecommerce Designer, Austin',
  },
  {
    stars: 5,
    text: 'Small batch craftsmanship really shows. The stitch density, custom hardware, and deep royal blue tone look even better in person. The comparison block helped us make the switch.',
    name: 'Omar Al Fahim',
    role: 'DTC Brand Owner, Dubai',
  },
]

let cleanupMotion: (() => void) | null = null

onMounted(async () => {
  const section = root.value
  if (prefersReducedMotion() || !section) return

  const { gsap } = await load()
  const ctx = gsap.context(() => {
    const revealItems = section.querySelectorAll<HTMLElement>('.story-reveal')
    if (revealItems.length) {
      gsap.from(revealItems, {
        y: 24,
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
  <section id="story" ref="root" class="story-section" aria-labelledby="story-title">
    <div class="story-container">
      <!-- Top Row: Editorial Media + Brand Copy -->
      <div class="story-hero-grid">
        <!-- Left Media Box: clean 1px border, no shadow, no overlay cards -->
        <div class="story-media-card story-reveal" :style="{ backgroundImage: `url(${mainImage})` }" />

        <!-- Right Editorial Column -->
        <div class="story-copy-col story-reveal">
          <span class="story-badge">AAROH STUDIO 2026</span>

          <h2 id="story-title" class="story-heading">
            AAROH | CONSIDERED<br />
            SILHOUETTES BY THE STUDIO
          </h2>

          <p class="story-lead">
            Everyday essentials cut from heavyweight 480 GSM combed cotton. Built in small studio batches
            with zero compromise, structured drop shoulders, and custom hardware made to last a lifetime.
          </p>

          <div class="story-actions">
            <NuxtLink to="/shop" class="story-btn-primary">
              EXPLORE PIECES &gt;
            </NuxtLink>
            <NuxtLink to="/story" class="story-btn-secondary">
              STUDIO LOOKBOOK →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Lower Row: Rating + 3 Testimonial Cards -->
      <div class="story-reviews-grid">
        <!-- Rating Block -->
        <div class="story-score-card story-reveal">
          <div class="story-score-num">4.8/5</div>
          <div class="story-score-stars" aria-label="5 out of 5 stars">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
          <p class="story-score-note">BASED ON 280+ VERIFIED STUDIO CLIENTS</p>
        </div>

        <!-- 3 Review Cards -->
        <div class="story-cards-row">
          <article v-for="(review, index) in reviews" :key="index" class="story-review-card story-reveal">
            <div class="story-card-stars" aria-label="5 stars">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <p class="story-card-text">{{ review.text }}</p>
            <div class="story-card-author">
              <div class="story-card-name">{{ review.name }}</div>
              <div class="story-card-role">{{ review.role }}</div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.story-section {
  position: relative;
  background: #ffffff;
  color: #111111;
  padding: clamp(3.5rem, 6vw, 6.5rem) var(--gutter);
  overflow: hidden;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.story-container {
  max-width: var(--max);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(3.5rem, 6vw, 6rem);
}

/* --- Hero Grid --- */
.story-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(2.5rem, 5vw, 6rem);
}

/* Media Card (Left) */
.story-media-card {
  position: relative;
  width: 100%;
  aspect-ratio: 1.15 / 1;
  min-height: clamp(320px, 38vw, 540px);
  background-size: cover;
  background-position: center top;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: none;
  overflow: hidden;
}

/* Right Column (Editorial) */
.story-copy-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.story-badge {
  display: inline-block;
  background: #000000;
  color: #ffffff;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 11px;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
}

.story-heading {
  font-family: var(--font-logo), 'Space Grotesk', sans-serif;
  font-size: clamp(2rem, 3.8vw, 3.5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: #000000;
  margin: 0 0 clamp(1.2rem, 2.2vw, 1.8rem);
}

.story-lead {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: clamp(0.82rem, 1vw, 0.92rem);
  line-height: 1.72;
  color: #2b2b2b;
  max-width: 48ch;
  margin: 0 0 clamp(1.6rem, 2.8vw, 2.4rem);
}

.story-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem 2rem;
}

.story-btn-primary {
  display: inline-flex;
  align-items: center;
  background: #000000;
  color: #ffffff;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 12px 22px;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease;
}

.story-btn-primary:hover {
  background: #222222;
  transform: translateY(-1px);
}

.story-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #000000;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.story-btn-secondary:hover {
  opacity: 0.7;
}

/* --- Reviews Row --- */
.story-reviews-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: clamp(2rem, 4vw, 4.5rem);
  padding-top: clamp(1.5rem, 3vw, 2.5rem);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.story-score-card {
  min-width: 170px;
}

.story-score-num {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: clamp(3rem, 5.5vw, 4.8rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.05em;
  color: #000000;
}

.story-score-stars {
  display: flex;
  gap: 3px;
  color: #ff5500;
  font-size: 1.05rem;
  margin-top: 10px;
}

.story-score-note {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #777777;
  text-transform: uppercase;
  margin-top: 8px;
  max-width: 18ch;
  line-height: 1.4;
}

.story-cards-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 2vw, 1.8rem);
}

.story-review-card {
  background: #fdfdfd;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: clamp(16px, 2vw, 24px);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.story-card-stars {
  display: flex;
  gap: 2px;
  color: #ff5500;
  font-size: 0.95rem;
  margin-bottom: 12px;
}

.story-card-text {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: clamp(0.74rem, 0.88vw, 0.82rem);
  line-height: 1.62;
  color: #2b2b2b;
  margin: 0 0 16px;
}

.story-card-author {
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
  padding-top: 10px;
}

.story-card-name {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.82rem;
  font-weight: 700;
  color: #000000;
}

.story-card-role {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.7rem;
  color: #777777;
  margin-top: 2px;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .story-hero-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .story-media-card {
    aspect-ratio: 16 / 10;
    min-height: 340px;
  }

  .story-reviews-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .story-cards-row {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
}

@media (max-width: 640px) {
  .story-media-card {
    aspect-ratio: 1 / 1;
    min-height: 290px;
    padding: 14px 16px;
  }

  .story-media-pill {
    padding: 6px 12px;
    gap: 10px;
    font-size: 0.72rem;
  }

  .story-heading {
    font-size: clamp(1.8rem, 8vw, 2.4rem);
  }

  .story-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .story-btn-primary,
  .story-btn-secondary {
    justify-content: center;
  }
}
</style>
