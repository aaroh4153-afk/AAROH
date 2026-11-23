<script setup lang="ts">
definePageMeta({ chrome: false, title: 'Add product', layout: 'studio' })

useHead({ title: 'Add product · AAROH. Studio' })

const router = useRouter()

function onSaved() {
  router.push('/dashboard/products')
}
</script>

<template>
  <div class="new-product">
    <header class="studio-page-head">
      <div>
        <NuxtLink to="/dashboard/products" class="new-product__back">
          <DashIcon name="chevronLeft" :size="13" />
          All products
        </NuxtLink>
        <h1 class="studio-page-title">Add a product</h1>
        <p class="studio-page-sub">
          Photograph it, price it, set the sizes — it goes live the moment you publish.
        </p>
      </div>
    </header>

    <ProductForm @saved="onSaved" @cancel="router.push('/dashboard/products')" />
  </div>
</template>

<style scoped>
.new-product__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  color: var(--studio-muted);
  font-size: 0.65rem;
  font-weight: 650;
  text-decoration: none;
}

.new-product__back:hover {
  color: var(--primary);
}
</style>
