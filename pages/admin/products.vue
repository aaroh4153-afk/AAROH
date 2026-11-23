<script setup lang="ts">
import { stockState, totalStock, type ProductStatus } from '~/data/products'

definePageMeta({ chrome: false, title: 'Catalogue', layout: 'admin' })

useHead({ title: 'Catalogue · AAROH. Admin' })

const {
  products,
  categories,
  collections,
  setProductStatus,
  duplicateProduct,
} = useStore()

const search = ref('')
const status = ref<'all' | ProductStatus>('all')
const category = ref('all')

const flash = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

function notify(message: string) {
  flash.value = message
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    flash.value = ''
  }, 2400)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return products.value
    .filter((product) => {
      if (status.value !== 'all' && product.status !== status.value) return false
      if (category.value !== 'all' && product.category !== category.value) return false
      if (!query) return true
      return [product.name, product.sku, product.colour]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    .sort((a, b) => a.name.localeCompare(b.name))
})

const stats = computed(() => ({
  total: products.value.length,
  live: products.value.filter((product) => product.status === 'active').length,
  draft: products.value.filter((product) => product.status === 'draft').length,
  stock: products.value.reduce((total, product) => total + totalStock(product), 0),
  low: products.value.filter((product) => product.status === 'active' && stockState(product) !== 'in').length,
}))

const statusTabs = computed(() => [
  { id: 'all' as const, label: 'All', count: products.value.length },
  { id: 'active' as const, label: 'Live', count: stats.value.live },
  { id: 'draft' as const, label: 'Draft', count: stats.value.draft },
  {
    id: 'archived' as const,
    label: 'Archived',
    count: products.value.filter((product) => product.status === 'archived').length,
  },
])

function categoryName(id: string) {
  return categories.value.find((entry) => entry.id === id)?.name ?? '—'
}

function collectionName(id: string) {
  return collections.value.find((entry) => entry.id === id)?.name ?? '—'
}

function toggleLive(id: string, current: ProductStatus, name: string) {
  const next = current === 'active' ? 'draft' : 'active'
  setProductStatus(id, next)
  notify(next === 'active' ? `${name} set live.` : `${name} unpublished.`)
}

function archive(id: string, name: string) {
  setProductStatus(id, 'archived')
  notify(`${name} archived.`)
}

function duplicate(id: string, name: string) {
  duplicateProduct(id)
  notify(`${name} duplicated as a draft.`)
}
</script>

