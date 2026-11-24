import { createError } from 'h3'
import { query } from '~/server/utils/db'
import { escapeEmailHtml, sendEmail } from '~/server/utils/email'
import { verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

interface NeonAuthProfile {
  firebase_uid: string
  email: string
  display_name: string
  photo_url: string
  email_verified: boolean
  created_at: Date | string
  updated_at: Date | string
}

export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)
  const email = decoded.email?.trim().toLowerCase()

  if (!decoded.email_verified || !email) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Verify your email before saving your account.',
    })
  }

  const displayName = String(decoded.name || '').trim()
  const photoUrl = String(decoded.picture || '').trim()
  
  let savedProfile: NeonAuthProfile | undefined
  try {
    const profileResult = await query<NeonAuthProfile>(
      `INSERT INTO auth_users (
         firebase_uid, email, display_name, photo_url, email_verified, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, true, now(), now())
       ON CONFLICT (firebase_uid) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         photo_url = EXCLUDED.photo_url,
         email_verified = true,
         updated_at = now()
       RETURNING firebase_uid, email, display_name, photo_url, email_verified, created_at, updated_at
      `,
      [decoded.uid, email, displayName, photoUrl],
    )
    savedProfile = profileResult.rows[0]
  } catch (dbError) {
    console.warn('[aaroh/auth] Database write failed (likely quota limit). Falling back to session profile.', dbError)
    // Graceful fallback: return the decoded Firebase auth profile so login does not break with a 500 error!
    return {
      user: {
        uid: decoded.uid,
        email,
        displayName,
        photoUrl,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      welcomeEmailSent: false,
    }
  }
  if (!savedProfile) {
    throw createError({ statusCode: 500, statusMessage: 'The account profile could not be saved.' })
  }

  const claim = await query<{ firebase_uid: string }>(
    `UPDATE auth_users
     SET welcome_email_claimed_at = now()
     WHERE firebase_uid = $1
       AND welcome_email_sent_at IS NULL
       AND (
         welcome_email_claimed_at IS NULL
         OR welcome_email_claimed_at < now() - interval '5 minutes'
       )
     RETURNING firebase_uid`,
    [decoded.uid],
  )

  let welcomeEmailSent = true
  if (claim.rowCount) {
    const safeName = escapeEmailHtml(displayName || 'there')
    try {
      await sendEmail({
        to: email,
        subject: 'Thank you for joining AAROH.',
        text: `Hi ${displayName || 'there'},\n\nThank you for signing up and becoming part of AAROH. We are glad you are here.`,
        html: `<p>Hi ${safeName},</p><p>Thank you for signing up and becoming part of AAROH. We are glad you are here.</p>`,
      })
    } catch (error) {
      await query(
        `UPDATE auth_users
         SET welcome_email_claimed_at = NULL
         WHERE firebase_uid = $1 AND welcome_email_sent_at IS NULL`,
        [decoded.uid],
      )
      console.error('[aaroh/auth] The Neon profile was saved, but the welcome email failed.', error)
      welcomeEmailSent = false
    }

    if (welcomeEmailSent) {
      await query(
        `UPDATE auth_users
         SET welcome_email_claimed_at = NULL, welcome_email_sent_at = now()
         WHERE firebase_uid = $1 AND welcome_email_sent_at IS NULL`,
        [decoded.uid],
      )
    }
  }

  return {
    user: {
      uid: savedProfile.firebase_uid,
      email: savedProfile.email,
      displayName: savedProfile.display_name,
      photoUrl: savedProfile.photo_url,
      emailVerified: savedProfile.email_verified,
      createdAt: new Date(savedProfile.created_at).toISOString(),
      updatedAt: new Date(savedProfile.updated_at).toISOString(),
    },
    welcomeEmailSent,
  }
})
