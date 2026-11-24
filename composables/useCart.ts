import type { Product, SizeName } from '~/data/products'

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

function loadFromStorage(): CartItem[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

function clearStorage() {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export const useCart = () => {
  const items = useState<CartItem[]>('cart-items', () => [])
  const isOpen = useState<boolean>('cart-is-open', () => false)
  const hydrated = useState<boolean>('cart-hydrated', () => false)

  const count = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))

  const subtotal = computed(() =>
    items.value.reduce((total, item) => total + item.price * item.quantity, 0),
  )

  // Persist to localStorage whenever items change (client-side only)
  if (import.meta.client) {
    watch(
      items,
      (newItems) => {
        saveToStorage(newItems)
      },
      { deep: true },
    )
  }

  /**
   * Hydrate cart from localStorage. Called once on app mount.
   * On first call, loads from localStorage. After login, merges with server cart.
   */
  async function hydrate(idToken?: string) {
    if (!import.meta.client) return

    if (!hydrated.value) {
      // Always load localStorage first so cart is instant on page load
      const local = loadFromStorage()
      if (local.length) items.value = local
      hydrated.value = true
    }

    // If logged in, load server cart and merge with local
    if (idToken) {
      await loadFromServer(idToken)
    }
  }

  /**
   * Load cart from Neon DB for a logged-in user and merge with local cart.
   * Local items (added while logged out) are pushed to server.
   */
  async function loadFromServer(idToken: string) {
    if (!import.meta.client) return

    try {
      const serverItems = await $fetch<CartItem[]>('/api/cart', {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      // Merge: local items not on server → push to server
      const localOnly = items.value.filter(
        (local) => !serverItems.some((s) => s.id === local.id),
      )

      for (const item of localOnly) {
        await $fetch('/api/cart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
          body: {
            productId: item.productId,
            name: item.name,
            colour: item.colour,
            size: item.size,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          },
        }).catch(() => null)
      }

      // Build merged list: server items + local-only additions
      const merged: CartItem[] = [...serverItems]
      for (const local of localOnly) {
        const existing = merged.find((m) => m.id === local.id)
        if (existing) {
          existing.quantity = local.quantity
        } else {
          merged.push(local)
        }
      }

      items.value = merged
    } catch {
      // Network / auth error — keep local cart as-is
    }
  }

  /**
   * Push a single add/update to the server if logged in.
   */
  async function syncAddToServer(item: CartItem, idToken?: string) {
    if (!idToken || !import.meta.client) return
    await $fetch('/api/cart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      body: {
        productId: item.productId,
        name: item.name,
        colour: item.colour,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      },
    }).catch(() => null)
  }

  /**
   * Push a quantity change to the server if logged in.
   */
  async function syncUpdateToServer(productId: string, size: string | undefined, quantity: number, idToken?: string) {
    if (!idToken || !import.meta.client) return
    await $fetch('/api/cart/item', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${idToken}` },
      body: { productId, size, quantity },
    }).catch(() => null)
  }

  const addItem = (
    product: Pick<Product, 'id' | 'name' | 'colour' | 'price' | 'images'>,
    size?: SizeName,
    quantity = 1,
    idToken?: string,
  ) => {
    const cartId = size ? `${product.id}--${size}` : product.id
    const existing = items.value.find((item) => item.id === cartId)

    if (existing) {
      existing.quantity += quantity
      syncUpdateToServer(product.id, size, existing.quantity, idToken)
    } else {
      const newItem: CartItem = {
        id: cartId,
        productId: product.id,
        name: product.name,
        colour: product.colour,
        price: product.price,
        image: product.images[0] ?? '',
        size,
        quantity,
      }
      items.value.push(newItem)
      syncAddToServer(newItem, idToken)
    }

    isOpen.value = true
  }

  const updateQuantity = (id: string, quantity: number, idToken?: string) => {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return
    if (quantity <= 0) {
      removeItem(id, idToken)
      return
    }
    item.quantity = quantity
    syncUpdateToServer(item.productId, item.size, quantity, idToken)
  }

  const increment = (id: string, idToken?: string) => {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return
    item.quantity += 1
    syncUpdateToServer(item.productId, item.size, item.quantity, idToken)
  }

  const decrement = (id: string, idToken?: string) => {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return
    if (item.quantity <= 1) {
      removeItem(id, idToken)
    } else {
      item.quantity -= 1
      syncUpdateToServer(item.productId, item.size, item.quantity, idToken)
    }
  }

  const removeItem = (id: string, idToken?: string) => {
    const item = items.value.find((entry) => entry.id === id)
    if (item) {
      syncUpdateToServer(item.productId, item.size, 0, idToken)
    }
    items.value = items.value.filter((entry) => entry.id !== id)
  }

  const clear = (idToken?: string) => {
    items.value = []
    clearStorage()
    if (idToken && import.meta.client) {
      $fetch('/api/cart', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      }).catch(() => null)
    }
  }

  const toggleCart = () => {
    isOpen.value = !isOpen.value
  }

  return {
    items,
    isOpen,
    count,
    subtotal,
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
