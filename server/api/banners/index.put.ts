import { replaceBanners } from '~/server/utils/banners'
import { verifyStudioAdmin } from '~/server/utils/firebaseAuth'

export default defineEventHandler(async (event) => {
  await verifyStudioAdmin(event)
  return replaceBanners(await readBody(event))
})
