<script setup lang="ts">
definePageMeta({ chrome: false, title: 'Customers', layout: 'studio' })

useHead({ title: 'Customers · AAROH. Studio' })

const { customers, orders } = useStore()

const search = ref('')
const sort = ref<'spent' | 'orders' | 'name' | 'recent'>('spent')
const expanded = ref<string | null>(null)

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  const list = customers.value.filter((customer) => {
    if (!query) return true
    return [customer.name, customer.email, customer.city, customer.phone]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  return [...list].sort((a, b) => {
    if (sort.value === 'name') return a.name.localeCompare(b.name)
    if (sort.value === 'orders') return b.orders - a.orders
    if (sort.value === 'recent') return new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime()
    return b.spent - a.spent
  })
})

const stats = computed(() => {
  const list = customers.value
  const totalSpent = list.reduce((total, customer) => total + customer.spent, 0)
  const repeat = list.filter((customer) => customer.orders > 1).length
  const cities = new Map<string, number>()
  for (const customer of list) cities.set(customer.city, (cities.get(customer.city) ?? 0) + 1)
  const topCity = [...cities.entries()].sort((a, b) => b[1] - a[1])[0]
  return {
    total: list.length,
    repeat,
    average: list.length ? Math.round(totalSpent / list.length) : 0,
    topCity: topCity ? topCity[0] : '—',
  }
})

function customerOrders(email: string) {
  return orders.value.filter((order) => order.customer.email === email)
}

function toggle(email: string) {
  expanded.value = expanded.value === email ? null : email
}

function segment(customer: { spent: number; orders: number }) {
  if (customer.spent >= 6000) return { label: 'VIP', tone: 'violet' }
  if (customer.orders > 1) return { label: 'Repeat', tone: 'info' }
  return { label: 'New', tone: 'neutral' }
}
</script>

<template>
  <div class="customers">
    <header class="studio-page-head">
      <div>
        <h1 class="studio-page-title">Customers</h1>
        <p class="studio-page-sub">
          {{ stats.total }} people have ordered · {{ stats.repeat }} came back for more.
        </p>
      </div>
      <div class="studio-page-actions">
        <NuxtLink to="/dashboard/orders" class="studio-btn">
          <DashIcon name="receipt" :size="15" />
          All orders
        </NuxtLink>
      </div>
    </header>

    <section class="customers__stats">
      <div class="customers__stat">
        <span>Total customers</span>
        <strong>{{ stats.total }}</strong>
      </div>
      <div class="customers__stat">
        <span>Repeat buyers</span>
        <strong>{{ stats.repeat }}</strong>
      </div>
      <div class="customers__stat">
        <span>Avg. lifetime spend</span>
        <strong>{{ formatPrice(stats.average) }}</strong>
      </div>
      <div class="customers__stat">
        <span>Top city</span>
        <strong>{{ stats.topCity }}</strong>
      </div>
    </section>

    <section class="studio-card customers__card">
      <div class="studio-toolbar">
        <div class="studio-toolbar__group">
          <label class="studio-search">
            <DashIcon name="search" :size="15" />
            <input v-model="search" class="studio-input" type="search" placeholder="Search name, email or city…" />
          </label>
        </div>
        <div class="studio-toolbar__group">
          <select v-model="sort" class="studio-select studio-select--compact" aria-label="Sort customers">
            <option value="spent">Highest spend</option>
            <option value="orders">Most orders</option>
            <option value="recent">Most recent</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      <div class="studio-table-wrap">
        <table class="studio-table customers__table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Location</th>
              <th>Segment</th>
              <th class="customers__right">Orders</th>
              <th class="customers__right">Spent</th>
              <th>Last order</th>
              <th aria-label="Expand" />
            </tr>
          </thead>
          <tbody>
            <template v-for="customer in filtered" :key="customer.email">
              <tr
                class="customers__row"
                tabindex="0"
                role="button"
                :aria-expanded="expanded === customer.email"
                @click="toggle(customer.email)"
                @keydown.enter="toggle(customer.email)"
              >
                <td>
                  <span class="studio-row">
                    <span class="studio-avatar">{{ initials(customer.name) }}</span>
                    <span class="studio-stack">
                      <strong class="studio-strong">{{ customer.name }}</strong>
                      <small class="studio-muted">{{ customer.email }}</small>
                    </span>
                  </span>
                </td>
                <td>
                  <span class="studio-stack">
                    <strong class="customers__city">{{ customer.city }}</strong>
                    <small class="studio-muted">{{ customer.phone }}</small>
                  </span>
                </td>
                <td>
                  <span class="studio-badge" :class="`studio-badge--${segment(customer).tone}`">
                    {{ segment(customer).label }}
                  </span>
                </td>
                <td class="customers__right studio-num">{{ customer.orders }}</td>
                <td class="customers__right">
                  <strong class="customers__spent">{{ formatPrice(customer.spent) }}</strong>
                </td>
                <td>
                  <span class="studio-stack">
                    <strong class="customers__date">{{ formatDate(customer.lastOrder) }}</strong>
                    <small class="studio-muted">{{ relativeTime(customer.lastOrder) }}</small>
                  </span>
                </td>
                <td class="customers__chev">
                  <DashIcon :name="expanded === customer.email ? 'chevronDown' : 'chevronRight'" :size="14" />
                </td>
              </tr>

              <tr v-if="expanded === customer.email" class="customers__expand">
                <td colspan="7">
                  <div class="customers__detail">
                    <div class="customers__detail-head">
                      <div>
                        <h3>Order history</h3>
                        <p>{{ customer.orders }} orders · {{ formatPrice(customer.spent) }} lifetime value</p>
                      </div>
                      <NuxtLink
                        :to="`/dashboard/orders?q=${encodeURIComponent(customer.email)}`"
                        class="studio-btn studio-btn--sm"
                      >
                        Manage orders
                        <DashIcon name="arrowRight" :size="12" />
                      </NuxtLink>
                    </div>

                    <ul class="customers__orders">
                      <li v-for="order in customerOrders(customer.email)" :key="order.id">
                        <span class="customers__order-id">{{ order.id }}</span>
                        <span class="customers__order-items">
                          {{ order.items.map((item) => item.name).join(', ') }}
                        </span>
                        <span class="customers__order-size">
                          {{ order.items.reduce((total, item) => total + item.quantity, 0) }} units
                        </span>
                        <StatusBadge :status="order.paymentStatus" />
                        <StatusBadge :status="order.deliveryStatus" />
                        <strong>{{ formatPrice(order.total) }}</strong>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="!filtered.length" class="studio-empty">
          <DashIcon name="users" :size="26" />
          <strong>No customers found</strong>
          <p>Nobody matches that search. Try a name, email or city.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.customers {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.customers__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.customers__stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 14px 16px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fff;
  box-shadow: var(--studio-shadow);
}

