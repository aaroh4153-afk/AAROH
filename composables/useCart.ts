import type { Product, SizeName } from '~/data/products'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { isVerifiedAccount } from '~/utils/firebaseAuth'

export interface CartItem {
  /** Cart line id: product id plus selected size. */
  id: string
  productId: string
  name: string
  colour: string
  price: number
  image: string
  quantity: number
  size?: SizeName
}

const STORAGE_KEY = 'aaroh_cart_v1'
const MAX_QUANTITY = 99
let mutationQueue: Promise<void> = Promise.resolve()

function cartId(productId: string, size?: string): string {
  return size ? `${productId}--${size}` : productId
}

function normalizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is CartItem => {
      if (!entry || typeof entry !== 'object') return false
      const item = entry as Partial<CartItem>
      return Boolean(
        item.id &&
        item.productId &&
        item.name &&
        Number.isInteger(item.quantity) &&
        Number(item.quantity) > 0,
      )
    })
    .map((item) => ({
      ...item,
      quantity: Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity))),
      price: Math.max(0, Number(item.price) || 0),
    }))
}

function loadFromStorage(): CartItem[] {
  if (!import.meta.client) return []
  try {
    return normalizeItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]) {
  if (!import.meta.client) return
  try {
    if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // The in-memory cart still works when browser storage is unavailable.
  }
}

function clearStorage() {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string; message?: string } }).data
    if (data?.statusMessage || data?.message) return data.statusMessage || data.message || ''
  }
  return 'Your cart could not be synced. Check your connection and try again.'
}

