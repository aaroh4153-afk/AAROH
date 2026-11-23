<script setup lang="ts">
import { animate } from 'animejs'

withDefaults(
  defineProps<{
    variant?: 'hero' | 'footer' | 'product'
  }>(),
  { variant: 'hero' },
)

const root = ref<HTMLElement | null>(null)

let animations: Array<{ pause: () => void }> = []

onMounted(() => {
  if (!root.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  animations = [
    animate('.spot-art__spin', {
      rotate: [0, 360],
      duration: 26000,
      loop: true,
      ease: 'linear',
    }),
    animate('.spot-art__pulse', {
      scale: [0.88, 1.08],
      opacity: [0.45, 0.95],
      duration: 2400,
      alternate: true,
      loop: true,
      ease: 'inOut(2)',
    }),
    animate('.spot-art__float', {
      y: [-5, 9],
      x: [-2, 3],
      duration: 3400,
      alternate: true,
      loop: true,
      ease: 'inOut(2)',
    }),
  ]
})

onBeforeUnmount(() => {
  animations.forEach((animation) => animation.pause())
  animations = []
})
</script>

<template>
  <div ref="root" class="spot-art" :class="`spot-art--${variant}`" aria-hidden="true">
    <svg class="spot-art__item spot-art__orbit spot-art__spin" viewBox="0 0 160 160" fill="none">
      <circle cx="80" cy="80" r="64" stroke="currentColor" stroke-width="1" stroke-dasharray="2 10" />
      <circle cx="80" cy="16" r="4" fill="currentColor" />
      <path d="M80 6v20M80 134v20M6 80h20M134 80h20" stroke="currentColor" stroke-width="1.4" />
    </svg>

    <svg class="spot-art__item spot-art__star spot-art__pulse" viewBox="0 0 100 100" fill="none">
      <path
        d="M50 4c2.8 23.4 22.6 43.2 46 46-23.4 2.8-43.2 22.6-46 46-2.8-23.4-22.6-43.2-46-46C27.4 47.2 47.2 27.4 50 4Z"
        stroke="currentColor"
        stroke-width="1.6"
      />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
    </svg>

    <svg class="spot-art__item spot-art__wave spot-art__float" viewBox="0 0 220 60" fill="none">
      <path
        d="M4 38c18-24 36-24 54 0s36 24 54 0 36-24 54 0 32 18 50-4"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>

    <svg class="spot-art__item spot-art__burst spot-art__spin" viewBox="0 0 120 120" fill="none">
      <path
        d="M60 8v104M8 60h104M23 23l74 74M97 23 23 97"
        stroke="currentColor"
        stroke-width="1.2"
      />
      <circle cx="60" cy="60" r="18" stroke="currentColor" stroke-width="1.2" />
    </svg>

    <span class="spot-art__label">AW / 26</span>
  </div>
</template>

<style scoped>
.spot-art {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  color: rgba(30, 64, 255, 0.22);
  pointer-events: none;
  user-select: none;
}

.spot-art__item {
  position: absolute;
  display: block;
  overflow: visible;
}

.spot-art__orbit {
  top: 4%;
  right: 2.4%;
  width: clamp(110px, 13vw, 210px);
  height: auto;
}

.spot-art__star {
  top: 8%;
  left: 1.5%;
  width: clamp(48px, 5.6vw, 92px);
  height: auto;
  color: rgba(226, 59, 46, 0.38);
}

.spot-art__wave {
  right: 8%;
  bottom: 8%;
  width: clamp(120px, 15vw, 250px);
  height: auto;
  color: rgba(255, 214, 0, 0.7);
}

.spot-art__burst {
  bottom: 1%;
  left: 4%;
  width: clamp(72px, 8vw, 126px);
  height: auto;
  color: rgba(30, 64, 255, 0.2);
}

.spot-art__label {
  position: absolute;
  right: 4.5%;
  bottom: 6%;
  color: rgba(11, 18, 32, 0.34);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  writing-mode: vertical-rl;
}

.spot-art--footer {
  color: rgba(255, 214, 0, 0.28);
}

.spot-art--footer .spot-art__star {
  top: 8%;
  left: auto;
  right: 5%;
  width: clamp(60px, 7vw, 116px);
  color: rgba(255, 214, 0, 0.62);
}

.spot-art--footer .spot-art__orbit {
  top: auto;
  right: -2%;
  bottom: 18%;
  width: clamp(150px, 21vw, 330px);
  color: rgba(255, 255, 255, 0.12);
}

.spot-art--footer .spot-art__wave {
  right: auto;
  bottom: 22%;
  left: 3%;
  color: rgba(255, 180, 195, 0.4);
}

.spot-art--footer .spot-art__burst {
  top: 10%;
  bottom: auto;
  left: 42%;
  color: rgba(255, 255, 255, 0.1);
}

.spot-art--footer .spot-art__label {
  right: auto;
  bottom: 12%;
  left: 3%;
  color: rgba(242, 239, 228, 0.34);
}

.spot-art--product {
  color: rgba(30, 64, 255, 0.16);
}

.spot-art--product .spot-art__orbit {
  top: 2%;
  right: 4%;
  width: clamp(120px, 17vw, 250px);
}

.spot-art--product .spot-art__star {
  top: auto;
  bottom: 6%;
  left: 4%;
  width: clamp(52px, 6vw, 88px);
}

.spot-art--product .spot-art__wave {
  display: none;
}

.spot-art--product .spot-art__burst {
  top: 12%;
  bottom: auto;
  left: auto;
  right: 30%;
  width: clamp(80px, 10vw, 150px);
}

@media (max-width: 900px) {
  .spot-art__orbit,
  .spot-art--footer .spot-art__orbit {
    width: 120px;
    opacity: 0.75;
  }

  .spot-art__wave {
    width: 130px;
  }

  .spot-art__burst {
    width: 86px;
  }

  .spot-art__label {
    display: none;
  }
}
</style>
