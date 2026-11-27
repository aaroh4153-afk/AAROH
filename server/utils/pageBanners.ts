import { createError } from 'h3'
import {
  clonePageBanners,
  defaultPageBanners,
  type CampaignBanner,
  type PageBanners,
  type ShopBanner,
} from '~/data/banners'
import { query, withTransaction } from './db'

const MAX_IMAGE_LENGTH = 1_500_000

type Slot = keyof PageBanners

interface BannerRow {
  slot: string
  image: string
  alt_text: string
  content: Record<string, unknown> | null
}

interface CampaignContent {
  label: string
  season: string
  title: string
  note: string
  ctaLabel: string
  ctaHref: string
}

interface ShopContent {
  eyebrow: string
  title: string
  note: string
}

interface SlotUpdate {
  slot: Slot
  image: string
  altText: string
  content: CampaignContent | ShopContent
}

function invalid(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

function readText(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  fallback: string,
): string {
  const raw = body[key]
  if (raw === undefined || raw === null) return fallback
  if (typeof raw !== 'string') invalid(`${key} must be text.`)

  const value = raw.trim()
  if (value.length > maxLength) {
    invalid(`${key} must be ${maxLength} characters or fewer.`)
  }
  return value || fallback
}

/** Empty is allowed: it falls back to the built-in banner image. */
function readImage(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') invalid('The banner image must be an image or a URL.')

  const image = value.trim()
  if (!image) return ''

  const dataImage = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(image)
  const localPath = image.startsWith('/')
  if (!dataImage && !localPath) {
    let url: URL
    try {
      url = new URL(image)
    } catch {
      invalid('Use a PNG, JPEG, WebP image or a valid image URL.')
    }
    const protocol = (url as URL).protocol
    if (protocol !== 'https:' && protocol !== 'http:') {
      invalid('Banner URLs must use HTTP or HTTPS.')
    }
  }

  if (image.length > MAX_IMAGE_LENGTH) {
    throw createError({
      statusCode: 413,
      statusMessage: 'The banner image must be 1 MB or smaller.',
    })
  }

  return image
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function mapRow(row: BannerRow): PageBanners[Slot] {
  const content = row.content ?? {}

  if (row.slot === 'campaign') {
    const banner: CampaignBanner = {
      ...defaultPageBanners.campaign,
      label: readString(content.label, defaultPageBanners.campaign.label),
      season: readString(content.season, defaultPageBanners.campaign.season),
      title: readString(content.title, defaultPageBanners.campaign.title),
      note: readString(content.note, defaultPageBanners.campaign.note),
      ctaLabel: readString(content.ctaLabel, defaultPageBanners.campaign.ctaLabel),
      ctaHref: readString(content.ctaHref, defaultPageBanners.campaign.ctaHref),
      altText: readString(row.alt_text, defaultPageBanners.campaign.altText),
      image: row.image.trim() || defaultPageBanners.campaign.image,
    }
    return banner
  }

  const banner: ShopBanner = {
    ...defaultPageBanners.shop,
    eyebrow: readString(content.eyebrow, defaultPageBanners.shop.eyebrow),
    title: readString(content.title, defaultPageBanners.shop.title),
    note: readString(content.note, defaultPageBanners.shop.note),
    altText: readString(row.alt_text, defaultPageBanners.shop.altText),
    image: row.image.trim(),
  }
  return banner
}

export async function loadPageBanners(): Promise<PageBanners> {
  const banners = clonePageBanners(defaultPageBanners)

  try {
    const { rows } = await query<BannerRow>(
      'SELECT slot, image, alt_text, content FROM page_banners',
    )

    for (const row of rows) {
      if (row.slot === 'campaign') banners.campaign = mapRow(row) as CampaignBanner
      if (row.slot === 'shop') banners.shop = mapRow(row) as ShopBanner
    }
  } catch (error) {
    console.warn('[aaroh/page-banners] Database query failed, using default banners.', error)
  }

  return banners
}

function parseUpdate(slot: Slot, entry: unknown): SlotUpdate {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    invalid('Each banner must be saved as an object.')
  }

  const body = entry as Record<string, unknown>
  const image = readImage(body.image)

  if (slot === 'campaign') {
    return {
      slot,
      image,
      altText: readText(body, 'altText', 200, defaultPageBanners.campaign.altText),
      content: {
        label: readText(body, 'label', 80, defaultPageBanners.campaign.label),
        season: readText(body, 'season', 80, defaultPageBanners.campaign.season),
        title: readText(body, 'title', 300, defaultPageBanners.campaign.title),
        note: readText(body, 'note', 800, defaultPageBanners.campaign.note),
        ctaLabel: readText(body, 'ctaLabel', 60, defaultPageBanners.campaign.ctaLabel),
        ctaHref: readText(body, 'ctaHref', 300, defaultPageBanners.campaign.ctaHref),
      },
    }
  }

  return {
    slot,
    image,
    altText: readText(body, 'altText', 200, defaultPageBanners.shop.altText),
    content: {
      eyebrow: readText(body, 'eyebrow', 80, defaultPageBanners.shop.eyebrow),
      title: readText(body, 'title', 200, defaultPageBanners.shop.title),
      note: readText(body, 'note', 500, defaultPageBanners.shop.note),
    },
  }
}

/** Updates only the slots present in the payload. */
export async function savePageBanners(input: unknown): Promise<PageBanners> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    invalid('Banner payload is required.')
  }

  const body = input as Record<string, unknown>
  const updates: SlotUpdate[] = []

  if (body.campaign !== undefined) updates.push(parseUpdate('campaign', body.campaign))
  if (body.shop !== undefined) updates.push(parseUpdate('shop', body.shop))

  if (!updates.length) invalid('Send the campaign or shop banner to update.')

  await withTransaction(async (client) => {
    for (const update of updates) {
      await client.query(
        `INSERT INTO page_banners (slot, image, alt_text, content, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, now())
         ON CONFLICT (slot) DO UPDATE SET
           image = EXCLUDED.image,
           alt_text = EXCLUDED.alt_text,
           content = EXCLUDED.content,
           updated_at = now()`,
        [update.slot, update.image, update.altText, JSON.stringify(update.content)],
      )
    }
  })

  return loadPageBanners()
}
