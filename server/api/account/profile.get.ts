import { ensureCustomerRecord, verifyCustomerRequest } from '~/server/utils/firebaseAuth'

export default defineEventHandler(async (event) => {
  const decoded = await verifyCustomerRequest(event)
  return await ensureCustomerRecord(decoded)
})
