<script setup lang="ts">
import { defaultPageBanners, type PageBanners } from '~/data/banners'

const siteUrl = useRuntimeConfig().public.siteUrl as string
const title = 'Shop the full collection · AAROH.'
const description =
  'Browse every active AAROH. piece. Filter by category and collection, search by colour or style, and sort by price or newest arrivals.'

const { data: pageBanners } = await useFetch<PageBanners>('/api/page-banners', {
  default: () => defaultPageBanners,
})

const shopBanner = computed(() => ({
  ...defaultPageBanners.shop,
  ...(pageBanners.value?.shop ?? {}),
}))

const hasBanner = computed(() => Boolean(shopBanner.value.image))

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
  <div class="shop-page">
    <ShopBanner v-if="hasBanner" :banner="shopBanner" />
    <ProductGrid full-page :hide-editorial="hasBanner" />
  </div>
</template>
