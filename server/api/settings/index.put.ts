import { saveSettings } from '../../utils/store'
import { requireStudio } from '~/server/utils/studioAuth'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const body = await readBody(event)
  return saveSettings(body)
})
