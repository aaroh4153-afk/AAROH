import type { StorePayload } from '~/data/store'

/**
 * Hydrate the shared store from PostgreSQL before the page renders.
 * Falls back safely to default seed catalog if the database is offline or unconfigured.
 */
export default defineNuxtPlugin(async () => {
  const store = useStore()

  try {
    const request = useRequestFetch()
    const data = await request<StorePayload>('/api/store')
    if (data?.products?.length) {
      store.products.value = data.products
    }
    if (data?.orders) {
      store.orders.value = data.orders
    }
    if (data?.categories?.length) {
      store.categories.value = data.categories
    }
    if (data?.collections?.length) {
      store.collections.value = data.collections
    }
    if (data?.settings) {
      store.settings.value = data.settings
    }
  } catch (error) {
    console.warn('[aaroh/store] Database unavailable during SSR; seeded store state retained.')
  }
})
