import { createError } from 'h3'
import type { PoolClient } from 'pg'
import type {
  Category,
  Collection,
  Product,
  ProductSize,
  ProductStatus,
  SizeName,
} from '~/data/products'
import type {
  Customer,
  DeliveryStatus,
  Order,
  OrderItem,
  PaymentMethod,
  PaymentStatus,
} from '~/data/orders'
import { deliveryStatuses, paymentStatuses } from '~/data/orders'
import type { StorePayload } from '~/data/store'
import {
  defaultSettings,
  normalizeSettings,
  type StoreSettings,
} from '~/data/settings'
import { query, resetDatabase, withTransaction } from './db'

interface CategoryRow {
  id: string
  name: string
  blurb: string
  position: number
}

interface CollectionRow {
  id: string
  name: string
  blurb: string
  description: string
  image: string
  tint: string
  position: number
}

interface ProductRow {
  id: string
  sku: string
  name: string
  colour: string
  hex: string
  category_id: string
  collection_id: string
  price: number
  compare_at_price: number | null
  description: string
  details: unknown
  images: unknown
  status: ProductStatus
  featured: boolean
  rail: boolean
  created_at: Date | string
}

interface SizeRow {
  product_id: string
  size: SizeName
  stock: number
}

interface OrderRow {
  id: string
  customer: Customer | string
  subtotal: number
  shipping: number
  discount: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  delivery_status: DeliveryStatus
  placed_at: Date | string
  channel: Order['channel']
  notes: string | null
}

interface OrderItemRow {
  order_id: string
  product_id: string
  name: string
  image: string
  size: SizeName
  quantity: number
  price: number
}

interface SettingsRow {
  value: StoreSettings | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : []
}

function toCustomer(value: Customer | string): Customer {
  return typeof value === 'string' ? (JSON.parse(value) as Customer) : value
}

function toProduct(row: ProductRow, sizes: ProductSize[]): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    colour: row.colour,
    hex: row.hex,
    category: row.category_id,
    collection: row.collection_id,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    description: row.description,
    details: toStringArray(row.details),
    images: toStringArray(row.images),
    sizes,
    status: row.status,
    featured: row.featured,
    rail: row.rail ? true : undefined,
    createdAt: toIso(row.created_at),
  }
}

function toOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    customer: toCustomer(row.customer),
    items,
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount,
    total: row.total,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    deliveryStatus: row.delivery_status,
    placedAt: toIso(row.placed_at),
    channel: row.channel,
    notes: row.notes ?? undefined,
  }
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    productId: row.product_id,
    name: row.name,
    image: row.image,
    size: row.size,
    quantity: row.quantity,
    price: row.price,
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

async function nextSku(client: PoolClient): Promise<string> {
  const { rows } = await client.query<{ sku: string }>('SELECT sku FROM products')
  const numbers = rows
    .map((row) => Number(row.sku.split('-').pop()))
    .filter((value) => Number.isFinite(value))
  const next = (numbers.length ? Math.max(...numbers) : 100) + 1
  return `ARH-NEW-${String(next).padStart(3, '0')}`
}

export function parseProductInput(input: unknown, fallbackId?: string): Product {
  if (!input || typeof input !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product payload' })
  }

  const body = input as Record<string, unknown>
  const name = String(body.name ?? '').trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Product name is required' })
  }

  const id = String(body.id ?? fallbackId ?? slugify(name)).trim()
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product id is required' })
  }

  const sizes = (Array.isArray(body.sizes) ? body.sizes : [])
    .map((entry) => {
      const row = entry as Record<string, unknown>
      return {
        size: String(row.size ?? '').trim() as SizeName,
        stock: Math.max(0, Math.round(Number(row.stock) || 0)),
      }
    })
    .filter((entry) => entry.size)

  if (!sizes.length) {
    throw createError({ statusCode: 400, statusMessage: 'At least one size is required' })
  }

  const status = ['active', 'draft', 'archived'].includes(String(body.status))
    ? (String(body.status) as ProductStatus)
    : 'draft'

  const compareAtPrice =
    body.compareAtPrice === undefined || body.compareAtPrice === null || body.compareAtPrice === ''
      ? undefined
      : Math.max(0, Math.round(Number(body.compareAtPrice) || 0))

  return {
    id,
    sku: String(body.sku ?? '').trim(),
    name,
    colour: String(body.colour ?? '').trim() || 'Natural',
    hex: String(body.hex ?? '').trim() || '#1E40FF',
    category: String(body.category ?? '').trim() || 'hoodies',
    collection: String(body.collection ?? '').trim() || 'core-blues',
    price: Math.max(0, Math.round(Number(body.price) || 0)),
    compareAtPrice,
    description: String(body.description ?? '').trim(),
    details: toStringArray(body.details),
    images: toStringArray(body.images),
    sizes,
    status,
    featured: Boolean(body.featured),
    rail: Boolean(body.rail),
    createdAt: String(body.createdAt ?? new Date().toISOString()),
  }
}

