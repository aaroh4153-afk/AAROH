import type { Product } from '~/data/products'

const blueHoodieRailImages = [
  '/images/products/hoodie-hanger-front.png',
  '/images/products/hoodie-side.png',
]

export function getHeroRailImages(product: Product): string[] {
  if (product.id === 'blue-huddle-2') return blueHoodieRailImages
  return product.images
}
