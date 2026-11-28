<script setup lang="ts">
import { INSTAGRAM_URL } from '~/data/products'
import { useStore } from '~/composables/useStore'
import { useMotion } from '~/composables/useMotion'

const { settings } = useStore()
const root = ref<HTMLElement | null>(null)
const media = ref<HTMLElement | null>(null)
const { load, prefersReducedMotion } = useMotion()

const story = computed(() => settings.value.story)
const reviews = computed(() => story.value.reviews.slice(0, 3))
const mainImage = computed(() => story.value.image)
const titleWords = computed(() =>
  (story.value.heading || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean),
)
const eyebrow = computed(() => story.value.eyebrow || '01 / The story of AAROH.')

// The studio pillars echo the story copy in a plain, ruled list.
const pillars = [
  {
    title: 'Small studio batches',
    body: 'Every piece is cut and sewn in short runs, checked by hand before it leaves the studio.',
  },
  {
    title: 'Considered fabric',
    body: 'Weight, drape and hand-feel come first — fabrics chosen to soften with wear, not pill.',
  },
  {
    title: 'Everyday silhouettes',
    body: 'Quiet shapes that sit between dress-up and off-duty, made for real days and repeat wear.',
  },
  {
    title: 'Built to be re-worn',
    body: 'Reinforced seams and honest finishes, so the essentials stay in the rotation for years.',
  },
]

let cleanupMotion: (() => void) | null = null

onMounted(async () => {
  const section = root.value
  if (prefersReducedMotion() || !section) return

  const { gsap } = await load()

  const ctx = gsap.context(() => {
    // 1. Headline: each word rises out of its own mask.
    gsap.from('.story__word', {
      yPercent: 118,
      duration: 1.05,
      stagger: 0.045,
      ease: 'power4.out',
      scrollTrigger: { trigger: section, start: 'top 78%' },
    })

    // 2. Hairlines draw themselves in from the left.
    gsap.from('.story__rule', {
      scaleX: 0,
      duration: 1.1,
      stagger: 0.12,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: section, start: 'top 76%' },
    })

    // 3. Media: frame opens up while the image settles back from a slight push.
    if (media.value) {
      gsap.from(media.value, {
        clipPath: 'inset(14% 8% 14% 8%)',
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: media.value, start: 'top 85%' },
      })

      gsap.from('.story__media img', {
        scale: 1.18,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: { trigger: media.value, start: 'top 85%' },
      })

      // 4. Slow parallax drift on the image as the section scrolls past.
      if (window.matchMedia('(min-width: 900px)').matches) {
        gsap.to('.story__media img', {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: media.value,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        })
      }
    }

    // 5. Statement and the ruled detail rows.
    gsap.from('.story__lead', {
      y: 34,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.story__statement', start: 'top 84%' },
    })

    gsap.from('.story__aside > *', {
      y: 22,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.story__statement', start: 'top 84%' },
    })

    gsap.from('.story__pillar', {
      y: 26,
      opacity: 0,
      duration: 0.8,
      stagger: 0.09,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.story__pillars', start: 'top 86%' },
    })

    if (section.querySelector('.story__quotes')) {
      gsap.from('.story__quote', {
        y: 24,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.story__quotes', start: 'top 88%' },
      })
    }

    gsap.from('.story__foot', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.story__foot', start: 'top 92%' },
    })
  }, section)

  cleanupMotion = () => ctx.revert()
})

onBeforeUnmount(() => cleanupMotion?.())
</script>

