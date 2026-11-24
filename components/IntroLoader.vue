<script setup lang="ts">
import { animate, stagger } from 'animejs'

const letters = ['A', 'A', 'R', 'O', 'H', '.']

const done = ref(false)
const leaving = ref(false)

let hideTimer: ReturnType<typeof setTimeout> | null = null
let exitTimer: ReturnType<typeof setTimeout> | null = null
let introAnimation: { pause: () => void } | null = null

const INTRO_MS = 2900
const STORAGE_KEY = 'aaroh-intro-shown'

function finish() {
  leaving.value = true
  document.documentElement.classList.remove('is-loading')
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Storage can be unavailable in private modes; the loader still works.
  }

  exitTimer = setTimeout(() => {
    done.value = true
  }, 720)
}

function runIntro() {
  document.documentElement.classList.add('is-loading')

  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      done.value = true
      document.documentElement.classList.remove('is-loading')
      return
    }
  } catch {
    // Continue with the intro when storage is blocked.
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduced) {
    hideTimer = setTimeout(finish, 700)
    return
  }

  // The wordmark rises out of its mask, then the editorial lines follow.
  introAnimation = animate('.intro-loader__letter > span', {
    translateY: ['112%', '0%'],
    duration: 1050,
    delay: stagger(64, { start: 180 }),
    ease: 'out(4)',
  })

  animate('.intro-loader__line', {
    translateY: ['118%', '0%'],
    duration: 900,
    delay: stagger(95, { start: 520 }),
    ease: 'out(4)',
  })

  animate('.intro-loader__portrait', {
    scaleY: [0.86, 1],
    opacity: [0, 1],
    duration: 1250,
    delay: 120,
    ease: 'out(3)',
  })

  animate('.intro-loader__portrait img', {
    scale: [1.09, 1],
    duration: 1700,
    delay: 120,
    ease: 'out(3)',
  })

  animate('.intro-loader__meta', {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 620,
    delay: stagger(55, { start: 760 }),
    ease: 'out(3)',
  })

  animate('.intro-loader__rule', {
    scaleX: [0, 1],
    duration: 1000,
    delay: 640,
    ease: 'out(3)',
  })

  hideTimer = setTimeout(finish, INTRO_MS)
}

onMounted(runIntro)

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer)
  if (exitTimer) clearTimeout(exitTimer)
  introAnimation?.pause()
  document.documentElement.classList.remove('is-loading')
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="!done"
      class="intro-loader"
      :class="{ 'intro-loader--leaving': leaving }"
      role="status"
      aria-live="polite"
      aria-label="Loading AAROH."
    >
      <div class="intro-loader__grid">
        <section class="intro-loader__copy">
          <div class="intro-loader__top">
            <span class="intro-loader__meta">AAROH. / Studio</span>
            <span class="intro-loader__meta">Est. 2026 — Mumbai</span>
          </div>

          <div class="intro-loader__middle">
            <div class="intro-loader__wordmark" aria-label="AAROH.">
              <span
                v-for="(letter, index) in letters"
                :key="`${letter}-${index}`"
                class="intro-loader__letter"
                :class="{ 'intro-loader__dot': letter === '.' }"
              ><span>{{ letter === '.' ? '' : letter }}</span></span>
            </div>

            <div class="intro-loader__statement">
              <span class="intro-loader__line-mask">
                <span class="intro-loader__line">Everyday essentials,</span>
              </span>
              <span class="intro-loader__line-mask">
                <span class="intro-loader__line">made to be worn.</span>
              </span>
            </div>
          </div>

          <div class="intro-loader__bottom">
            <span class="intro-loader__meta">01 — The core collection</span>
            <span class="intro-loader__meta">Autumn / Winter ’26</span>
          </div>
        </section>

        <figure class="intro-loader__portrait">
          <img
            src="/images/campaign/hoodie-portrait.png"
            alt="AAROH. royal blue hoodie on a model"
            decoding="async"
          />
          <figcaption>Royal Blue / Core</figcaption>
        </figure>
      </div>

      <span class="intro-loader__rule" aria-hidden="true" />
    </div>
  </Teleport>
</template>

