import type { Product } from '~/data/products'

export function getHeroRailImages(product: Product): string[] {
  const front = product.images[0]
  if (!front) return []
  return [front, product.images[1] || front]
}