export async function loadCategories(): Promise<Category[]> {
  const { rows } = await query<CategoryRow>(
    'SELECT id, name, blurb, position FROM categories ORDER BY position ASC, name ASC',
  )
  return rows.map((row) => ({ id: row.id, name: row.name, blurb: row.blurb }))
}

export async function loadCollections(): Promise<Collection[]> {
  const { rows } = await query<CollectionRow>(
    `SELECT id, name, blurb, description, image, tint, position
     FROM collections
     ORDER BY position ASC, name ASC`,
  )
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    blurb: row.blurb,
    description: row.description,
    image: row.image,
    tint: row.tint,
  }))
}

export async function loadProducts(): Promise<Product[]> {
  const [productResult, sizeResult] = await Promise.all([
    query<ProductRow>('SELECT * FROM products ORDER BY position ASC, created_at DESC, id ASC'),
    query<SizeRow>('SELECT product_id, size, stock FROM product_sizes ORDER BY position ASC, size ASC'),
  ])

  const sizesByProduct = new Map<string, ProductSize[]>()
  for (const row of sizeResult.rows) {
    const sizes = sizesByProduct.get(row.product_id) ?? []
    sizes.push({ size: row.size, stock: row.stock })
    sizesByProduct.set(row.product_id, sizes)
  }

  return productResult.rows.map((row) => toProduct(row, sizesByProduct.get(row.id) ?? []))
}

export async function loadProduct(id: string): Promise<Product | null> {
  const productResult = await query<ProductRow>('SELECT * FROM products WHERE id = $1', [id])
  const row = productResult.rows[0]
  if (!row) return null

  const sizeResult = await query<SizeRow>(
    `SELECT product_id, size, stock
     FROM product_sizes
     WHERE product_id = $1
     ORDER BY position ASC, size ASC`,
    [id],
  )

  return toProduct(
    row,
    sizeResult.rows.map((size) => ({ size: size.size, stock: size.stock })),
  )
}

export async function loadOrders(): Promise<Order[]> {
  const [orderResult, itemResult] = await Promise.all([
    query<OrderRow>('SELECT * FROM orders ORDER BY placed_at DESC, id DESC'),
    query<OrderItemRow>('SELECT * FROM order_items ORDER BY order_id ASC, position ASC'),
  ])

  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const row of itemResult.rows) {
    const items = itemsByOrder.get(row.order_id) ?? []
    items.push(toOrderItem(row))
    itemsByOrder.set(row.order_id, items)
  }

  return orderResult.rows.map((row) => toOrder(row, itemsByOrder.get(row.id) ?? []))
}

export async function loadOrder(id: string): Promise<Order | null> {
  const orderResult = await query<OrderRow>('SELECT * FROM orders WHERE id = $1', [id])
  const row = orderResult.rows[0]
  if (!row) return null

  const itemResult = await query<OrderItemRow>(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY position ASC',
    [id],
  )

  return toOrder(row, itemResult.rows.map(toOrderItem))
}

export async function loadSettings(): Promise<StoreSettings> {
  const { rows } = await query<SettingsRow>("SELECT value FROM settings WHERE key = 'store'")
  const value = rows[0]?.value

  if (!value) return normalizeSettings(defaultSettings)
  return normalizeSettings(typeof value === 'string' ? (JSON.parse(value) as StoreSettings) : value)
}

export async function saveSettings(input: unknown): Promise<StoreSettings> {
  const settings = normalizeSettings(input as Partial<StoreSettings>)

  await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('store', $1::jsonb, now())
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(settings)],
  )

  return settings
}

