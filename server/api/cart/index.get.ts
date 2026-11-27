import { loadCanonicalCart } from '~/server/utils/commerce'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

/** GET /api/cart — the signed-in customer's cart, priced from the live catalogue. */
export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)

  return await loadCanonicalCart(decoded.uid)
})