<template>
  <section id="story" ref="root" class="story" aria-labelledby="story-title">
    <div class="story__inner">
      <header class="story__head">
        <p class="story__eyebrow">{{ eyebrow }}</p>
        <p class="story__badge">{{ story.badge }}</p>
      </header>

      <div class="story__rule" aria-hidden="true" />

      <h2 id="story-title" class="story__title">
        <span v-for="(word, index) in titleWords" :key="`${word}-${index}`" class="story__word-mask">
          <span class="story__word">{{ word }}</span>
        </span>
      </h2>

      <div class="story__meta">
        <p class="story__caption">{{ story.caption }}</p>
        <span class="story__scroll">Scroll down
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M7 7 17 17" />
            <path d="M17 7v10H7" />
          </svg>
        </span>
      </div>

      <figure v-if="mainImage" ref="media" class="story__media">
        <img :src="mainImage" :alt="story.imageAlt" loading="lazy" decoding="async" />
      </figure>

      <div class="story__statement">
        <p class="story__lead">{{ story.lead }}</p>

        <aside class="story__aside">
          <p class="story__label">({{ story.noteEyebrow }})</p>
          <div class="story__aside-body">
            <p>{{ story.note }}</p>
            <div v-if="story.rating" class="story__rating">
              <strong>{{ story.rating }}</strong>
              <span>{{ story.ratingNote }}</span>
            </div>
            <a class="story__social" :href="INSTAGRAM_URL" target="_blank" rel="noopener noreferrer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <path d="M17.5 6.5h.01" />
              </svg>
              @aaroh.studio
            </a>
          </div>
        </aside>
      </div>

      <div class="story__rule" aria-hidden="true" />

      <div class="story__pillars">
        <p class="story__label story__label--pillars">(What we make)</p>
        <div class="story__pillar-grid">
          <article v-for="pillar in pillars" :key="pillar.title" class="story__pillar">
            <h3>{{ pillar.title }}</h3>
            <p>{{ pillar.body }}</p>
          </article>
        </div>
      </div>

      <div v-if="reviews.length" class="story__quotes">
        <article v-for="(review, index) in reviews" :key="`${review.name}-${index}`" class="story__quote">
          <p class="story__quote-text">“{{ review.text }}”</p>
          <p class="story__quote-by">
            <span>{{ review.name }}</span>
            <span class="story__quote-role">{{ review.role }}</span>
          </p>
        </article>
      </div>

      <footer class="story__foot">
        <NuxtLink to="/shop" class="story__cta">
          Explore pieces
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </NuxtLink>
        <NuxtLink to="/story" class="story__link">Read the full story</NuxtLink>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.story {
  position: relative;
  padding: clamp(3.5rem, 6vw, 7rem) var(--gutter) clamp(3rem, 5vw, 5.5rem);
  background: var(--surface);
  color: var(--ink);
  overflow: hidden;
  border-top: 1px solid var(--line);
}

.story__inner {
  max-width: var(--max);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
}

/* --- Top meta --- */
.story__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.story__eyebrow,
.story__badge,
.story__label {
  margin: 0;
  font-family: var(--font-outfit);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.story__badge {
  color: var(--text-muted);
}

.story__rule {
  height: 1px;
  background: var(--line-strong);
  transform-origin: left center;
}

/* --- Display headline --- */
.story__title {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.28em;
  margin: clamp(1.4rem, 3vw, 2.6rem) 0 0;
  padding: 0;
  max-width: 18ch;
  font-family: var(--font-logo);
  font-size: clamp(2.7rem, 9.6vw, 8.6rem);
  font-weight: 600;
  line-height: 0.9;
  letter-spacing: -0.045em;
  text-transform: none;
  color: var(--heading-ink);
}

.story__word-mask {
  display: inline-block;
  overflow: hidden;
  padding-bottom: 0.06em;
}

.story__word {
  display: inline-block;
  will-change: transform;
}

.story__title .story__word-mask:nth-last-child(-n + 2) .story__word {
  color: var(--blue);
}

.story__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1.5rem;
  margin-top: clamp(1.2rem, 2.4vw, 2rem);
  padding-bottom: clamp(1.4rem, 3vw, 2.4rem);
  border-bottom: 1px solid var(--line-strong);
}

.story__caption {
  margin: 0;
  font-family: var(--font-outfit);
  font-size: clamp(0.82rem, 1vw, 0.95rem);
  color: var(--text-secondary);
}

.story__scroll {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-outfit);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
}

.story__scroll svg {
  color: var(--blue);
}

/* --- Media --- */
.story__media {
  margin: clamp(1.4rem, 3vw, 2.6rem) 0 0;
  overflow: hidden;
  border-radius: 3px;
  background: var(--bg-subtle);
  aspect-ratio: 16 / 8.4;
  will-change: clip-path;
}

.story__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 28%;
  will-change: transform;
}

/* --- Statement --- */
.story__statement {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: clamp(1.6rem, 4vw, 4rem);
  padding: clamp(1.8rem, 3.6vw, 3.2rem) 0 clamp(1.8rem, 3.6vw, 3rem);
  border-bottom: 1px solid var(--line-strong);
}

.story__lead {
  margin: 0;
  max-width: 22ch;
  font-family: var(--font-logo);
  font-size: clamp(1.5rem, 3.1vw, 2.85rem);
  font-weight: 500;
  line-height: 1.06;
  letter-spacing: -0.03em;
  color: var(--heading-ink);
}

