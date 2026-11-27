import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import type { PoolClient, QueryResult, QueryResultRow } from 'pg'
import type { AccountProfile, AddressInput, UserAddress } from '~/data/account'
import type { SizeName } from '~/data/products'
import { query, withTransaction } from './db'

export interface CartItem {
  id: string
  productId: string
  name: string
  colour: string
  price: number
  image: string
  quantity: number
  size?: SizeName
}

export interface AuthUserRow {
  firebase_uid: string
  email: string | null
  display_name: string
  photo_url: string
  phone: string
  phone_verified: boolean
  email_verified: boolean
  created_at: Date | string
  updated_at: Date | string
}

interface AddressRow {
  id: string
  label: string
  name: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  is_default: boolean
  created_at: Date | string
  updated_at: Date | string
}

interface CanonicalCartRow {
  product_id: string
  name: string
  colour: string
  price: number
  image: string
  size: SizeName
  quantity: number
}

interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>
}

function invalid(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function readString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  options: { required?: boolean; minLength?: number; fallback?: string } = {},
): string {
  const raw = body[key]
  if (raw === undefined) {
    if (options.required) invalid(`${key} is required.`)
    return options.fallback ?? ''
  }
  if (typeof raw !== 'string') invalid(`${key} must be a string.`)

  const value = raw.trim()
  if (options.required && !value) invalid(`${key} is required.`)
  if (value.length > maxLength) invalid(`${key} must be ${maxLength} characters or fewer.`)
  if (options.minLength && value.length < options.minLength) {
    invalid(`${key} must be ${options.minLength} characters or more.`)
  }
  return value
}

function readBoolean(body: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = body[key]
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') invalid(`${key} must be a boolean.`)
  return value
}

