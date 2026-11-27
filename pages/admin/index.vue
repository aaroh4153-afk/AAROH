<script setup lang="ts">
import { paymentStatuses, type Order } from '~/data/orders'
import { downloadOrdersCsv } from '~/utils/exportOrders'

definePageMeta({ chrome: false, title: 'Order management', layout: 'admin' })

useHead({ title: 'Order management · AAROH. Admin' })

const route = useRoute()
const { orders, paidRevenue, customers } = useStore()

type AdminTab = 'all' | 'dispatch' | 'transit' | 'delivered' | 'issues' | 'unpaid'

const activeTab = ref<AdminTab>('dispatch')
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const payment = ref('all')
const channel = ref('all')

const selected = ref<Order | null>(null)
const drawerOpen = ref(false)

function openOrder(order: Order) {
  selected.value = order
  drawerOpen.value = true
}

function matchesTab(order: Order, tab: AdminTab): boolean {
  if (tab === 'all') return true
  if (tab === 'dispatch') return order.deliveryStatus === 'Processing' || order.deliveryStatus === 'Packed'
  if (tab === 'transit') return order.deliveryStatus === 'Shipped'
  if (tab === 'delivered') return order.deliveryStatus === 'Delivered'
  if (tab === 'issues') return order.deliveryStatus === 'Cancelled' || order.deliveryStatus === 'Returned'
  return order.paymentStatus === 'Pending' || order.paymentStatus === 'Failed'
}

const tabs = computed<{ id: AdminTab; label: string; count: number }[]>(() => [
  { id: 'all', label: 'All orders', count: orders.value.length },
  { id: 'dispatch', label: 'To dispatch', count: orders.value.filter((o) => matchesTab(o, 'dispatch')).length },
  { id: 'transit', label: 'In transit', count: orders.value.filter((o) => matchesTab(o, 'transit')).length },
  { id: 'delivered', label: 'Delivered', count: orders.value.filter((o) => matchesTab(o, 'delivered')).length },
  { id: 'issues', label: 'Cancelled & returns', count: orders.value.filter((o) => matchesTab(o, 'issues')).length },
  { id: 'unpaid', label: 'Unpaid', count: orders.value.filter((o) => matchesTab(o, 'unpaid')).length },
])

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return orders.value.filter((order) => {
    if (!matchesTab(order, activeTab.value)) return false
    if (payment.value !== 'all' && order.paymentStatus !== payment.value) return false
    if (channel.value !== 'all' && order.channel !== channel.value) return false
    if (!query) return true
    const haystack = [
      order.id,
      order.customer.name,
      order.customer.email,
      order.customer.city,
      ...order.items.map((item) => item.name),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
})

const viewRevenue = computed(() =>
  filtered.value
    .filter((order) => order.paymentStatus === 'Paid')
    .reduce((total, order) => total + order.total, 0),
)

const stats = computed(() => ({
  gmv: paidRevenue.value,
  orders: orders.value.length,
  customers: customers.value.length,
  issues: orders.value.filter((order) => matchesTab(order, 'issues')).length,
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

function exportView() {
  downloadOrdersCsv(filtered.value, `aaroh-admin-orders-${activeTab.value}.csv`)
}
</script>

<template>
  <div class="admin-orders">
    <header class="studio-page-head">
      <div>
        <span class="admin-orders__eyebrow">Platform oversight</span>
        <h1 class="studio-page-title">Order management</h1>
        <p class="studio-page-sub">
          Every order across the AAROH. storefront, grouped by the action it needs.
        </p>
      </div>
      <div class="studio-page-actions">
        <button class="studio-btn" type="button" @click="exportView">
          <DashIcon name="download" :size="15" />
          Export view
        </button>
      </div>
    </header>

    <section class="admin-orders__stats">
      <div class="admin-orders__stat">
        <span class="admin-orders__stat-icon"><DashIcon name="wallet" :size="15" /></span>
        <div>
          <small>Gross merchandise value</small>
          <strong>{{ formatPrice(stats.gmv) }}</strong>
        </div>
      </div>
      <div class="admin-orders__stat">
        <span class="admin-orders__stat-icon admin-orders__stat-icon--violet"><DashIcon name="receipt" :size="15" /></span>
        <div>
          <small>Orders processed</small>
          <strong>{{ stats.orders }}</strong>
        </div>
      </div>
      <div class="admin-orders__stat">
        <span class="admin-orders__stat-icon admin-orders__stat-icon--green"><DashIcon name="users" :size="15" /></span>
        <div>
          <small>Customers</small>
          <strong>{{ stats.customers }}</strong>
        </div>
      </div>
      <div class="admin-orders__stat">
        <span class="admin-orders__stat-icon admin-orders__stat-icon--orange"><DashIcon name="warning" :size="15" /></span>
        <div>
          <small>Cancelled &amp; returns</small>
          <strong>{{ stats.issues }}</strong>
        </div>
      </div>
    </section>

    <section class="studio-card admin-orders__card">
      <div class="studio-tabs admin-orders__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="studio-tab"
          :class="{ 'studio-tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
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
              placeholder="Search order, customer, city or product…"
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

      <div class="admin-orders__summary">
        <span><strong>{{ filtered.length }}</strong> orders</span>
        <span><strong>{{ formatPrice(viewRevenue) }}</strong> paid value</span>
        <span class="admin-orders__brand">
          <i />
          Brand: Aaroh Studio
        </span>
      </div>

      <OrdersTable :orders="filtered" @open="openOrder" />
    </section>

    <OrderDrawer v-model="drawerOpen" :order="selected" />
  </div>
</template>

<style scoped>
.admin-orders {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-orders__eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #a3abbd;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.admin-orders__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.admin-orders__stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 15px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fff;
  box-shadow: var(--studio-shadow);
}

.admin-orders__stat-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;
  border-radius: 9px;
  background: var(--studio-navy-soft);
  color: var(--primary);
}

.admin-orders__stat-icon--violet {
  background: #f2ecff;
  color: #6d3cd6;
}

.admin-orders__stat-icon--green {
  background: #eafbef;
  color: #14804a;
}

.admin-orders__stat-icon--orange {
  background: #fff4e8;
  color: #b65a12;
}

.admin-orders__stat div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.admin-orders__stat small {
  overflow: hidden;
  color: var(--studio-muted);
  font-size: 0.56rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-orders__stat strong {
  color: var(--studio-ink);
  font-size: 1.02rem;
  font-weight: 750;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
}

.admin-orders__card {
  overflow: hidden;
}

.admin-orders__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--studio-line-soft);
  background: #fbfbfd;
  color: var(--studio-muted);
  font-size: 0.64rem;
}

.admin-orders__summary strong {
  color: var(--studio-ink);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.admin-orders__brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  color: #667085;
  font-weight: 600;
}

.admin-orders__brand i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
}

@media (max-width: 1000px) {
  .admin-orders__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-orders__brand {
    margin-left: 0;
  }
}
</style>
