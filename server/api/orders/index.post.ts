import { createError, getHeader } from 'h3'
import { ensureCustomerRecord, verifyFirebaseRequest } from '../../utils/firebaseAuth'
import { createOrder } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Signed-in customers attach their order to their account. Guests can still check out.
  let firebaseUid: string | undefined
  const authorization = getHeader(event, 'authorization')
  if (authorization) {
    try {
      const decoded = await verifyFirebaseRequest(event)
      try {
        // The order only links to an account that actually exists in auth_users.
        await ensureCustomerRecord(decoded)
        firebaseUid = decoded.uid
      } catch (profileError) {
        console.warn(
          '[aaroh/orders] Continuing as a guest order; the account profile could not be saved.',
          profileError,
        )
      }
    } catch (authError) {
      console.warn('[aaroh/orders] Ignoring an invalid sign-in token for guest checkout.', authError)
    }
  }

  const idempotencyKey =
    String(getHeader(event, 'idempotency-key') ?? '').trim() ||
    String((body as { idempotencyKey?: unknown })?.idempotencyKey ?? '').trim() ||
    undefined

  try {
    return await createOrder(body, { firebaseUid, idempotencyKey })
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
