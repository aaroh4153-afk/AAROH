import { query } from '~/server/utils/db'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

/** DELETE /api/cart — clears the entire cart for the authenticated user */
export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)

  await query(`DELETE FROM user_carts WHERE firebase_uid = $1`, [decoded.uid])

  return { ok: true }
})
