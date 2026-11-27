import { readBody } from 'h3'
import { setWishlistItem } from '~/server/utils/commerce'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

/** PATCH /api/wishlist — save or unsave a piece, returning the saved ids. */
export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)
  const body = await readBody(event)

  return await setWishlistItem(decoded.uid, body)
})
