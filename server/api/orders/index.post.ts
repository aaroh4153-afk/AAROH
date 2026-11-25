import { createError } from 'h3'
import { createOrder } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    return await createOrder(body)
  } catch (error) {
    const code = (error as { code?: string })?.code
    const message = error instanceof Error ? error.message : ''

    if (code === '53000' || /quota/i.test(message)) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Order storage is temporarily unavailable. Please try again shortly.',
      })
    }

    throw error
  }
})
