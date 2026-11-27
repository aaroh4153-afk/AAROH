export interface AccountProfile {
  uid: string
  email: string
  displayName: string
  phone: string
  photoUrl: string
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface UserAddress {
  id: string
  label: string
  name: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type AddressInput = Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>

export interface AccountCartLine {
  id: string
  productId: string
  name: string
  colour: string
  price: number
  image: string
  quantity: number
  size?: string
}

/** Everything the account card, the tabs and checkout hydrate from one request. */
export interface AccountOverview {
  profile: AccountProfile
  addresses: UserAddress[]
  orders: import('./orders').Order[]
  cart: AccountCartLine[]
  wishlist: string[]
}

export interface CheckoutItemInput {
  productId: string
  size: string
  quantity: number
}

export interface CheckoutCustomerInput {
  name: string
  phone: string
  line1: string
  line2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  deliveryInstructions?: string
  specialRequests?: string
}

export interface CheckoutOrderInput {
  customer: CheckoutCustomerInput
  items: CheckoutItemInput[]
  paymentMethod: 'UPI' | 'Card' | 'Net Banking' | 'Cash on Delivery'
  notes?: string
  addressId?: string
  idempotencyKey: string
}
