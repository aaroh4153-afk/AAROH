import { createError, getRouterParam } from 'h3'
import { ensureCustomerRecord, verifyCustomerRequest } from '~/server/utils/firebaseAuth'
import { saveUserAddress } from '~/server/utils/commerce'

export default defineEventHandler(async (event) => {
  const decoded = await verifyCustomerRequest(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Address id is required.' })
  }

  await ensureCustomerRecord(decoded)
  const body = await readBody(event)
  const saved = await saveUserAddress(decoded.uid, body, id)
  if (!saved) {
    throw createError({ statusCode: 404, statusMessage: 'Address not found.' })
  }
  return saved
})
