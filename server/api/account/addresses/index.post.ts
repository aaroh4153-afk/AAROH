import { ensureCustomerRecord, verifyCustomerRequest } from '~/server/utils/firebaseAuth'
import { saveUserAddress } from '~/server/utils/commerce'

export default defineEventHandler(async (event) => {
  const decoded = await verifyCustomerRequest(event)
  await ensureCustomerRecord(decoded)

  const body = await readBody(event)
  return await saveUserAddress(decoded.uid, body)
})
