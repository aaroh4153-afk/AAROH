<script setup lang="ts">
import { totalStock } from '~/data/products'
import type { Order } from '~/data/orders'

definePageMeta({ chrome: false, title: 'Overview', layout: 'studio' })

useHead({ title: 'Studio overview · AAROH.' })

const {
  orders,
  pendingOrders,
  lowStockProducts,
  topProducts,
  unitsSold,
  paidRevenue,
  averageOrderValue,
  dailySeries,
  last7Revenue,
  previous7Revenue,
  last7Orders,
  products,
} = useStore()

const range = ref<7 | 14>(14)

const series = computed(() => dailySeries.value.slice(-range.value))
const rangeRevenue = computed(() => series.value.reduce((total, day) => total + day.revenue, 0))
const rangeOrders = computed(() => series.value.reduce((total, day) => total + day.orders, 0))

const revenueDelta = computed(() => percentChange(last7Revenue.value, previous7Revenue.value))

const previous7Orders = computed(() =>
  dailySeries.value.slice(0, 7).reduce((total, day) => total + day.orders, 0),
)
const orderDelta = computed(() => percentChange(last7Orders.value, previous7Orders.value))

const aovDelta = computed(() => {
  const current = last7Orders.value ? last7Revenue.value / last7Orders.value : 0
  const previous = previous7Orders.value ? previous7Revenue.value / previous7Orders.value : 0
  return percentChange(current, previous)
})

const today = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

const selected = ref<Order | null>(null)
const drawerOpen = ref(false)

function openOrder(order: Order) {
  selected.value = order
  drawerOpen.value = true
}

const recentOrders = computed(() => orders.value.slice(0, 5))

const pipeline = computed(() => {
  const stages = ['Processing', 'Packed', 'Shipped', 'Delivered'] as const
  const total = orders.value.length || 1
  return stages.map((stage) => {
    const count = orders.value.filter((order) => order.deliveryStatus === stage).length
    return {
      stage,
      count,
      percent: Math.round((count / total) * 100),
    }
  })
})

const channelShare = computed(() => {
  const channels = ['Online store', 'Instagram', 'Quick sell'] as const
  const total = orders.value.reduce((sum, order) => sum + order.total, 0) || 1
  return channels.map((channel) => {
    const revenue = orders.value
      .filter((order) => order.channel === channel)
      .reduce((sum, order) => sum + order.total, 0)
    return { channel, revenue, percent: Math.round((revenue / total) * 100) }
  })
})

const lowStock = computed(() => lowStockProducts.value.slice(0, 4))
const top = computed(() => topProducts.value.slice(0, 4))
const activeCount = computed(() => products.value.filter((product) => product.status === 'active').length)

const topMax = computed(() => Math.max(1, ...top.value.map((entry) => entry.revenue)))
</script>

