import type { Product } from '~/data/products'

export const defaultRailHoodieImages = [
  '/images/products/hoodie-front.png',
  '/images/products/hoodie-side.png',
]

export function getHeroRailImages(product: Product): string[] {
  // If the product specifically defines at least 2 images, use them, otherwise use the canonical front + side rail hoodies
  if (product.images && product.images.length >= 2) {
    return [product.images[0] || defaultRailHoodieImages[0], product.images[1] || defaultRailHoodieImages[1]]
  }
  return defaultRailHoodieImages
}

