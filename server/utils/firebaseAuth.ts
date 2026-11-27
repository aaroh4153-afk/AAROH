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

function readRawServiceAccount(): string {
  const config = useRuntimeConfig()
  return String(
    config.firebaseServiceAccountJson || process.env.NUXT_FIREBASE_SERVICE_ACCOUNT_JSON || '',
  )
    .trim()
    .replace(/^\uFEFF/, '')
}

/**
 * Escapes real line breaks and tabs that ended up inside JSON strings, which is
 * what happens when the service-account file is pasted into a hosting dashboard
 * and the editor turns the `\n` sequences into actual newlines.
 */
function escapeRawControlCharacters(value: string): string {
  let insideString = false
  let afterBackslash = false
  let result = ''

  for (const character of value) {
    if (insideString) {
      if (afterBackslash) {
        afterBackslash = false
        result += character
        continue
      }
      if (character === '\\') {
        afterBackslash = true
        result += character
        continue
      }
      if (character === '"') {
        insideString = false
        result += character
        continue
      }
      if (character === '\n' || character === '\r' || character === '\t') {
        result +=
          character === '\n' ? '\\n' : character === '\r' ? '\\r' : '\\t'
        continue
      }
      result += character
      continue
    }

    if (character === '"') insideString = true
    result += character
  }

  return result
}

function parseServiceAccount(rawAccount: string): FirebaseServiceAccount | null {
  if (!rawAccount) return null

  // Hosting dashboards often keep the quotes that wrapped the value in .env.
  const unquoted =
    rawAccount.length > 1 && rawAccount.startsWith('"') && rawAccount.endsWith('"')
      ? rawAccount.slice(1, -1).replace(/\\"/g, '"')
      : rawAccount

  let parsedAccount: unknown
  try {
    parsedAccount = JSON.parse(unquoted)
  } catch {
    try {
      parsedAccount = JSON.parse(escapeRawControlCharacters(unquoted))
    } catch {
      return null
    }
  }

  if (typeof parsedAccount !== 'object' || parsedAccount === null) return null

  const account = parsedAccount as FirebaseServiceAccount
  if (!account.project_id || !account.client_email || !account.private_key) return null

  // A double-escaped key (`\\n` in the dashboard) survives JSON.parse with the
  // escapes intact; firebase-admin needs real line breaks to read the PEM.
  return { ...account, private_key: String(account.private_key).replace(/\\n/g, '\n') }
}

/** Low-sensitivity state of the service-account config, for /api/health. */
export function getFirebaseAccountStatus(): 'ok' | 'missing' | 'invalid' {
  const rawAccount = readRawServiceAccount()
  if (!rawAccount) return 'missing'
  return parseServiceAccount(rawAccount) ? 'ok' : 'invalid'
}

let cachedServiceAccount: { raw: string; account: FirebaseServiceAccount | null } | null = null
let tokenVerifierChecksRevocation = false

function getFirebaseServiceAccount(): FirebaseServiceAccount | null {
  const rawAccount = readRawServiceAccount()
  if (!rawAccount) return null
  if (cachedServiceAccount?.raw === rawAccount) return cachedServiceAccount.account

  const account = parseServiceAccount(rawAccount)
  cachedServiceAccount = { raw: rawAccount, account }
  if (!account) {
    // A damaged dashboard value must not break sign-in: ID tokens can still be
    // verified with the project ID alone, only revocation checks and Admin
    // helpers need the service account.
    console.warn(
      '[aaroh/auth] NUXT_FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON; continuing without Firebase Admin.',
    )
    return null
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
  const existingApp = getApps().find((app) => app.name === 'aaroh-token-verifier')
  if (existingApp) {
    return { auth: getAuth(existingApp), checkRevoked: tokenVerifierChecksRevocation }
  }

  const account = getFirebaseServiceAccount()
  if (account) {
    try {
      const app = initializeApp(
        {
          projectId,
          credential: cert({
            projectId: account.project_id,
            clientEmail: account.client_email,
            privateKey: account.private_key,
          }),
        },
        'aaroh-token-verifier',
      )
      tokenVerifierChecksRevocation = true
      return { auth: getAuth(app), checkRevoked: true }
    } catch (error) {
      // A key that parses but cannot be read (truncated PEM, wrong escapes) must
      // not take sign-in down; verify tokens with the project ID only instead.
      console.error(
        '[aaroh/auth] Firebase Admin credentials could not be loaded; verifying ID tokens without revocation checks.',
        error,
      )
    }
  }

  const app = initializeApp({ projectId }, 'aaroh-token-verifier')
  tokenVerifierChecksRevocation = false
  return { auth: getAuth(app), checkRevoked: false }
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
  if (existingApp) return getAuth(existingApp)

  try {
    const app = initializeApp(
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
  } catch (error) {
    console.error('[aaroh/auth] Firebase Admin credentials could not be loaded.', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Firebase Admin is not available on the server.',
    })
  }
}

export async function verifyFirebaseRequest(event: H3Event): Promise<DecodedIdToken> {
  const authorization = getHeader(event, 'authorization') ?? ''
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in is required.' })
  }

  const { auth, checkRevoked } = getFirebaseTokenAuth()

  try {
    // Revocation checks need Admin credentials; skip them when only the project ID is configured.
    return await auth.verifyIdToken(token, checkRevoked)
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
