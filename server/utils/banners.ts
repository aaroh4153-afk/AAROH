import { createError } from 'h3'
import type { StoreBanner } from '~/data/banners'
import { query, withTransaction } from './db'

const MAX_BANNERS = 2
const MAX_IMAGE_LENGTH = 1_500_000

interface BannerRow {
  id: string
  image: string
  alt_text: string
  position: number
}

function parseBanners(input: unknown): Omit<StoreBanner, 'position'>[] {
  if (!input || typeof input !== 'object' || !('banners' in input)) {
    throw createError({ statusCode: 400, statusMessage: 'Banner list is required.' })
  }

  const entries = (input as { banners: unknown }).banners
  if (!Array.isArray(entries) || entries.length > MAX_BANNERS) {
    throw createError({
      statusCode: 400,
      statusMessage: `Upload no more than ${MAX_BANNERS} banners.`,
    })
  }

  return entries.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw createError({ statusCode: 400, statusMessage: 'Each banner must include an image.' })
    }

    const body = entry as Record<string, unknown>
    const image = String(body.image ?? '').trim()
    const dataImage = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(image)

    if (!image) {
      throw createError({ statusCode: 400, statusMessage: 'Each banner must include an image.' })
    }

    if (image.length > MAX_IMAGE_LENGTH) {
      throw createError({
        statusCode: 413,
        statusMessage: 'Each banner image must be 1 MB or smaller.',
      })
    }

    if (!dataImage) {
      let url: URL
      try {
        url = new URL(image)
      } catch {
        throw createError({
          statusCode: 400,
          statusMessage: 'Use a PNG, JPEG, WebP image or a valid image URL.',
        })
      }

      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw createError({ statusCode: 400, statusMessage: 'Banner URLs must use HTTP or HTTPS.' })
      }
    }

    const altText = String(body.altText ?? `AAROH. editorial image ${index + 1}`).trim()
    if (altText.length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'Banner alt text must be 200 characters or less.' })
    }

    return { id: `home-banner-${index + 1}`, image, altText }
  })
}

export async function loadBanners(): Promise<StoreBanner[]> {
  const { rows } = await query<BannerRow>(
    `SELECT id, image, alt_text, position
     FROM editorial_banners
     ORDER BY position ASC, id ASC`,
  )

  return rows.map((row) => ({
    id: row.id,
    image: row.image,
    altText: row.alt_text,
    position: row.position,
  }))
}

export async function replaceBanners(input: unknown): Promise<StoreBanner[]> {
  const banners = parseBanners(input)

  await withTransaction(async (client) => {
    await client.query('DELETE FROM editorial_banners')

    for (const [position, banner] of banners.entries()) {
      await client.query(
        `INSERT INTO editorial_banners (id, image, alt_text, position, updated_at)
         VALUES ($1, $2, $3, $4, now())`,
        [banner.id, banner.image, banner.altText, position],
      )
    }
  })

  return loadBanners()
}
