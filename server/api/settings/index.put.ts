import { saveSettings } from '../../utils/store'
import { verifyStudioAdmin } from '~/server/utils/firebaseAuth'

export default defineEventHandler(async (event) => {
  await verifyStudioAdmin(event)
  const body = await readBody(event)
  return saveSettings(body)
})
