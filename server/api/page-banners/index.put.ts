import { savePageBanners } from '~/server/utils/pageBanners'
import { requireStudio } from '~/server/utils/studioAuth'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  return savePageBanners(await readBody(event))
})
