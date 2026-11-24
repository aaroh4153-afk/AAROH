import { readBody } from 'h3'
import { query } from '~/server/utils/db'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

/** PATCH /api/cart/item — update quantity for a specific product+size */
export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)
  const body = await readBody(event)
  const { productId, size, quantity } = body as {
    productId: string
    size?: string
    quantity: number
  }

  if (!productId || typeof quantity !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'Missing productId or quantity.' })
  }

  if (quantity <= 0) {
    // Remove the item entirely
    await query(
      `DELETE FROM user_carts
       WHERE firebase_uid = $1 AND product_id = $2 AND COALESCE(size, '') = $3`,
      [decoded.uid, productId, size ?? ''],
    )
    return { ok: true, deleted: true }
  }

  await query(
    `UPDATE user_carts
     SET quantity = $4, updated_at = now()
     WHERE firebase_uid = $1 AND product_id = $2 AND COALESCE(size, '') = $3`,
    [decoded.uid, productId, size ?? '', quantity],
  )

  return { ok: true }
})