<template>
  <div class="admin-products">
    <header class="studio-page-head">
      <div>
        <span class="admin-products__eyebrow">Platform oversight</span>
        <h1 class="studio-page-title">Catalogue</h1>
        <p class="studio-page-sub">
          {{ stats.total }} products · {{ stats.live }} live · {{ stats.low }} low on stock.
        </p>
      </div>
      <div class="studio-page-actions">
        <NuxtLink to="/admin" class="studio-btn">
          <DashIcon name="receipt" :size="15" />
          Order management
        </NuxtLink>
      </div>
    </header>

    <section class="admin-products__stats">
      <div class="admin-products__stat">
        <span>Products</span>
        <strong>{{ stats.total }}</strong>
      </div>
      <div class="admin-products__stat">
        <span>Live on store</span>
        <strong>{{ stats.live }}</strong>
      </div>
      <div class="admin-products__stat">
        <span>Units in stock</span>
        <strong>{{ stats.stock }}</strong>
      </div>
      <div class="admin-products__stat">
        <span>Low stock</span>
        <strong class="admin-products__stat--warn">{{ stats.low }}</strong>
      </div>
    </section>

    <section class="studio-card admin-products__card">
      <div class="studio-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.id"
          type="button"
          class="studio-tab"
          :class="{ 'studio-tab--active': status === tab.id }"
          @click="status = tab.id"
        >
          {{ tab.label }}
          <span>{{ tab.count }}</span>
        </button>
      </div>

      <div class="studio-toolbar">
        <div class="studio-toolbar__group">
          <label class="studio-search">
            <DashIcon name="search" :size="15" />
            <input v-model="search" class="studio-input" type="search" placeholder="Search product, SKU or colour…" />
          </label>
        </div>
        <div class="studio-toolbar__group">
          <select v-model="category" class="studio-select studio-select--compact" aria-label="Filter by category">
            <option value="all">All categories</option>
            <option v-for="entry in categories" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
          </select>
        </div>
      </div>

      <div class="studio-table-wrap">
        <table class="studio-table">
          <thead>
            <tr>
              <th>Product</th>
              <th class="admin-products__brand-col">Brand</th>
              <th>Category</th>
              <th class="admin-products__right">Price</th>
              <th class="admin-products__right">Stock</th>
              <th>Status</th>
              <th class="admin-products__right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filtered" :key="product.id">
              <td>
                <span class="studio-row">
                  <img :src="product.images[0]" :alt="product.name" class="studio-thumb" />
                  <span class="studio-stack">
                    <strong class="admin-products__name">{{ product.name }}</strong>
                    <small class="studio-muted">{{ product.sku }}</small>
                  </span>
                </span>
              </td>
              <td class="admin-products__brand-col">
                <span class="admin-products__brand"><i />Aaroh Studio</span>
              </td>
              <td>
                <span class="studio-stack">
                  <strong class="admin-products__cat">{{ categoryName(product.category) }}</strong>
                  <small class="studio-muted">{{ collectionName(product.collection) }}</small>
                </span>
              </td>
              <td class="admin-products__right">
                <strong class="admin-products__price">{{ formatPrice(product.price) }}</strong>
              </td>
              <td class="admin-products__right">
                <span
                  class="studio-badge"
                  :class="{
                    'studio-badge--danger': totalStock(product) === 0,
                    'studio-badge--warn': totalStock(product) > 0 && totalStock(product) <= 10,
                    'studio-badge--success': totalStock(product) > 10,
                  }"
                >
                  {{ totalStock(product) }}
                </span>
              </td>
              <td>
                <span class="studio-stack">
                  <StatusBadge :status="product.status" />
                  <small v-if="product.featured" class="admin-products__featured">
                    <DashIcon name="sparkles" :size="10" />
                    Featured
                  </small>
                </span>
              </td>
              <td class="admin-products__right">
                <div class="admin-products__actions">
                  <NuxtLink
                    :to="`/product/${product.id}`"
                    target="_blank"
                    class="studio-btn studio-btn--icon studio-btn--sm"
                    aria-label="Preview on storefront"
                    title="Preview"
                  >
                    <DashIcon name="eye" :size="14" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="studio-btn studio-btn--icon studio-btn--sm"
                    :aria-label="product.status === 'active' ? 'Unpublish' : 'Publish'"
                    :title="product.status === 'active' ? 'Unpublish' : 'Publish'"
                    @click="toggleLive(product.id, product.status, product.name)"
                  >
                    <DashIcon :name="product.status === 'active' ? 'close' : 'check'" :size="14" />
                  </button>
                  <button
                    type="button"
                    class="studio-btn studio-btn--icon studio-btn--sm"
                    aria-label="Duplicate product"
                    title="Duplicate"
                    @click="duplicate(product.id, product.name)"
                  >
                    <DashIcon name="copy" :size="14" />
                  </button>
                  <button
                    v-if="product.status !== 'archived'"
                    type="button"
                    class="studio-btn studio-btn--icon studio-btn--sm admin-products__archive"
                    aria-label="Archive product"
                    title="Archive"
                    @click="archive(product.id, product.name)"
                  >
                    <DashIcon name="layers" :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!filtered.length" class="studio-empty">
          <DashIcon name="box" :size="26" />
          <strong>No products match</strong>
          <p>Adjust the status, category or search term.</p>
        </div>
      </div>

      <footer class="admin-products__foot">
        <span>Showing {{ filtered.length }} of {{ products.length }} products</span>
        <span>Moderation actions update the live store</span>
      </footer>
    </section>

    <Transition name="toast">
      <div v-if="flash" class="admin-products__toast">
        <DashIcon name="check" :size="14" />
        {{ flash }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.admin-products {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-products__eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #a3abbd;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.admin-products__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.admin-products__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 13px 15px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fff;
  box-shadow: var(--studio-shadow);
}

.admin-products__stat span {
  color: var(--studio-muted);
  font-size: 0.58rem;
  font-weight: 650;
}

.admin-products__stat strong {
  color: var(--studio-ink);
  font-size: 1.22rem;
  font-weight: 750;
  letter-spacing: -0.04em;
}

.admin-products__stat--warn {
  color: #b65a12 !important;
}

.admin-products__card {
  overflow: hidden;
}

.admin-products__name {
  font-size: 0.77rem;
  font-weight: 650;
}

.admin-products__brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #667085;
  font-size: 0.68rem;
  font-weight: 600;
}

.admin-products__brand i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
}

.admin-products__cat {
  font-size: 0.72rem;
  font-weight: 600;
}

.admin-products__right {
  text-align: right;
}

.admin-products__price {
  color: var(--studio-ink);
  font-size: 0.76rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.admin-products__featured {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #8a6d1f;
  font-size: 0.54rem;
  font-weight: 650;
}

.admin-products__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.admin-products__actions .studio-btn--icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #667085;
}

.admin-products__actions .studio-btn--icon:hover {
  color: var(--primary);
}

.admin-products__archive:hover {
  border-color: #ffd9d9 !important;
  background: #fff4f4 !important;
  color: #c02626 !important;
}

.admin-products__foot {
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

.admin-products__toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 70;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border: 1px solid #c8f0d5;
  border-radius: 10px;
  background: #f0fdf4;
  box-shadow: 0 18px 40px -24px rgba(16, 24, 40, 0.6);
  color: #14804a;
  font-size: 0.72rem;
  font-weight: 650;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 900px) {
  .admin-products__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1120px) {
  .admin-products__brand-col {
    display: none;
  }
}
</style>
