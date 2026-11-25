import { products, type Product, type SizeName } from './products'

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

/** Fixed sample clock so the demo is identical on the server and the client. */
const REFERENCE = new Date('2026-11-17T12:00:00+05:30')

function daysAgo(days: number, hour = 11, minute = 20): string {
  const date = new Date(REFERENCE)
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function findProduct(id: string): Product {
  const product = products.find((entry) => entry.id === id)
  if (!product) throw new Error(`Unknown product in seed order: ${id}`)
  return product
}

function line(productId: string, size: SizeName, quantity: number): OrderItem {
  const product = findProduct(productId)
  return {
    productId,
    name: product.name,
    image: product.images[0]!,
    size,
    quantity,
    price: product.price,
  }
}

interface SeedOrder {
  id: string
  customer: Customer
  items: OrderItem[]
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  deliveryStatus: DeliveryStatus
  placedAt: string
  channel: Order['channel']
  shipping?: number
  discount?: number
  notes?: string
}

function make(seed: SeedOrder): Order {
  const subtotal = seed.items.reduce((total, item) => total + item.price * item.quantity, 0)
  const shipping = seed.shipping ?? 0
  const discount = seed.discount ?? 0
  return {
    ...seed,
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
  }
}

const customers: Record<string, Customer> = {
  aarav: {
    name: 'Aarav Mehta',
    email: 'aarav.mehta@gmail.com',
    phone: '+91 98200 45120',
    line1: '12 Hill Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
  },
  ananya: {
    name: 'Ananya Rao',
    email: 'ananya.rao@outlook.com',
    phone: '+91 98860 71234',
    line1: '44, 5th Block, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560095',
  },
  ishita: {
    name: 'Ishita Kapoor',
    email: 'ishita.k@icloud.com',
    phone: '+91 98110 62890',
    line1: 'B-9, Greater Kailash II',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110048',
  },
  kabir: {
    name: 'Kabir Sethi',
    email: 'kabir.sethi@gmail.com',
    phone: '+91 99870 14502',
    line1: '702, Lakeview Residency, Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
  },
  meera: {
    name: 'Meera Nair',
    email: 'meera.nair@yahoo.com',
    phone: '+91 97440 33871',
    line1: '18, Marine Drive, Fort Kochi',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682001',
  },
  rohan: {
    name: 'Rohan Bhatia',
    email: 'rohan.bhatia@gmail.com',
    phone: '+91 98180 55210',
    line1: '504, Sector 45',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122003',
  },
  sara: {
    name: 'Sara Iyer',
    email: 'sara.iyer@gmail.com',
    phone: '+91 99400 22894',
    line1: '27, Besant Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600090',
  },
  vihaan: {
    name: 'Vihaan Joshi',
    email: 'vihaan.joshi@proton.me',
    phone: '+91 98230 90116',
    line1: '9, Koregaon Park Lane 5',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
  },
  diya: {
    name: 'Diya Malhotra',
    email: 'diya.malhotra@gmail.com',
    phone: '+91 98730 44562',
    line1: '61, Salt Lake Sector 2',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
  },
  arjun: {
    name: 'Arjun Menon',
    email: 'arjun.menon@gmail.com',
    phone: '+91 95390 71208',
    line1: '14, Panampilly Nagar',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682036',
  },
  naina: {
    name: 'Naina Shah',
    email: 'naina.shah@gmail.com',
    phone: '+91 99040 66129',
    line1: '8, C.G. Road, Navrangpura',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380009',
  },
  aditya: {
    name: 'Aditya Verma',
    email: 'aditya.verma@gmail.com',
    phone: '+91 94150 78320',
    line1: '22, Civil Lines',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302006',
  },
}

export const seedOrders: Order[] = [
  make({
    id: 'ARH-1084',
    customer: customers.aarav!,
    items: [line('core-lavender', 'L', 1), line('oat-heavy-tee', 'M', 1)],
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryStatus: 'Processing',
    placedAt: daysAgo(0, 10, 42),
    channel: 'Online store',
  }),
  make({
    id: 'ARH-1083',
    customer: customers.ananya!,
    items: [line('charcoal-studio', 'M', 1)],
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    deliveryStatus: 'Packed',
    placedAt: daysAgo(0, 9, 18),
    channel: 'Online store',
    discount: 100,
  }),
  make({
    id: 'ARH-1082',
    customer: customers.ishita!,
    items: [line('sage-linen', 'S', 1), line('mist-everyday-tee', 'S', 2)],
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryStatus: 'Shipped',
    placedAt: daysAgo(1, 18, 4),
    channel: 'Instagram',
  }),
  make({
    id: 'ARH-1081',
    customer: customers.kabir!,
    items: [line('saffron-field-jacket', 'L', 1)],
    paymentMethod: 'Net Banking',
    paymentStatus: 'Paid',
    deliveryStatus: 'Shipped',
    placedAt: daysAgo(1, 14, 30),
    channel: 'Online store',
  }),
  make({
    id: 'ARH-1080',
    customer: customers.meera!,
    items: [line('cream-relaxed', 'M', 1), line('stone-poplin', 'M', 1)],
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    deliveryStatus: 'Processing',
    placedAt: daysAgo(2, 12, 12),
    channel: 'Online store',
    shipping: 79,
    notes: 'Please call before delivery.',
  }),
  make({
    id: 'ARH-1079',
    customer: customers.rohan!,
    items: [line('core-ivory', 'XL', 2)],
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(3, 16, 45),
    channel: 'Online store',
    discount: 200,
  }),
  make({
    id: 'ARH-1078',
    customer: customers.sara!,
    items: [line('lavender-sunday', 'M', 1)],
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(4, 11, 5),
    channel: 'Instagram',
  }),
  make({
    id: 'ARH-1077',
    customer: customers.vihaan!,
    items: [line('denim-blue-shirt', 'L', 1), line('core-mist', 'L', 1)],
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(5, 19, 22),
    channel: 'Online store',
  }),
  make({
    id: 'ARH-1076',
    customer: customers.diya!,
    items: [line('cobalt-camp', 'S', 1)],
    paymentMethod: 'Card',
    paymentStatus: 'Refunded',
    deliveryStatus: 'Returned',
    placedAt: daysAgo(6, 13, 40),
    channel: 'Online store',
    notes: 'Size exchange requested — refunded to card.',
  }),
  make({
    id: 'ARH-1075',
    customer: customers.arjun!,
    items: [line('forest-oxford', 'M', 1), line('oat-heavy-tee', 'L', 1)],
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(7, 10, 16),
    channel: 'Instagram',
  }),
  make({
    id: 'ARH-1074',
    customer: customers.naina!,
    items: [line('ivory-overshirt', 'S', 1)],
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(8, 15, 8),
    channel: 'Online store',
  }),
  make({
    id: 'ARH-1073',
    customer: customers.aditya!,
    items: [line('core-cream', 'M', 1)],
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(9, 17, 55),
    channel: 'Quick sell',
    shipping: 79,
  }),
  make({
    id: 'ARH-1072',
    customer: customers.aarav!,
    items: [line('saffron-field-jacket', 'M', 1), line('stone-poplin', 'L', 1)],
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(10, 12, 0),
    channel: 'Online store',
    discount: 150,
  }),
  make({
    id: 'ARH-1071',
    customer: customers.ananya!,
    items: [line('core-sage', 'S', 1)],
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(11, 9, 30),
    channel: 'Instagram',
  }),
  make({
    id: 'ARH-1070',
    customer: customers.ishita!,
    items: [line('sage-linen', 'M', 2)],
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(12, 14, 15),
    channel: 'Online store',
    discount: 200,
  }),
  make({
    id: 'ARH-1069',
    customer: customers.kabir!,
    items: [line('charcoal-studio', 'L', 1)],
    paymentMethod: 'UPI',
    paymentStatus: 'Failed',
    deliveryStatus: 'Cancelled',
    placedAt: daysAgo(12, 20, 5),
    channel: 'Online store',
    notes: 'Payment failed at checkout. Customer reordered as ARH-1081.',
  }),
  make({
    id: 'ARH-1068',
    customer: customers.meera!,
    items: [line('core-oat', 'M', 1)],
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(13, 11, 48),
    channel: 'Instagram',
  }),
  make({
    id: 'ARH-1067',
    customer: customers.rohan!,
    items: [line('lavender-sunday', 'L', 1), line('mist-everyday-tee', 'M', 1)],
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    deliveryStatus: 'Delivered',
    placedAt: daysAgo(14, 16, 25),
    channel: 'Online store',
  }),
]

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