<template>
  <div class="overview">
    <header class="studio-page-head">
      <div>
        <span class="overview__eyebrow">{{ today }}</span>
        <h1 class="studio-page-title">Good morning, Harshikesh.</h1>
        <p class="studio-page-sub">
          {{ pendingOrders.length }} orders need attention · {{ activeCount }} pieces live in the store.
        </p>
      </div>
      <div class="studio-page-actions">
        <NuxtLink to="/" class="studio-btn">
          <DashIcon name="store" :size="15" />
          View store
        </NuxtLink>
        <NuxtLink to="/dashboard/products/new" class="studio-btn studio-btn--primary">
          <DashIcon name="plus" :size="15" />
          Add product
        </NuxtLink>
      </div>
    </header>

    <section class="overview__stats">
      <StatCard
        label="Paid revenue"
        :value="formatPrice(paidRevenue)"
        :delta="revenueDelta"
        delta-label="last 7 days vs prior"
        icon="wallet"
        tone="blue"
        :spark="dailySeries.map((day) => day.revenue)"
      />
      <StatCard
        label="Orders"
        :value="String(orders.length)"
        :delta="orderDelta"
        delta-label="last 7 days vs prior"
        icon="receipt"
        tone="violet"
        :spark="dailySeries.map((day) => day.orders)"
      />
      <StatCard
        label="Avg. order value"
        :value="formatPrice(averageOrderValue)"
        :delta="aovDelta"
        delta-label="ticket size trend"
        icon="tag"
        tone="green"
      />
      <StatCard
        label="Units sold"
        :value="String(unitsSold)"
        icon="box"
        tone="orange"
      />
    </section>

    <div class="overview__grid">
      <section class="studio-card overview__revenue">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Revenue</h2>
            <p class="studio-card__sub">Paid orders across the storefront and Instagram.</p>
          </div>
          <div class="overview__range">
            <button
              v-for="option in [7, 14]"
              :key="option"
              type="button"
              :class="{ 'overview__range-btn--active': range === option }"
              class="overview__range-btn"
              @click="range = option as 7 | 14"
            >
              {{ option }}d
            </button>
          </div>
        </div>
        <div class="studio-card__body">
          <div class="overview__revenue-head">
            <strong>{{ formatPrice(rangeRevenue) }}</strong>
            <span class="overview__delta" :class="{ 'overview__delta--down': revenueDelta < 0 }">
              <DashIcon :name="revenueDelta >= 0 ? 'arrowUp' : 'arrowDown'" :size="11" :stroke-width="2.4" />
              {{ Math.abs(revenueDelta).toFixed(1) }}%
            </span>
            <span class="overview__revenue-note">{{ rangeOrders }} orders in the last {{ range }} days</span>
          </div>
          <TrendChart
            :data="series.map((day) => ({ label: day.label, value: day.revenue }))"
            :height="230"
            :formatter="formatPrice"
          />
        </div>
        <footer class="overview__channels">
          <div v-for="channel in channelShare" :key="channel.channel" class="overview__channel">
            <span class="overview__channel-name">
              <i :class="`overview__dot overview__dot--${channel.channel.split(' ')[0]!.toLowerCase()}`" />
              {{ channel.channel }}
            </span>
            <strong>{{ channel.percent }}%</strong>
            <span class="overview__channel-bar">
              <span :style="{ width: `${channel.percent}%` }" />
            </span>
          </div>
        </footer>
      </section>

      <section class="studio-card overview__pipeline">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Order pipeline</h2>
            <p class="studio-card__sub">Every order by fulfilment stage.</p>
          </div>
          <NuxtLink to="/dashboard/orders" class="studio-btn studio-btn--ghost studio-btn--sm">
            View all
            <DashIcon name="arrowRight" :size="12" />
          </NuxtLink>
        </div>
        <div class="studio-card__body overview__pipeline-body">
          <div v-for="stage in pipeline" :key="stage.stage" class="overview__stage">
            <div class="overview__stage-head">
              <span>{{ stage.stage }}</span>
              <strong>{{ stage.count }}</strong>
            </div>
            <span
              class="studio-progress overview__progress"
              :class="`overview__progress--${stage.stage.toLowerCase()}`"
            >
              <span :style="{ width: `${Math.max(4, stage.percent)}%` }" />
            </span>
          </div>

          <div class="overview__pipeline-foot">
            <div>
              <span>Pending action</span>
              <strong>{{ pendingOrders.length }}</strong>
            </div>
            <div>
              <span>Low stock</span>
              <strong>{{ lowStockProducts.length }}</strong>
            </div>
          </div>

          <NuxtLink to="/dashboard/orders" class="studio-note overview__note">
            <DashIcon name="clock" :size="14" />
            <span>Review the queue and move orders to packed or shipped.</span>
          </NuxtLink>
        </div>
      </section>

      <section class="studio-card overview__orders">
        <div class="studio-card__head">
          <div>
            <h2 class="studio-card__title">Recent orders</h2>
            <p class="studio-card__sub">Live from the last few days of trading.</p>
          </div>
          <NuxtLink to="/dashboard/orders" class="studio-btn studio-btn--ghost studio-btn--sm">
            All orders
            <DashIcon name="arrowRight" :size="12" />
          </NuxtLink>
        </div>
        <OrdersTable :orders="recentOrders" compact @open="openOrder" />
      </section>

      <div class="overview__side">
        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">
                Low stock
                <small>{{ lowStockProducts.length }}</small>
              </h2>
              <p class="studio-card__sub">Restock before the weekend.</p>
            </div>
            <NuxtLink to="/dashboard/products" class="studio-btn studio-btn--ghost studio-btn--sm">
              Manage
            </NuxtLink>
          </div>
          <div class="studio-card__body overview__low">
            <NuxtLink
              v-for="product in lowStock"
              :key="product.id"
              :to="`/dashboard/products/${product.id}`"
              class="overview__low-row"
            >
              <img :src="product.images[0]" :alt="product.name" class="studio-thumb" />
              <span class="studio-stack">
                <strong>{{ product.name }}</strong>
                <small>{{ product.colour }}</small>
              </span>
              <span class="overview__low-count" :class="{ 'overview__low-count--out': totalStock(product) === 0 }">
                {{ totalStock(product) }}
              </span>
            </NuxtLink>

            <div v-if="!lowStock.length" class="studio-empty overview__low-empty">
              <DashIcon name="check" :size="20" />
              <strong>All stocked</strong>
              <p>Every active piece has healthy units on hand.</p>
            </div>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Top pieces</h2>
              <p class="studio-card__sub">By paid revenue.</p>
            </div>
          </div>
          <div class="studio-card__body overview__top">
            <div v-for="(entry, index) in top" :key="entry.id" class="overview__top-row">
              <span class="overview__rank">{{ index + 1 }}</span>
              <img :src="entry.image" :alt="entry.name" class="studio-thumb" />
              <span class="studio-stack">
                <strong>{{ entry.name }}</strong>
                <small>{{ entry.units }} sold · {{ formatCompactPrice(entry.revenue) }}</small>
              </span>
              <span class="overview__top-bar">
                <span :style="{ width: `${Math.round((entry.revenue / topMax) * 100)}%` }" />
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>

    <OrderDrawer v-model="drawerOpen" :order="selected" />
  </div>
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.overview__eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #a3abbd;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.overview__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr);
  align-items: start;
  gap: 12px;
}

