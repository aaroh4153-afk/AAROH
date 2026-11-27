import { readBody } from 'h3'
import { mutateCart } from '~/server/utils/commerce'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

/** PATCH /api/cart/item — set the quantity for one product+size and return the saved cart. */
export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)
  const body = await readBody(event)

  return await mutateCart(decoded.uid, body, 'set')
})
