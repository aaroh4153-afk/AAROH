<script setup lang="ts">
import {
  deliveryStatuses,
  paymentStatuses,
  type DeliveryStatus,
  type Order,
} from '~/data/orders'
import { downloadOrdersCsv } from '~/utils/exportOrders'

definePageMeta({ chrome: false, title: 'Orders', layout: 'studio' })

useHead({ title: 'Orders · AAROH. Studio' })

const route = useRoute()
const { orders } = useStore()

const activeTab = ref<'all' | DeliveryStatus>('all')
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const payment = ref('all')
const channel = ref('all')

const selected = ref<Order | null>(null)
const drawerOpen = ref(false)

function openOrder(order: Order) {
  selected.value = order
  drawerOpen.value = true
}

const tabs = computed(() => {
  const base: { id: 'all' | DeliveryStatus; label: string; count: number }[] = [
    { id: 'all', label: 'All orders', count: orders.value.length },
    ...deliveryStatuses.map((status) => ({
      id: status,
      label: status,
      count: orders.value.filter((order) => order.deliveryStatus === status).length,
    })),
  ]
  return base
})

function setTab(id: 'all' | DeliveryStatus) {
  activeTab.value = id
}

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return orders.value.filter((order) => {
    if (activeTab.value !== 'all' && order.deliveryStatus !== activeTab.value) return false
    if (payment.value !== 'all' && order.paymentStatus !== payment.value) return false
    if (channel.value !== 'all' && order.channel !== channel.value) return false
    if (!query) return true
    const haystack = [
      order.id,
      order.customer.name,
      order.customer.email,
      order.customer.city,
      order.paymentMethod,
      ...order.items.map((item) => item.name),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
})

const filteredRevenue = computed(() =>
  filtered.value
    .filter((order) => order.paymentStatus === 'Paid')
    .reduce((total, order) => total + order.total, 0),
)

const stats = computed(() => ({
  pending: orders.value.filter((order) => ['Processing', 'Packed'].includes(order.deliveryStatus)).length,
  transit: orders.value.filter((order) => order.deliveryStatus === 'Shipped').length,
  delivered: orders.value.filter((order) => order.deliveryStatus === 'Delivered').length,
  returns: orders.value.filter((order) => ['Returned', 'Cancelled'].includes(order.deliveryStatus)).length,
}))

const hasFilters = computed(
  () => Boolean(search.value.trim()) || payment.value !== 'all' || channel.value !== 'all',
)

function clearFilters() {
  search.value = ''
  payment.value = 'all'
  channel.value = 'all'
  activeTab.value = 'all'
}

function exportCsv() {
  downloadOrdersCsv(filtered.value, `aaroh-orders-${activeTab.value.toLowerCase()}.csv`)
}
</script>

<template>
  <div class="orders-page">
    <header class="studio-page-head">
      <div>
        <h1 class="studio-page-title">Orders</h1>
        <p class="studio-page-sub">
          {{ orders.length }} orders · {{ stats.pending }} awaiting dispatch · {{ stats.transit }} in transit.
        </p>
      </div>
      <div class="studio-page-actions">
        <button class="studio-btn" type="button" @click="exportCsv">
          <DashIcon name="download" :size="15" />
          Export CSV
        </button>
      </div>
    </header>

    <section class="orders-page__stats">
      <div class="orders-page__stat">
        <span class="orders-page__stat-label">To dispatch</span>
        <strong>{{ stats.pending }}</strong>
        <small>Processing &amp; packed</small>
      </div>
      <div class="orders-page__stat">
        <span class="orders-page__stat-label">In transit</span>
        <strong>{{ stats.transit }}</strong>
        <small>Handed to courier</small>
      </div>
      <div class="orders-page__stat">
        <span class="orders-page__stat-label">Delivered</span>
        <strong>{{ stats.delivered }}</strong>
        <small>Completed orders</small>
      </div>
      <div class="orders-page__stat">
        <span class="orders-page__stat-label">Cancelled / returned</span>
        <strong>{{ stats.returns }}</strong>
        <small>Refund or exchange</small>
      </div>
    </section>

    <section class="studio-card orders-page__card">
      <div class="studio-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="studio-tab"
          :class="{ 'studio-tab--active': activeTab === tab.id }"
          @click="setTab(tab.id)"
        >
          {{ tab.label }}
          <span>{{ tab.count }}</span>
        </button>
      </div>

      <div class="studio-toolbar">
        <div class="studio-toolbar__group">
          <label class="studio-search">
            <DashIcon name="search" :size="15" />
            <input
              v-model="search"
              class="studio-input"
              type="search"
              placeholder="Search order, customer or product…"
            />
          </label>
        </div>

        <div class="studio-toolbar__group">
          <select v-model="payment" class="studio-select studio-select--compact" aria-label="Filter by payment">
            <option value="all">All payments</option>
            <option v-for="status in paymentStatuses" :key="status" :value="status">{{ status }}</option>
          </select>
          <select v-model="channel" class="studio-select studio-select--compact" aria-label="Filter by channel">
            <option value="all">All channels</option>
            <option value="Online store">Online store</option>
            <option value="Instagram">Instagram</option>
            <option value="Quick sell">Quick sell</option>
          </select>
          <button v-if="hasFilters" class="studio-btn studio-btn--ghost studio-btn--sm" type="button" @click="clearFilters">
            <DashIcon name="close" :size="12" />
            Clear
          </button>
        </div>
      </div>

      <div class="orders-page__summary">
        <span>
          <strong>{{ filtered.length }}</strong> orders in view
        </span>
        <span>
          <strong>{{ formatPrice(filteredRevenue) }}</strong> paid revenue
        </span>
        <span class="orders-page__hint">Click any row to manage payment and delivery.</span>
      </div>

      <OrdersTable :orders="filtered" @open="openOrder" />
    </section>

    <OrderDrawer v-model="drawerOpen" :order="selected" />
  </div>
</template>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.orders-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.orders-page__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fff;
  box-shadow: var(--studio-shadow);
}

.orders-page__stat-label {
  color: var(--studio-muted);
  font-size: 0.6rem;
  font-weight: 650;
  letter-spacing: 0.02em;
}

.orders-page__stat strong {
  color: var(--studio-ink);
  font-size: 1.35rem;
  font-weight: 750;
  letter-spacing: -0.04em;
  line-height: 1.2;
}

.orders-page__stat small {
  color: #a3abbd;
  font-size: 0.58rem;
}

.orders-page__card {
  overflow: hidden;
}

.orders-page__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  padding: 11px 18px;
  border-bottom: 1px solid var(--studio-line-soft);
  background: #fbfbfd;
  color: var(--studio-muted);
  font-size: 0.65rem;
}

.orders-page__summary strong {
  color: var(--studio-ink);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.orders-page__hint {
  margin-left: auto;
  color: #a3abbd;
}

@media (max-width: 900px) {
  .orders-page__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .orders-page__hint {
    display: none;
  }
}
</style>
