import { clearStudioSession } from '../../utils/studioAuth'

export default defineEventHandler((event) => {
  clearStudioSession(event)
  return { signedIn: false }
})
