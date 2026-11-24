import { getPool, hasDatabase } from '../utils/db'

export default defineEventHandler(async () => {
  if (!hasDatabase()) {
    return { status: 'ok', database: 'unconfigured' }
  }

  try {
    await getPool().query('SELECT 1')
    return { status: 'ok', database: 'connected' }
  } catch (error: any) {
    return { status: 'ok', database: 'error', error: error?.message || String(error) }
  }
})
