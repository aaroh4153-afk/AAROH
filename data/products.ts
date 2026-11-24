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

export const categories: Category[] = [
  { id: 'hoodies', name: 'Hoodies', blurb: 'Brushed fleece, one considered silhouette.' },
  { id: 'shirts', name: 'Shirts', blurb: 'Poplin, oxford and linen in quiet colour.' },
  { id: 'tees', name: 'Tees', blurb: 'Heavyweight everyday layers.' },
  { id: 'outerwear', name: 'Outerwear', blurb: 'Field jackets built for the in-between.' },
]

export const collections: Collection[] = [
  {
    id: 'core-blues',
    name: 'The Core Blues',
    blurb: 'Six considered blues, one silhouette.',
    description:
      'The AAROH. hoodie in six blues — from ice to midnight. Cut for layering, made to be lived in.',
    image: '/images/products/hoodie-hanger-front.png',
    tint: '#1E40FF',
  },
  {
    id: 'everyday',
    name: 'Everyday Shirts',
    blurb: 'Soft structure for the working week.',
    description:
      'Poplin, oxford and linen shirts with an easy line. Quiet colour, honest fabric, everyday wear.',
    image: '/images/products/shirt-white-front.png',
    tint: '#C9D4C4',
  },
  {
    id: 'studio-drop',
    name: 'Studio Drop 02',
    blurb: 'The limited cut of the season.',
    description:
      'Small-batch pieces from the studio — deeper colour, a sharper line and only a few of each.',
    image: '/images/products/shirt-charcoal-front.png',
    tint: '#3C414A',
  },
  {
    id: 'layering',
    name: 'The Layering Edit',
    blurb: 'Hoodies and jackets that carry the weather.',
    description:
      'Light layers that work together — a hoodie under a field jacket, always with room to move.',
    image: '/images/campaign/yellow-jacket.jpg',
    tint: '#E8C24B',
  },
]

const coreSizes = (xs: number, s: number, m: number, l: number, xl: number): ProductSize[] => [
  { size: 'XS', stock: xs },
  { size: 'S', stock: s },
  { size: 'M', stock: m },
  { size: 'L', stock: l },
  { size: 'XL', stock: xl },
]

