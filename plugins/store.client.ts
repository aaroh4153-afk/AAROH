export default defineNuxtPlugin((nuxtApp) => {
  const store = useStore()

  nuxtApp.hook('app:mounted', () => {
    // Attempt background sync if backend database is reachable
    void store.refreshFromDatabase()

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void store.refreshFromDatabase()
    }
    document.addEventListener('visibilitychange', refreshWhenVisible)
  })
})
