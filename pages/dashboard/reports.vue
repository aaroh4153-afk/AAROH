<script setup lang="ts">
definePageMeta({ chrome: false, title: 'Reports', layout: 'studio' })

useHead({ title: 'Reports · AAROH. Studio' })

const {
  orders,
  products,
  categories,
  dailySeries,
  paidRevenue,
  unitsSold,
  averageOrderValue,
  topProducts,
  collectionStats,
} = useStore()

const range = ref<7 | 14>(14)

const series = computed(() => dailySeries.value.slice(-range.value))
const rangeRevenue = computed(() => series.value.reduce((total, day) => total + day.revenue, 0))
const rangeOrders = computed(() => series.value.reduce((total, day) => total + day.orders, 0))
const rangeUnits = computed(() =>
  orders.value
    .filter((order) => order.paymentStatus === 'Paid')
    .reduce(
      (total, order) => total + order.items.reduce((count, item) => count + item.quantity, 0),
      0,
    ),
)

const categoryRows = computed(() => {
  const paid = orders.value.filter((order) => order.paymentStatus === 'Paid')
  const rows = categories.value.map((category) => {
    const ids = new Set(
      products.value
        .filter((product) => product.category === category.id)
        .map((product) => product.id),
    )
    let units = 0
    let revenue = 0
    for (const order of paid) {
      for (const item of order.items) {
        if (!ids.has(item.productId)) continue
        units += item.quantity
        revenue += item.price * item.quantity
      }
    }
    return { id: category.id, name: category.name, blurb: category.blurb, units, revenue }
  })
  const max = Math.max(1, ...rows.map((row) => row.revenue))
  return rows
    .map((row) => ({ ...row, share: Math.round((row.revenue / max) * 100) }))
    .sort((a, b) => b.revenue - a.revenue)
})

const collectionRows = computed(() =>
  [...collectionStats.value].sort((a, b) => b.units - a.units),
)

const collectionMax = computed(() => Math.max(1, ...collectionRows.value.map((row) => row.units)))

