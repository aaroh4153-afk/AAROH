import { replaceBanners } from '~/server/utils/banners'
import { requireStudio } from '~/server/utils/studioAuth'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  return replaceBanners(await readBody(event))
})
