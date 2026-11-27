import { createError } from 'h3'
import { requireStudio } from '~/server/utils/studioAuth'
import { duplicateProduct } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  const product = await duplicateProduct(id)
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

  return product
})
