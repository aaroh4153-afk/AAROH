import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { isVerifiedAccount } from '~/utils/firebaseAuth'

const STORAGE_KEY = 'aaroh_wishlist_v1'

function loadStored(): string[] {
  if (!import.meta.client) return []
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveStored(ids: string[]) {
  if (!import.meta.client) return
  try {
    if (ids.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable; the in-memory wishlist still works.
  }
}

/**
 * Saved pieces behave exactly like the cart: a signed-in customer's wishlist lives
 * in Neon against their Firebase uid, a guest's stays in this browser.
 */
export const useWishlist = () => {
  const { user } = useFirebaseAuth()
  const ids = useState<string[]>('wishlist-ids', () => [])
  const hydrated = useState<boolean>('wishlist-hydrated', () => false)
  const syncing = useState<boolean>('wishlist-syncing', () => false)
  const activeUid = useState<string>('wishlist-active-uid', () => '')
  const guestIds = useState<string[]>('wishlist-guest-ids', () => [])

  const count = computed(() => ids.value.length)

  function has(productId: string): boolean {
    return ids.value.includes(productId)
  }

  function verifiedUid(account = user.value): string {
    return isVerifiedAccount(account) && account ? account.uid : ''
  }

  async function getToken(account = user.value): Promise<string | null> {
    if (!isVerifiedAccount(account) || !account) return null
    try {
      return await account.getIdToken()
    } catch {
      return null
    }
  }

  /** Loads the guest list once, then switches to the signed-in customer's saved pieces. */
  async function hydrate(): Promise<void> {
    if (!import.meta.client) return

    if (!hydrated.value) {
      const local = loadStored()
      ids.value = local
      guestIds.value = local
      hydrated.value = true
    }

    const uid = verifiedUid()
    if (uid === activeUid.value) return

    const previousUid = activeUid.value
    activeUid.value = uid

    if (!uid) {
      ids.value = previousUid ? [] : loadStored()
      guestIds.value = ids.value
      saveStored(ids.value)
      return
    }

    const token = await getToken()
    if (!token) return

    try {
      let serverIds = await $fetch<string[]>('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Keep anything the customer saved while browsing as a guest.
      const localOnly = previousUid
        ? []
        : guestIds.value.filter((id) => !serverIds.includes(id))

      for (const productId of localOnly) {
        serverIds = await $fetch<string[]>('/api/wishlist', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: { productId, saved: true },
        })
      }

      if (activeUid.value !== uid) return
      ids.value = serverIds
      guestIds.value = []
      saveStored([])
    } catch (error) {
      console.warn('[aaroh/wishlist] Could not load the saved pieces.', error)
    }
  }

  async function toggle(productId: string): Promise<boolean> {
    const saved = !has(productId)
    ids.value = saved
      ? [productId, ...ids.value.filter((id) => id !== productId)]
      : ids.value.filter((id) => id !== productId)

    const token = await getToken()
    if (!token) {
      saveStored(ids.value)
      return saved
    }

    syncing.value = true
    try {
      ids.value = await $fetch<string[]>('/api/wishlist', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: { productId, saved },
      })
    } catch (error) {
      console.warn('[aaroh/wishlist] Could not save that piece.', error)
    } finally {
      syncing.value = false
    }

    return saved
  }

  return { ids, count, hydrated, syncing, has, toggle, hydrate }
}
