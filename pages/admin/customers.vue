<script setup lang="ts">
definePageMeta({ chrome: false, title: 'Customers', layout: 'admin' })

useHead({ title: 'Customers · AAROH. Admin' })

const { customers } = useStore()

const search = ref('')
const sort = ref<'spent' | 'orders' | 'recent'>('spent')

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
    if (sort.value === 'orders') return b.orders - a.orders
    if (sort.value === 'recent') return new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime()
    return b.spent - a.spent
  })
})

const stats = computed(() => {
  const list = customers.value
  const spent = list.reduce((total, customer) => total + customer.spent, 0)
  const repeat = list.filter((customer) => customer.orders > 1).length
  return {
    total: list.length,
    repeat,
    average: list.length ? Math.round(spent / list.length) : 0,
    cities: new Set(list.map((customer) => customer.city)).size,
  }
})

function segment(customer: { spent: number; orders: number }) {
  if (customer.spent >= 6000) return { label: 'VIP', tone: 'violet' }
  if (customer.orders > 1) return { label: 'Repeat', tone: 'info' }
  return { label: 'New', tone: 'neutral' }
}
</script>

<template>
  <div class="admin-customers">
    <header class="studio-page-head">
      <div>
        <span class="admin-customers__eyebrow">Platform oversight</span>
        <h1 class="studio-page-title">Customers</h1>
        <p class="studio-page-sub">
          {{ stats.total }} shoppers across {{ stats.cities }} cities · {{ stats.repeat }} repeat buyers.
        </p>
      </div>
      <div class="studio-page-actions">
        <NuxtLink to="/admin" class="studio-btn">
          <DashIcon name="receipt" :size="15" />
          Order management
        </NuxtLink>
      </div>
    </header>

    <section class="admin-customers__stats">
      <div class="admin-customers__stat">
        <span>Total customers</span>
        <strong>{{ stats.total }}</strong>
      </div>
      <div class="admin-customers__stat">
        <span>Repeat buyers</span>
        <strong>{{ stats.repeat }}</strong>
      </div>
      <div class="admin-customers__stat">
        <span>Avg. lifetime spend</span>
        <strong>{{ formatPrice(stats.average) }}</strong>
      </div>
      <div class="admin-customers__stat">
        <span>Cities served</span>
        <strong>{{ stats.cities }}</strong>
      </div>
    </section>

    <section class="studio-card admin-customers__card">
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
          </select>
        </div>
      </div>

      <div class="studio-table-wrap">
        <table class="studio-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th class="admin-customers__contact">Contact</th>
              <th>Location</th>
              <th>Segment</th>
              <th class="admin-customers__right">Orders</th>
              <th class="admin-customers__right">Lifetime spend</th>
              <th>Last order</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in filtered" :key="customer.email">
              <td>
                <span class="studio-row">
                  <span class="studio-avatar">{{ initials(customer.name) }}</span>
                  <span class="studio-stack">
                    <strong class="admin-customers__name">{{ customer.name }}</strong>
                    <small class="studio-muted">{{ customer.email }}</small>
                  </span>
                </span>
              </td>
              <td class="admin-customers__contact"><span class="admin-customers__phone">{{ customer.phone }}</span></td>
              <td>
                <span class="studio-stack">
                  <strong class="admin-customers__city">{{ customer.city }}</strong>
                  <small class="studio-muted">India</small>
                </span>
              </td>
              <td>
                <span class="studio-badge" :class="`studio-badge--${segment(customer).tone}`">
                  {{ segment(customer).label }}
                </span>
              </td>
              <td class="admin-customers__right studio-num">{{ customer.orders }}</td>
              <td class="admin-customers__right">
                <strong class="admin-customers__spent">{{ formatPrice(customer.spent) }}</strong>
              </td>
              <td>
                <span class="studio-stack">
                  <strong class="admin-customers__date">{{ formatDate(customer.lastOrder) }}</strong>
                  <small class="studio-muted">{{ relativeTime(customer.lastOrder) }}</small>
                </span>
              </td>
              <td class="admin-customers__action">
                <NuxtLink
                  :to="`/admin?q=${encodeURIComponent(customer.email)}`"
                  class="studio-btn studio-btn--sm"
                >
                  Orders
                  <DashIcon name="arrowRight" :size="12" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!filtered.length" class="studio-empty">
          <DashIcon name="users" :size="26" />
          <strong>No customers found</strong>
          <p>Try another name, email or city.</p>
        </div>
      </div>

      <footer class="admin-customers__foot">
        <span>Showing {{ filtered.length }} of {{ customers.length }} customers</span>
        <span>Customer records are derived from orders</span>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.admin-customers {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-customers__eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #a3abbd;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.admin-customers__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.admin-customers__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 13px 15px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fff;
  box-shadow: var(--studio-shadow);
}

.admin-customers__stat span {
  color: var(--studio-muted);
  font-size: 0.58rem;
  font-weight: 650;
}

.admin-customers__stat strong {
  color: var(--studio-ink);
  font-size: 1.22rem;
  font-weight: 750;
  letter-spacing: -0.04em;
}

.admin-customers__card {
  overflow: hidden;
}

.admin-customers__name {
  font-size: 0.77rem;
  font-weight: 650;
}

.admin-customers__phone {
  color: #667085;
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
}

.admin-customers__city {
  font-size: 0.73rem;
  font-weight: 600;
}

.admin-customers__right {
  text-align: right;
}

.admin-customers__spent {
  color: var(--studio-ink);
  font-size: 0.76rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.admin-customers__date {
  font-size: 0.72rem;
  font-weight: 600;
}

.admin-customers__action {
  width: 90px;
}

.admin-customers__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 18px;
  border-top: 1px solid var(--studio-line);
  background: #fbfbfd;
  color: #a3abbd;
  font-size: 0.6rem;
}

@media (max-width: 900px) {
  .admin-customers__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1120px) {
  .admin-customers__contact {
    display: none;
  }
}
</style>
