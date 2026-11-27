import { createError } from 'h3'
import { escapeEmailHtml, sendEmail } from '~/server/utils/email'
import { getFirebaseAdmin, verifyFirebaseRequest } from '~/server/utils/firebaseAuth'

export default defineEventHandler(async (event) => {
  const decoded = await verifyFirebaseRequest(event)
  const email = decoded.email?.trim().toLowerCase()

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'This account has no email address.' })
  }

  if (decoded.email_verified) {
    throw createError({ statusCode: 409, statusMessage: 'This email address is already verified.' })
  }

  const config = useRuntimeConfig()
  const baseUrl = String(config.firebaseAuthBaseUrl || config.public.siteUrl).replace(/\/+$/, '')
  const verificationUrl = `${baseUrl}/account?verified=1`
  const actionLink = await getFirebaseAdmin().generateEmailVerificationLink(email, {
    url: verificationUrl,
  })
  const safeName = escapeEmailHtml(String(decoded.name || 'there'))
  const safeLink = escapeEmailHtml(actionLink)

  await sendEmail({
    to: email,
    subject: 'Verify your AAROH. account',
    text: `Hi ${String(decoded.name || 'there')},\n\nVerify your email address to finish creating your AAROH. account:\n${actionLink}\n\nIf you did not create an account, you can ignore this email.`,
    html: `<p>Hi ${safeName},</p><p>Verify your email address to finish creating your AAROH. account.</p><p><a href="${safeLink}">Verify my email</a></p><p>If you did not create an account, you can ignore this email.</p>`,
  })

  return { sent: true }
})