export async function loadStore(): Promise<StorePayload> {
  const [products, orders, categories, collections, settings] = await Promise.all([
    loadProducts(),
    loadOrders(),
    loadCategories(),
    loadCollections(),
    loadSettings(),
  ])

  return { products, orders, categories, collections, settings }
}

export async function upsertProduct(product: Product): Promise<Product> {
  const sizes = product.sizes.map((size, index) => ({
    size: size.size,
    stock: Math.max(0, Math.round(Number(size.stock) || 0)),
    position: index,
  }))

  return withTransaction(async (client) => {
    const sku = product.sku.trim() || (await nextSku(client))

    const result = await client.query<ProductRow>(
      `INSERT INTO products (
         id, sku, name, colour, hex, category_id, collection_id, price,
         compare_at_price, description, details, images, status, featured,
         rail, created_at, position
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11::jsonb, $12::jsonb, $13, $14,
         $15, $16, COALESCE((SELECT MIN(position) - 1 FROM products), 0)
       )
       ON CONFLICT (id) DO UPDATE SET
         sku = EXCLUDED.sku,
         name = EXCLUDED.name,
         colour = EXCLUDED.colour,
         hex = EXCLUDED.hex,
         category_id = EXCLUDED.category_id,
         collection_id = EXCLUDED.collection_id,
         price = EXCLUDED.price,
         compare_at_price = EXCLUDED.compare_at_price,
         description = EXCLUDED.description,
         details = EXCLUDED.details,
         images = EXCLUDED.images,
         status = EXCLUDED.status,
         featured = EXCLUDED.featured,
         rail = EXCLUDED.rail
       RETURNING *`,
      [
        product.id,
        sku,
        product.name,
        product.colour,
        product.hex,
        product.category,
        product.collection,
        product.price,
        product.compareAtPrice ?? null,
        product.description,
        JSON.stringify(product.details),
        JSON.stringify(product.images),
        product.status,
        product.featured,
        Boolean(product.rail),
        product.createdAt,
      ],
    )

    await client.query('DELETE FROM product_sizes WHERE product_id = $1', [product.id])

    for (const size of sizes) {
      await client.query(
        `INSERT INTO product_sizes (product_id, size, stock, position)
         VALUES ($1, $2, $3, $4)`,
        [product.id, size.size, size.stock, size.position],
      )
    }

    return toProduct(
      result.rows[0]!,
      sizes.map((size) => ({ size: size.size, stock: size.stock })),
    )
  })
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await query('DELETE FROM products WHERE id = $1', [id])
  return (result.rowCount ?? 0) > 0
}

export async function updateProduct(
  id: string,
  patch: { status?: ProductStatus; size?: SizeName; stock?: number },
): Promise<Product | null> {
  if (patch.status !== undefined) {
    if (!['active', 'draft', 'archived'].includes(patch.status)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid product status' })
    }
    await query('UPDATE products SET status = $2 WHERE id = $1', [id, patch.status])
  }

  if (patch.size !== undefined) {
    const stock = Math.max(0, Math.round(Number(patch.stock) || 0))
    await query(
      `INSERT INTO product_sizes (product_id, size, stock, position)
       VALUES (
         $1, $2, $3,
         COALESCE((SELECT MAX(position) + 1 FROM product_sizes WHERE product_id = $1), 0)
       )
       ON CONFLICT (product_id, size)
       DO UPDATE SET stock = EXCLUDED.stock`,
      [id, patch.size, stock],
    )
  }

  return loadProduct(id)
}

