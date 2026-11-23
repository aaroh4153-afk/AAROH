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

export const useCart = () => {
  const items = useState<CartItem[]>('cart-items', () => [])
  const isOpen = useState<boolean>('cart-is-open', () => false)

  const count = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))

  const subtotal = computed(() =>
    items.value.reduce((total, item) => total + item.price * item.quantity, 0),
  )

  const addItem = (
    product: Pick<Product, 'id' | 'name' | 'colour' | 'price' | 'images'>,
    size?: SizeName,
    quantity = 1,
  ) => {
    const cartId = size ? `${product.id}--${size}` : product.id
    const existing = items.value.find((item) => item.id === cartId)

    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        id: cartId,
        productId: product.id,
        name: product.name,
        colour: product.colour,
        price: product.price,
        image: product.images[0] ?? '',
        size,
        quantity,
      })
    }

    isOpen.value = true
  }

  const updateQuantity = (id: string, quantity: number) => {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    item.quantity = quantity
  }

  const increment = (id: string) => {
    const item = items.value.find((entry) => entry.id === id)
    if (item) item.quantity += 1
  }

  const decrement = (id: string) => {
    const item = items.value.find((entry) => entry.id === id)
    if (!item) return
    if (item.quantity <= 1) removeItem(id)
    else item.quantity -= 1
  }

  const removeItem = (id: string) => {
    items.value = items.value.filter((item) => item.id !== id)
  }

  const clear = () => {
    items.value = []
  }

  const toggleCart = () => {
    isOpen.value = !isOpen.value
  }

  return {
    items,
    isOpen,
    count,
    subtotal,
    addItem,
    updateQuantity,
    increment,
    decrement,
    removeItem,
    clear,
    toggleCart,
  }
}
