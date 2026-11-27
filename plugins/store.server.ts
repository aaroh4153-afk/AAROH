import type { StorePayload } from '~/data/store'

/** Hydrate the shared store from PostgreSQL before the page renders. */
export default defineNuxtPlugin(async () => {
  const store = useStore()

  try {
    const request = useRequestFetch()
    const data = await request<StorePayload>('/api/store')
    if (data?.products) {
      store.products.value = data.products
    }
    if (data?.orders) {
      store.orders.value = data.orders
    }
    if (Array.isArray(data?.categories)) {
      store.categories.value = data.categories
    }
    if (Array.isArray(data?.collections)) {
      store.collections.value = data.collections
    }
    if (data?.settings) {
      store.settings.value = data.settings
    }
  } catch (error) {
    console.warn('[aaroh/store] Database unavailable during SSR; live store state will sync on client.')
  }
})