// The AAROH. hoodie in six considered blues. One silhouette, one price.
export const products: Product[] = [
  {
    id: 'core-lavender',
    sku: 'ARH-HD-001',
    name: 'Royal Blue Hoodie',
    colour: 'Royal Blue',
    hex: '#1E40FF',
    category: 'hoodies',
    collection: 'core-blues',
    price: 1499,
    compareAtPrice: 1899,
    description:
      'The piece that started the rail. A quiet, everyday hoodie cut with room to move — soft structure, a clean line and the AAROH. blue that works with everything already in your wardrobe.',
    details: [
      'Relaxed, unisex cut with a dropped shoulder',
      'Heavyweight brushed fleece, finished by hand in small batches',
      'Kangaroo pocket, ribbed cuffs and hem',
      'Cold wash, inside out. Line dry in shade.',
    ],
    images: [
      '/images/products/hoodie-hanger-front.png',
      '/images/products/hoodie-side.png',
      '/images/campaign/hoodie-portrait.png',
    ],
    sizes: coreSizes(4, 14, 20, 12, 6),
    status: 'active',
    featured: true,
    rail: true,
    createdAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'core-ivory',
    sku: 'ARH-HD-002',
    name: 'Cobalt Hoodie',
    colour: 'Cobalt Blue',
    hex: '#2563EB',
    category: 'hoodies',
    collection: 'core-blues',
    price: 1499,
    compareAtPrice: 1899,
    description:
      'A brighter take on the core hoodie. Cobalt sits between the deep indigo and the ice blue — saturated enough to carry an outfit, calm enough for every day.',
    details: [
      'Relaxed, unisex cut with a dropped shoulder',
      'Heavyweight brushed fleece',
      'Kangaroo pocket, ribbed cuffs and hem',
      'Cold wash, inside out. Line dry in shade.',
    ],
    images: ['/images/products/hoodie-hanger-front.png', '/images/products/hoodie-side.png'],
    sizes: coreSizes(3, 10, 16, 9, 4),
    status: 'active',
    featured: true,
    rail: true,
    createdAt: '2026-09-02T10:05:00.000Z',
  },
  {
    id: 'core-cream',
    sku: 'ARH-HD-003',
    name: 'Indigo Hoodie',
    colour: 'Deep Indigo',
    hex: '#2B3FA8',
    category: 'hoodies',
    collection: 'core-blues',
    price: 1499,
    compareAtPrice: 1899,
    description:
      'Deep indigo, almost navy in low light. The same soft, roomy hoodie with a colour that reads quiet and grounded.',
    details: [
      'Relaxed, unisex cut with a dropped shoulder',
      'Heavyweight brushed fleece',
      'Kangaroo pocket, ribbed cuffs and hem',
      'Cold wash, inside out. Line dry in shade.',
    ],
    images: ['/images/products/hoodie-hanger-front.png', '/images/products/hoodie-side.png'],
    sizes: coreSizes(2, 8, 14, 8, 4),
    status: 'active',
    featured: true,
    rail: true,
    createdAt: '2026-09-02T10:10:00.000Z',
  },
  {
    id: 'core-mist',
    sku: 'ARH-HD-004',
    name: 'Midnight Hoodie',
    colour: 'Midnight Navy',
    hex: '#0B1220',
    category: 'hoodies',
    collection: 'core-blues',
    price: 1499,
    compareAtPrice: 1899,
    description:
      'The darkest point on the rail. Midnight is the hoodie you keep by the door — easy with denim, easy with wool.',
    details: [
      'Relaxed, unisex cut with a dropped shoulder',
      'Heavyweight brushed fleece',
      'Kangaroo pocket, ribbed cuffs and hem',
      'Cold wash, inside out. Line dry in shade.',
    ],
    images: ['/images/products/hoodie-hanger-front.png', '/images/products/hoodie-side.png'],
    sizes: coreSizes(1, 6, 11, 7, 3),
    status: 'active',
    featured: false,
    rail: true,
    createdAt: '2026-09-02T10:15:00.000Z',
  },
  {
    id: 'core-oat',
    sku: 'ARH-HD-005',
    name: 'Azure Hoodie',
    colour: 'Soft Azure',
    hex: '#3B82F6',
    category: 'hoodies',
    collection: 'core-blues',
    price: 1499,
    compareAtPrice: 1899,
    description:
      'A softer, sunlit blue. Azure keeps the shape and weight of the core hoodie but lightens the whole outfit.',
    details: [
      'Relaxed, unisex cut with a dropped shoulder',
      'Heavyweight brushed fleece',
      'Kangaroo pocket, ribbed cuffs and hem',
      'Cold wash, inside out. Line dry in shade.',
    ],
    images: ['/images/products/hoodie-hanger-front.png', '/images/products/hoodie-side.png'],
    sizes: coreSizes(0, 0, 3, 2, 1),
    status: 'active',
    featured: false,
    rail: true,
    createdAt: '2026-09-02T10:20:00.000Z',
  },
  {
    id: 'core-sage',
    sku: 'ARH-HD-006',
    name: 'Ice Hoodie',
    colour: 'Ice Blue',
    hex: '#BFD8FF',
    category: 'hoodies',
    collection: 'core-blues',
    price: 1499,
    compareAtPrice: 1899,
    description:
      'The palest blue on the rail. Ice is for bright mornings and open skies — the same hoodie, barely there.',
    details: [
      'Relaxed, unisex cut with a dropped shoulder',
      'Heavyweight brushed fleece',
      'Kangaroo pocket, ribbed cuffs and hem',
      'Cold wash, inside out. Line dry in shade.',
    ],
    images: ['/images/products/hoodie-hanger-front.png', '/images/products/hoodie-side.png'],
    sizes: coreSizes(0, 0, 0, 0, 0),
    status: 'active',
    featured: false,
    rail: true,
    createdAt: '2026-09-02T10:25:00.000Z',
  },
  {
    id: 'ivory-overshirt',
    sku: 'ARH-SH-101',
    name: 'Ivory Overshirt',
    colour: 'Ivory',
    hex: '#EFE9DA',
    category: 'shirts',
    collection: 'everyday',
    price: 1299,
    compareAtPrice: 1599,
    description:
      'A crisp ivory overshirt with a boxy, relaxed line. Worn open over a tee or buttoned to the top — it holds its shape either way.',
    details: [
      'Relaxed overshirt fit, true to size',
      'Mid-weight cotton poplin with a dry hand-feel',
      'Corozo buttons, single chest pocket',
      'Machine wash cold, warm iron',
    ],
    images: ['/images/products/shirt-white-front.png', '/images/products/shirt-white-side.png'],
    sizes: coreSizes(2, 9, 15, 9, 4),
    status: 'active',
    featured: true,
    createdAt: '2026-10-11T09:20:00.000Z',
  },
  {
    id: 'forest-oxford',
    sku: 'ARH-SH-102',
    name: 'Forest Oxford',
    colour: 'Forest Green',
    hex: '#3E5A44',
    category: 'shirts',
    collection: 'everyday',
    price: 1249,
    description:
      'An oxford in deep forest. Heavier than poplin, softer with every wash, and quietly good under a hoodie.',
    details: [
      'Classic oxford fit with a soft collar',
      'Brushed cotton oxford, woven in India',
      'Single chest pocket, horn-look buttons',
      'Machine wash cold, line dry',
    ],
    images: ['/images/products/shirt-forest-front.png', '/images/products/shirt-forest-side.png'],
    sizes: coreSizes(1, 7, 13, 8, 3),
    status: 'active',
    featured: false,
    createdAt: '2026-10-04T09:20:00.000Z',
  },
  {
    id: 'charcoal-studio',
    sku: 'ARH-SH-103',
    name: 'Charcoal Studio Shirt',
    colour: 'Charcoal',
    hex: '#3C414A',
    category: 'shirts',
    collection: 'studio-drop',
    price: 1349,
    description:
      'From the studio drop: a charcoal shirt cut a little longer, with a soft point collar and a clean, hidden placket.',
    details: [
      'Longline studio fit',
      'Garment-dyed cotton with a matte finish',
      'Hidden placket, tonal buttons',
      'Machine wash cold, inside out',
    ],
    images: ['/images/products/shirt-charcoal-front.png', '/images/products/shirt-charcoal-side.png'],
    sizes: coreSizes(0, 2, 3, 1, 0),
    status: 'active',
    featured: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'cream-relaxed',
    sku: 'ARH-SH-104',
    name: 'Cream Relaxed Shirt',
    colour: 'Cream',
    hex: '#EDE3CC',
    category: 'shirts',
    collection: 'studio-drop',
    price: 1149,
    description:
      'A cream shirt with an easy, lived-in collar. The kind of piece that makes the rest of an outfit look considered.',
    details: [
      'Relaxed fit with a camp-style collar',
      'Lightweight cotton with a soft wash',
      'Mother-of-pearl buttons',
      'Machine wash cold, warm iron',
    ],
    images: ['/images/products/shirt-cream-front.png', '/images/products/shirt-cream-side.png'],
    sizes: coreSizes(1, 6, 10, 7, 3),
    status: 'active',
    featured: false,
    createdAt: '2026-10-22T11:40:00.000Z',
  },
  {
    id: 'sage-linen',
    sku: 'ARH-SH-105',
    name: 'Sage Linen Shirt',
    colour: 'Sage',
    hex: '#9CAF9B',
    category: 'shirts',
    collection: 'everyday',
    price: 1299,
    description:
      'A washed linen shirt in muted sage. Breathes in the heat, layers under knitwear, and creases like it means it.',
    details: [
      'Relaxed fit, softly structured',
      '100% washed linen',
      'Coconut buttons, single chest pocket',
      'Machine wash cold, line dry',
    ],
    images: ['/images/products/shirt-sage-front.png', '/images/products/shirt-sage-side.png'],
    sizes: coreSizes(2, 8, 13, 8, 4),
    status: 'active',
    featured: false,
    createdAt: '2026-10-15T12:10:00.000Z',
  },
  {
    id: 'stone-poplin',
    sku: 'ARH-SH-106',
    name: 'Stone Poplin Shirt',
    colour: 'Stone',
    hex: '#C8BFB0',
    category: 'shirts',
    collection: 'everyday',
    price: 1199,
    description:
      'Stone poplin with a quiet, neutral tone. A clean everyday shirt that sits between smart and soft.',
    details: [
      'Regular fit with a curved hem',
      'Crisp cotton poplin',
      'Single chest pocket',
      'Machine wash cold, warm iron',
    ],
    images: ['/images/products/shirt-stone-front.png', '/images/products/shirt-stone-side.png'],
    sizes: coreSizes(0, 5, 11, 6, 3),
    status: 'active',
    featured: false,
    createdAt: '2026-09-28T10:30:00.000Z',
  },
  {
    id: 'lavender-sunday',
    sku: 'ARH-SH-107',
    name: 'Lavender Sunday Shirt',
    colour: 'Lavender',
    hex: '#B9A8D6',
    category: 'shirts',
    collection: 'studio-drop',
    price: 1249,
    description:
      'A soft lavender shirt for slow days. The studio cut is roomy through the body with a narrow, tidy collar.',
    details: [
      'Relaxed studio fit',
      'Cotton-linen blend with a soft wash',
      'Tonal buttons, single chest pocket',
      'Machine wash cold, line dry',
    ],
    images: ['/images/products/shirt-lavender-front.png', '/images/products/shirt-lavender-side.png'],
    sizes: coreSizes(1, 4, 8, 5, 2),
    status: 'active',
    featured: true,
    createdAt: '2026-11-03T09:10:00.000Z',
  },
  {
    id: 'denim-blue-shirt',
    sku: 'ARH-SH-108',
    name: 'Denim Blue Shirt',
    colour: 'Denim Blue',
    hex: '#4A6E96',
    category: 'shirts',
    collection: 'studio-drop',
    price: 1399,
    description:
      'A shirt in washed denim blue, cut like your favourite overshirt. Soft enough from the first wear.',
    details: [
      'Boxy overshirt fit',
      'Washed cotton denim',
      'Twin chest pockets',
      'Machine wash cold, inside out',
    ],
    images: ['/images/products/shirt-denim-blue.png', '/images/products/shirt-denim-side.png'],
    sizes: coreSizes(0, 4, 7, 5, 2),
    status: 'active',
    featured: false,
    createdAt: '2026-10-30T14:20:00.000Z',
  },
  {
    id: 'cobalt-camp',
    sku: 'ARH-SH-109',
    name: 'Cobalt Camp Shirt',
    colour: 'Cobalt',
    hex: '#2F5FB3',
    category: 'shirts',
    collection: 'studio-drop',
    price: 1349,
    description:
      'The camp collar, in cobalt. A short, boxy cut with a fluid drape — holiday shirt energy, everyday fabric.',
    details: [
      'Boxy camp-collar fit',
      'Fluid viscose-cotton blend',
      'Open collar, straight hem',
      'Machine wash cold, cool iron',
    ],
    images: ['/images/products/shirt-cobalt-front.png', '/images/products/shirt-cobalt-side.png'],
    sizes: coreSizes(0, 3, 8, 5, 2),
    status: 'active',
    featured: false,
    createdAt: '2026-10-08T16:00:00.000Z',
  },
  {
    id: 'oat-heavy-tee',
    sku: 'ARH-TS-201',
    name: 'Oat Heavy Tee',
    colour: 'Oat',
    hex: '#D8CBB4',
    category: 'tees',
    collection: 'everyday',
    price: 799,
    description:
      'A heavyweight cotton tee in warm oat. Substantial enough to wear alone, soft enough to layer under everything.',
    details: [
      'Relaxed fit, dropped shoulder',
      '240gsm combed cotton jersey',
      'Ribbed neckline, twin-needle hem',
      'Machine wash cold, line dry',
    ],
    images: ['/images/products/shirt-oat-front.png', '/images/products/shirt-oat-side.png'],
    sizes: coreSizes(3, 12, 18, 11, 6),
    status: 'active',
    featured: false,
    createdAt: '2026-09-18T10:00:00.000Z',
  },
  {
    id: 'mist-everyday-tee',
    sku: 'ARH-TS-202',
    name: 'Mist Everyday Tee',
    colour: 'Mist',
    hex: '#C7D2CF',
    category: 'tees',
    collection: 'everyday',
    price: 799,
    description:
      'The same heavy tee in a cool mist grey. An easy base layer that keeps its shape wash after wash.',
    details: [
      'Relaxed fit, dropped shoulder',
      '240gsm combed cotton jersey',
      'Ribbed neckline, twin-needle hem',
      'Machine wash cold, line dry',
    ],
    images: ['/images/products/shirt-mist-front.png', '/images/products/shirt-mist-side.png'],
    sizes: coreSizes(2, 9, 14, 8, 4),
    status: 'active',
    featured: false,
    createdAt: '2026-09-18T10:10:00.000Z',
  },
  {
    id: 'saffron-field-jacket',
    sku: 'ARH-OW-301',
    name: 'Saffron Field Jacket',
    colour: 'Saffron',
    hex: '#E8C24B',
    category: 'outerwear',
    collection: 'layering',
    price: 2499,
    compareAtPrice: 2999,
    description:
      'A field jacket in saffron, cut to layer over a hoodie. Four utility pockets, a soft stand collar and a hem that sits just right.',
    details: [
      'Relaxed field-jacket fit',
      'Mid-weight cotton twill with a dry finish',
      'Four patch pockets, corozo buttons',
      'Spot clean or dry clean',
    ],
    images: ['/images/campaign/yellow-jacket.jpg'],
    sizes: coreSizes(0, 2, 4, 2, 1),
    status: 'active',
    featured: true,
    createdAt: '2026-11-05T12:00:00.000Z',
  },
]

/** The six hoodies that hang on the 3D rail in the hero. */
export const railProducts: Product[] = products.filter((product) => product.rail)

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

/** Six considered blues reserved exclusively for the HeroSection 3D rail. */
export const heroRailHoodies: Product[] = products.filter((product) => product.rail)
