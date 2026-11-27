<script setup lang="ts">
definePageMeta({ chrome: false, title: 'Edit product', layout: 'studio' })

const route = useRoute()
const router = useRouter()
const { getProduct } = useStore()

const product = computed(() => getProduct(String(route.params.id)))

useHead(() => ({ title: product.value ? `${product.value.name} · AAROH. Studio` : 'Edit product · AAROH. Studio' }))

function done() {
  router.push('/dashboard/products')
}
</script>

<template>
  <div class="edit-product">
    <header v-if="product" class="studio-page-head">
      <div>
        <NuxtLink to="/dashboard/products" class="edit-product__back">
          <DashIcon name="chevronLeft" :size="13" />
          All products
        </NuxtLink>
        <h1 class="studio-page-title">{{ product.name }}</h1>
        <p class="studio-page-sub">
          {{ product.sku }} · last updated {{ formatDate(product.createdAt) }}
          <span class="edit-product__status">· {{ product.status }}</span>
        </p>
      </div>
      <div class="studio-page-actions">
        <NuxtLink :to="`/product/${product.id}`" class="studio-btn" target="_blank">
          <DashIcon name="eye" :size="15" />
          View on store
        </NuxtLink>
      </div>
    </header>

    <ProductForm
      v-if="product"
      :key="product.id"
      :product="product"
      @saved="done"
      @removed="done"
      @cancel="router.push('/dashboard/products')"
    />

    <div v-else class="studio-card">
      <div class="studio-empty">
        <DashIcon name="box" :size="28" />
        <strong>Product not found</strong>
        <p>This piece may have been deleted from the catalogue in this session.</p>
        <NuxtLink to="/dashboard/products" class="studio-btn studio-btn--primary studio-btn--sm">
          Back to products
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-product__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  color: var(--studio-muted);
  font-size: 0.65rem;
  font-weight: 650;
  text-decoration: none;
}

.edit-product__back:hover {
  color: var(--primary);
}

.edit-product__status {
  text-transform: capitalize;
}
</style>