export const useCart = () => {
  const { user } = useFirebaseAuth()
  const items = useState<CartItem[]>('cart-items', () => [])
  const isOpen = useState<boolean>('cart-is-open', () => false)
  const hydrated = useState<boolean>('cart-hydrated', () => false)
  const syncing = useState<boolean>('cart-syncing', () => false)
  const syncError = useState<string>('cart-sync-error', () => '')
  const activeUid = useState<string>('cart-active-uid', () => '')
  const hydratedUid = useState<string>('cart-hydrated-uid', () => '')
  const guestBackup = useState<CartItem[]>('cart-guest-backup', () => [])

  const count = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() =>
    items.value.reduce((total, item) => total + item.price * item.quantity, 0),
  )

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

  async function requestCart(
    path: string,
    options: { method?: string; body?: unknown } = {},
    account = user.value,
  ) {
    const token = await getToken(account)
    if (!token) throw new Error('Sign in with a verified account to sync your cart.')
    return await $fetch<CartItem[]>(path, {
      ...options,
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  function enqueue(operation: () => Promise<void>) {
    mutationQueue = mutationQueue
      .catch(() => undefined)
      .then(async () => {
        syncing.value = true
        try {
          await operation()
        } finally {
          syncing.value = false
        }
      })
      .catch((error) => {
        syncError.value = errorMessage(error)
        console.warn('[aaroh/cart] Neon cart sync failed.', error)
      })
    return mutationQueue
  }

  async function replaceFromServer() {
    const serverItems = normalizeItems(await requestCart('/api/cart'))
    items.value = serverItems
    syncError.value = ''
  }

  /** Loads the guest cart once, then switches atomically to the verified user's Neon cart. */
  async function hydrate(_idToken?: string) {
    if (!import.meta.client) return

    if (!hydrated.value) {
      const local = loadFromStorage()
      items.value = local
      guestBackup.value = local
      hydrated.value = true
    }

    const uid = verifiedUid()
    if (uid === hydratedUid.value) return

    const previousUid = activeUid.value
    activeUid.value = uid
    syncError.value = ''

    if (!uid) {
      items.value = previousUid ? [] : loadFromStorage()
      guestBackup.value = items.value
      hydratedUid.value = ''
      saveToStorage(items.value)
      return
    }

    // Never merge a previous account's in-memory cart into the new account.
    if (previousUid) {
      items.value = []
      guestBackup.value = []
      clearStorage()
    }

    try {
      let serverItems = normalizeItems(await requestCart('/api/cart'))
      const localOnly = previousUid
        ? []
        : guestBackup.value.filter(
            (local) => !serverItems.some((server) => server.id === local.id),
          )

      for (const local of localOnly) {
        if (!local.size) continue
        serverItems = normalizeItems(
          await requestCart('/api/cart/item', {
            method: 'PATCH',
            body: { productId: local.productId, size: local.size, quantity: local.quantity },
          }),
        )
      }

      if (activeUid.value !== uid || (user.value?.emailVerified && user.value.uid !== uid)) return
      items.value = serverItems
      hydratedUid.value = uid
      clearStorage()
      guestBackup.value = []
    } catch (error) {
      // Keep a recoverable guest cart, but never show another account's data.
      if (activeUid.value !== uid) return
      items.value = previousUid ? [] : guestBackup.value
      syncError.value = errorMessage(error)
      console.warn('[aaroh/cart] Could not hydrate the Neon cart.', error)
    }
  }

  async function loadFromServer(_idToken?: string) {
    if (!import.meta.client) return
    const uid = verifiedUid()
    if (!uid) return
    activeUid.value = uid
    try {
      await replaceFromServer()
    } catch (error) {
      syncError.value = errorMessage(error)
    }
  }

  function persistLine(item: Pick<CartItem, 'productId' | 'size'>, quantity: number) {
    const account = user.value
    if (!import.meta.client || !isVerifiedAccount(account) || !account) return
    const uid = account.uid
    enqueue(async () => {
      if (user.value?.uid !== uid) return
      const serverItems = await requestCart(
        '/api/cart/item',
        {
          method: 'PATCH',
          body: { productId: item.productId, size: item.size, quantity },
        },
        account,
      )
      if (user.value?.uid !== uid) return
      items.value = normalizeItems(serverItems)
      syncError.value = ''
    })
  }

  function addItem(
    product: Pick<Product, 'id' | 'name' | 'colour' | 'price' | 'images'>,
    size?: SizeName,
    quantity = 1,
    _idToken?: string,
  ) {
    const id = cartId(product.id, size)
    const existing = items.value.find((item) => item.id === id)
    const nextQuantity = Math.min(
      MAX_QUANTITY,
      (existing?.quantity ?? 0) + Math.max(1, Math.round(quantity)),
    )

    if (existing) {
      existing.quantity = nextQuantity
    } else {
      items.value.push({
        id,
        productId: product.id,
        name: product.name,
        colour: product.colour,
        price: product.price,
        image: product.images[0] ?? '',
        size,
        quantity: nextQuantity,
      })
    }

    persistLine({ productId: product.id, size }, nextQuantity)
    isOpen.value = true
  }

  function updateQuantity(id: string, quantity: number, _idToken?: string) {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    item.quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)))
    persistLine(item, item.quantity)
  }

  function increment(id: string, _idToken?: string) {
    const item = items.value.find((entry) => entry.id === id)
    if (item) updateQuantity(id, item.quantity + 1)
  }

  function decrement(id: string, _idToken?: string) {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return
    if (item.quantity <= 1) removeItem(id)
    else updateQuantity(id, item.quantity - 1)
  }

  function removeItem(id: string, _idToken?: string) {
    const item = items.value.find((entry) => entry.id === id)
    items.value = items.value.filter((entry) => entry.id !== id)
    if (item) persistLine(item, 0)
  }

  function clear(_idToken?: string) {
    items.value = []
    guestBackup.value = []
    clearStorage()
    const account = user.value
    if (!import.meta.client || !isVerifiedAccount(account) || !account) return
    const uid = account.uid
    enqueue(async () => {
      if (user.value?.uid !== uid) return
      const serverItems = await requestCart('/api/cart', { method: 'DELETE' }, account)
      if (user.value?.uid === uid) items.value = normalizeItems(serverItems)
      syncError.value = ''
    })
  }

  // Guest carts remain available offline. Authenticated carts are never written to localStorage.
  if (import.meta.client) {
    watch(
      items,
      (newItems) => {
        if (!isVerifiedAccount(user.value)) saveToStorage(newItems)
      },
      { deep: true },
    )
  }

  const toggleCart = () => {
    isOpen.value = !isOpen.value
  }

  return {
    items,
    isOpen,
    count,
    subtotal,
    hydrated,
    syncing,
    syncError,
    hydrate,
    loadFromServer,
    addItem,
    updateQuantity,
    increment,
    decrement,
    removeItem,
    clear,
    toggleCart,
  }
}
