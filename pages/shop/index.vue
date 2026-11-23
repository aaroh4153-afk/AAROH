<script setup lang="ts">
const siteUrl = useRuntimeConfig().public.siteUrl as string
const title = 'Shop the full collection · AAROH.'
const description =
  'Browse every active AAROH. piece. Filter by category and collection, search by colour or style, and sort by price or newest arrivals.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: `${siteUrl}/shop`,
  ogSiteName: 'AAROH.',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}/shop` }],
})
</script>

<template>
  <ProductGrid full-page />
</template>
