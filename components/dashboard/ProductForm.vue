<script setup lang="ts">
import {
  type Product,
  type ProductSize,
  type ProductStatus,
  type SizeName,
} from '~/data/products'
import type { ProductDraft } from '~/composables/useStore'

const props = defineProps<{
  product?: Product
}>()

const emit = defineEmits<{
  saved: [product: Product]
  cancel: []
  removed: []
}>()

const router = useRouter()
const {
  categories,
  collections,
  saveProduct,
  removeProduct,
} = useStore()

const isEdit = computed(() => Boolean(props.product))

const allSizes: SizeName[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

interface SizeRow {
  size: SizeName
  enabled: boolean
  stock: number
}

function initialSizes(): SizeRow[] {
  const existing = new Map((props.product?.sizes ?? []).map((entry) => [entry.size, entry.stock]))
  const hasExisting = existing.size > 0
  return allSizes.map((size) => {
    if (hasExisting) {
      return { size, enabled: existing.has(size), stock: existing.get(size) ?? 0 }
    }
    const core = size === 'S' || size === 'M' || size === 'L' || size === 'XL'
    return { size, enabled: core, stock: core ? 8 : 0 }
  })
}

const form = reactive({
  name: props.product?.name ?? '',
  colour: props.product?.colour ?? '',
  hex: props.product?.hex ?? '#1E40FF',
  category: props.product?.category ?? categories.value[0]?.id ?? 'hoodies',
  collection: props.product?.collection ?? collections.value[0]?.id ?? 'core-blues',
  price: props.product?.price ?? 0,
  compareAtPrice: props.product?.compareAtPrice ?? 0,
  sku: props.product?.sku ?? '',
  description: props.product?.description ?? '',
  details: (props.product?.details ?? []).join('\n'),
  status: (props.product?.status ?? 'active') as ProductStatus,
  featured: props.product?.featured ?? false,
  images: [...(props.product?.images ?? [])],
  sizes: initialSizes(),
})

const errors = reactive<Record<string, string>>({})
const confirmRemove = ref(false)
const savedFlash = ref(false)

const activeSizes = computed(() => form.sizes.filter((row) => row.enabled))
const totalUnits = computed(() => activeSizes.value.reduce((total, row) => total + (Number(row.stock) || 0), 0))
const discount = computed(() => {
  if (!form.compareAtPrice || form.compareAtPrice <= form.price) return 0
  return Math.round(((form.compareAtPrice - form.price) / form.compareAtPrice) * 100)
})

const categoryName = computed(
  () => categories.value.find((entry) => entry.id === form.category)?.name ?? '—',
)

const previewImage = computed(() => form.images[0] ?? '')

function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]

  if (!form.name.trim()) errors.name = 'Give the piece a name.'
  if (!form.colour.trim()) errors.colour = 'Add a colour name.'
  if (!form.price || Number(form.price) <= 0) errors.price = 'Set a selling price above zero.'
  if (form.compareAtPrice && Number(form.compareAtPrice) <= Number(form.price)) {
    errors.compareAtPrice = 'Compare-at price should be higher than the selling price.'
  }
  if (!form.description.trim()) errors.description = 'Add a short description.'
  if (!activeSizes.value.length) errors.sizes = 'Enable at least one size.'
  if (activeSizes.value.some((row) => Number(row.stock) < 0)) errors.sizes = 'Stock cannot be negative.'

  return Object.keys(errors).length === 0
}

function payload(status: ProductStatus): ProductDraft {
  const sizes: ProductSize[] = activeSizes.value.map((row) => ({
    size: row.size,
    stock: Math.max(0, Math.round(Number(row.stock) || 0)),
  }))

  return {
    id: props.product?.id,
    sku: form.sku.trim() || undefined,
    name: form.name.trim(),
    colour: form.colour.trim(),
    hex: form.hex,
    category: form.category,
    collection: form.collection,
    price: Math.round(Number(form.price)),
    compareAtPrice:
      form.compareAtPrice && Number(form.compareAtPrice) > Number(form.price)
        ? Math.round(Number(form.compareAtPrice))
        : undefined,
    description: form.description.trim(),
    details: form.details
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    images: form.images.length ? [...form.images] : ['/images/products/hoodie-hanger-front.png'],
    sizes,
    status,
    featured: form.featured,
  }
}

