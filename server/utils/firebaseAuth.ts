import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import { query } from './db'
import { mapAuthUserProfile, type AuthUserRow } from './commerce'
import type { AccountProfile } from '~/data/account'

interface FirebaseServiceAccount {
  project_id?: string
  client_email?: string
  private_key?: string
}

function getFirebaseServiceAccount(): FirebaseServiceAccount | null {
  const config = useRuntimeConfig()
  const rawAccount = String(
    config.firebaseServiceAccountJson || process.env.NUXT_FIREBASE_SERVICE_ACCOUNT_JSON || '',
  ).trim()

  if (!rawAccount) return null

  let parsedAccount: unknown
  try {
    parsedAccount = JSON.parse(rawAccount)
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Firebase Admin service-account JSON is invalid.',
    })
  }

  if (typeof parsedAccount !== 'object' || parsedAccount === null) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Firebase Admin service-account JSON must be an object.',
    })
  }

  const account = parsedAccount as FirebaseServiceAccount
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Firebase Admin service-account JSON is missing required fields.',
    })
  }

  return account
}

function getFirebaseTokenAuth() {
  const config = useRuntimeConfig()
  const projectId = String(
    config.public.firebaseProjectId || process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  ).trim()

  if (!projectId) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Set NUXT_PUBLIC_FIREBASE_PROJECT_ID to verify Firebase sign-ins.',
    })
  }

  // Revocation checks need Admin credentials. Use the configured service account
  // when available, while retaining project-ID-only verification as a fallback.
  const account = getFirebaseServiceAccount()
  const existingApp = getApps().find((app) => app.name === 'aaroh-token-verifier')
  const app =
    existingApp ??
    initializeApp(
      account
        ? {
            projectId,
            credential: cert({
              projectId: account.project_id,
              clientEmail: account.client_email,
              privateKey: account.private_key,
            }),
          }
        : { projectId },
      'aaroh-token-verifier',
    )
  return getAuth(app)
}

function getFirebaseAdminAuth() {
  const account = getFirebaseServiceAccount()
  if (!account) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Firebase Admin is not configured on the server.',
    })
  }

  const existingApp = getApps().find((app) => app.name === 'aaroh-auth')
  const app =
    existingApp ??
    initializeApp(
      {
        credential: cert({
          projectId: account.project_id,
          clientEmail: account.client_email,
          privateKey: account.private_key,
        }),
      },
      'aaroh-auth',
    )

  return getAuth(app)
}

export async function verifyFirebaseRequest(event: H3Event): Promise<DecodedIdToken> {
  const authorization = getHeader(event, 'authorization') ?? ''
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in is required.' })
  }

  const auth = getFirebaseTokenAuth()

  try {
    // Revocation checks need Admin credentials; skip them when only the project ID is configured.
    return await auth.verifyIdToken(token, Boolean(getFirebaseServiceAccount()))
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
    if (
      code === 'auth/argument-error' ||
      code === 'auth/id-token-expired' ||
      code === 'auth/id-token-revoked' ||
      code === 'auth/invalid-id-token' ||
      code === 'auth/user-disabled' ||
      code === 'auth/user-not-found'
    ) {
      throw createError({ statusCode: 401, statusMessage: 'Your sign-in session has expired.' })
    }

    console.error('[aaroh/auth] Firebase ID token verification failed.', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Could not verify your Firebase sign-in. Please try again.',
    })
  }
}

export async function verifyCustomerRequest(event: H3Event): Promise<DecodedIdToken> {
  const decoded = await verifyFirebaseRequest(event)
  const email = decoded.email?.trim()
  const phone = decoded.phone_number?.trim()

  // AAROH accounts are phone-first; a verified email is equally accepted.
  if (!(decoded.email_verified && email) && !phone) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Verify your phone number or email before using your AAROH account.',
    })
  }

  return decoded
}

export async function ensureCustomerRecord(decoded: DecodedIdToken): Promise<AccountProfile> {
  const email = decoded.email?.trim().toLowerCase() || null
  const phone = decoded.phone_number?.trim() || ''
  const emailVerified = Boolean(decoded.email_verified && email)
  const phoneVerified = Boolean(phone)

  if (!emailVerified && !phoneVerified) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Verify your phone number or email before saving your account.',
    })
  }

  const displayName = String(decoded.name ?? '').trim() || phone || email || 'AAROH customer'
  const photoUrl = String(decoded.picture ?? '').trim()
  const result = await query<AuthUserRow>(
    `INSERT INTO auth_users (
       firebase_uid, email, display_name, photo_url, phone, phone_verified,
       email_verified, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
     ON CONFLICT (firebase_uid) DO UPDATE SET
       email = COALESCE(EXCLUDED.email, auth_users.email),
       display_name = CASE
         WHEN auth_users.display_name <> '' THEN auth_users.display_name
         ELSE EXCLUDED.display_name
       END,
       photo_url = CASE
         WHEN auth_users.photo_url <> '' THEN auth_users.photo_url
         ELSE EXCLUDED.photo_url
       END,
       phone = CASE
         WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone
         ELSE auth_users.phone
       END,
       phone_verified = auth_users.phone_verified OR EXCLUDED.phone_verified,
       email_verified = auth_users.email_verified OR EXCLUDED.email_verified,
       updated_at = now()
     RETURNING firebase_uid, email, display_name, photo_url, phone, phone_verified,
               email_verified, created_at, updated_at`,
    [decoded.uid, email, displayName, photoUrl, phone, phoneVerified, emailVerified],
  )

  const profile = result.rows[0]
  if (!profile) {
    throw createError({ statusCode: 500, statusMessage: 'The account profile could not be saved.' })
  }

  // The first verified account becomes the studio owner when no admin exists yet.
  await query(
    `UPDATE auth_users SET is_admin = true
     WHERE firebase_uid = (
       SELECT firebase_uid FROM auth_users
       WHERE email_verified
         AND NOT EXISTS (SELECT 1 FROM auth_users WHERE is_admin)
       ORDER BY created_at ASC
       LIMIT 1
     )`,
  )

  return mapAuthUserProfile(profile)
}

/** Studio access: the configured owner email, or the account flagged in auth_users. */
export async function isStudioAdmin(decoded: DecodedIdToken): Promise<boolean> {
  const config = useRuntimeConfig()
  const allowedEmail = String(
    config.studioAdminEmail || process.env.NUXT_STUDIO_ADMIN_EMAIL || '',
  )
    .trim()
    .toLowerCase()

  if (
    allowedEmail &&
    decoded.email_verified &&
    decoded.email?.trim().toLowerCase() === allowedEmail
  ) {
    return true
  }

  const result = await query<{ is_admin: boolean }>(
    'SELECT is_admin FROM auth_users WHERE firebase_uid = $1',
    [decoded.uid],
  )
  return Boolean(result.rows[0]?.is_admin)
}

export async function verifyStudioAdmin(event: H3Event): Promise<DecodedIdToken> {
  const decoded = await verifyFirebaseRequest(event)
  if (!(await isStudioAdmin(decoded))) {
    throw createError({
      statusCode: 403,
      statusMessage:
        'This account cannot change the studio. Sign in with the studio owner account.',
    })
  }

  return decoded
}

export function getFirebaseAdmin() {
  return getFirebaseAdminAuth()
}
