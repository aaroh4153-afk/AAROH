import { createError } from 'h3'
import { requireStudio } from '~/server/utils/studioAuth'
import { parseProductInput, upsertProduct } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  const body = await readBody(event)
  return upsertProduct({ ...parseProductInput(body, id), id })
})
