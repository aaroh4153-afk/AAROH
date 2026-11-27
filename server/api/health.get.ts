import { getPool, hasDatabase } from '../utils/db'
import { getFirebaseAccountStatus } from '../utils/firebaseAuth'

export default defineEventHandler(async () => {
  const firebase = getFirebaseAccountStatus()

  if (!hasDatabase()) {
    return { status: 'ok', database: 'unconfigured', firebase }
  }

  try {
    await getPool().query('SELECT 1')
    return { status: 'ok', database: 'connected', firebase }
  } catch (error: any) {
    return { status: 'ok', database: 'error', firebase, error: error?.message || String(error) }
  }
})