const channelRows = computed(() => {
  const channels = ['Online store', 'Instagram', 'Quick sell'] as const
  const total = orders.value.reduce((sum, order) => sum + order.total, 0) || 1
  return channels
    .map((channel) => {
      const ordersInChannel = orders.value.filter((order) => order.channel === channel)
      const revenue = ordersInChannel.reduce((sum, order) => sum + order.total, 0)
      return {
        channel,
        orders: ordersInChannel.length,
        revenue,
        percent: Math.round((revenue / total) * 100),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
})

const paymentRows = computed(() => {
  const methods = ['UPI', 'Card', 'Net Banking', 'Cash on Delivery'] as const
  const total = orders.value.length || 1
  return methods.map((method) => {
    const count = orders.value.filter((order) => order.paymentMethod === method).length
    return { method, count, percent: Math.round((count / total) * 100) }
  })
})

const sizeRows = computed(() => {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
  const counts = new Map<string, number>()
  for (const order of orders.value) {
    for (const item of order.items) {
      counts.set(item.size, (counts.get(item.size) ?? 0) + item.quantity)
    }
  }
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0) || 1
  return sizes
    .map((size) => {
      const units = counts.get(size) ?? 0
      return { size, units, percent: Math.round((units / total) * 100) }
    })
    .filter((row) => row.units > 0)
})

const top = computed(() => topProducts.value.slice(0, 5))
const topMax = computed(() => Math.max(1, ...top.value.map((entry) => entry.revenue)))
</script>

<template>
  <div class="reports">
    <header class="studio-page-head">
      <div>
        <h1 class="studio-page-title">Reports</h1>
        <p class="studio-page-sub">A read on what is selling, where it sells and who buys it.</p>
      </div>
      <div class="studio-page-actions">
        <div class="reports__range">
          <button
            v-for="option in [7, 14]"
            :key="option"
            type="button"
            class="reports__range-btn"
            :class="{ 'reports__range-btn--active': range === option }"
            @click="range = option as 7 | 14"
          >
            Last {{ option }} days
          </button>
        </div>
      </div>
    </header>

    <section class="reports__stats">
      <StatCard
        label="Revenue in range"
        :value="formatPrice(rangeRevenue)"
        delta-label="paid orders only"
        icon="wallet"
        :spark="series.map((day) => day.revenue)"
      />
      <StatCard
        label="Orders in range"
        :value="String(rangeOrders)"
        delta-label="includes unpaid"
        icon="receipt"
        tone="violet"
        :spark="series.map((day) => day.orders)"
      />
      <StatCard
        label="Avg. order value"
        :value="formatPrice(averageOrderValue)"
        delta-label="all paid orders"
        icon="tag"
        tone="green"
      />
      <StatCard
        label="Lifetime units"
        :value="String(unitsSold)"
        delta-label="paid orders only"
        icon="box"
        tone="orange"
      />
    </section>

    <div class="reports__grid">
      <section class="studio-card reports__chart">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Revenue trend</h2>
            <p class="studio-card__sub">Daily paid revenue over the last {{ range }} days.</p>
          </div>
          <span class="reports__total">{{ formatPrice(rangeRevenue) }}</span>
        </div>
        <div class="studio-card__body">
          <TrendChart
            :data="series.map((day) => ({ label: day.label, value: day.revenue }))"
            :height="260"
            :formatter="formatPrice"
          />
        </div>
      </section>

      <section class="studio-card">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Payment mix</h2>
            <p class="studio-card__sub">How customers prefer to pay.</p>
          </div>
        </div>
        <div class="studio-card__body reports__mix">
          <div v-for="row in paymentRows" :key="row.method" class="reports__mix-row">
            <div class="reports__mix-head">
              <span>{{ row.method }}</span>
              <strong>{{ row.count }} <small>{{ row.percent }}%</small></strong>
            </div>
            <span class="studio-progress">
              <span :style="{ width: `${Math.max(3, row.percent)}%` }" />
            </span>
          </div>

          <div class="studio-divider" />

          <div class="reports__mix-row">
            <div class="reports__mix-head">
              <span>Paid revenue</span>
              <strong>{{ formatPrice(paidRevenue) }}</strong>
            </div>
            <div class="reports__mix-head">
              <span>Paid orders</span>
              <strong>{{ orders.filter((order) => order.paymentStatus === 'Paid').length }}</strong>
            </div>
            <div class="reports__mix-head">
              <span>Avg. units per order</span>
              <strong>{{ (unitsSold / Math.max(1, orders.filter((o) => o.paymentStatus === 'Paid').length)).toFixed(1) }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="studio-card reports__categories">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Category performance</h2>
            <p class="studio-card__sub">Paid revenue by product family.</p>
          </div>
        </div>
        <div class="studio-card__body reports__cat-body">
          <div v-for="row in categoryRows" :key="row.id" class="reports__cat-row">
            <div class="reports__cat-text">
              <strong>{{ row.name }}</strong>
              <small>{{ row.units }} units</small>
            </div>
            <span class="reports__cat-bar">
              <span :style="{ width: `${Math.max(2, row.share)}%` }" />
            </span>
            <strong class="reports__cat-revenue">{{ formatPrice(row.revenue) }}</strong>
          </div>
        </div>
      </section>

      <section class="studio-card">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Top pieces</h2>
            <p class="studio-card__sub">By paid revenue, all time.</p>
          </div>
        </div>
        <div class="studio-card__body reports__top">
          <div v-for="(entry, index) in top" :key="entry.id" class="reports__top-row">
            <span class="reports__rank">{{ index + 1 }}</span>
            <img :src="entry.image" :alt="entry.name" class="studio-thumb" />
            <span class="studio-stack reports__top-text">
              <strong>{{ entry.name }}</strong>
              <small>{{ entry.units }} units sold</small>
            </span>
            <span class="reports__top-bar">
              <span :style="{ width: `${Math.round((entry.revenue / topMax) * 100)}%` }" />
            </span>
            <strong class="reports__top-revenue">{{ formatPrice(entry.revenue) }}</strong>
          </div>
        </div>
      </section>

      <section class="studio-card">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Collections</h2>
            <p class="studio-card__sub">Units sold per edit.</p>
          </div>
        </div>
        <div class="studio-card__body reports__collections">
          <div v-for="row in collectionRows" :key="row.id" class="reports__collection">
            <div class="reports__collection-head">
              <span class="reports__collection-name">
                <i :style="{ background: row.tint }" />
                {{ row.name }}
              </span>
              <span>{{ row.units }} units · {{ row.productCount }} pieces</span>
            </div>
            <span class="studio-progress">
              <span
                :style="{ width: `${Math.max(3, Math.round((row.units / collectionMax) * 100))}%`, background: row.tint }"
              />
            </span>
          </div>
        </div>
      </section>

      <section class="studio-card">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Channels</h2>
            <p class="studio-card__sub">Where the money comes from.</p>
          </div>
        </div>
        <div class="studio-card__body reports__channels">
          <div v-for="row in channelRows" :key="row.channel" class="reports__channel">
            <div class="reports__channel-head">
              <span>{{ row.channel }}</span>
              <strong>{{ formatPrice(row.revenue) }}</strong>
            </div>
            <div class="reports__channel-meta">
              <span>{{ row.orders }} orders</span>
              <span>{{ row.percent }}% of revenue</span>
            </div>
            <span class="studio-progress">
              <span :style="{ width: `${Math.max(3, row.percent)}%` }" />
            </span>
          </div>
        </div>
      </section>

      <section class="studio-card">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Sizes sold</h2>
            <p class="studio-card__sub">Units by size, all orders.</p>
          </div>
        </div>
        <div class="studio-card__body reports__sizes">
          <div v-for="row in sizeRows" :key="row.size" class="reports__size">
            <span class="reports__size-label">{{ row.size }}</span>
            <span class="studio-progress">
              <span :style="{ width: `${Math.max(4, row.percent)}%` }" />
            </span>
            <strong>{{ row.units }}</strong>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.reports {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reports__range {
  display: flex;
  padding: 3px;
  border: 1px solid var(--studio-line);
  border-radius: 10px;
  background: #fff;
}

.reports__range-btn {
  padding: 6px 11px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--studio-muted);
  font-family: var(--font);
  font-size: 0.67rem;
  font-weight: 650;
  cursor: pointer;
}

.reports__range-btn--active {
  background: var(--primary);
  color: #fff;
}

.reports__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.reports__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 12px;
}

.reports__chart {
  grid-column: 1 / -1;
}

.reports__total {
  color: var(--studio-ink);
  font-size: 1.15rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.reports__mix {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reports__mix-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reports__mix-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: var(--studio-muted);
  font-size: 0.68rem;
  font-weight: 600;
}

.reports__mix-head strong {
  color: var(--studio-ink);
  font-size: 0.72rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.reports__mix-head small {
  margin-left: 4px;
  color: #a3abbd;
  font-size: 0.6rem;
  font-weight: 600;
}

.reports__cat-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.reports__cat-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 80px;
  align-items: center;
  gap: 12px;
}

.reports__cat-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.reports__cat-text strong {
  color: var(--studio-ink);
  font-size: 0.74rem;
  font-weight: 650;
}

.reports__cat-text small {
  color: var(--studio-muted);
  font-size: 0.6rem;
}

.reports__cat-bar {
  display: block;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef1f7;
}

.reports__cat-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--studio-navy), #6b78de);
}

.reports__cat-revenue {
  color: var(--studio-ink);
  font-size: 0.74rem;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.reports__top {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.reports__top-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.reports__rank {
  display: grid;
  width: 19px;
  height: 19px;
  flex: none;
  place-items: center;
  border-radius: 6px;
  background: #f1f3f8;
  color: var(--studio-muted);
  font-size: 0.56rem;
  font-weight: 750;
}

.reports__top-row .studio-thumb {
  width: 32px;
  height: 36px;
}

.reports__top-text {
  flex: 1;
}

.reports__top-text strong {
  overflow: hidden;
  font-size: 0.71rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reports__top-text small {
  color: var(--studio-muted);
  font-size: 0.58rem;
}

.reports__top-bar {
  display: block;
  width: 46px;
  height: 5px;
  flex: none;
  overflow: hidden;
  border-radius: 999px;
  background: #eef1f7;
}

.reports__top-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
}

.reports__top-revenue {
  width: 62px;
  flex: none;
  color: var(--studio-ink);
  font-size: 0.7rem;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.reports__collections {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.reports__collection {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.reports__collection-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: var(--studio-muted);
  font-size: 0.6rem;
}

.reports__collection-name {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--studio-ink);
  font-size: 0.7rem;
  font-weight: 650;
}

.reports__collection-name i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.reports__channels {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.reports__channel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reports__channel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: var(--studio-ink);
  font-size: 0.72rem;
  font-weight: 650;
}

.reports__channel-head strong {
  font-size: 0.74rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.reports__channel-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #a3abbd;
  font-size: 0.58rem;
}

.reports__sizes {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.reports__size {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 10px;
}

.reports__size-label {
  color: var(--studio-ink);
  font-size: 0.66rem;
  font-weight: 750;
}

.reports__size strong {
  color: var(--studio-ink);
  font-size: 0.68rem;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1080px) {
  .reports__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .reports__grid {
    grid-template-columns: 1fr;
  }

  .reports__stats {
    grid-template-columns: 1fr;
  }
}
</style>
