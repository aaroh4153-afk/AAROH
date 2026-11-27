import { createError, getQuery } from 'h3'
import { isStudioAdmin, verifyCustomerRequest } from '../../utils/firebaseAuth'
import { getStudioSession } from '../../utils/studioAuth'
import { loadOrders, loadOrdersForUser } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (query.mine === '1' || query.mine === 'true') {
    const decoded = await verifyCustomerRequest(event)
    return loadOrdersForUser(decoded.uid)
  }

  if (getStudioSession(event)) {
    return loadOrders()
  }

  const decoded = await verifyCustomerRequest(event)

  if (!(await isStudioAdmin(decoded))) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the studio admin can read every customer order.',
    })
  }

  return loadOrders()
})
