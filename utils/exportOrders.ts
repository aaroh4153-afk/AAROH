import type { Order } from '~/data/orders'

const HEADER = [
  'Order ID',
  'Placed at',
  'Customer',
  'Email',
  'Phone',
  'City',
  'Items',
  'Sizes',
  'Quantity',
  'Subtotal',
  'Shipping',
  'Discount',
  'Total',
  'Payment method',
  'Payment status',
  'Delivery status',
  'Channel',
]

/** Serialises orders for a client-side CSV download. */
export function ordersToCsv(orders: Order[]): string {
  const rows = orders.map((order) => [
    order.id,
    new Date(order.placedAt).toISOString(),
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    order.customer.city,
    order.items.map((item) => item.name).join(' | '),
    order.items.map((item) => item.size).join(' | '),
    order.items.reduce((total, item) => total + item.quantity, 0),
    order.subtotal,
    order.shipping,
    order.discount,
    order.total,
    order.paymentMethod,
    order.paymentStatus,
    order.deliveryStatus,
    order.channel,
  ])

  return [HEADER, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell)
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
        })
        .join(','),
    )
    .join('\n')
}

export function downloadOrdersCsv(orders: Order[], filename: string): void {
  if (!import.meta.client) return
  const blob = new Blob([ordersToCsv(orders)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
