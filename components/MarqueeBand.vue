<script setup lang="ts">
withDefaults(
  defineProps<{
    items?: string[]
    duration?: number
  }>(),
  {
    items: () => [
      'Everyday essentials',
      'Quiet confidence',
      'The core collection',
      'Made to be worn',
    ],
    duration: 34,
  },
)
</script>

<template>
  <div class="marquee" aria-hidden="true">
    <div class="marquee__track" :style="{ animationDuration: `${duration}s` }">
      <div v-for="copy in 2" :key="copy" class="marquee__group">
        <template v-for="(item, index) in items" :key="`${copy}-${index}`">
          <span class="marquee__word">{{ item }}</span>
          <span class="marquee__star">✦</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee {
  position: relative;
  overflow: hidden;
  border-block: 1.5px solid var(--ink);
  background: var(--ink);
  color: var(--cream);
}

.marquee__track {
  display: flex;
  width: max-content;
  animation-name: marquee;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

.marquee__group {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: clamp(18px, 2.6vw, 38px);
  padding: clamp(13px, 1.6vw, 21px) clamp(18px, 2.6vw, 38px) clamp(13px, 1.6vw, 21px) 0;
}

.marquee__word {
  font-size: clamp(1.25rem, 2.5vw, 2.35rem);
  font-stretch: 118%;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.035em;
  text-transform: uppercase;
  white-space: nowrap;
}

.marquee__star {
  color: var(--sky);
  font-size: clamp(0.6rem, 1vw, 0.9rem);
  line-height: 1;
}

@keyframes marquee {
  to {
    transform: translate3d(-50%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee__track {
    animation: none;
  }
}
</style>
