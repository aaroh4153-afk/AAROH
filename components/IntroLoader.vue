<script setup lang="ts">
import { animate, stagger } from 'animejs'

const letters = ['A', 'A', 'R', 'O', 'H', '.']

const done = ref(false)
const leaving = ref(false)
const root = ref<HTMLElement | null>(null)

let hideTimer: ReturnType<typeof setTimeout> | null = null
let exitTimer: ReturnType<typeof setTimeout> | null = null
let introAnimation: { pause: () => void } | null = null

const INTRO_MS = 3000
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
    hideTimer = setTimeout(finish, 600)
    return
  }

  // Logo only: each letter rises out of its own mask, then the wordmark settles.
  introAnimation = animate('.intro-loader__letter', {
    translateY: ['110%', '0%'],
    rotate: [4, 0],
    opacity: [0, 1],
    duration: 1000,
    delay: stagger(70, { start: 160 }),
    ease: 'out(4)',
  })

  animate('.intro-loader__logo', {
    scale: [0.97, 1],
    duration: 1800,
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
      ref="root"
      class="intro-loader"
      :class="{ 'intro-loader--leaving': leaving }"
      role="status"
      aria-live="polite"
      aria-label="Loading AAROH."
    >
      <div class="intro-loader__logo" aria-label="AAROH.">
        <span
          v-for="(letter, index) in letters"
          :key="`${letter}-${index}`"
          class="intro-loader__letter"
          :class="{ 'intro-loader__dot': letter === '.' }"
        ><span>{{ letter === '.' ? '' : letter }}</span></span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.intro-loader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--brand-navy);
  color: var(--white);
  transition: opacity 0.7s var(--ease), transform 0.7s var(--ease);
}

.intro-loader--leaving {
  pointer-events: none;
  opacity: 0;
  transform: translateY(-100%);
}

.intro-loader__logo {
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-inline: var(--gutter);
  color: var(--white);
  font-family: var(--font-logo);
  font-size: clamp(4.2rem, 14vw, 13.5rem);
  font-stretch: 125%;
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: -0.065em;
  white-space: nowrap;
  will-change: transform;
}

.intro-loader__letter {
  display: inline-block;
  overflow: hidden;
  padding-block: 0.04em 0.12em;
  margin-block: -0.04em -0.12em;
}

.intro-loader__letter > span {
  display: inline-block;
  will-change: transform, opacity;
}

/* Square period, matching the logo artwork. */
.intro-loader__dot > span::after {
  content: '';
  display: block;
  width: 0.17em;
  height: 0.17em;
  margin-bottom: 0.07em;
  background: currentColor;
}

@media (prefers-reduced-motion: reduce) {
  .intro-loader {
    transition: opacity 0.2s linear;
  }
}
</style>
