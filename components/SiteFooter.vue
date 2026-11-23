<script setup lang="ts">
import { animate, stagger } from 'animejs'
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from '../data/products'
import { useMotion } from '../composables/useMotion'

const root = ref<HTMLElement | null>(null)
const motionReady = ref(false)
const revealed = ref(false)
const { prefersReducedMotion } = useMotion()

let observer: IntersectionObserver | null = null
let fallbackTimer: ReturnType<typeof setTimeout> | null = null

function backToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

function reveal() {
  if (revealed.value) return
  revealed.value = true

  animate('.footer-reveal', {
    y: [20, 0],
    opacity: [0, 1],
    duration: 700,
    delay: stagger(55),
    ease: 'out(3)',
  })
}

onMounted(() => {
  if (prefersReducedMotion()) {
    revealed.value = true
    return
  }

  motionReady.value = true

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        reveal()
        observer?.disconnect()
      }
    },
    { threshold: 0.04 },
  )

  if (root.value) observer.observe(root.value)

  // Safety net: the footer must never stay hidden if the observer misses.
  fallbackTimer = setTimeout(reveal, 2200)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (fallbackTimer) clearTimeout(fallbackTimer)
})
</script>

<template>
  <footer ref="root" class="site-footer" :class="{ 'site-footer--motion': motionReady }">
    <section class="site-footer__content" aria-label="AAROH. footer information">
      <header class="site-footer__top">
        <NuxtLink class="site-footer__logo footer-reveal" to="/" aria-label="AAROH. home">AAROH.</NuxtLink>
        <p class="site-footer__tagline footer-reveal">Everyday essentials, made to be worn.</p>

        <nav class="site-footer__social footer-reveal" aria-label="Follow AAROH.">
          <a
            class="site-footer__social-btn"
            :href="INSTAGRAM_URL"
            target="_blank"
            rel="noopener"
            aria-label="AAROH. on Instagram"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none" />
            </svg>
          </a>

          <a
            class="site-footer__social-btn"
            :href="FACEBOOK_URL"
            target="_blank"
            rel="noopener"
            aria-label="AAROH. on Facebook"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M14.5 8.5h2.3V5.4h-2.6c-2.3 0-3.8 1.5-3.8 3.9v1.8H8v3.2h2.4V21h3.4v-6.7h2.4l.5-3.2h-2.9V9.6c0-.8.3-1.1 1-1.1Z" />
            </svg>
          </a>

          <a
            class="site-footer__social-btn"
            :href="TIKTOK_URL"
            target="_blank"
            rel="noopener"
            aria-label="AAROH. on TikTok"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M14 4v10.2a3.4 3.4 0 1 1-3-3.4" />
              <path d="M14 4c.4 2.3 1.9 3.7 4.2 4v3a7 7 0 0 1-4.2-1.5" />
            </svg>
          </a>
        </nav>

        <a class="btn site-footer__cta footer-reveal" :href="INSTAGRAM_URL" target="_blank" rel="noopener">
          Become a founding member
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </header>

      <nav class="site-footer__columns footer-reveal" aria-label="Footer navigation">
        <span class="site-footer__label">Explore</span>
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/#ready-to-wear">Shop</NuxtLink>
        <NuxtLink to="/#categories">Categories</NuxtLink>
        <NuxtLink to="/#campaign">Campaign</NuxtLink>
        <NuxtLink to="/dashboard">Brand dashboard</NuxtLink>
        <NuxtLink to="/admin">Admin console</NuxtLink>

        <span class="site-footer__label">Benefits</span>
        <NuxtLink to="/#ready-to-wear">Core collection</NuxtLink>
        <NuxtLink to="/#ready-to-wear">New season</NuxtLink>
        <NuxtLink to="/story">Our story</NuxtLink>
        <button type="button" @click="backToTop">Back to top</button>

        <span class="site-footer__label">Contact</span>
        <a href="mailto:hello@aaroh.in">hello@aaroh.in</a>
        <a :href="INSTAGRAM_URL" target="_blank" rel="noopener">Instagram</a>
        <a :href="FACEBOOK_URL" target="_blank" rel="noopener">Facebook</a>
        <a :href="TIKTOK_URL" target="_blank" rel="noopener">TikTok</a>
      </nav>

      <section class="site-footer__bottom footer-reveal" aria-label="Copyright and policies">
        <span>© 2026 AAROH. All rights reserved.</span>
        <span class="site-footer__legal">
          <a href="mailto:hello@aaroh.in">Privacy</a>
          <a href="mailto:hello@aaroh.in">Terms</a>
        </span>
        <span>Made with intent in India.</span>
      </section>
    </section>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  isolation: isolate;
  display: flex;
  width: 100%;
  min-height: clamp(35rem, 48vw, 42rem);
  padding: clamp(3.5rem, 6vw, 5.5rem) var(--gutter) clamp(1.5rem, 2.5vw, 2rem);
  overflow: hidden;
  background-color: var(--rust);
  background-image:
    linear-gradient(
      108deg,
      var(--upi-orange) 0%,
      color-mix(in srgb, var(--red) 72%, var(--upi-orange)) 52%,
      color-mix(in srgb, var(--rust) 45%, var(--ink)) 100%
    );
  color: var(--white);
}

