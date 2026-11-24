import pg from 'pg'
import type { Pool as PgPool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import {
  categories as seedCategories,
  collections as seedCollections,
  products as seedProducts,
} from '~/data/products'
import { seedOrders } from '~/data/orders'
import { defaultSettings } from '~/data/settings'

const { Pool } = pg

let pool: PgPool | null = null
let ready: Promise<void> | null = null

export function hasDatabase(): boolean {
  try {
    const config = useRuntimeConfig()
    return Boolean(String(process.env.DATABASE_URL || config.databaseUrl || '').trim())
  } catch {
    return Boolean(String(process.env.DATABASE_URL || '').trim())
  }
}

function connectionString(): string {
  const config = useRuntimeConfig()
  // Render injects DATABASE_URL at runtime; prefer it over any build-time value.
  const value = String(process.env.DATABASE_URL || config.databaseUrl || '').trim()

  if (!value) {
    throw new Error(
      'DATABASE_URL is not configured. Add the Neon connection string to .env before starting the studio.',
    )
  }

  return value
}

export function getPool(): PgPool {
  if (!pool) {
    pool = new Pool({
      connectionString: connectionString(),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
      ssl: { rejectUnauthorized: false },
    })

    pool.on('error', (error) => {
      console.error('[aaroh/db] idle client error', error)
    })
  }

  return pool
}

async function createSchema(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id text PRIMARY KEY,
      name text NOT NULL,
      blurb text NOT NULL DEFAULT '',
      position integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS collections (
      id text PRIMARY KEY,
      name text NOT NULL,
      blurb text NOT NULL DEFAULT '',
      description text NOT NULL DEFAULT '',
      image text NOT NULL DEFAULT '',
      tint text NOT NULL DEFAULT '#1E40FF',
      position integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id text PRIMARY KEY,
      sku text NOT NULL UNIQUE,
      name text NOT NULL,
      colour text NOT NULL,
      hex text NOT NULL DEFAULT '#1E40FF',
      category_id text NOT NULL REFERENCES categories(id) ON UPDATE CASCADE,
      collection_id text NOT NULL REFERENCES collections(id) ON UPDATE CASCADE,
      price integer NOT NULL CHECK (price >= 0),
      compare_at_price integer,
      description text NOT NULL DEFAULT '',
      details jsonb NOT NULL DEFAULT '[]'::jsonb,
      images jsonb NOT NULL DEFAULT '[]'::jsonb,
      status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
      featured boolean NOT NULL DEFAULT false,
      rail boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      position integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_sizes (
      product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size text NOT NULL,
      stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
      position integer NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, size)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id text PRIMARY KEY,
      customer jsonb NOT NULL,
      subtotal integer NOT NULL DEFAULT 0,
      shipping integer NOT NULL DEFAULT 0,
      discount integer NOT NULL DEFAULT 0,
      total integer NOT NULL DEFAULT 0,
      payment_method text NOT NULL,
      payment_status text NOT NULL,
      delivery_status text NOT NULL,
      placed_at timestamptz NOT NULL,
      channel text NOT NULL,
      notes text
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id bigserial PRIMARY KEY,
      order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id text NOT NULL,
      name text NOT NULL,
      image text NOT NULL DEFAULT '',
      size text NOT NULL,
      quantity integer NOT NULL CHECK (quantity > 0),
      price integer NOT NULL CHECK (price >= 0),
      position integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS editorial_banners (
      id text PRIMARY KEY,
      image text NOT NULL,
      alt_text text NOT NULL DEFAULT '',
      position integer NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS auth_users (
      firebase_uid text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      display_name text NOT NULL DEFAULT '',
      photo_url text NOT NULL DEFAULT '',
      email_verified boolean NOT NULL DEFAULT true CHECK (email_verified),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      welcome_email_claimed_at timestamptz,
      welcome_email_sent_at timestamptz
    );

    CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
    CREATE INDEX IF NOT EXISTS products_collection_idx ON products(collection_id);
    CREATE INDEX IF NOT EXISTS product_sizes_product_idx ON product_sizes(product_id);
    CREATE INDEX IF NOT EXISTS orders_placed_at_idx ON orders(placed_at DESC);
    CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS user_carts (
      id bigserial PRIMARY KEY,
      firebase_uid text NOT NULL REFERENCES auth_users(firebase_uid) ON DELETE CASCADE,
      product_id text NOT NULL,
      product_name text NOT NULL,
      colour text NOT NULL DEFAULT '',
      size text,
      price integer NOT NULL,
      quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
      image text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (firebase_uid, product_id, COALESCE(size, ''))
    );

    CREATE INDEX IF NOT EXISTS user_carts_uid_idx ON user_carts(firebase_uid);

    -- Existing Neon databases predate the welcome-email columns; add them in place.
    ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS welcome_email_claimed_at timestamptz;
    ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;
  `)
}

async function seedDatabase(client: PoolClient): Promise<void> {
  await client.query('BEGIN')

  try {
    await client.query(`
      TRUNCATE TABLE
        order_items,
        orders,
        product_sizes,
        products,
        categories,
        collections,
        settings
      RESTART IDENTITY CASCADE
    `)

    for (const [index, category] of seedCategories.entries()) {
      await client.query(
        `INSERT INTO categories (id, name, blurb, position)
         VALUES ($1, $2, $3, $4)`,
        [category.id, category.name, category.blurb, index],
      )
    }

    for (const [index, collection] of seedCollections.entries()) {
      await client.query(
        `INSERT INTO collections (id, name, blurb, description, image, tint, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          collection.id,
          collection.name,
          collection.blurb,
          collection.description,
          collection.image,
          collection.tint,
          index,
        ],
      )
    }

    for (const [index, product] of seedProducts.entries()) {
      await client.query(
        `INSERT INTO products (
           id, sku, name, colour, hex, category_id, collection_id, price,
           compare_at_price, description, details, images, status, featured,
           rail, created_at, position
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11::jsonb, $12::jsonb, $13, $14,
           $15, $16, $17
         )`,
        [
          product.id,
          product.sku,
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
          index,
        ],
      )

      for (const [sizeIndex, size] of product.sizes.entries()) {
        await client.query(
          `INSERT INTO product_sizes (product_id, size, stock, position)
           VALUES ($1, $2, $3, $4)`,
          [product.id, size.size, size.stock, sizeIndex],
        )
      }
    }

    await client.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('store', $1::jsonb, now())`,
      [JSON.stringify(defaultSettings)],
    )

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function initialize(): Promise<void> {
  const client = await getPool().connect()

  try {
    await createSchema(client)

    const seededOrderIds = seedOrders.map((order) => order.id)
    if (seededOrderIds.length) {
      await client.query('DELETE FROM orders WHERE id = ANY($1::text[])', [seededOrderIds])
    }

    const { rows } = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM products',
    )

    if (Number(rows[0]?.count ?? 0) === 0) {
      await seedDatabase(client)
    }
  } finally {
    client.release()
  }
}

/** Creates the schema and seeds the demo catalogue on first use. */
export function ensureDatabase(): Promise<void> {
  if (!ready) {
    ready = initialize().catch((error) => {
      ready = null
      throw error
    })
  }

  return ready
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  await ensureDatabase()
  return getPool().query<T>(text, values)
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  await ensureDatabase()
  const client = await getPool().connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/** Wipes every table and restores the original demo catalogue and orders. */
export async function resetDatabase(): Promise<void> {
  await ensureDatabase()
  const client = await getPool().connect()

  try {
    await seedDatabase(client)
  } finally {
    client.release()
  }
}
