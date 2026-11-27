import { createError } from 'h3'
import { ensureCustomerRecord, verifyCustomerRequest } from '~/server/utils/firebaseAuth'
import { updateUserProfile } from '~/server/utils/commerce'

export default defineEventHandler(async (event) => {
  const decoded = await verifyCustomerRequest(event)
  await ensureCustomerRecord(decoded)

  const body = await readBody(event)
  const updated = await updateUserProfile(decoded.uid, body)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Account not found.' })
  }
  return updated
})
