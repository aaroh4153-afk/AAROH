import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import {
  createError,
  deleteCookie,
  getCookie,
  getHeader,
  getRequestProtocol,
  setCookie,
} from 'h3'
import type { H3Event } from 'h3'
import { verifyStudioAdmin } from './firebaseAuth'

const COOKIE_NAME = 'aaroh_studio'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export interface StudioSession {
  email: string
  expiresAt: number
}

interface StudioCredentials {
  email: string
  password: string
  secret: string
}

/** Owner credentials for the dashboard. Override them with NUXT_STUDIO_EMAIL / NUXT_STUDIO_PASSWORD. */
export function getStudioCredentials(): StudioCredentials {
  const config = useRuntimeConfig()
  return {
    email: String(config.studioEmail || process.env.NUXT_STUDIO_EMAIL || 'aaroh4153@gmail.com')
      .trim()
      .toLowerCase(),
    password: String(
      config.studioPassword || process.env.NUXT_STUDIO_PASSWORD || 'aaroh4153@Fashion',
    ),
    secret: String(
      config.studioSessionSecret ||
        process.env.NUXT_STUDIO_SESSION_SECRET ||
        'aaroh-studio-session-secret',
    ),
  }
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function checkStudioCredentials(input: { email?: string; password?: string }): boolean {
  const { email, password } = getStudioCredentials()
  const givenEmail = String(input.email ?? '').trim().toLowerCase()
  const givenPassword = String(input.password ?? '')

  return (
    timingSafeEqual(digest(givenEmail), digest(email)) &&
    timingSafeEqual(digest(givenPassword), digest(password))
  )
}

export function setStudioSession(event: H3Event, email: string): StudioSession {
  const { secret } = getStudioCredentials()
  const session: StudioSession = {
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  }
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')

  setCookie(event, COOKIE_NAME, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
    secure: getRequestProtocol(event) === 'https',
  })

  return session
}

export function clearStudioSession(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function getStudioSession(event: H3Event): StudioSession | null {
  const raw = getCookie(event, COOKIE_NAME)
  if (!raw) return null

  const [payload, signature] = raw.split('.')
  if (!payload || !signature) return null

  const { secret } = getStudioCredentials()
  const expected = sign(payload, secret)
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as StudioSession
    if (!session?.email || !session.expiresAt || session.expiresAt < Date.now()) return null
    return session
  } catch {
    return null
  }
}

/**
 * Studio access: the signed-in owner session, or a Firebase account that is
 * flagged as the studio admin.
 */
export async function requireStudio(event: H3Event): Promise<StudioSession> {
  const session = getStudioSession(event)
  if (session) return session

  if (!getHeader(event, 'authorization')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sign in to the studio with the owner email and password.',
    })
  }

  const decoded = await verifyStudioAdmin(event)
  return { email: decoded.email?.trim().toLowerCase() || '', expiresAt: 0 }
}