<style scoped>
.intro-loader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  overflow: hidden;
  background: #f4f2ec;
  color: var(--ink);
  transition: opacity 0.7s var(--ease), transform 0.7s var(--ease);
}

.intro-loader--leaving {
  pointer-events: none;
  opacity: 0;
  transform: translateY(-100%);
}

.intro-loader__grid {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: minmax(0, 1.16fr) minmax(0, 0.84fr);
}

.intro-loader__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(1.25rem, 3vh, 2.5rem);
  padding: clamp(1.25rem, 3vw, 3.25rem);
}

.intro-loader__top,
.intro-loader__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}

.intro-loader__meta {
  color: color-mix(in srgb, var(--ink) 62%, transparent);
  font-family: var(--font-outfit);
  font-size: 0.6rem;
  font-weight: 650;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.intro-loader__middle {
  display: grid;
  gap: clamp(1.4rem, 4vh, 3rem);
}

.intro-loader__wordmark {
  display: flex;
  align-items: baseline;
  color: var(--primary);
  font-family: var(--font-logo);
  font-size: clamp(3.2rem, 9.6vw, 8.6rem);
  font-stretch: 120%;
  font-weight: 800;
  letter-spacing: 0.035em;
  line-height: 0.8;
  white-space: nowrap;
}

.intro-loader__letter {
  display: inline-block;
  overflow: hidden;
  padding-block: 0.05em 0.13em;
  margin-block: -0.05em -0.13em;
}

.intro-loader__letter > span {
  display: inline-block;
  will-change: transform;
}

.intro-loader__dot > span::after {
  content: '';
  display: block;
  width: 0.16em;
  height: 0.16em;
  margin-bottom: 0.06em;
  background: currentColor;
}

.intro-loader__statement {
  display: grid;
  gap: 0.1rem;
  max-width: 34ch;
  color: color-mix(in srgb, var(--ink) 78%, transparent);
  font-family: var(--font-logo);
  font-size: clamp(0.82rem, 1.1vw, 1rem);
  font-stretch: 78%;
  font-weight: 550;
  letter-spacing: 0.16em;
  line-height: 1.55;
  text-transform: uppercase;
}

.intro-loader__line-mask {
  display: block;
  overflow: hidden;
}

.intro-loader__line {
  display: block;
  will-change: transform;
}

.intro-loader__portrait {
  position: relative;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  background: var(--primary);
  transform-origin: 50% 100%;
}

.intro-loader__portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 26%;
  filter: grayscale(1) contrast(1.08) brightness(0.96);
  mix-blend-mode: multiply;
  will-change: transform;
}

.intro-loader__portrait figcaption {
  position: absolute;
  right: clamp(1rem, 2.4vw, 2rem);
  bottom: clamp(1rem, 2.4vw, 2rem);
  left: clamp(1rem, 2.4vw, 2rem);
  color: color-mix(in srgb, var(--white) 86%, transparent);
  font-family: var(--font-outfit);
  font-size: 0.58rem;
  font-weight: 650;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.intro-loader__rule {
  position: absolute;
  right: clamp(1.25rem, 3vw, 3.25rem);
  bottom: clamp(4.2rem, 9vh, 6.5rem);
  left: clamp(1.25rem, 3vw, 3.25rem);
  height: 1px;
  background: color-mix(in srgb, var(--ink) 18%, transparent);
  transform-origin: left center;
}

@media (max-width: 820px) {
  .intro-loader__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 40vh) minmax(0, 1fr);
  }

  .intro-loader__portrait {
    grid-row: 1;
  }

  .intro-loader__portrait img {
    object-position: 50% 22%;
  }

  .intro-loader__copy {
    grid-row: 2;
    padding: 1.1rem 1.15rem 1.35rem;
  }

  .intro-loader__wordmark {
    font-size: clamp(3.1rem, 16.5vw, 5.6rem);
  }

  .intro-loader__statement {
    font-size: 0.7rem;
    letter-spacing: 0.13em;
  }

  .intro-loader__meta {
    font-size: 0.52rem;
    letter-spacing: 0.14em;
  }

  .intro-loader__rule {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .intro-loader {
    transition: opacity 0.2s linear;
  }
}
</style>
