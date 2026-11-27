import { createError } from 'h3'
import type { DeliveryStatus, PaymentStatus } from '~/data/orders'
import { requireStudio } from '~/server/utils/studioAuth'
import { updateOrder } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Order id is required' })

  const body = await readBody<{
    paymentStatus?: PaymentStatus
    deliveryStatus?: DeliveryStatus
  }>(event)

  const order = await updateOrder(id, body)
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  return order
})