export function mapAuthUserProfile(row: AuthUserRow): AccountProfile {
  return {
    uid: row.firebase_uid,
    email: row.email ?? '',
    displayName: row.display_name,
    phone: row.phone,
    photoUrl: row.photo_url,
    emailVerified: row.email_verified,
    phoneVerified: row.phone_verified,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function mapAddress(row: AddressRow): UserAddress {
  return {
    id: row.id,
    label: row.label,
    name: row.name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    isDefault: row.is_default,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

export function parseAddressInput(input: unknown): AddressInput & { id: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    invalid('Invalid address payload.')
  }

  const body = input as Record<string, unknown>
  const phone = readString(body, 'phone', 20, { required: true, minLength: 7 })
  const pincode = readString(body, 'pincode', 6, { required: true })
  if (!/^\d{6}$/.test(pincode)) invalid('PIN code must contain exactly six digits.')

  return {
    id: randomUUID(),
    label: readString(body, 'label', 40, { fallback: 'Home' }) || 'Home',
    name: readString(body, 'name', 120, { required: true }),
    phone,
    line1: readString(body, 'line1', 200, { required: true }),
    line2: readString(body, 'line2', 200),
    city: readString(body, 'city', 100, { required: true }),
    state: readString(body, 'state', 100, { required: true }),
    pincode,
    isDefault: readBoolean(body, 'isDefault'),
  }
}

export async function loadUserAddresses(uid: string): Promise<UserAddress[]> {
  const { rows } = await query<AddressRow>(
    `SELECT id, label, name, phone, line1, line2, city, state, pincode,
            is_default, created_at, updated_at
     FROM user_addresses
     WHERE firebase_uid = $1
     ORDER BY is_default DESC, created_at ASC, id ASC`,
    [uid],
  )
  return rows.map(mapAddress)
}

async function lockCustomer(client: PoolClient, uid: string): Promise<void> {
  const result = await client.query<{ firebase_uid: string }>(
    'SELECT firebase_uid FROM auth_users WHERE firebase_uid = $1 FOR UPDATE',
    [uid],
  )
  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Account not found.' })
  }
}

export async function saveUserAddress(
  uid: string,
  input: unknown,
  id?: string,
): Promise<UserAddress | null> {
  const address = parseAddressInput(input)

  return withTransaction(async (client) => {
    // Serialize default-address changes for this customer.
    await lockCustomer(client, uid)

    if (id) {
      const existing = await client.query<AddressRow>(
        `SELECT * FROM user_addresses
         WHERE id = $1 AND firebase_uid = $2
         FOR UPDATE`,
        [id, uid],
      )
      if (!existing.rows[0]) return null
    }

    const countResult = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM user_addresses WHERE firebase_uid = $1',
      [uid],
    )
    const isDefault = address.isDefault || countResult.rows[0]?.count === 0

    if (isDefault) {
      await client.query(
        `UPDATE user_addresses
         SET is_default = false, updated_at = now()
         WHERE firebase_uid = $1 AND is_default = true AND id <> $2`,
        [uid, id ?? ''],
      )
    }

    const values = [
      id ?? address.id,
      uid,
      address.label,
      address.name,
      address.phone,
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.pincode,
      isDefault,
    ]

    const result = id
      ? await client.query<AddressRow>(
          `UPDATE user_addresses SET
             label = $3, name = $4, phone = $5, line1 = $6, line2 = $7,
             city = $8, state = $9, pincode = $10, is_default = $11, updated_at = now()
           WHERE id = $1 AND firebase_uid = $2
           RETURNING *`,
          values,
        )
      : await client.query<AddressRow>(
          `INSERT INTO user_addresses (
             id, firebase_uid, label, name, phone, line1, line2,
             city, state, pincode, is_default, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
           RETURNING *`,
          values,
        )

    const saved = result.rows[0]
    return saved ? mapAddress(saved) : null
  })
}

export async function deleteUserAddress(uid: string, id: string): Promise<boolean> {
  return withTransaction(async (client) => {
    await lockCustomer(client, uid)
    const existing = await client.query<{ is_default: boolean }>(
      `SELECT is_default FROM user_addresses
       WHERE id = $1 AND firebase_uid = $2
       FOR UPDATE`,
      [id, uid],
    )
    const address = existing.rows[0]
    if (!address) return false

    await client.query('DELETE FROM user_addresses WHERE id = $1 AND firebase_uid = $2', [id, uid])

    if (address.is_default) {
      await client.query(
        `UPDATE user_addresses
         SET is_default = true, updated_at = now()
         WHERE firebase_uid = $1
           AND id = (
             SELECT id FROM user_addresses
             WHERE firebase_uid = $1
             ORDER BY created_at ASC, id ASC
             LIMIT 1
           )`,
        [uid],
      )
    }

    return true
  })
}

export async function updateUserProfile(
  uid: string,
  input: unknown,
): Promise<AccountProfile | null> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    invalid('Invalid profile payload.')
  }

  const body = input as Record<string, unknown>
  const sets: string[] = []
  const values: unknown[] = []

  if (body.displayName !== undefined) {
    values.push(readString(body, 'displayName', 120))
    sets.push(`display_name = $${values.length}`)
  }

  if (body.phone !== undefined) {
    const phone = readString(body, 'phone', 20)
    if (phone && phone.length < 7) invalid('Phone number must be 7–20 characters or empty.')
    values.push(phone)
    sets.push(`phone = $${values.length}`)
  }

  if (!sets.length) {
    const result = await query<AuthUserRow>(
      `SELECT firebase_uid, email, display_name, photo_url, phone, phone_verified,
              email_verified, created_at, updated_at
       FROM auth_users WHERE firebase_uid = $1`,
      [uid],
    )
    return result.rows[0] ? mapAuthUserProfile(result.rows[0]) : null
  }

  values.push(uid)
  let result: QueryResult<AuthUserRow>
  try {
    result = await query<AuthUserRow>(
      `UPDATE auth_users SET ${sets.join(', ')}, updated_at = now()
       WHERE firebase_uid = $${values.length}
       RETURNING firebase_uid, email, display_name, photo_url, phone, phone_verified,
                 email_verified, created_at, updated_at`,
      values,
    )
  } catch (error) {
    // The phone column is unique across accounts; explain the clash instead of a 500.
    if ((error as { code?: string }).code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'That phone number is already saved on another account.',
      })
    }
    throw error
  }
  return result.rows[0] ? mapAuthUserProfile(result.rows[0]) : null
}

function firstImage(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return typeof value[0] === 'string' ? value[0] : ''
}

function mapCartItem(row: CanonicalCartRow): CartItem {
  return {
    id: `${row.product_id}--${row.size}`,
    productId: row.product_id,
    name: row.name,
    colour: row.colour,
    price: row.price,
    image: row.image,
    quantity: row.quantity,
    size: row.size,
  }
}

async function selectCanonicalCart(
  executor: typeof query | PoolClient,
  uid: string,
): Promise<CartItem[]> {
  let rows: CanonicalCartRow[]
  const sql = `
    SELECT p.id AS product_id, p.name, p.colour, p.price,
          COALESCE(p.images->>0, '') AS image, ps.size, uc.quantity
    FROM user_carts uc
    JOIN products p ON p.id = uc.product_id
    JOIN product_sizes ps ON ps.product_id = uc.product_id AND ps.size = uc.size
    WHERE uc.firebase_uid = $1 AND p.status = 'active'
    ORDER BY p.position ASC, uc.created_at ASC, p.id ASC, ps.position ASC, ps.size ASC`
  if (typeof executor === 'function') {
    const result = await (executor as typeof query)<CanonicalCartRow>(sql, [uid])
    rows = result.rows
  } else {
    const result = await (executor as PoolClient).query<CanonicalCartRow>(sql, [uid])
    rows = result.rows
  }
  return rows.map(mapCartItem)
}