.site-footer::before {
  position: absolute;
  inset-block: 0;
  right: 0;
  z-index: 0;
  width: min(56vw, 48rem);
  background: url('/images/campaign/yellow-jacket.jpg') 52% 26% / cover no-repeat;
  content: '';
  mix-blend-mode: multiply;
  opacity: 0.82;
  mask-image: linear-gradient(90deg, transparent 0%, black 24%);
  pointer-events: none;
}

.site-footer__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 82.5rem;
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(2rem, 4vw, 3rem);
}

.site-footer__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.75rem, 1.5vw, 1.15rem);
  text-align: center;
}

.site-footer__logo {
  color: var(--white);
  font-family: var(--font-logo);
  font-size: clamp(3.8rem, 8vw, 7rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.075em;
  text-decoration: none;
}

.site-footer__tagline {
  max-width: 34ch;
  color: color-mix(in srgb, var(--white) 88%, transparent);
  font-family: var(--font-outfit);
  font-size: clamp(0.85rem, 1.2vw, 1rem);
  line-height: 1.45;
}

.site-footer__social {
  display: flex;
  gap: 0.5rem;
}

.site-footer__social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid color-mix(in srgb, var(--white) 48%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--white) 8%, transparent);
  color: var(--white);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.site-footer__social-btn:hover {
  background: var(--white);
  color: var(--red);
}

.site-footer__cta {
  display: inline-flex;
  min-height: 3.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  margin-top: 0.5rem;
  padding-inline: 1.75rem;
  border: 1px solid color-mix(in srgb, var(--white) 18%, transparent);
  border-radius: var(--pill);
  background: var(--ink);
  color: var(--white);
  font-size: 0.82rem;
  text-decoration: none;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.site-footer__cta:hover {
  transform: translateY(-0.125rem);
  background: color-mix(in srgb, var(--ink) 82%, var(--red));
}

.site-footer__columns {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.8rem clamp(0.85rem, 1.8vw, 1.6rem);
  padding-block: clamp(1.35rem, 2.6vw, 2rem);
  border-block: 1px solid color-mix(in srgb, var(--white) 27%, transparent);
}

.site-footer__label {
  margin-inline-start: 0.45rem;
  color: color-mix(in srgb, var(--white) 70%, transparent);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
}

.site-footer__columns a,
.site-footer__columns button {
  position: relative;
  padding: 0;
  border: none;
  background: none;
  color: var(--white);
  font-family: var(--font-outfit);
  font-size: clamp(0.78rem, 1vw, 0.9rem);
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.site-footer__columns a:hover,
.site-footer__columns button:hover {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.site-footer__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem 1.5rem;
  color: color-mix(in srgb, var(--white) 78%, transparent);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
}

.site-footer__legal {
  display: flex;
  gap: 1rem;
}

.site-footer__legal a {
  color: inherit;
  text-decoration: none;
}

.site-footer__legal a:hover {
  color: var(--white);
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.site-footer--motion .footer-reveal {
  opacity: 0;
}

@media (max-width: 47.5rem) {
  .site-footer {
    min-height: 35rem;
    padding-block: 3.5rem 1.5rem;
  }

  .site-footer::before {
    width: 100%;
    opacity: 0.38;
    background-position: 62% 24%;
    mask-image: linear-gradient(180deg, black 0%, transparent 92%);
  }

  .site-footer__content {
    gap: 2rem;
  }

  .site-footer__columns {
    gap: 0.85rem 1rem;
    padding-block: 1.5rem;
  }

  .site-footer__bottom {
    justify-content: center;
    text-align: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-footer--motion .footer-reveal {
    opacity: 1;
  }
}
</style>
