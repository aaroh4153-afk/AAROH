<script setup lang="ts">
import type { ShopBanner } from '~/data/banners'

defineProps<{ banner: ShopBanner }>()
</script>

<template>
  <section class="shop-banner" aria-label="Shop collection banner">
    <figure class="shop-banner__panel">
      <img
        :src="banner.image"
        :alt="banner.altText"
        loading="eager"
        fetchpriority="high"
        decoding="async"
      />
    </figure>
  </section>
</template>

<style scoped>
.shop-banner {
  width: 100%;
  padding: clamp(1.5rem, 3vw, 2.75rem) var(--gutter) 0;
  background: var(--surface);
}

.shop-banner__panel {
  position: relative;
  width: min(100%, var(--max));
  height: clamp(16rem, 34vw, 30rem);
  margin-inline: auto;
  overflow: hidden;
  border-radius: 0.85rem;
  background: var(--cream);
  isolation: isolate;
}

.shop-banner__panel img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
}

@media (max-width: 700px) {
  .shop-banner__panel {
    height: clamp(14rem, 62vw, 22rem);
  }
}
</style>
