import { createOrder } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return createOrder(body)
})
