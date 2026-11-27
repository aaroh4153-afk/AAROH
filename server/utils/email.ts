import { createError } from 'h3'
import nodemailer from 'nodemailer'

interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
}

export function escapeEmailHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character] ?? character
  })
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const config = useRuntimeConfig()
  const host = String(config.smtpHost || process.env.NUXT_SMTP_HOST || '').trim()
  const user = String(config.smtpUser || process.env.NUXT_SMTP_USER || '').trim()
  const password = String(config.smtpPassword || process.env.NUXT_SMTP_PASSWORD || '')
  const from = String(config.smtpFrom || process.env.NUXT_SMTP_FROM || '').trim()
  const port = Number(config.smtpPort || process.env.NUXT_SMTP_PORT || 587)

  if (!host || !user || !password || !from || !Number.isInteger(port) || port < 1) {
    throw createError({
      statusCode: 503,
      statusMessage: 'SMTP email is not configured on the server.',
    })
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  })

  await transporter.sendMail({ from, ...message })
}
