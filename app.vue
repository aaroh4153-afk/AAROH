<script setup lang="ts">
const route = useRoute()
const showChrome = computed(() => route.meta.chrome !== false)
</script>

<template>
  <NuxtLayout>
    <a v-if="showChrome" class="skip-link" href="#main">Skip to content</a>
    <IntroLoader v-if="showChrome && route.path !== '/story' && route.path !== '/shop'" />
    <AnnouncementBar v-if="showChrome" />
    <SiteHeader v-if="showChrome" />
    <component :is="showChrome ? 'main' : 'div'" id="main">
      <NuxtPage />
    </component>
    <SiteFooter v-if="showChrome" />
    <CartDrawer v-if="showChrome" />
  </NuxtLayout>
</template>
