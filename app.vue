<script setup lang="ts">
const route = useRoute()
const showChrome = computed(() => route.meta.chrome !== false)
</script>

<template>
  <NuxtLayout>
    <template v-if="showChrome">
      <a class="skip-link" href="#main">Skip to content</a>
      <IntroLoader v-if="route.path !== '/story' && route.path !== '/shop'" />
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <NuxtPage />
      </main>
      <SiteFooter />
      <CartDrawer />
    </template>
    <NuxtPage v-else />
  </NuxtLayout>
</template>
