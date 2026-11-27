import { requireStudio } from '~/server/utils/studioAuth'
import { parseProductInput, upsertProduct } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const body = await readBody(event)
  return upsertProduct(parseProductInput(body))
})
