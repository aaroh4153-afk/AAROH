import { getStudioSession } from '../../utils/studioAuth'

export default defineEventHandler((event) => {
  const session = getStudioSession(event)
  return { signedIn: Boolean(session), email: session?.email ?? null }
})
