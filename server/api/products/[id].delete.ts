import { createError } from 'h3'
import { requireStudio } from '~/server/utils/studioAuth'
import { deleteProduct } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  const deleted = await deleteProduct(id)
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

  return { ok: true }
})