function submit(status?: ProductStatus) {
  if (!validate()) {
    const firstError = document.querySelector('.studio-error')
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  const saved = saveProduct(payload(status ?? form.status))
  savedFlash.value = true
  emit('saved', saved)
}

function onRemove() {
  if (!props.product) return
  removeProduct(props.product.id)
  emit('removed')
}

watch(
  () => form.compareAtPrice,
  (value) => {
    if (!value) delete errors.compareAtPrice
  },
)
</script>

<template>
  <form class="product-form" @submit.prevent="submit()">
    <div class="product-form__layout">
      <div class="product-form__main">
        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">The piece</h2>
              <p class="studio-card__sub">Name, colour and the story behind it.</p>
            </div>
          </div>
          <div class="studio-card__body product-form__stack">
            <label class="studio-field">
              <span class="studio-label">Product name <span>Required</span></span>
              <input v-model="form.name" class="studio-input" type="text" placeholder="e.g. Royal Blue Hoodie" />
              <span v-if="errors.name" class="studio-error">{{ errors.name }}</span>
            </label>

            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Colour name <span>Required</span></span>
                <input v-model="form.colour" class="studio-input" type="text" placeholder="e.g. Royal Blue" />
                <span v-if="errors.colour" class="studio-error">{{ errors.colour }}</span>
              </label>

              <label class="studio-field">
                <span class="studio-label">Colour swatch</span>
                <span class="product-form__swatch">
                  <input v-model="form.hex" type="color" aria-label="Colour swatch" />
                  <input v-model="form.hex" class="studio-input" type="text" placeholder="#1E40FF" />
                </span>
              </label>
            </div>

            <label class="studio-field">
              <span class="studio-label">Description <span>Shows on the product page</span></span>
              <textarea
                v-model="form.description"
                class="studio-textarea"
                rows="4"
                maxlength="420"
                placeholder="How does it fit? What is it made of? Why will they keep it?"
              />
              <span class="product-form__meta">
                <span v-if="errors.description" class="studio-error">{{ errors.description }}</span>
                <span class="studio-hint">{{ form.description.length }}/420</span>
              </span>
            </label>

            <label class="studio-field">
              <span class="studio-label">Detail lines <span>One per line</span></span>
              <textarea
                v-model="form.details"
                class="studio-textarea"
                rows="4"
                placeholder="Relaxed, unisex cut&#10;Heavyweight brushed fleece&#10;Cold wash, inside out"
              />
              <span class="studio-hint">These become the bullet list on the product page.</span>
            </label>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Pricing</h2>
              <p class="studio-card__sub">All prices in Indian rupees, inclusive of tax.</p>
            </div>
          </div>
          <div class="studio-card__body">
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Selling price <span>Required</span></span>
                <span class="product-form__rupee">
                  <span>₹</span>
                  <input v-model.number="form.price" class="studio-input" type="number" min="0" step="1" />
                </span>
                <span v-if="errors.price" class="studio-error">{{ errors.price }}</span>
              </label>

              <label class="studio-field">
                <span class="studio-label">Compare-at price <span>Optional</span></span>
                <span class="product-form__rupee">
                  <span>₹</span>
                  <input v-model.number="form.compareAtPrice" class="studio-input" type="number" min="0" step="1" />
                </span>
                <span v-if="errors.compareAtPrice" class="studio-error">{{ errors.compareAtPrice }}</span>
                <span v-else-if="discount" class="studio-hint product-form__discount">
                  Shoppers see {{ discount }}% off
                </span>
              </label>
            </div>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Sizes &amp; stock</h2>
              <p class="studio-card__sub">Toggle the sizes you stock and set units on hand.</p>
            </div>
            <span class="studio-badge studio-badge--neutral">{{ totalUnits }} units</span>
          </div>
          <div class="studio-card__body product-form__stack">
            <div class="product-form__sizes">
              <div
                v-for="row in form.sizes"
                :key="row.size"
                class="product-form__size"
                :class="{ 'product-form__size--off': !row.enabled }"
              >
                <label class="product-form__size-toggle">
                  <input v-model="row.enabled" type="checkbox" />
                  <strong>{{ row.size }}</strong>
                </label>
                <input
                  v-model.number="row.stock"
                  class="studio-input product-form__stock"
                  type="number"
                  min="0"
                  step="1"
                  :disabled="!row.enabled"
                  :aria-label="`Stock for size ${row.size}`"
                />
                <span class="product-form__size-state">
                  {{ !row.enabled ? 'Off' : Number(row.stock) > 0 ? 'In stock' : 'Sold out' }}
                </span>
              </div>
            </div>
            <span v-if="errors.sizes" class="studio-error">{{ errors.sizes }}</span>
            <p class="studio-hint">
              A size with zero units stays visible but shows as sold out on the storefront.
            </p>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Photography</h2>
              <p class="studio-card__sub">Front, side and on-body shots.</p>
            </div>
          </div>
          <div class="studio-card__body">
            <ImageUploader v-model="form.images" :max="5" />
          </div>
        </section>
      </div>

      <aside class="product-form__aside">
        <section class="studio-card product-form__sticky">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Publish</h2>
              <p class="studio-card__sub">{{ isEdit ? 'Editing ' + product?.sku : 'New piece' }}</p>
            </div>
          </div>
          <div class="studio-card__body product-form__stack">
            <div class="product-form__preview">
              <div class="product-form__preview-art" :style="{ background: `${form.hex}14` }">
                <img v-if="previewImage" :src="previewImage" :alt="form.name || 'Product preview'" />
                <span v-else :style="{ color: form.hex }">{{ (form.name || 'A').slice(0, 1) }}</span>
              </div>
              <div class="product-form__preview-text">
                <strong>{{ form.name || 'Untitled piece' }}</strong>
                <span>{{ categoryName }} · {{ form.colour || 'No colour' }}</span>
                <div>
                  <b>{{ formatPrice(Number(form.price) || 0) }}</b>
                  <s v-if="discount">{{ formatPrice(Number(form.compareAtPrice)) }}</s>
                </div>
              </div>
            </div>

            <label class="studio-field">
              <span class="studio-label">Status</span>
              <select v-model="form.status" class="studio-select">
                <option value="active">Active — live on store</option>
                <option value="draft">Draft — hidden</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label class="studio-field">
              <span class="studio-label">Category</span>
              <select v-model="form.category" class="studio-select">
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>

            <label class="studio-field">
              <span class="studio-label">Collection</span>
              <select v-model="form.collection" class="studio-select">
                <option v-for="collection in collections" :key="collection.id" :value="collection.id">
                  {{ collection.name }}
                </option>
              </select>
            </label>

            <label class="studio-field">
              <span class="studio-label">SKU <span>Auto if blank</span></span>
              <input v-model="form.sku" class="studio-input" type="text" :placeholder="product?.sku ?? 'ARH-NEW-001'" />
            </label>

            <label class="studio-check">
              <input v-model="form.featured" type="checkbox" />
              Feature on the homepage
            </label>
            <div class="studio-divider" />

            <button class="studio-btn studio-btn--primary product-form__submit" type="submit">
              <DashIcon :name="isEdit ? 'check' : 'plus'" :size="15" />
              {{ isEdit ? 'Save changes' : 'Publish product' }}
            </button>
            <button class="studio-btn" type="button" @click="submit('draft')">
              Save as draft
            </button>
            <button class="studio-btn studio-btn--ghost" type="button" @click="emit('cancel')">
              Cancel
            </button>

            <p v-if="savedFlash" class="studio-note product-form__saved">
              <DashIcon name="check" :size="13" />
              Saved. Changes are live in the store.
            </p>

            <template v-if="isEdit">
              <div class="studio-divider" />
              <button
                v-if="!confirmRemove"
                class="studio-btn studio-btn--danger studio-btn--sm"
                type="button"
                @click="confirmRemove = true"
              >
                <DashIcon name="trash" :size="13" />
                Delete product
              </button>
              <div v-else class="product-form__confirm">
                <p>Delete “{{ product?.name }}”? This cannot be undone.</p>
                <div class="product-form__confirm-actions">
                  <button class="studio-btn studio-btn--danger studio-btn--sm" type="button" @click="onRemove">
                    Yes, delete
                  </button>
                  <button class="studio-btn studio-btn--sm" type="button" @click="confirmRemove = false">
                    Keep it
                  </button>
                </div>
              </div>
            </template>
          </div>
        </section>
      </aside>
    </div>
  </form>
</template>

<style scoped>
.product-form__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  align-items: start;
  gap: 18px;
}

