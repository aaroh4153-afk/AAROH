import type { Category, Collection, Product } from './products'
import type { Order } from './orders'
import type { StoreSettings } from './settings'

/** The complete dataset the storefront and studio render from. */
export interface StorePayload {
  products: Product[]
  orders: Order[]
  categories: Category[]
  collections: Collection[]
  settings: StoreSettings
}
