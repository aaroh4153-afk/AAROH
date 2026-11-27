import { readBody } from 'h3'
import { mutateCart } from '~/server/utils/commerce'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

/** POST /api/cart — add a line and return the canonical cart. */
export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)
  const body = await readBody(event)

  return await mutateCart(decoded.uid, body, 'add')
})
