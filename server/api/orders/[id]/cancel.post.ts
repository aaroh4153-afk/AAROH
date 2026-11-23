import { createError } from 'h3'
import { cancelOrder } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Order id is required' })

  const order = await cancelOrder(id)
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  return order
})
