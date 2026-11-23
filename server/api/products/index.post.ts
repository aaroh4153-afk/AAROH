import { parseProductInput, upsertProduct } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return upsertProduct(parseProductInput(body))
})
