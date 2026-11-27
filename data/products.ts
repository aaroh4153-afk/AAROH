export const INSTAGRAM_URL = 'https://www.instagram.com/_aaroh.in/'

// Update these two handles if the studio opens dedicated profiles.
export const FACEBOOK_URL = 'https://www.facebook.com/_aaroh.in'
export const TIKTOK_URL = 'https://www.tiktok.com/@_aaroh.in'

export type ProductStatus = 'active' | 'draft' | 'archived'
export type SizeName = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface ProductSize {
  size: SizeName
  stock: number
}

export interface Product {
  id: string
  sku: string
  name: string
  colour: string
  hex: string
  category: string
  collection: string
  /** Selling price in INR. */
  price: number
  /** Original price in INR, when the piece is on offer. */
  compareAtPrice?: number
  description: string
  details: string[]
  images: string[]
  sizes: ProductSize[]
  status: ProductStatus
  featured: boolean
  /** Sits on the 3D rail in the hero. */
  rail?: boolean
  createdAt: string
}

export interface Category {
  id: string
  name: string
  blurb: string
}

export interface Collection {
  id: string
  name: string
  blurb: string
  description: string
  image: string
  tint: string
}

export function totalStock(product: Product): number {
  return product.sizes.reduce((total, size) => total + size.stock, 0)
}

export type StockState = 'in' | 'low' | 'out'

export function stockState(product: Product): StockState {
  const total = totalStock(product)
  if (total <= 0) return 'out'
  return total <= 10 ? 'low' : 'in'
}

export function stockLabel(product: Product): string {
  const state = stockState(product)
  if (state === 'out') return 'Sold out'
  if (state === 'low') return `Only ${totalStock(product)} left`
  return 'In stock'
}

export function firstAvailableSize(product: Product): SizeName | null {
  const size = product.sizes.find((entry) => entry.stock > 0)
  return size ? size.size : null
}

export function discountPercent(product: Product): number | null {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return null
  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
}
