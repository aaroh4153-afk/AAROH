import type { User } from 'firebase/auth'

export interface FirebaseProfile {
  uid: string
  email: string
  displayName: string
  photoUrl: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface FirebaseSyncResult {
  user: FirebaseProfile
  welcomeEmailSent: boolean
}

export async function requestFirebaseVerification(user: User): Promise<void> {
  const token = await user.getIdToken()
  await $fetch('/api/auth/verification', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}

export async function syncFirebaseUser(
  user: User,
  forceRefresh = false,
): Promise<FirebaseSyncResult> {
  if (!user.emailVerified) {
    throw new Error('Verify your email before syncing the account profile.')
  }

  const token = await user.getIdToken(forceRefresh)
  return await $fetch<FirebaseSyncResult>('/api/auth/sync', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}
