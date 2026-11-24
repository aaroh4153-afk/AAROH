import { readBody } from 'h3'
import { query } from '~/server/utils/db'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)
  const body = await readBody(event)

  const { productId, name, colour, size, price, quantity, image } = body as {
    productId: string
    name: string
    colour: string
    size?: string
    price: number
    quantity: number
    image: string
  }

  if (!productId || !name || typeof price !== 'number' || typeof quantity !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'Missing required cart fields.' })
  }

  // Upsert: if the same product+size already in cart, add quantities
  const result = await query(
    `INSERT INTO user_carts (firebase_uid, product_id, product_name, colour, size, price, quantity, image, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (firebase_uid, product_id, COALESCE(size, ''))
     DO UPDATE SET
       quantity = user_carts.quantity + EXCLUDED.quantity,
       price = EXCLUDED.price,
       updated_at = now()
     RETURNING id`,
    [decoded.uid, productId, name, colour ?? '', size ?? null, price, quantity, image ?? ''],
  )

  return { ok: true, id: result.rows[0]?.id }
})
