import { createError, readBody } from 'h3'
import { checkStudioCredentials, setStudioSession } from '../../utils/studioAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = String(body?.email ?? '').trim()
  const password = String(body?.password ?? '')

  if (!email || !password || !checkStudioCredentials({ email, password })) {
    throw createError({
      statusCode: 401,
      statusMessage: 'That email and password do not match the studio owner account.',
    })
  }

  const session = setStudioSession(event, email)
  return { signedIn: true, email: session.email }
})