.customers__stat span {
  color: var(--studio-muted);
  font-size: 0.6rem;
  font-weight: 650;
}

.customers__stat strong {
  overflow: hidden;
  color: var(--studio-ink);
  font-size: 1.2rem;
  font-weight: 750;
  letter-spacing: -0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customers__card {
  overflow: hidden;
}

.customers__row {
  cursor: pointer;
}

.customers__row:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.customers__city {
  font-size: 0.74rem;
  font-weight: 600;
}

.customers__right {
  text-align: right;
}

.customers__spent {
  font-size: 0.76rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.customers__date {
  font-size: 0.72rem;
  font-weight: 600;
}

.customers__chev {
  width: 32px;
  color: #c3cad9;
}

.customers__expand td {
  padding: 0;
  background: #fafbff;
}

.customers__detail {
  padding: 14px 18px 18px;
  border-top: 1px dashed var(--studio-line);
}

.customers__detail-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.customers__detail-head h3 {
  margin: 0;
  color: var(--studio-ink);
  font-size: 0.8rem;
  font-weight: 700;
}

.customers__detail-head p {
  margin-top: 2px;
  color: var(--studio-muted);
  font-size: 0.65rem;
}

.customers__orders {
  display: flex;
  flex-direction: column;
  gap: 5px;
  list-style: none;
}

.customers__orders li {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) 60px 80px 86px 80px;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--studio-line-soft);
  border-radius: 9px;
  background: #fff;
  font-size: 0.68rem;
}

.customers__order-id {
  color: var(--studio-ink);
  font-weight: 700;
}

.customers__order-items {
  overflow: hidden;
  color: var(--studio-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customers__order-size {
  color: #a3abbd;
  font-size: 0.6rem;
}

.customers__orders strong {
  color: var(--studio-ink);
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1080px) {
  .customers__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .customers__orders li {
    grid-template-columns: 70px minmax(0, 1fr) 80px;
  }

  .customers__order-size,
  .customers__orders .studio-badge:first-of-type {
    display: none;
  }
}
</style>
