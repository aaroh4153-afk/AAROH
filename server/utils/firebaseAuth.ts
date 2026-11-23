import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'

interface FirebaseServiceAccount {
  project_id?: string
  client_email?: string
  private_key?: string
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

  const existingApp = getApps().find((app) => app.name === 'aaroh-token-verifier')
  const app = existingApp ?? initializeApp({ projectId }, 'aaroh-token-verifier')
  return getAuth(app)
}

function getFirebaseAdminAuth() {
  const config = useRuntimeConfig()
  const rawAccount = String(
    config.firebaseServiceAccountJson || process.env.NUXT_FIREBASE_SERVICE_ACCOUNT_JSON || '',
  ).trim()

  if (!rawAccount) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Firebase Admin is not configured on the server.',
    })
  }

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
    return await auth.verifyIdToken(token)
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
    if (
      code === 'auth/argument-error' ||
      code === 'auth/id-token-expired' ||
      code === 'auth/id-token-revoked' ||
      code === 'auth/invalid-id-token'
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

export async function verifyStudioAdmin(event: H3Event): Promise<DecodedIdToken> {
  const config = useRuntimeConfig()
  const allowedEmail = String(
    config.studioAdminEmail || process.env.NUXT_STUDIO_ADMIN_EMAIL || '',
  )
    .trim()
    .toLowerCase()

  if (!allowedEmail) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Set NUXT_STUDIO_ADMIN_EMAIL before saving dashboard settings.',
    })
  }

  const decoded = await verifyFirebaseRequest(event)
  if (!decoded.email_verified || decoded.email?.trim().toLowerCase() !== allowedEmail) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Sign in with the verified studio admin account to make this change.',
    })
  }

  return decoded
}

export function getFirebaseAdmin() {
  return getFirebaseAdminAuth()
}
