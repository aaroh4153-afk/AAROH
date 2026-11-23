import { createError } from 'h3'
import { parseProductInput, upsertProduct } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  const body = await readBody(event)
  return upsertProduct({ ...parseProductInput(body, id), id })
})
