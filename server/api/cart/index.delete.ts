import { clearUserCart } from '~/server/utils/commerce'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

/** DELETE /api/cart — clears the entire cart for the authenticated user. */
export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)

  await clearUserCart(decoded.uid)

  return []
})
