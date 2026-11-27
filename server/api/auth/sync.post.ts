import { createError } from 'h3'
import { query } from '~/server/utils/db'
import { escapeEmailHtml, sendEmail } from '~/server/utils/email'
import { ensureCustomerRecord, verifyCustomerRequest } from '~/server/utils/firebaseAuth'
import type { AccountProfile } from '~/data/account'

export default defineEventHandler(async (event) => {
  const decoded = await verifyCustomerRequest(event)

  let savedProfile: AccountProfile
  try {
    savedProfile = await ensureCustomerRecord(decoded)
  } catch (dbError) {
    console.error('[aaroh/auth] The account profile could not be saved.', dbError)
    throw createError({
      statusCode: 503,
      statusMessage: 'Your account could not be saved right now. Please try again shortly.',
    })
  }

  // Attach earlier guest orders that used the same email or phone number.
  const email = savedProfile.email.trim().toLowerCase()
  const phone = savedProfile.phone.trim()
  if (email || phone) {
    try {
      await query(
        `UPDATE orders
         SET firebase_uid = $1
         WHERE firebase_uid IS NULL
           AND (
             ($2 <> '' AND lower(customer->>'email') = $2)
             OR (
               $3 <> ''
               AND right(regexp_replace(customer->>'phone', '\\D', '', 'g'), 10)
                 = right(regexp_replace($3, '\\D', '', 'g'), 10)
             )
           )`,
        [decoded.uid, email, phone],
      )
    } catch (claimError) {
      console.warn('[aaroh/auth] Earlier guest orders could not be claimed.', claimError)
    }
  }

  // The welcome email is only possible for accounts that supplied an email address.
  let welcomeEmailSent = true
  if (!email) {
    return { user: savedProfile, welcomeEmailSent }
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

  if (claim.rowCount) {
    const safeName = escapeEmailHtml(savedProfile.displayName || 'there')
    try {
      await sendEmail({
        to: email,
        subject: 'Thank you for joining AAROH.',
        text: `Hi ${savedProfile.displayName || 'there'},\n\nThank you for signing up and becoming part of AAROH. We are glad you are here.`,
        html: `<p>Hi ${safeName},</p><p>Thank you for signing up and becoming part of AAROH. We are glad you are here.</p>`,
      })
    } catch (error) {
      await query(
        `UPDATE auth_users
         SET welcome_email_claimed_at = NULL
         WHERE firebase_uid = $1 AND welcome_email_sent_at IS NULL`,
        [decoded.uid],
      )
      console.error('[aaroh/auth] The profile was saved, but the welcome email failed.', error)
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
    user: savedProfile,
    welcomeEmailSent,
  }
})
