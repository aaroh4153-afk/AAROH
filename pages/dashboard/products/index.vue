<script setup lang="ts">
import { stockState, totalStock, type Product, type ProductStatus } from '~/data/products'

definePageMeta({ chrome: false, title: 'Products', layout: 'studio' })

useHead({ title: 'Products · AAROH. Studio' })

const {
  products,
  categories,
  collections,
  duplicateProduct,
  removeProduct,
  setProductStatus,
} = useStore()

const search = ref('')
const status = ref<'all' | ProductStatus>('all')
const category = ref('all')
const collection = ref('all')
const sort = ref<'newest' | 'name' | 'price-desc' | 'stock-asc'>('newest')

const deleteTarget = ref<Product | null>(null)
const flash = ref('')
let flashTimer: ReturnType<typeof setTimeout> | null = null

function notify(message: string) {
  flash.value = message
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flash.value = ''
  }, 2600)
}

onBeforeUnmount(() => {
  if (flashTimer) clearTimeout(flashTimer)
})

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  const list = products.value.filter((product) => {
    if (status.value !== 'all' && product.status !== status.value) return false
    if (category.value !== 'all' && product.category !== category.value) return false
    if (collection.value !== 'all' && product.collection !== collection.value) return false
    if (!query) return true
    return [product.name, product.sku, product.colour, product.category]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  return [...list].sort((a, b) => {
    if (sort.value === 'name') return a.name.localeCompare(b.name)
    if (sort.value === 'price-desc') return b.price - a.price
    if (sort.value === 'stock-asc') return totalStock(a) - totalStock(b)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const stats = computed(() => ({
  total: products.value.length,
  active: products.value.filter((product) => product.status === 'active').length,
  draft: products.value.filter((product) => product.status === 'draft').length,
  low: products.value.filter((product) => product.status === 'active' && stockState(product) !== 'in').length,
}))

const statusTabs = computed(() => [
  { id: 'all' as const, label: 'All', count: products.value.length },
  {
    id: 'active' as const,
    label: 'Active',
    count: products.value.filter((product) => product.status === 'active').length,
  },
  {
    id: 'draft' as const,
    label: 'Draft',
    count: products.value.filter((product) => product.status === 'draft').length,
  },
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

function duplicate(product: Product) {
  duplicateProduct(product.id)
  notify(`${product.name} duplicated as a draft.`)
}

function toggleStatus(product: Product) {
  setProductStatus(product.id, product.status === 'active' ? 'draft' : 'active')
  notify(product.status === 'active' ? `${product.name} is live.` : `${product.name} moved to draft.`)
}

function confirmDelete() {
  if (!deleteTarget.value) return
  const name = deleteTarget.value.name
  removeProduct(deleteTarget.value.id)
  deleteTarget.value = null
  notify(`${name} removed from the catalogue.`)
}
</script>

<template>
  <div class="products">
    <header class="studio-page-head">
      <div>
        <h1 class="studio-page-title">Products</h1>
        <p class="studio-page-sub">
          {{ stats.total }} pieces · {{ stats.active }} live · {{ stats.low }} need restocking.
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

    <section class="products__tabs">
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
            <input v-model="search" class="studio-input" type="search" placeholder="Search name, SKU or colour…" />
          </label>
        </div>

        <div class="studio-toolbar__group">
          <select v-model="category" class="studio-select studio-select--compact" aria-label="Filter by category">
            <option value="all">All categories</option>
            <option v-for="entry in categories" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
          </select>
          <select v-model="collection" class="studio-select studio-select--compact" aria-label="Filter by collection">
            <option value="all">All collections</option>
            <option v-for="entry in collections" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
          </select>
          <select v-model="sort" class="studio-select studio-select--compact" aria-label="Sort products">
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="price-desc">Price high–low</option>
            <option value="stock-asc">Lowest stock</option>
          </select>
        </div>
      </div>
    </section>

    <section class="studio-card products__card">
      <div class="studio-table-wrap">
        <table class="studio-table products__table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Placement</th>
              <th class="products__right">Price</th>
              <th>Stock by size</th>
              <th>Status</th>
              <th class="products__right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filtered" :key="product.id">
              <td>
                <NuxtLink :to="`/dashboard/products/${product.id}`" class="products__product">
                  <img :src="product.images[0]" :alt="product.name" class="studio-thumb" />
                  <span class="studio-stack">
                    <strong class="studio-strong">{{ product.name }}</strong>
                    <small class="studio-muted">{{ product.sku }} · {{ product.colour }}</small>
                  </span>
                </NuxtLink>
              </td>
              <td>
                <span class="studio-stack">
                  <strong class="products__placement">{{ categoryName(product.category) }}</strong>
                  <small class="studio-muted">{{ collectionName(product.collection) }}</small>
                </span>
              </td>
              <td class="products__right">
                <span class="studio-stack products__price">
                  <strong class="studio-strong">{{ formatPrice(product.price) }}</strong>
                  <s v-if="product.compareAtPrice" class="studio-muted">{{ formatPrice(product.compareAtPrice) }}</s>
                </span>
              </td>
              <td>
                <div class="products__sizes">
                  <span
                    v-for="size in product.sizes"
                    :key="size.size"
                    class="products__size"
                    :class="{
                      'products__size--out': size.stock === 0,
                      'products__size--low': size.stock > 0 && size.stock <= 3,
                    }"
                    :title="`${size.size}: ${size.stock} units`"
                  >
                    {{ size.size }}
                    <b>{{ size.stock }}</b>
                  </span>
                </div>
                <small class="products__total" :class="{ 'products__total--out': totalStock(product) === 0 }">
                  {{ totalStock(product) }} units total
                </small>
              </td>
              <td>
                <button
                  type="button"
                  class="products__status"
                  :title="product.status === 'active' ? 'Move to draft' : 'Publish'"
                  @click="toggleStatus(product)"
                >
                  <StatusBadge :status="product.status" />
                </button>
                <span v-if="product.featured" class="products__featured">
                  <DashIcon name="sparkles" :size="11" />
                  Featured
                </span>
              </td>
              <td class="products__right">
                <div class="products__actions">
                  <NuxtLink
                    :to="`/dashboard/products/${product.id}`"
                    class="studio-btn studio-btn--icon studio-btn--sm"
                    :aria-label="`Edit ${product.name}`"
                    title="Edit"
                  >
                    <DashIcon name="edit" :size="14" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="studio-btn studio-btn--icon studio-btn--sm"
                    aria-label="Duplicate product"
                    title="Duplicate"
                    @click="duplicate(product)"
                  >
                    <DashIcon name="copy" :size="14" />
                  </button>
                  <button
                    type="button"
                    class="studio-btn studio-btn--icon studio-btn--sm products__delete"
                    aria-label="Delete product"
                    title="Delete"
                    @click="deleteTarget = product"
                  >
                    <DashIcon name="trash" :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!filtered.length" class="studio-empty">
          <DashIcon name="box" :size="26" />
          <strong>No products match</strong>
          <p>Try a different status, category or search term — or add a new piece.</p>
          <NuxtLink to="/dashboard/products/new" class="studio-btn studio-btn--primary studio-btn--sm">
            <DashIcon name="plus" :size="13" />
            Add product
          </NuxtLink>
        </div>
      </div>

      <footer class="products__foot">
        <span>Showing {{ filtered.length }} of {{ products.length }} pieces</span>
        <span>Stock syncs with the storefront in this session</span>
      </footer>
    </section>

    <ConfirmDialog
      :model-value="Boolean(deleteTarget)"
      title="Delete this product?"
      :message="`“${deleteTarget?.name ?? ''}” will be removed from the catalogue and storefront. This cannot be undone.`"
      confirm-label="Delete product"
      @update:model-value="deleteTarget = null"
      @confirm="confirmDelete"
    />

    <Transition name="toast">
      <div v-if="flash" class="products__toast">
        <DashIcon name="check" :size="14" />
        {{ flash }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.products {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.products__tabs {
  overflow: hidden;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fff;
  box-shadow: var(--studio-shadow);
}

.products__card {
  overflow: hidden;
}

.products__product {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--studio-ink);
  text-decoration: none;
}

.products__product:hover strong {
  color: var(--primary);
}

.products__product .studio-thumb {
  width: 38px;
  height: 42px;
}

.products__product strong {
  font-size: 0.78rem;
  font-weight: 650;
}

.products__product small {
  font-size: 0.6rem;
}

.products__placement {
  font-size: 0.72rem;
  font-weight: 600;
}

.products__right {
  text-align: right;
}

.products__price {
  align-items: flex-end;
}

.products__price s {
  font-size: 0.6rem;
}

.products__sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.products__size {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 4px 2px 5px;
  border-radius: 5px;
  background: #f1f3f8;
  color: #667085;
  font-size: 0.53rem;
  font-weight: 700;
}

.products__size b {
  color: #98a1b3;
  font-size: 0.52rem;
  font-weight: 650;
}

.products__size--low {
  background: #fff4e8;
  color: #b65a12;
}

.products__size--low b {
  color: #b65a12;
}

.products__size--out {
  background: #ffeded;
  color: #c02626;
}

.products__size--out b {
  color: #c02626;
}

.products__total {
  display: block;
  margin-top: 4px;
  color: #a3abbd;
  font-size: 0.55rem;
}

.products__total--out {
  color: #c02626;
  font-weight: 650;
}

.products__status {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.products__featured {
  display: block;
  margin-top: 3px;
  color: #8a6d1f;
  font-size: 0.53rem;
  font-weight: 650;
}

.products__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.products__actions .studio-btn--icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #667085;
}

.products__actions .studio-btn--icon:hover {
  color: var(--primary);
}

.products__delete:hover {
  border-color: #ffbebe !important;
  background: #fff4f4 !important;
  color: #c02626 !important;
}

.products__foot {
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

.products__toast {
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
  .products__sizes {
    max-width: 130px;
  }
}
</style>
