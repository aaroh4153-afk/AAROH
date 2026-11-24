<script setup lang="ts">
withDefaults(
  defineProps<{
    items?: string[]
    duration?: number
  }>(),
  {
    items: () => [
      'ARCHITECTURAL SILHOUETTE',
      '480 GSM HEAVYWEIGHT FLEECE',
      'ZERO COMPROMISE',
      'SMALL-BATCH PRODUCTION',
      'CUSTOM HARDWARE',
      'CRAFTED IN INDIA',
      'MADE TO BE WORN',
    ],
    duration: 32,
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
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: #ffffff;
  color: #111111;
  padding: clamp(10px, 1.2vw, 15px) 0;
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
  gap: clamp(14px, 2vw, 24px);
  padding-right: clamp(14px, 2vw, 24px);
}

.marquee__word {
  font-family: var(--font-mono), 'Space Mono', 'SF Mono', monospace;
  font-size: clamp(0.74rem, 1.05vw, 0.92rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #111111;
}

.marquee__star {
  color: #888888;
  font-size: clamp(0.6rem, 0.8vw, 0.76rem);
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
