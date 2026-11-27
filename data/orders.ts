import type { SizeName } from './products'

export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed'
export type DeliveryStatus = 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned'
export type PaymentMethod = 'UPI' | 'Card' | 'Net Banking' | 'Cash on Delivery'

export interface Customer {
  name: string
  email: string
  phone: string
  line1: string
  /** Apartment, floor or building, when supplied. */
  line2?: string
  city: string
  state: string
  pincode: string
  /** Optional delivery context collected at checkout. */
  landmark?: string
  deliveryInstructions?: string
  specialRequests?: string
}

export interface OrderItem {
  productId: string
  name: string
  image: string
  size: SizeName
  quantity: number
  /** Price per unit, in INR. */
  price: number
}

export interface Order {
  id: string
  customer: Customer
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  deliveryStatus: DeliveryStatus
  placedAt: string
  channel: 'Online store' | 'Instagram' | 'Quick sell'
  notes?: string
}

export const paymentMethods: PaymentMethod[] = ['UPI', 'Card', 'Net Banking', 'Cash on Delivery']
export const paymentStatuses: PaymentStatus[] = ['Paid', 'Pending', 'Refunded', 'Failed']
export const deliveryStatuses: DeliveryStatus[] = [
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
]
