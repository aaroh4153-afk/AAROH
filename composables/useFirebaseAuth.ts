import type { User } from 'firebase/auth'
import type { FirebaseProfile } from '~/utils/firebaseAuth'

export function useFirebaseAuth() {
  const user = useState<User | null>('aaroh.firebase.user', () => null)
  const profile = useState<FirebaseProfile | null>('aaroh.firebase.profile', () => null)
  const { $firebaseAuth } = useNuxtApp()

  return {
    auth: $firebaseAuth ?? null,
    user,
    profile,
  }
}
