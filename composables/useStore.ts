import { computed } from 'vue'
import {
  categories as seedCategories,
  collections as seedCollections,
  products as seedProducts,
  stockState,
  totalStock,
  type Category,
  type Collection,
  type Product,
  type ProductSize,
} from '~/data/products'
import {
  seedOrders,
  type DeliveryStatus,
  type Order,
  type PaymentStatus,
} from '~/data/orders'
import type { StorePayload } from '~/data/store'
import {
  cloneSettings,
  defaultSettings,
  type StoreSettings,
} from '~/data/settings'

function cloneProduct(product: Product): Product {
  return {
    ...product,
    images: [...product.images],
    sizes: product.sizes.map((size) => ({ ...size })),
    details: [...product.details],
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

const istDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function dayKey(date: Date): string {
  return istDay.format(date)
}

function startOfDayOffset(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

export type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'sku'> & {
  id?: string
  sku?: string
}

/**
 * Shared source of truth for the storefront and the studio UI.
 * PostgreSQL hydrates this state on the server; every mutation updates the
 * local refs immediately and writes through to the Nitro API in the background.
 */
export const useStore = () => {
  const products = useState<Product[]>('studio-products', () => seedProducts.map(cloneProduct))
  const orders = useState<Order[]>('studio-orders', () => seedOrders.map((o) => ({ ...o, items: [...o.items] })))

  const categoryList = useState<Category[]>('studio-categories', () => [...seedCategories])
  const collectionList = useState<Collection[]>('studio-collections', () => [...seedCollections])
  const settings = useState<StoreSettings>('studio-settings', () =>
    cloneSettings(defaultSettings),
  )

  async function refreshFromDatabase() {
    try {
      const data = await $fetch<StorePayload>('/api/store')
      if (data && Array.isArray(data.products) && data.products.length > 0) {
        products.value = data.products
      }
      if (data && Array.isArray(data.orders)) {
        orders.value = data.orders
      }
      if (data && Array.isArray(data.categories) && data.categories.length > 0) {
        categoryList.value = data.categories
      }
      if (data && Array.isArray(data.collections) && data.collections.length > 0) {
        collectionList.value = data.collections
      }
      if (data?.settings) {
        settings.value = data.settings
      }
    } catch (error) {
      console.warn('[aaroh/store] Could not refresh from the database; using seed catalogue.', error)
    }
  }

  async function persist(
    path: string,
    options: {
      method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      body?: Record<string, any> | BodyInit | null
    } = {},
  ) {
    if (import.meta.server) return

    try {
      await $fetch(path, options)
      await refreshFromDatabase()
    } catch (error) {
      console.error(`[aaroh/store] ${options.method ?? 'GET'} ${path} failed.`, error)
      void refreshFromDatabase()
    }
  }

  const activeProducts = computed(() =>
    products.value.filter((product) => product.status === 'active'),
  )

  const featuredProducts = computed(() =>
    activeProducts.value.filter((product) => product.featured).slice(0, 6),
  )

  const pendingOrders = computed(() =>
    orders.value.filter(
      (order) =>
        order.deliveryStatus === 'Processing' ||
        order.deliveryStatus === 'Packed' ||
        order.paymentStatus === 'Pending',
    ),
  )

  const lowStockProducts = computed(() =>
    products.value
      .filter((product) => product.status === 'active' && stockState(product) !== 'in')
      .sort((a, b) => totalStock(a) - totalStock(b)),
  )

  const unitsSold = computed(() =>
    orders.value
      .filter((order) => order.paymentStatus === 'Paid')
      .reduce(
        (total, order) =>
          total + order.items.reduce((count, item) => count + item.quantity, 0),
        0,
      ),
  )

  const paidRevenue = computed(() =>
    orders.value
      .filter((order) => order.paymentStatus === 'Paid')
      .reduce((total, order) => total + order.total, 0),
  )

  const averageOrderValue = computed(() => {
    const paid = orders.value.filter((order) => order.paymentStatus === 'Paid')
    if (!paid.length) return 0
    return Math.round(paid.reduce((total, order) => total + order.total, 0) / paid.length)
  })

  /** Last 14 days of trading, oldest first. */
  const dailySeries = computed(() => {
    const buckets = new Map<string, { revenue: number; orders: number }>()
    for (let index = 13; index >= 0; index -= 1) {
      buckets.set(dayKey(startOfDayOffset(index)), { revenue: 0, orders: 0 })
    }

    for (const order of orders.value) {
      if (order.paymentStatus !== 'Paid') continue
      const key = dayKey(new Date(order.placedAt))
      const bucket = buckets.get(key)
      if (!bucket) continue
      bucket.revenue += order.total
      bucket.orders += 1
    }

    return [...buckets.entries()].map(([key, value]) => ({
      key,
      label: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(
        new Date(`${key}T12:00:00+05:30`),
      ),
      ...value,
    }))
  })

  const last7Revenue = computed(() =>
    dailySeries.value.slice(-7).reduce((total, day) => total + day.revenue, 0),
  )

  const previous7Revenue = computed(() =>
    dailySeries.value.slice(0, 7).reduce((total, day) => total + day.revenue, 0),
  )

  const last7Orders = computed(() =>
    dailySeries.value.slice(-7).reduce((total, day) => total + day.orders, 0),
  )

  const revenueSpark = computed(() => dailySeries.value.map((day) => day.revenue))
  const ordersSpark = computed(() => dailySeries.value.map((day) => day.orders))

  const topProducts = computed(() => {
    const map = new Map<string, { id: string; name: string; image: string; units: number; revenue: number }>()
    for (const order of orders.value) {
      if (order.paymentStatus !== 'Paid') continue
      for (const item of order.items) {
        const entry = map.get(item.productId) ?? {
          id: item.productId,
          name: item.name,
          image: item.image,
          units: 0,
          revenue: 0,
        }
        entry.units += item.quantity
        entry.revenue += item.price * item.quantity
        map.set(item.productId, entry)
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue)
  })

  const collectionStats = computed(() =>
    collectionList.value.map((collection) => {
      const members = products.value.filter((product) => product.collection === collection.id)
      const productIds = new Set(members.map((product) => product.id))
      const units = orders.value
        .filter((order) => order.paymentStatus === 'Paid')
        .reduce(
          (total, order) =>
            total +
            order.items
              .filter((item) => productIds.has(item.productId))
              .reduce((count, item) => count + item.quantity, 0),
          0,
        )
      return {
        ...collection,
        productCount: members.length,
        units,
        stock: members.reduce((total, product) => total + totalStock(product), 0),
      }
    }),
  )

  const customers = computed(() => {
    const map = new Map<
      string,
      { name: string; email: string; phone: string; city: string; orders: number; spent: number; lastOrder: string }
    >()
    for (const order of orders.value) {
      const entry = map.get(order.customer.email) ?? {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
        city: order.customer.city,
        orders: 0,
        spent: 0,
        lastOrder: order.placedAt,
      }
      entry.orders += 1
      if (order.paymentStatus === 'Paid') entry.spent += order.total
      if (new Date(order.placedAt) > new Date(entry.lastOrder)) entry.lastOrder = order.placedAt
      map.set(order.customer.email, entry)
    }
    return [...map.values()].sort((a, b) => b.spent - a.spent)
  })

  function getProduct(id: string): Product | undefined {
    return products.value.find((product) => product.id === id)
  }

  function nextSku(): string {
    const numbers = products.value
      .map((product) => Number(product.sku.split('-').pop()))
      .filter((value) => Number.isFinite(value))
    const next = (numbers.length ? Math.max(...numbers) : 100) + 1
    return `ARH-NEW-${String(next).padStart(3, '0')}`
  }

  function saveProduct(draft: ProductDraft): Product {
    const existing = draft.id ? getProduct(draft.id) : undefined
    const baseId = slugify(draft.name) || `piece-${Date.now()}`
    let id = draft.id ?? baseId
    if (!existing) {
      let suffix = 2
      while (products.value.some((product) => product.id === id)) {
        id = `${baseId}-${suffix}`
        suffix += 1
      }
    }

    const sizes: ProductSize[] = draft.sizes.map((size) => ({
      size: size.size,
      stock: Math.max(0, Number(size.stock) || 0),
    }))

    let product: Product

    if (existing) {
      Object.assign(existing, {
        ...draft,
        id,
        sizes,
        sku: draft.sku || existing.sku,
        updatedAt: undefined,
      })
      product = existing
    } else {
      product = {
        ...draft,
        id,
        sku: draft.sku || nextSku(),
        sizes,
        createdAt: new Date().toISOString(),
      }
      products.value.unshift(product)
    }

    persist(`/api/products/${encodeURIComponent(product.id)}`, {
      method: 'PUT',
      body: cloneProduct(product),
    })

    return product
  }

  function removeProduct(id: string): void {
    products.value = products.value.filter((product) => product.id !== id)
    persist(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  function duplicateProduct(id: string): void {
    const product = getProduct(id)
    if (!product) return
    const copy = cloneProduct(product)
    copy.id = `${product.id}-copy-${products.value.length + 1}`
    copy.name = `${product.name} (Copy)`
    copy.sku = nextSku()
    copy.status = 'draft'
    copy.featured = false
    copy.createdAt = new Date().toISOString()
    products.value.unshift(copy)
    persist('/api/products', { method: 'POST', body: cloneProduct(copy) })
  }

  function setProductStatus(id: string, status: Product['status']): void {
    const product = getProduct(id)
    if (!product) return
    product.status = status
    persist(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status },
    })
  }

  function setStock(id: string, sizeName: string, stock: number): void {
    const product = getProduct(id)
    const size = product?.sizes.find((entry) => entry.size === sizeName)
    if (!size) return
    size.stock = Math.max(0, stock)
    persist(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { size: sizeName, stock: size.stock },
    })
  }

  function getOrder(id: string): Order | undefined {
    return orders.value.find((order) => order.id === id)
  }

  function setPaymentStatus(id: string, status: PaymentStatus): void {
    const order = getOrder(id)
    if (!order) return
    order.paymentStatus = status
    persist(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { paymentStatus: status },
    })
  }

  function setDeliveryStatus(id: string, status: DeliveryStatus): void {
    const order = getOrder(id)
    if (!order) return
    order.deliveryStatus = status
    persist(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { deliveryStatus: status },
    })
  }

  function cancelOrder(id: string): void {
    const order = getOrder(id)
    if (!order) return
    order.deliveryStatus = 'Cancelled'
    if (order.paymentStatus === 'Paid') order.paymentStatus = 'Refunded'
    persist(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
  }

  async function saveSettings(next: StoreSettings, authorization: string): Promise<void> {
    const saved = await $fetch<StoreSettings>('/api/settings', {
      method: 'PUT',
      headers: { authorization },
      body: cloneSettings(next),
    })
    settings.value = cloneSettings(saved)
  }

  function resetDemoData(): void {
    products.value = []
    orders.value = []
    categoryList.value = []
    collectionList.value = []
    settings.value = cloneSettings(defaultSettings)
    try {
      localStorage.removeItem('aaroh-studio-v1')
    } catch {
      // Storage can be unavailable; the in-memory reset is enough.
    }
    persist('/api/reset', { method: 'POST' })
  }

  return {
    products,
    orders,
    refreshFromDatabase,
    categories: categoryList,
    collections: collectionList,
    settings,
    activeProducts,
    featuredProducts,
    pendingOrders,
    lowStockProducts,
    unitsSold,
    paidRevenue,
    averageOrderValue,
    dailySeries,
    last7Revenue,
    previous7Revenue,
    last7Orders,
    revenueSpark,
    ordersSpark,
    topProducts,
    collectionStats,
    customers,
    getProduct,
    saveProduct,
    removeProduct,
    duplicateProduct,
    setProductStatus,
    setStock,
    getOrder,
    setPaymentStatus,
    setDeliveryStatus,
    cancelOrder,
    saveSettings,
    resetDemoData,
  }
}