.story__aside {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding-left: clamp(1.2rem, 2.4vw, 2rem);
  border-left: 1px solid var(--line);
}

.story__aside-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

.story__aside-body > p {
  margin: 0;
  max-width: 40ch;
  font-family: var(--font-outfit);
  font-size: clamp(0.82rem, 0.95vw, 0.9rem);
  line-height: 1.65;
  color: var(--text-secondary);
}

.story__rating {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.story__rating strong {
  font-family: var(--font-logo);
  font-size: 1.4rem;
  font-weight: 600;
}

.story__rating span {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.story__social {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-outfit);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
  text-decoration: none;
}

.story__social:hover {
  color: var(--blue);
}

/* --- Ruled pillars --- */
.story__pillars {
  display: grid;
  grid-template-columns: minmax(0, 0.5fr) minmax(0, 2fr);
  gap: clamp(1.4rem, 3vw, 2.6rem);
  padding: clamp(1.8rem, 3.4vw, 2.8rem) 0;
}

.story__label--pillars {
  margin-top: 0.15rem;
}

.story__pillar-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(1.4rem, 3vw, 3rem);
}

.story__pillar {
  padding: 1.1rem 0 1.3rem;
  border-top: 1px solid var(--line);
}

.story__pillar:nth-child(-n + 2) {
  border-top: 0;
  padding-top: 0;
}

.story__pillar h3 {
  margin: 0 0 0.45rem;
  font-family: var(--font-outfit);
  font-size: clamp(1rem, 1.3vw, 1.15rem);
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--heading-ink);
}

.story__pillar p {
  margin: 0;
  max-width: 38ch;
  font-family: var(--font-outfit);
  font-size: clamp(0.76rem, 0.9vw, 0.84rem);
  line-height: 1.6;
  color: var(--text-secondary);
}

/* --- Quotes --- */
.story__quotes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: clamp(1.2rem, 2.4vw, 2.4rem);
  padding: clamp(1.4rem, 2.6vw, 2rem) 0;
  border-top: 1px solid var(--line-strong);
}

.story__quote {
  border-left: 1px solid var(--line);
  padding-left: 1rem;
}

.story__quote-text {
  margin: 0 0 0.7rem;
  font-family: var(--font-outfit);
  font-size: clamp(0.86rem, 1vw, 0.94rem);
  line-height: 1.6;
  color: var(--ink);
}

.story__quote-by {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.story__quote-role {
  color: var(--text-muted);
}

/* --- Footer actions --- */
.story__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: clamp(1.2rem, 2.4vw, 1.8rem);
  border-top: 1px solid var(--line-strong);
}

.story__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.9rem 1.5rem;
  border-radius: 999px;
  background: var(--ink);
  color: var(--white);
  font-family: var(--font-outfit);
  font-size: 0.74rem;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  transition: transform 0.25s var(--ease), background 0.25s var(--ease);
}

.story__cta:hover {
  transform: translateY(-2px);
  background: var(--blue);
}

.story__link {
  font-family: var(--font-outfit);
  font-size: 0.74rem;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
  padding-bottom: 2px;
}

.story__link:hover {
  color: var(--blue);
}

@media (max-width: 900px) {
  .story__title {
    font-size: clamp(2.4rem, 11.5vw, 5rem);
    max-width: 100%;
  }

  .story__statement,
  .story__pillars {
    grid-template-columns: 1fr;
  }

  .story__aside {
    padding-left: 1rem;
  }

  .story__media {
    aspect-ratio: 4 / 3.2;
  }
}

@media (max-width: 640px) {
  .story__head {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.4rem;
  }

  .story__title {
    font-size: clamp(2.2rem, 12.6vw, 3.3rem);
    gap: 0 0.22em;
  }

  .story__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7rem;
  }

  .story__media {
    aspect-ratio: 4 / 4.4;
  }

  .story__pillar-grid {
    grid-template-columns: 1fr;
  }

  .story__pillar:nth-child(2) {
    border-top: 1px solid var(--line);
    padding-top: 1.1rem;
  }

  .story__foot {
    flex-direction: column;
    align-items: stretch;
  }

  .story__cta {
    justify-content: center;
  }

  .story__link {
    align-self: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story__word,
  .story__media,
  .story__media img {
    transform: none !important;
  }
}
</style>
