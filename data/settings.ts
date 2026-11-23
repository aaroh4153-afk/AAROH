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
    payments: { ...settings.payments },
    notifications: { ...settings.notifications },
  }
}

export function normalizeSettings(input: Partial<StoreSettings> | null | undefined): StoreSettings {
  return {
    brand: { ...defaultSettings.brand, ...(input?.brand ?? {}) },
    storefront: { ...defaultSettings.storefront, ...(input?.storefront ?? {}) },
    payments: { ...defaultSettings.payments, ...(input?.payments ?? {}) },
    notifications: { ...defaultSettings.notifications, ...(input?.notifications ?? {}) },
  }
}
