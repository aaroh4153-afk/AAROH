import { INSTAGRAM_URL } from './products'

export interface BrandSettings {
  storeName: string
  legalName: string
  email: string
  phone: string
  instagram: string
  gstin: string
  address: string
  currency: string
  freeShipping: number
  flatRate: number
  codLimit: number
}

export interface StorefrontSettings {
  live: boolean
  featuredCollection: string
  announcement: string
}

export interface StoryReview {
  text: string
  name: string
  role: string
  stars: number
}

export interface StorySettings {
  eyebrow: string
  title: string
  titleAccent: string
  intro: string
  image: string
  imageAlt: string
  caption: string
  badge: string
  heading: string
  lead: string
  noteEyebrow: string
  note: string
  rating: string
  ratingNote: string
  reviews: StoryReview[]
}

export interface PaymentSettings {
  upi: boolean
  cards: boolean
  netbanking: boolean
  cod: boolean
}

export interface NotificationSettings {
  newOrder: boolean
  lowStock: boolean
  weeklyDigest: boolean
}

export interface StoreSettings {
  brand: BrandSettings
  storefront: StorefrontSettings
  story: StorySettings
  payments: PaymentSettings
  notifications: NotificationSettings
}

export const defaultSettings: StoreSettings = {
  brand: {
    storeName: 'Aaroh Studio',
    legalName: 'Aaroh Apparel Pvt. Ltd.',
    email: 'studio@aaroh.in',
    phone: '+91 98200 45120',
    instagram: INSTAGRAM_URL,
    gstin: '27AAROH1234F1Z5',
    address: 'Unit 4, Laxmi Woollen Mills, Shakti Mills Lane, Mumbai 400011',
    currency: 'INR',
    freeShipping: 1499,
    flatRate: 79,
    codLimit: 5000,
  },
  storefront: {
    live: true,
    featuredCollection: 'core-blues',
    announcement: 'Free shipping on orders over ₹1,499 · Studio drop 02 is live',
  },
  story: {
    eyebrow: '01 / The story of AAROH.',
    title: 'Everyday essentials,',
    titleAccent: 'made with intent.',
    intro:
      'AAROH. began with stacks of fabric, test pieces, and a simple idea: make thoughtful clothes for everyday life.',
    image: '/images/campaign/hoodie-portrait.png',
    imageAlt: 'AAROH. studio story image',
    caption: 'Made to be worn, again and again.',
    badge: 'AAROH STUDIO',
    heading: 'Considered silhouettes by the studio',
    lead:
      'Everyday essentials made in small studio batches, with thoughtful construction and repeat wear in mind.',
    noteEyebrow: 'A note from the studio',
    note:
      'The AAROH. process is built on learning, making and refining. That spirit remains in every piece: considered essentials made for real days and repeat wear.',
    rating: '',
    ratingNote: '',
    reviews: [],
  },
  payments: {
    upi: true,
    cards: true,
    netbanking: true,
    cod: true,
  },
  notifications: {
    newOrder: true,
    lowStock: true,
    weeklyDigest: false,
  },
}

export function cloneSettings(settings: StoreSettings = defaultSettings): StoreSettings {
  return {
    brand: { ...settings.brand },
    storefront: { ...settings.storefront },
    story: {
      ...settings.story,
      reviews: settings.story.reviews.map((review) => ({ ...review })),
    },
    payments: { ...settings.payments },
    notifications: { ...settings.notifications },
  }
}

export function normalizeSettings(input: Partial<StoreSettings> | null | undefined): StoreSettings {
  const story = input?.story
  const reviews = Array.isArray(story?.reviews)
    ? story.reviews
        .map((review) => ({
          text: String(review?.text ?? '').trim(),
          name: String(review?.name ?? '').trim(),
          role: String(review?.role ?? '').trim(),
          stars: Math.min(5, Math.max(1, Math.round(Number(review?.stars) || 5))),
        }))
        .filter((review) => review.text && review.name)
    : defaultSettings.story.reviews

  return {
    brand: { ...defaultSettings.brand, ...(input?.brand ?? {}) },
    storefront: { ...defaultSettings.storefront, ...(input?.storefront ?? {}) },
    story: {
      ...defaultSettings.story,
      ...(story ?? {}),
      reviews,
    },
    payments: { ...defaultSettings.payments, ...(input?.payments ?? {}) },
    notifications: { ...defaultSettings.notifications, ...(input?.notifications ?? {}) },
  }
}
