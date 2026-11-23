<script setup lang="ts">
import { INSTAGRAM_URL } from '~/data/products'

const siteUrl = useRuntimeConfig().public.siteUrl as string
const title = 'AAROH. | Everyday essentials, made to be worn'
const description =
  'Shop the AAROH. collection — hoodies, shirts and layers in a quiet, considered palette. Browse by category or collection, choose your size, and check live stock. From ₹799.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: siteUrl,
  ogSiteName: 'AAROH.',
  ogImage: `${siteUrl}/og-image.png`,
  ogImageAlt: 'The AAROH. royal blue hoodie on a wooden hanger',
  twitterCard: 'summary_large_image',
  robots: 'index, follow, max-image-preview:large',
})

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'AAROH.',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'AAROH.',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      founder: { '@type': 'Person', name: 'Harshikesh' },
      sameAs: [INSTAGRAM_URL],
    },
  ],
}

useHead({
  link: [{ rel: 'canonical', href: siteUrl }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(schema) }],
})
</script>

<template>
  <div class="home">
    <HeroSection />
    <MarqueeBand />
    <ProductGrid />
    <EditorialBanners />
    <StorySection />
    <CampaignSection />
  </div>
</template>
