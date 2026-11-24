import { query } from '~/server/utils/db'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

interface CartRow {
  id: number
  firebase_uid: string
  product_id: string
  product_name: string
  colour: string
  size: string | null
  price: number
  quantity: number
  image: string
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)

  const result = await query<CartRow>(
    `SELECT id, firebase_uid, product_id, product_name, colour, size, price, quantity, image, created_at, updated_at
     FROM user_carts
     WHERE firebase_uid = $1
     ORDER BY created_at ASC`,
    [decoded.uid],
  )

  return result.rows.map((row) => ({
    id: `${row.product_id}${row.size ? `--${row.size}` : ''}`,
    productId: row.product_id,
    name: row.product_name,
    colour: row.colour,
    size: row.size ?? undefined,
    price: row.price,
    quantity: row.quantity,
    image: row.image,
  }))
})
