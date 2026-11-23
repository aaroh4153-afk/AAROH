import type { Product } from '~/data/products'
import blueHoodieMockup from '~/Blue Aaroh Hoodie Mockup.png'

const blueHoodieRailImages = [
  blueHoodieMockup,
  '/images/products/hoodie-side.png',
]

export function getHeroRailImages(product: Product): string[] {
  if (product.id === 'blue-huddle-2') return blueHoodieRailImages
  return product.images
}
