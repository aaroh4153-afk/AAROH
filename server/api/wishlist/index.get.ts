import { loadWishlist } from '~/server/utils/commerce'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

/** GET /api/wishlist — saved product ids for the signed-in customer. */
export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)

  return await loadWishlist(decoded.uid)
})