.overview__revenue {
  min-width: 0;
}

.overview__range {
  display: flex;
  padding: 3px;
  border: 1px solid var(--studio-line);
  border-radius: 9px;
  background: #f7f8fc;
}

.overview__range-btn {
  padding: 4px 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--studio-muted);
  font-family: var(--font);
  font-size: 0.62rem;
  font-weight: 700;
  cursor: pointer;
}

.overview__range-btn--active {
  background: #fff;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.12);
  color: var(--studio-ink);
}

.overview__revenue-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.overview__revenue-head strong {
  color: var(--studio-ink);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.overview__delta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--studio-lime-soft);
  color: #3d7a10;
  font-size: 0.6rem;
  font-weight: 750;
}

.overview__delta--down {
  background: #ffeded;
  color: #c02626;
}

.overview__revenue-note {
  color: #a3abbd;
  font-size: 0.62rem;
}

.overview__channels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 0 22px 20px;
}

.overview__channel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.overview__channel-name {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--studio-muted);
  font-size: 0.64rem;
  font-weight: 650;
}

.overview__dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--primary);
}

.overview__dot--instagram {
  background: var(--studio-violet);
}

.overview__dot--quick {
  background: var(--studio-orange);
}

.overview__channel strong {
  color: var(--studio-ink);
  font-size: 0.68rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.overview__channel-bar {
  display: block;
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef1f7;
}

.overview__channel-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
}

.overview__channel:nth-child(2) .overview__channel-bar span {
  background: var(--studio-violet);
}

.overview__channel:nth-child(3) .overview__channel-bar span {
  background: var(--studio-orange);
}

.overview__pipeline-body {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.overview__stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 5px;
  color: var(--studio-muted);
  font-size: 0.68rem;
  font-weight: 600;
}

.overview__stage-head strong {
  color: var(--studio-ink);
  font-size: 0.72rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.overview__progress span {
  background: var(--primary);
}

.overview__progress--packed span {
  background: #4a57c4;
}

.overview__progress--shipped span {
  background: #8f9cf0;
}

.overview__progress--delivered span {
  background: var(--studio-lime-deep);
}

.overview__pipeline-foot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--studio-line-soft);
}

.overview__pipeline-foot > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 11px;
  border-radius: 10px;
  background: #f8f9fc;
}

.overview__pipeline-foot span {
  color: var(--studio-muted);
  font-size: 0.58rem;
  font-weight: 600;
}

.overview__pipeline-foot strong {
  color: var(--studio-ink);
  font-size: 1.05rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.overview__note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  text-decoration: none;
}

.overview__note:hover {
  border-color: #ccd7ff;
}

.overview__orders {
  min-width: 0;
}

.overview__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.overview__low {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
}

.overview__low-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px;
  border-radius: 9px;
  color: var(--studio-ink);
  text-decoration: none;
}

.overview__low-row:hover {
  background: #fafbff;
}

.overview__low-row .studio-thumb {
  width: 36px;
  height: 40px;
}

.overview__low-row .studio-stack {
  flex: 1;
}

.overview__low-row strong {
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview__low-row small {
  color: var(--studio-muted);
  font-size: 0.6rem;
}

.overview__low-count {
  display: inline-flex;
  min-width: 24px;
  height: 21px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #fff4e8;
  color: #b65a12;
  font-size: 0.6rem;
  font-weight: 750;
}

.overview__low-count--out {
  background: #ffeded;
  color: #c02626;
}

.overview__low-empty {
  padding: 24px 12px;
}

.overview__low-empty strong {
  font-size: 0.8rem;
}

.overview__low-empty p {
  font-size: 0.68rem;
}

.overview__top {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding-top: 12px;
}

.overview__top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview__rank {
  display: grid;
  width: 18px;
  height: 18px;
  flex: none;
  place-items: center;
  border-radius: 6px;
  background: #f1f3f8;
  color: var(--studio-muted);
  font-size: 0.56rem;
  font-weight: 750;
}

.overview__top-row .studio-thumb {
  width: 32px;
  height: 36px;
}

.overview__top-row .studio-stack {
  flex: 1;
}

.overview__top-row strong {
  overflow: hidden;
  font-size: 0.7rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview__top-row small {
  color: var(--studio-muted);
  font-size: 0.58rem;
}

.overview__top-bar {
  display: block;
  width: 38px;
  height: 4px;
  flex: none;
  overflow: hidden;
  border-radius: 999px;
  background: #eef1f7;
}

.overview__top-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
}

@media (max-width: 1180px) {
  .overview__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview__grid {
    grid-template-columns: 1fr;
  }

  .overview__side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .overview__stats {
    grid-template-columns: 1fr;
  }

  .overview__side {
    grid-template-columns: 1fr;
  }

  .overview__channels {
    grid-template-columns: 1fr;
    gap: 10px;
    padding-inline: 16px;
  }
}
</style>