export async function duplicateProduct(id: string): Promise<Product | null> {
  return withTransaction(async (client) => {
    const productResult = await client.query<ProductRow>('SELECT * FROM products WHERE id = $1', [id])
    const product = productResult.rows[0]
    if (!product) return null

    const sizeResult = await client.query<SizeRow>(
      `SELECT product_id, size, stock
       FROM product_sizes
       WHERE product_id = $1
       ORDER BY position ASC, size ASC`,
      [id],
    )

    const countResult = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM products',
    )
    const copyId = `${product.id}-copy-${(countResult.rows[0]?.count ?? 0) + 1}`
    const sku = await nextSku(client)
    const createdAt = new Date().toISOString()

    const copyResult = await client.query<ProductRow>(
      `INSERT INTO products (
         id, sku, name, colour, hex, category_id, collection_id, price,
         compare_at_price, description, details, images, status, featured,
         rail, created_at, position
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11::jsonb, $12::jsonb, 'draft', false,
         $13, $14, COALESCE((SELECT MIN(position) - 1 FROM products), 0)
       )
       RETURNING *`,
      [
        copyId,
        sku,
        `${product.name} (Copy)`,
        product.colour,
        product.hex,
        product.category_id,
        product.collection_id,
        product.price,
        product.compare_at_price,
        product.description,
        JSON.stringify(toStringArray(product.details)),
        JSON.stringify(toStringArray(product.images)),
        product.rail,
        createdAt,
      ],
    )

    const sizes: ProductSize[] = []
    for (const [index, size] of sizeResult.rows.entries()) {
      await client.query(
        `INSERT INTO product_sizes (product_id, size, stock, position)
         VALUES ($1, $2, $3, $4)`,
        [copyId, size.size, size.stock, index],
      )
      sizes.push({ size: size.size, stock: size.stock })
    }

    return toProduct(copyResult.rows[0]!, sizes)
  })
}

export async function updateOrder(
  id: string,
  patch: { paymentStatus?: PaymentStatus; deliveryStatus?: DeliveryStatus },
): Promise<Order | null> {
  const sets: string[] = []
  const values: unknown[] = []

  if (patch.paymentStatus !== undefined) {
    if (!paymentStatuses.includes(patch.paymentStatus)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid payment status' })
    }
    values.push(patch.paymentStatus)
    sets.push(`payment_status = $${values.length}`)
  }

  if (patch.deliveryStatus !== undefined) {
    if (!deliveryStatuses.includes(patch.deliveryStatus)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid delivery status' })
    }
    values.push(patch.deliveryStatus)
    sets.push(`delivery_status = $${values.length}`)
  }

  if (!sets.length) return loadOrder(id)

  values.push(id)
  await query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${values.length}`, values)
  return loadOrder(id)
}

export async function cancelOrder(id: string): Promise<Order | null> {
  await query(
    `UPDATE orders
     SET delivery_status = 'Cancelled',
         payment_status = CASE
           WHEN payment_status = 'Paid' THEN 'Refunded'
           ELSE payment_status
         END
     WHERE id = $1`,
    [id],
  )

  return loadOrder(id)
}

export async function createOrder(input: unknown): Promise<Order> {
  if (!input || typeof input !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order payload' })
  }

  const body = input as Partial<Order>
  const items = Array.isArray(body.items) ? body.items : []
  if (!items.length) {
    throw createError({ statusCode: 400, statusMessage: 'An order needs at least one item' })
  }

  const customer = body.customer
  if (!customer || typeof customer !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Customer details are required' })
  }

  const id = String(body.id ?? `ARH-${Date.now().toString().slice(-6)}`).trim()
  const subtotal = items.reduce(
    (total, item) => total + Math.round(Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
    0,
  )
  const shipping = Math.max(0, Math.round(Number(body.shipping) || 0))
  const discount = Math.max(0, Math.round(Number(body.discount) || 0))
  const total = subtotal + shipping - discount

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO orders (
         id, customer, subtotal, shipping, discount, total, payment_method,
         payment_status, delivery_status, placed_at, channel, notes
       )
       VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        JSON.stringify(customer),
        subtotal,
        shipping,
        discount,
        total,
        body.paymentMethod ?? 'UPI',
        body.paymentStatus ?? 'Pending',
        body.deliveryStatus ?? 'Processing',
        body.placedAt ?? new Date().toISOString(),
        body.channel ?? 'Online store',
        body.notes ?? null,
      ],
    )

    for (const [index, item] of items.entries()) {
      await client.query(
        `INSERT INTO order_items (
           order_id, product_id, name, image, size, quantity, price, position
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          String(item.productId ?? ''),
          String(item.name ?? ''),
          String(item.image ?? ''),
          String(item.size ?? 'M'),
          Math.max(1, Math.round(Number(item.quantity) || 1)),
          Math.max(0, Math.round(Number(item.price) || 0)),
          index,
        ],
      )
    }
  })

  const order = await loadOrder(id)
  if (!order) {
    throw createError({ statusCode: 500, statusMessage: 'Order could not be created' })
  }

  return order
}

export async function resetStore(): Promise<StorePayload> {
  await resetDatabase()
  return loadStore()
}
