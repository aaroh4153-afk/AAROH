import { ensureCustomerRecord, verifyCustomerRequest } from '~/server/utils/firebaseAuth'
import { loadUserAddresses } from '~/server/utils/commerce'

export default defineEventHandler(async (event) => {
  const decoded = await verifyCustomerRequest(event)
  await ensureCustomerRecord(decoded)
  return await loadUserAddresses(decoded.uid)
})
