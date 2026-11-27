<script setup lang="ts">
import type { Order } from '~/data/orders'

withDefaults(
  defineProps<{
    orders: Order[]
    compact?: boolean
  }>(),
  { compact: false },
)

const emit = defineEmits<{ open: [order: Order] }>()

function itemCount(order: Order): number {
  return order.items.reduce((total, item) => total + item.quantity, 0)
}

function summary(order: Order): string {
  const first = order.items[0]
  if (!first) return '—'
  if (order.items.length === 1) return first.name
  return `${first.name} + ${order.items.length - 1} more`
}
</script>

<template>
  <div class="studio-table-wrap">
    <table class="studio-table orders-table">
      <thead>
        <tr>
          <th>Order</th>
          <th v-if="!compact">Customer</th>
          <th class="orders-table__items-col">Items</th>
          <th v-if="!compact" class="orders-table__placed">Placed</th>
          <th>Payment</th>
          <th>Delivery</th>
          <th class="orders-table__right">Total</th>
          <th aria-label="Open" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="order in orders"
          :key="order.id"
          class="orders-table__row"
          tabindex="0"
          role="button"
          @click="emit('open', order)"
          @keydown.enter="emit('open', order)"
          @keydown.space.prevent="emit('open', order)"
        >
          <td>
            <span class="studio-stack">
              <strong class="studio-strong">{{ order.id }}</strong>
              <small class="orders-table__channel">{{ order.channel }}</small>
            </span>
          </td>

          <td v-if="!compact">
            <span class="studio-row">
              <span class="studio-avatar">{{ initials(order.customer.name) }}</span>
              <span class="studio-stack">
                <strong class="studio-strong orders-table__name">{{ order.customer.name }}</strong>
                <small class="studio-muted">{{ order.customer.city }}</small>
              </span>
            </span>
          </td>

          <td class="orders-table__items-col">
            <span class="studio-row orders-table__items">
              <span class="orders-table__stack">
                <img
                  v-for="item in order.items.slice(0, 2)"
                  :key="item.productId + item.size"
                  :src="item.image"
                  :alt="item.name"
                  class="studio-thumb"
                  loading="lazy"
                />
              </span>
              <span class="studio-stack">
                <strong class="studio-strong orders-table__name">{{ summary(order) }}</strong>
                <small class="studio-muted">{{ itemCount(order) }} {{ itemCount(order) === 1 ? 'unit' : 'units' }}</small>
              </span>
            </span>
          </td>

          <td v-if="!compact" class="orders-table__placed">
            <span class="studio-stack">
              <strong class="studio-strong orders-table__date">{{ formatDate(order.placedAt) }}</strong>
              <small class="studio-muted">{{ relativeTime(order.placedAt) }}</small>
            </span>
          </td>

          <td>
            <span class="studio-stack">
              <StatusBadge :status="order.paymentStatus" />
              <small class="studio-muted orders-table__method">{{ order.paymentMethod }}</small>
            </span>
          </td>

          <td><StatusBadge :status="order.deliveryStatus" /></td>

          <td class="orders-table__right">
            <span class="studio-stack orders-table__total">
              <strong class="studio-strong">{{ formatPrice(order.total) }}</strong>
              <small class="studio-muted">{{ order.items.length }} {{ order.items.length === 1 ? 'line' : 'lines' }}</small>
            </span>
          </td>

          <td class="orders-table__chev">
            <DashIcon name="chevronRight" :size="14" />
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!orders.length" class="studio-empty">
      <DashIcon name="receipt" :size="26" />
      <strong>No orders here</strong>
      <p>Nothing matches this tab yet. Try a different filter or clear the search.</p>
    </div>
  </div>
</template>

<style scoped>
.orders-table__row {
  cursor: pointer;
}

.orders-table__row:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.orders-table__channel {
  color: #a3abbd;
  font-size: 0.6rem;
  font-weight: 600;
}

.orders-table__name {
  max-width: 190px;
  overflow: hidden;
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orders-table__date {
  font-size: 0.74rem;
  font-weight: 600;
}

.orders-table__method {
  font-size: 0.58rem;
}

.orders-table__stack {
  display: flex;
  align-items: center;
}

.orders-table__stack .studio-thumb + .studio-thumb {
  margin-left: -12px;
}

.orders-table__stack .studio-thumb {
  width: 32px;
  height: 36px;
  border-radius: 2px;
  background: #fff;
}

.orders-table__items {
  gap: 9px;
}

.orders-table__right {
  text-align: right;
}

.orders-table__total {
  align-items: flex-end;
}

.orders-table__total strong {
  font-variant-numeric: tabular-nums;
}

.orders-table__chev {
  width: 34px;
  color: #c3cad9;
}

.orders-table__row:hover .orders-table__chev {
  color: var(--primary);
}

@media (max-width: 700px) {
  .orders-table__name {
    max-width: 130px;
  }
}

@media (max-width: 1080px) {
  .orders-table__placed {
    display: none;
  }

  .orders-table__name {
    max-width: 150px;
  }
}

@media (max-width: 780px) {
  .orders-table__items-col {
    display: none;
  }
}
</style>
