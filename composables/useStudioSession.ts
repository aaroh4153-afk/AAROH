import { computed } from 'vue'
import { getApiErrorMessage } from '~/composables/useAccount'

export interface StudioSessionInfo {
  email: string
}

interface StudioSessionResponse {
  signedIn: boolean
  email: string | null
}

/**
 * Dashboard owner sign-in. The server checks the email and password and sets an
 * httpOnly session cookie, which every studio write uses.
 */
export const useStudioSession = () => {
  const session = useState<StudioSessionInfo | null>('studio.session', () => null)
  const ready = useState<boolean>('studio.session.ready', () => false)
  const pending = useState<boolean>('studio.session.pending', () => false)
  const error = useState<string>('studio.session.error', () => '')

  async function load(force = false): Promise<StudioSessionInfo | null> {
    if (ready.value && !force) return session.value

    const request = import.meta.server ? useRequestFetch() : $fetch

    try {
      const data = await request<StudioSessionResponse>('/api/studio/session')
      session.value = data.signedIn && data.email ? { email: data.email } : null
    } catch {
      session.value = null
    } finally {
      ready.value = true
    }

    return session.value
  }

  async function signIn(email: string, password: string): Promise<StudioSessionInfo> {
    pending.value = true
    error.value = ''

    try {
      const data = await $fetch<{ email: string }>('/api/studio/session', {
        method: 'POST',
        body: { email: email.trim(), password },
      })
      session.value = { email: data.email }
      ready.value = true
      return session.value
    } catch (signInError) {
      error.value = getApiErrorMessage(
        signInError,
        'Could not reach the studio. Check the server and try again.',
      )
      throw signInError
    } finally {
      pending.value = false
    }
  }

  async function signOut(): Promise<void> {
    try {
      await $fetch('/api/studio/session', { method: 'DELETE' })
    } catch {
      // The cookie is cleared on the next sign-in even if the request fails.
    }

    session.value = null
    error.value = ''
  }

  return {
    session,
    ready,
    pending,
    error,
    signedIn: computed(() => Boolean(session.value)),
    load,
    signIn,
    signOut,
  }
}
