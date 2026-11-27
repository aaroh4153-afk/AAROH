import { createError } from 'h3'
import type { ProductStatus, SizeName } from '~/data/products'
import { requireStudio } from '~/server/utils/studioAuth'
import { updateProduct } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  const body = await readBody<{
    status?: ProductStatus
    size?: SizeName
    stock?: number
  }>(event)

  const product = await updateProduct(id, body)
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

  return product
})
