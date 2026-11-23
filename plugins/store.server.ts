import type { StorePayload } from '~/data/store'

/**
 * Hydrate the shared store from PostgreSQL before the page renders.
 * The client keeps the same reactive state and writes changes back through
 * the Nitro API, so every component continues to use the existing interface.
 */
export default defineNuxtPlugin(async () => {
  const store = useStore()

  async function refresh() {
    const request = useRequestFetch()
    try {
      const data = await request<StorePayload>('/api/store')
      store.products.value = data.products
      store.orders.value = data.orders
      store.categories.value = data.categories
      store.collections.value = data.collections
      store.settings.value = data.settings
    } catch (error) {
      console.warn('[aaroh/store] Database unavailable; live store state could not be loaded.', error)
    }
  }

  await refresh()

  if (import.meta.client) {
    let interval: ReturnType<typeof setInterval> | null = null

    onMounted(() => {
      const refreshWhenVisible = () => {
        if (document.visibilityState === 'visible') void store.refreshFromDatabase()
      }
      document.addEventListener('visibilitychange', refreshWhenVisible)
      interval = setInterval(() => void store.refreshFromDatabase(), 15_000)

      onBeforeUnmount(() => {
        document.removeEventListener('visibilitychange', refreshWhenVisible)
        if (interval) clearInterval(interval)
      })
    })
  }
})
