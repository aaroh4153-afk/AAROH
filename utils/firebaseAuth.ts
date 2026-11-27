import type { User } from 'firebase/auth'

export interface FirebaseProfile {
  uid: string
  email: string
  displayName: string
  photoUrl: string
  emailVerified: boolean
  phone: string
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface FirebaseSyncResult {
  user: FirebaseProfile
  welcomeEmailSent: boolean
}

/** AAROH accounts accept either a verified email or a verified phone number. */
export function isVerifiedAccount(user: User | null | undefined): boolean {
  return Boolean(user && (user.emailVerified || user.phoneNumber))
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
  if (!isVerifiedAccount(user)) {
    throw new Error('Verify your phone number or email before syncing the account profile.')
  }

  const token = await user.getIdToken(forceRefresh)
  return await $fetch<FirebaseSyncResult>('/api/auth/sync', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}
