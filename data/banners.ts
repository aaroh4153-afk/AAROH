export interface StoreBanner {
  id: string
  image: string
  altText: string
  position: number
}

export interface CampaignBanner {
  image: string
  altText: string
  label: string
  season: string
  title: string
  note: string
  ctaLabel: string
  ctaHref: string
}

export interface ShopBanner {
  image: string
  altText: string
  eyebrow: string
  title: string
  note: string
}

export interface PageBanners {
  campaign: CampaignBanner
  shop: ShopBanner
}

export const defaultPageBanners: PageBanners = {
  campaign: {
    image: '/images/campaign/hoodie-portrait.png',
    altText: 'AAROH. campaign model wearing the royal blue hoodie',
    label: '03 — THE CAMPAIGN',
    season: 'AUTUMN / WINTER ’26',
    title:
      'ARCHITECTURAL CUTS. WEIGHT WITHOUT COMPROMISE. SILHOUETTES CRAFTED FOR DAILY REPETITION.',
    note: 'Engineered with structured drop shoulders, custom-dyed royal blue 480 GSM fleece, and obsessive stitch density. Every piece is cut in small studio batches to age gracefully and become your primary wardrobe foundation.',
    ctaLabel: 'EXPLORE THE COLLECTION',
    ctaHref: '/shop',
  },
  shop: {
    image: '',
    altText: 'AAROH. collection editorial',
    eyebrow: 'The full collection',
    title: 'Everyday essentials, made to be worn.',
    note: 'Small-batch hoodies, shirts and layers in a quiet, considered palette.',
  },
}

export function clonePageBanners(banners: PageBanners = defaultPageBanners): PageBanners {
  return {
    campaign: { ...banners.campaign },
    shop: { ...banners.shop },
  }
}