export async function loadCanonicalCart(uid: string): Promise<CartItem[]> {
  return selectCanonicalCart(query, uid)
}

export type CartMutationMode = 'add' | 'set'

export async function mutateCart(
  uid: string,
  input: unknown,
  mode: CartMutationMode,
): Promise<CartItem[]> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    invalid('Invalid cart payload.')
  }

  const body = input as Record<string, unknown>
  const productId = readString(body, 'productId', 200, { required: true })
  const size = readString(body, 'size', 20, { required: true })
  const quantity = body.quantity
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity > 99) {
    invalid('Cart quantity must be an integer no greater than 99.')
  }
  if (mode === 'add' && quantity < 1) invalid('Cart quantity must be at least 1.')

  return withTransaction(async (client) => {
    const productResult = await client.query<{
      id: string
      name: string
      colour: string
      price: number
      images: unknown
      status: string
    }>(
      `SELECT id, name, colour, price, images, status
       FROM products WHERE id = $1
       ORDER BY id
       FOR UPDATE`,
      [productId],
    )
    const product = productResult.rows[0]
    if (!product) invalid('This product is no longer available.')
    if (product.status !== 'active') invalid('This product is no longer available.')

    const sizeResult = await client.query<{ size: SizeName; stock: number }>(
      `SELECT size, stock FROM product_sizes
       WHERE product_id = $1 AND size = $2
       ORDER BY size
       FOR UPDATE`,
      [productId, size],
    )
    const selectedSize = sizeResult.rows[0]
    if (!selectedSize) invalid('Select an available product size.')

    if (mode === 'set' && quantity <= 0) {
      await client.query(
        `DELETE FROM user_carts
         WHERE firebase_uid = $1 AND product_id = $2 AND COALESCE(size, '') = $3`,
        [uid, productId, size],
      )
      return selectCanonicalCart(client, uid)
    }

    if (selectedSize.stock < 1) invalid('This product size is out of stock.')

    const existing = await client.query<{ quantity: number }>(
      `SELECT quantity FROM user_carts
       WHERE firebase_uid = $1 AND product_id = $2 AND COALESCE(size, '') = $3
       ORDER BY id
       FOR UPDATE`,
      [uid, productId, size],
    )
    const currentQuantity = existing.rows[0]?.quantity ?? 0
    const requestedQuantity = mode === 'add' ? currentQuantity + quantity : quantity
    const nextQuantity = Math.min(selectedSize.stock, requestedQuantity)

    await client.query(
      `INSERT INTO user_carts (
         firebase_uid, product_id, product_name, colour, size, price, quantity, image, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
       ON CONFLICT (firebase_uid, product_id, COALESCE(size, ''))
       DO UPDATE SET
         product_name = EXCLUDED.product_name,
         colour = EXCLUDED.colour,
         price = EXCLUDED.price,
         quantity = EXCLUDED.quantity,
         image = EXCLUDED.image,
         updated_at = now()`,
      [
        uid,
        productId,
        product.name,
        product.colour,
        selectedSize.size,
        product.price,
        nextQuantity,
        firstImage(product.images),
      ],
    )

    return selectCanonicalCart(client, uid)
  })
}

export async function clearUserCart(uid: string): Promise<void> {
  await query('DELETE FROM user_carts WHERE firebase_uid = $1', [uid])
}

/** Saved pieces, newest first. Only pieces that are still on sale are returned. */
export async function loadWishlist(uid: string): Promise<string[]> {
  const { rows } = await query<{ product_id: string }>(
    `SELECT w.product_id
     FROM user_wishlist w
     JOIN products p ON p.id = w.product_id AND p.status = 'active'
     WHERE w.firebase_uid = $1
     ORDER BY w.created_at DESC, w.product_id ASC`,
    [uid],
  )
  return rows.map((row) => row.product_id)
}

/** Adds or removes one saved piece and returns the saved list. */
export async function setWishlistItem(uid: string, input: unknown): Promise<string[]> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    invalid('Invalid wishlist payload.')
  }

  const body = input as Record<string, unknown>
  const productId = readString(body, 'productId', 200, { required: true })
  const saved = readBoolean(body, 'saved', true)

  if (saved) {
    const product = await query<{ id: string }>(
      `SELECT id FROM products WHERE id = $1 AND status = 'active'`,
      [productId],
    )
    if (!product.rows[0]) invalid('This piece is no longer available.')

    await query(
      `INSERT INTO user_wishlist (firebase_uid, product_id)
       VALUES ($1, $2)
       ON CONFLICT (firebase_uid, product_id) DO NOTHING`,
      [uid, productId],
    )
  } else {
    await query('DELETE FROM user_wishlist WHERE firebase_uid = $1 AND product_id = $2', [
      uid,
      productId,
    ])
  }

  return await loadWishlist(uid)
}
