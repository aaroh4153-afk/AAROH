import pg from 'pg'
import type { Pool as PgPool, PoolClient, QueryResult, QueryResultRow } from 'pg'
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

    -- Editable campaign section and shop page banner, one row per slot.
    CREATE TABLE IF NOT EXISTS page_banners (
      slot text PRIMARY KEY,
      image text NOT NULL DEFAULT '',
      alt_text text NOT NULL DEFAULT '',
      content jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS auth_users (
      firebase_uid text PRIMARY KEY,
      email text UNIQUE,
      display_name text NOT NULL DEFAULT '',
      photo_url text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      phone_verified boolean NOT NULL DEFAULT false,
      email_verified boolean NOT NULL DEFAULT false,
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
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS user_carts_unique_idx
      ON user_carts (firebase_uid, product_id, COALESCE(size, ''));

    CREATE INDEX IF NOT EXISTS user_carts_uid_idx ON user_carts(firebase_uid);

    -- Saved pieces belong to the signed-in customer, exactly like the cart.
    CREATE TABLE IF NOT EXISTS user_wishlist (
      firebase_uid text NOT NULL REFERENCES auth_users(firebase_uid) ON DELETE CASCADE,
      product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (firebase_uid, product_id)
    );

    CREATE INDEX IF NOT EXISTS user_wishlist_uid_idx ON user_wishlist(firebase_uid);

    -- Existing Neon databases predate customer commerce; add these in place.
    ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
    ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;
    ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS welcome_email_claimed_at timestamptz;
    ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

    -- Studio access lives on the account itself so a changed email never locks the owner out.
    ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

    -- Phone-first accounts have no email; email-verified is no longer mandatory.
    ALTER TABLE auth_users ALTER COLUMN email DROP NOT NULL;
    ALTER TABLE auth_users ALTER COLUMN email_verified SET DEFAULT false;
    ALTER TABLE auth_users DROP CONSTRAINT IF EXISTS auth_users_email_verified_check;
    CREATE UNIQUE INDEX IF NOT EXISTS auth_users_phone_unique_idx
      ON auth_users (phone) WHERE phone <> '';

    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS firebase_uid text REFERENCES auth_users(firebase_uid) ON DELETE SET NULL;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text;

    CREATE INDEX IF NOT EXISTS orders_firebase_uid_placed_at_idx
      ON orders(firebase_uid, placed_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS orders_firebase_uid_idempotency_key_idx
      ON orders(firebase_uid, idempotency_key)
      WHERE firebase_uid IS NOT NULL AND idempotency_key IS NOT NULL;

    CREATE TABLE IF NOT EXISTS user_addresses (
      id text PRIMARY KEY,
      firebase_uid text NOT NULL REFERENCES auth_users(firebase_uid) ON DELETE CASCADE,
      label text NOT NULL DEFAULT 'Home',
      name text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      line1 text NOT NULL DEFAULT '',
      line2 text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      state text NOT NULL DEFAULT '',
      pincode text NOT NULL DEFAULT '',
      is_default boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS user_addresses_uid_idx ON user_addresses(firebase_uid);
    CREATE UNIQUE INDEX IF NOT EXISTS user_addresses_one_default_idx
      ON user_addresses(firebase_uid) WHERE is_default;
  `)
}


async function initialize(): Promise<void> {
  const client = await getPool().connect()

  try {
    await createSchema(client)
    await bootstrapStudioAdmin(client)
    await client.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('store', $1::jsonb, now())
       ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify(defaultSettings)],
    )
  } finally {
    client.release()
  }
}

/**
 * Makes sure the studio has an owner. The configured admin email wins; when that
 * address has not signed in yet, the first verified account owns the studio.
 */
async function bootstrapStudioAdmin(client: PoolClient): Promise<void> {
  const configured = String(
    process.env.NUXT_STUDIO_ADMIN_EMAIL || useRuntimeConfig().studioAdminEmail || '',
  )
    .trim()
    .toLowerCase()

  await client.query(
    `UPDATE auth_users SET is_admin = true
     WHERE firebase_uid = (
       SELECT firebase_uid FROM auth_users
       WHERE email_verified
         AND NOT EXISTS (SELECT 1 FROM auth_users WHERE is_admin)
       ORDER BY CASE WHEN lower(email) = $1 THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1
     )`,
    [configured],
  )
}

/** Creates the schema on first use without inserting demo catalogue data. */
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