.product-form__main,
.product-form__stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-form__main {
  gap: 18px;
}

.product-form__aside {
  position: relative;
}

.product-form__sticky {
  position: sticky;
  top: 84px;
}

.product-form__swatch {
  display: flex;
  gap: 8px;
}

.product-form__swatch input[type='color'] {
  width: 46px;
  height: 42px;
  flex: none;
  padding: 3px;
  border: 1px solid #e3e6ef;
  border-radius: 4px;
  background: #f8f9fc;
  cursor: pointer;
}

.product-form__rupee {
  position: relative;
  display: flex;
  align-items: center;
}

.product-form__rupee > span {
  position: absolute;
  left: 12px;
  color: var(--studio-muted);
  font-size: 0.82rem;
  font-weight: 650;
  pointer-events: none;
}

.product-form__rupee .studio-input {
  padding-left: 26px;
  font-variant-numeric: tabular-nums;
}

.product-form__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.product-form__discount {
  color: #14804a;
}

.product-form__sizes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px;
}

.product-form__size {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fbfbfe;
  transition: opacity 0.18s ease;
}

.product-form__size--off {
  opacity: 0.55;
}

.product-form__size-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}

.product-form__size-toggle input {
  width: 15px;
  height: 15px;
  accent-color: var(--primary);
}

