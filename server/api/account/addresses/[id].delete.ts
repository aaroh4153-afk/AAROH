import { createError, getRouterParam } from 'h3'
import { ensureCustomerRecord, verifyCustomerRequest } from '~/server/utils/firebaseAuth'
import { deleteUserAddress } from '~/server/utils/commerce'

export default defineEventHandler(async (event) => {
  const decoded = await verifyCustomerRequest(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Address id is required.' })
  }

  await ensureCustomerRecord(decoded)
  const deleted = await deleteUserAddress(decoded.uid, id)
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Address not found.' })
  }
  return { ok: true }
})
