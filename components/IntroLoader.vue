<script setup lang="ts">
const done = ref(false)
const leaving = ref(false)

const STORAGE_KEY = 'aaroh-intro-shown'
const INTRO_MS = 1400

function finish() {
  leaving.value = true
  document.documentElement.classList.remove('is-loading')
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Session storage fallback
  }

  setTimeout(() => {
    done.value = true
  }, 750)
}

onMounted(() => {
  document.documentElement.classList.add('is-loading')

  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      done.value = true
      document.documentElement.classList.remove('is-loading')
      return
    }
  } catch {
    // Continue
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    setTimeout(finish, 600)
    return
  }

  setTimeout(finish, INTRO_MS)
})
</script>

<template>
  <div
    v-if="!done"
    class="intro-splash"
    :class="{ 'intro-splash--leaving': leaving }"
    aria-hidden="true"
  >
    <div class="intro-splash__inner">
      <h1 class="intro-splash__wordmark">AAROH.</h1>
    </div>
  </div>
</template>

<style scoped>
.intro-splash {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0012db;
  color: #ffffff;
  user-select: none;
  pointer-events: auto;
  transition: transform 0.75s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.75s ease;
  will-change: transform;
}

.intro-splash--leaving {
  transform: translateY(-100%);
  pointer-events: none;
}

.intro-splash__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: splashFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.intro-splash__wordmark {
  margin: 0;
  font-family: var(--font-logo), 'Space Grotesk', -apple-system, sans-serif;
  font-size: clamp(3.5rem, 12vw, 8rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #ffffff;
  line-height: 1;
}

@keyframes splashFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .intro-splash {
    transition: opacity 0.3s ease;
  }
  .intro-splash--leaving {
    transform: none;
    opacity: 0;
  }
  .intro-splash__inner {
    animation: none;
  }
}
</style>