.product-form__size-toggle strong {
  color: var(--studio-ink);
  font-size: 0.78rem;
  font-weight: 700;
}

.product-form__stock {
  height: 34px;
  padding-inline: 9px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.product-form__size-state {
  color: #98a1b3;
  font-size: 0.56rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  text-align: center;
  text-transform: uppercase;
}

.product-form__preview {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fafbff;
}

.product-form__preview-art {
  display: grid;
  width: 58px;
  height: 66px;
  flex: none;
  place-items: center;
  overflow: hidden;
  border-radius: 4px;
}

.product-form__preview-art img {
  width: 100%;
  height: 100%;
  padding: 3px;
  object-fit: contain;
}

.product-form__preview-art span {
  font-size: 1.4rem;
  font-weight: 800;
}

.product-form__preview-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.product-form__preview-text strong {
  overflow: hidden;
  color: var(--studio-ink);
  font-size: 0.76rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-form__preview-text span {
  color: var(--studio-muted);
  font-size: 0.6rem;
}

.product-form__preview-text div {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 2px;
}

.product-form__preview-text b {
  color: var(--studio-ink);
  font-size: 0.78rem;
  font-weight: 750;
}

.product-form__preview-text s {
  color: #a3abbd;
  font-size: 0.62rem;
}

.product-form__submit {
  width: 100%;
}

.product-form__saved {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #14804a;
  background: #eafbef;
  border-color: #c8f0d5;
}

.product-form__confirm {
  padding: 11px;
  border: 1px solid #ffd9d9;
  border-radius: 4px;
  background: #fff7f7;
}

.product-form__confirm p {
  color: #96201f;
  font-size: 0.7rem;
  line-height: 1.5;
}

.product-form__confirm-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

@media (max-width: 1080px) {
  .product-form__layout {
    grid-template-columns: 1fr;
  }

  .product-form__sticky {
    position: static;
  }
}
</style>
