<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  discountPercent,
  firstAvailableSize,
  stockState,
  type Product,
} from '../data/products'
import { useCart } from '../composables/useCart'
import { useCatalog } from '../composables/useCatalog'
import { useMotion } from '../composables/useMotion'
import { useStore } from '../composables/useStore'
import { formatPrice } from '../utils/format'

const props = withDefaults(defineProps<{ fullPage?: boolean }>(), { fullPage: false })

const { addItem } = useCart()
const { categories, collections } = useStore()
const {
  query,
  homeProducts,
  storefrontProducts,
  isFiltering,
  clearFilters,
  activeCategory,
  activeCollection,
  sort,
  setCategory,
} = useCatalog()

const sectionRef = ref<HTMLElement | null>(null)
const gridAnchor = ref<HTMLElement | null>(null)
const activeView = ref<Record<string, 'front' | 'side'>>({})
const inStockOnly = ref(false)
const { load, prefersReducedMotion } = useMotion()

const NEW_CUTOFF = new Date('2026-10-24T00:00:00.000Z')
const collectionEditorialImage = '/images/campaign/hoodie-portrait.png'

const displayedProducts = computed(() =>
  inStockOnly.value ? homeProducts.value.filter((product) => stockState(product) !== 'out') : homeProducts.value,
)
const activeFilters = computed(() => isFiltering.value || inStockOnly.value)

/** The home page shows a short edit of six pieces in a horizontal rail. */
const HOME_EDIT_LIMIT = 6
const homeEdit = computed(() =>
  [...storefrontProducts.value]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, HOME_EDIT_LIMIT),
)
const visibleProducts = computed(() =>
  props.fullPage ? displayedProducts.value : homeEdit.value,
)

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const product of storefrontProducts.value) {
    counts[product.category] = (counts[product.category] ?? 0) + 1
  }
  return counts
})

const activeCollectionName = computed(
  () => collections.value.find((collection) => collection.id === activeCollection.value)?.name ?? '',
)

/** Only offer collections that the three-piece edit actually contains. */
const availableCollections = computed(() => {
  const ids = new Set(storefrontProducts.value.map((product) => product.collection))
  return collections.value.filter((collection) => ids.has(collection.id))
})

let cleanupMotion: (() => void) | null = null

function toggleCardView(id: string) {
  activeView.value[id] = activeView.value[id] === 'side' ? 'front' : 'side'
}

function setCardHoverView(id: string, isHovered: boolean) {
  if (props.fullPage) return
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  activeView.value[id] = isHovered ? 'side' : 'front'
}

function isNewCut(product: Product) {
  return new Date(product.createdAt) > NEW_CUTOFF
}

function availableSizeLabel(product: Product) {
  const sizes = product.sizes.filter((size) => size.stock > 0)
  if (!sizes.length) return 'Sold out'
  return `${sizes.length} ${sizes.length === 1 ? 'size' : 'sizes'} available`
}

function quickAdd(product: Product) {
  if (stockState(product) === 'out') return
  const size = firstAvailableSize(product)
  if (!size) return
  addItem(product, size)
}

function scrollToCatalogue() {
  gridAnchor.value?.scrollIntoView({
    behavior: props.fullPage || prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  })
}

function chooseCategory(id: string) {
  setCategory(activeCategory.value === id ? 'all' : id)
  scrollToCatalogue()
}

function resetFilters() {
  clearFilters()
  inStockOnly.value = false
}

onMounted(async () => {
  if (props.fullPage || prefersReducedMotion()) return

  const { gsap } = await load()
  const sectionValue = sectionRef.value
  if (sectionValue === null) return
  const section: HTMLElement = sectionValue

  const ctx = gsap.context(() => {
    function reveal(
      targetSelector: string,
      triggerSelector: string,
      options: {
        x?: number
        y?: number
        opacity: number
        duration: number
        delay?: number
        stagger?: number
        ease: string
        start: string
      },
    ) {
      const targets = [...section.querySelectorAll<HTMLElement>(targetSelector)]
      const trigger = section.querySelector<HTMLElement>(triggerSelector)
      if (!targets.length || !trigger) return

      const { start, ...tweenOptions } = options
      gsap.from(targets, {
        ...tweenOptions,
        scrollTrigger: { trigger, start },
      })
    }

    reveal('.collection-label', '.collection-label', {
      y: 22,
      opacity: 0,
      duration: 0.65,
      ease: 'power3.out',
      start: 'top 82%',
    })
    reveal('.catalog-toolbar', '.catalog-toolbar', {
      y: 18,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      start: 'top 94%',
    })
    reveal('.collection-title', '.collection-head', {
      y: 42,
      opacity: 0,
      duration: 0.9,
      ease: 'power4.out',
      start: 'top 84%',
    })
    reveal('.collection-aside', '.collection-head', {
      y: 20,
      opacity: 0,
      duration: 0.65,
      delay: 0.12,
      ease: 'power3.out',
      start: 'top 84%',
    })
    reveal('.rtw-col', '.rtw-grid-container', {
      y: 44,
      opacity: 0,
      duration: 0.8,
      stagger: 0.055,
      ease: 'power3.out',
      start: 'top 88%',
    })
    reveal('.category-row', '.categories-section', {
      x: -22,
      opacity: 0,
      duration: 0.65,
      stagger: 0.07,
      ease: 'power2.out',
      start: 'top 88%',
    })
    reveal('.collection-cta', '.collection-cta', {
      y: 24,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      start: 'top 92%',
    })
  }, section)

  cleanupMotion = () => ctx.revert()
})

onBeforeUnmount(() => {
  cleanupMotion?.()
})
</script>

<template>
  <section
    id="ready-to-wear"
    ref="sectionRef"
    class="collection"
    :class="{ 'collection--full-page': props.fullPage }"
    aria-labelledby="collection-title"
  >
    <figure v-if="props.fullPage" class="collection-editorial">
      <img
        :src="collectionEditorialImage"
        alt="AAROH. royal blue hoodie editorial portrait"
        loading="eager"
        fetchpriority="high"
      />
      <figcaption class="collection-editorial__caption">
        <span>AAROH. / Studio</span>
        <span>Everyday essentials, made to be worn.</span>
      </figcaption>
    </figure>

    <header class="collection-head">
      <div class="collection-label">
        <span class="collection-label__index">01</span>
        <span class="collection-label__rule" aria-hidden="true" />
        <span>{{ props.fullPage ? 'The full collection' : 'Ready-to-wear' }}</span>
        <span class="collection-label__badge">New season</span>
        <span class="collection-label__right">The core collection</span>
      </div>

      <div class="collection-head__row">
        <h2
          id="collection-title"
          class="collection-title"
          :aria-label="props.fullPage ? 'The full collection' : 'Shop the collection'"
        >
          <span>{{ props.fullPage ? 'The full' : 'Shop the' }}</span>
          <span class="collection-title__static">collection</span>
        </h2>

        <div class="collection-aside">
          <p v-if="activeFilters && props.fullPage" class="collection-status" role="status">
            {{ displayedProducts.length }} of {{ storefrontProducts.length }} pieces
            <template v-if="activeCollectionName"> · {{ activeCollectionName }}</template>
            <button type="button" @click="resetFilters">Clear</button>
          </p>
          <p v-else class="collection-description">
            Hoodies, shirts and layers — small-batch pieces in a quiet, considered palette.
          </p>

          <NuxtLink :to="props.fullPage ? '/#ready-to-wear' : '/shop'" class="text-link">
            {{ props.fullPage ? 'Back to the home page' : `Shop all ${storefrontProducts.length} pieces` }}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </header>

    <div v-if="props.fullPage" ref="gridAnchor" class="catalog-toolbar catalog-toolbar--full-page">
      <div class="catalog-full-search">
        <label class="catalog-full-search__field">
          <span>Find a piece</span>
          <input v-model="query" type="search" placeholder="Search styles, colours, collections" />
        </label>
        <label class="catalog-in-stock">
          <input v-model="inStockOnly" type="checkbox" />
          <span>In stock only</span>
        </label>
      </div>

      <div class="catalog-chips" role="group" aria-label="Filter by category">
        <button
          type="button"
          class="catalog-chip"
          :class="{ 'catalog-chip--active': activeCategory === 'all' }"
          @click="setCategory('all')"
        >
          All pieces <span>{{ storefrontProducts.length }}</span>
        </button>
        <button
          v-for="category in categories.filter((entry) => (categoryCounts[entry.id] ?? 0) > 0)"
          :key="category.id"
          type="button"
          class="catalog-chip"
          :class="{ 'catalog-chip--active': activeCategory === category.id }"
          @click="setCategory(category.id)"
        >
          {{ category.name }} <span>{{ categoryCounts[category.id] ?? 0 }}</span>
        </button>
      </div>

      <div class="catalog-tools">
        <label class="catalog-select">
          <span>Collection</span>
          <select v-model="activeCollection" aria-label="Filter by collection">
            <option value="all">All collections</option>
            <option v-for="collection in availableCollections" :key="collection.id" :value="collection.id">
              {{ collection.name }}
            </option>
          </select>
        </label>

        <label class="catalog-select">
          <span>Sort</span>
          <select v-model="sort" aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>
    </div>

    <div
      class="rtw-grid-container"
      :class="{
        'rtw-grid-container--filtered': activeFilters && props.fullPage,
        'rtw-grid-container--home': !props.fullPage,
      }"
    >
      <div
        v-if="visibleProducts.length"
        class="rtw-grid"
        :class="{
          'rtw-grid--filtered': activeFilters && props.fullPage,
          'rtw-grid--home': !props.fullPage,
        }"
      >
        <article
          v-for="product in visibleProducts"
          :key="product.id"
          class="rtw-col"
          :class="{ 'rtw-col--black-hoodle': product.id === 'black-hoodle' }"
          :style="{ '--tint': product.hex }"
          @mouseenter="setCardHoverView(product.id, true)"
          @mouseleave="setCardHoverView(product.id, false)"
        >
          <div class="rtw-card__image-box">
            <img
              :src="product.images[0]"
              :alt="`${product.name} — front view`"
              class="rtw-img rtw-img--front"
              :class="{ 'rtw-img--hidden': activeView[product.id] === 'side' }"
              loading="eager"
              decoding="async"
              draggable="false"
            />
            <img
              v-if="!props.fullPage"
              :src="product.images[1] ?? product.images[0]"
              :alt="`${product.name} — alternate view`"
              class="rtw-img rtw-img--side"
              :class="{ 'rtw-img--visible': activeView[product.id] === 'side' }"
              loading="lazy"
              decoding="async"
              draggable="false"
            />

            <span v-if="stockState(product) === 'out'" class="rtw-flag rtw-flag--out">Sold out</span>
            <span v-else-if="discountPercent(product)" class="rtw-flag rtw-flag--sale">
              −{{ discountPercent(product) }}%
            </span>
            <span v-else-if="isNewCut(product)" class="rtw-flag">New</span>

            <button
              v-if="!props.fullPage"
              class="rtw-view-btn"
              type="button"
              :aria-label="activeView[product.id] === 'side' ? `Show front view of ${product.name}` : `Show side view of ${product.name}`"
              :aria-pressed="activeView[product.id] === 'side'"
              @click.stop="toggleCardView(product.id)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M21 12a9 9 0 1 1-3.5-7.1" />
                <path d="M21 3v6h-6" />
              </svg>
            </button>

            <button
              v-if="!props.fullPage"
              class="rtw-quick-add"
              type="button"
              :disabled="stockState(product) === 'out'"
              @click.stop="quickAdd(product)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>{{ stockState(product) === 'out' ? 'Sold out' : 'Add to cart' }}</span>
            </button>
          </div>

          <NuxtLink
            class="rtw-open"
            :to="`/product/${product.id}`"
            :aria-label="`View ${product.name}`"
            @focusin="activeView[product.id] = 'side'"
            @focusout="activeView[product.id] = 'front'"
          />

          <div class="rtw-card__footer">
            <div class="rtw-card__text">
              <h3 class="rtw-card__name">{{ product.name }}</h3>
              <p class="rtw-card__meta" :class="{ 'rtw-card__meta--low': stockState(product) === 'low' }">
                {{ product.colour }} · {{ availableSizeLabel(product) }}
              </p>
            </div>
            <div class="rtw-card__prices">
              <span class="rtw-card__price">{{ formatPrice(product.price) }}</span>
              <s v-if="product.compareAtPrice" class="rtw-card__compare">
                {{ formatPrice(product.compareAtPrice) }}
              </s>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="collection-empty">
        <p class="collection-empty__title">{{ props.fullPage ? 'No pieces match.' : 'Nothing on this rail.' }}</p>
        <p class="collection-empty__copy">Try another colour, category or collection.</p>
        <button class="btn btn--ghost" type="button" @click="resetFilters">Clear filters</button>
      </div>
    </div>

    <div v-if="!props.fullPage" class="collection-cta">
      <p>Not sure where to start? <em>Start with the essentials.</em></p>
      <NuxtLink class="btn btn--cta" to="/shop">
        Shop all pieces
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.collection {
  width: 100%;
  max-width: var(--max);
  margin-inline: auto;
  padding: clamp(58px, 7.4vw, 112px) var(--gutter) clamp(62px, 8vw, 118px);
}

.collection-head {
  display: grid;
  gap: clamp(22px, 3vw, 34px);
  margin-bottom: clamp(26px, 3.4vw, 42px);
}

.collection-label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 0.64rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.collection-label__index {
  color: var(--primary);
  font-weight: 750;
}

.collection-label__rule {
  width: 30px;
  height: 1px;
  background: var(--primary);
}

.collection-label__badge {
  padding: 4px 8px;
  border-radius: var(--btn-radius);
  background: var(--sky);
  color: var(--primary);
  font-size: 0.55rem;
  font-weight: 750;
  letter-spacing: 0.09em;
}

.collection-label__right {
  margin-left: auto;
  opacity: 0.7;
}

.collection-head__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px 48px;
}

.collection-title {
  color: var(--ink);
  font-family: var(--font);
  font-size: clamp(1.7rem, 2.8vw, 2.6rem);
  font-weight: 550;
  line-height: 1;
  letter-spacing: -0.045em;
}

.collection-title__static {
  display: inline-block;
  margin-left: 0.12em;
  font: inherit;
}

.collection-aside {
  display: grid;
  justify-items: start;
  gap: 12px;
  max-width: 310px;
  padding-bottom: 4px;
}

.collection-description,
.collection-status {
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.55;
}

.collection-status button {
  display: inline;
  padding: 0 0 1px;
  border: none;
  border-bottom: 1px solid currentColor;
  background: none;
  color: var(--primary);
  font-size: inherit;
  font-weight: 650;
  cursor: pointer;
}

.collection-aside .text-link {
  color: var(--ink);
}

.rtw-grid-container {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--line);
  box-shadow: none;
  overflow: visible;
}

.rtw-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
}

/* Home edit: six pieces in a horizontal product rail. */
.rtw-grid-container--home {
  overflow: visible;
  border: 0;
  background: transparent;
}

.rtw-grid.rtw-grid--home {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.rtw-grid--home::-webkit-scrollbar {
  display: none;
}

.rtw-grid--home .rtw-col {
  flex: 0 0 calc((100% - 42px) / 4);
  scroll-snap-align: start;
}

.rtw-col {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 0.0625rem;
  background: var(--card);
}

.rtw-col--black-hoodle {
  z-index: 1;
  box-shadow: 0 0.35rem 1rem -0.3rem color-mix(in srgb, var(--ink) 34%, transparent);
}

.rtw-open {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  text-decoration: none;
}

.rtw-open:focus-visible {
  z-index: 3;
  outline: 2px solid var(--red);
  outline-offset: -3px;
}

.rtw-card__image-box {
  position: relative;
  display: flex;
  width: 100%;
  aspect-ratio: 3 / 4.35;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 16px 10px 18px;
  background: #ffffff;
  transition: background 0.35s ease;
}

@media (hover: hover) and (pointer: fine) {
  .rtw-col:hover .rtw-card__image-box {
    background: #fafaf9;
  }
}

@media (hover: none) {
  .rtw-col:hover .rtw-card__image-box,
  .rtw-col:focus-within .rtw-card__image-box {
    background: #ffffff;
  }
}

.rtw-img {
  position: absolute;
  inset: 14px 10px 18px;
  width: calc(100% - 20px);
  height: calc(100% - 32px);
  object-fit: contain;
  transition: opacity 0.42s var(--ease), transform 0.55s var(--ease);
  pointer-events: none;
  user-select: none;
}

.rtw-img--front {
  opacity: 1;
  transform: scale(1);
}

.rtw-img--side {
  opacity: 0;
  transform: scale(0.975) rotate(-1.5deg);
}

.rtw-img--hidden {
  opacity: 0;
  transform: scale(0.975) rotate(1.5deg);
}

.rtw-img--visible {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.rtw-view-btn {
  position: absolute;
  top: 9px;
  right: 9px;
  z-index: 2;
  display: inline-flex;
  width: 27px;
  height: 27px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(11, 18, 32, 0.1);
  border-radius: var(--btn-radius);
  background: rgba(255, 255, 255, 0.82);
  color: var(--primary);
  cursor: pointer;
  opacity: 0;
  backdrop-filter: blur(5px);
  transition: opacity 0.22s ease;
}

@media (hover: hover) and (pointer: fine) {
  .rtw-col:hover .rtw-view-btn {
    opacity: 1;
  }
}

.rtw-view-btn:focus-visible {
  opacity: 1;
}

.rtw-quick-add {
  position: absolute;
  bottom: 11px;
  left: 50%;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 9px 15px;
  border: 1px solid var(--white);
  border-radius: var(--pill);
  background: rgba(0, 0, 0, 0.352);
  color: var(--white);
  box-shadow: none;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 9px);
  transition: opacity 0.25s ease, transform 0.3s var(--ease);
}

@media (hover: hover) and (pointer: fine) {
  .rtw-col:hover .rtw-quick-add {
    opacity: 1;
    pointer-events: auto;
    transform: translate(-50%, 0);
  }
}

.rtw-col:focus-within .rtw-quick-add {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0);
}

.rtw-card__footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding: 11px 12px 12px;
  border-top: 1px solid var(--line);
  background: var(--card);
}

.rtw-card__name {
  margin: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: letter-spacing 0.35s var(--ease), color 0.2s ease;
}

@media (hover: hover) and (pointer: fine) {
  .rtw-col:hover .rtw-card__name {
    color: var(--primary);
    letter-spacing: 0.018em;
  }
}

.rtw-card__price {
  flex: none;
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: color 0.2s ease;
}

@media (hover: hover) and (pointer: fine) {
  .rtw-col:hover .rtw-card__price {
    color: var(--primary);
  }
}

/* Search results become a centred set of stand-alone light cards. */
.rtw-grid-container--filtered {
  border: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.rtw-grid--filtered {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  background: transparent;
}

.rtw-grid--filtered .rtw-col {
  flex: 0 1 228px;
  border: 1px solid var(--line);
  border-radius: 0.0625rem;
  overflow: hidden;
  background: var(--card);
}

.collection-empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: clamp(56px, 9vw, 110px) 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  text-align: center;
}

.collection-empty__title {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-style: italic;
  line-height: 1;
}

.collection-empty__copy {
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 0.88rem;
}

/* Categories list, borrowed from the editorial reference. */
.categories-section {
  margin-top: clamp(46px, 6vw, 76px);
}

.categories-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 8px;
}

.categories-head h3 {
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.categories-head span {
  color: var(--muted);
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.categories-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--line);
}

.category-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto 36px;
  align-items: center;
  gap: 14px;
  padding: 18px 8px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  text-decoration: none;
  transition: background-color 0.25s ease, padding 0.3s var(--ease), border-color 0.25s ease;
}

@media (hover: hover) and (pointer: fine) {
  .category-row:hover {
    padding-inline: 14px;
    border-bottom-color: rgba(30, 64, 255, 0.32);
    background: var(--sky);
  }
}

.category-index {
  color: var(--primary);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.category-name {
  overflow: hidden;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.category-name i {
  color: var(--text-muted);
  font-style: normal;
  font-weight: 400;
}

@media (hover: hover) and (pointer: fine) {
  .category-row:hover .category-name {
    color: var(--primary);
  }
}

.category-count {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
}

.category-arrow {
  display: inline-flex;
  width: 31px;
  height: 31px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink);
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.3s var(--ease);
}

@media (hover: hover) and (pointer: fine) {
  .category-row:hover .category-arrow {
    border-color: var(--primary);
    background: var(--primary);
    color: #fff;
    transform: translateX(3px);
  }
}

/* Closing call to action. */
.collection-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 22px 40px;
  margin-top: clamp(48px, 6vw, 84px);
  padding-top: clamp(26px, 3vw, 38px);
  border-top: 1px solid var(--line);
}

.collection-cta p {
  color: var(--muted);
  font-size: clamp(1.05rem, 1.8vw, 1.4rem);
  font-weight: 600;
  letter-spacing: -0.015em;
}

.collection-cta p em {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 1.1em;
  font-style: italic;
  font-weight: 400;
}

.collection-cta .btn {
  font-size: 0.8rem;
}

@media (max-width: 1080px) {
  .collection-head__row {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }

  .collection-aside {
    max-width: 480px;
  }

  .rtw-grid--home .rtw-col {
    flex-basis: calc((100% - 28px) / 3);
  }

  .rtw-card__image-box {
    aspect-ratio: 3 / 4.05;
  }

  .collection--full-page .rtw-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (hover: none) {
  .rtw-view-btn,
  .rtw-quick-add {
    opacity: 1;
    pointer-events: auto;
  }

  .rtw-col:active .rtw-card__image-box {
    background:
      radial-gradient(120% 82% at 50% 14%, #ffffff 0%, transparent 58%),
      linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--tint) 34%, var(--sky)) 100%);
  }

  .rtw-col:active .rtw-card__name,
  .rtw-col:active .rtw-card__price {
    color: var(--primary);
  }

  .category-row:active {
    background: var(--sky);
  }

  .rtw-quick-add {
    transform: translate(-50%, 0);
  }

  .rtw-quick-add span {
    display: none;
  }

  .rtw-quick-add {
    left: auto;
    right: 10px;
    bottom: 10px;
    width: 48px;
    height: 48px;
    min-width: 48px;
    justify-content: center;
    padding: 0;
    transform: none;
  }

  .rtw-col:hover .rtw-quick-add,
  .rtw-col:focus-within .rtw-quick-add {
    transform: none;
  }
}

@media (max-width: 700px) {
  .rtw-grid-container {
    border: 0;
    border-radius: 0;
    background: transparent;
    overflow: visible;
  }

  .rtw-grid {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 22px;
    margin-bottom: -10px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    background: transparent;
  }

  .rtw-grid--home {
    padding-bottom: 8px;
    margin-bottom: 0;
  }

  .rtw-grid--home .rtw-col {
    flex: 0 0 min(78vw, 300px);
  }

  .rtw-grid::-webkit-scrollbar {
    display: none;
  }

  .rtw-col {
    flex: 0 0 min(78vw, 300px);
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 0.0625rem;
    scroll-snap-align: start;
  }

  .rtw-grid--filtered {
    flex-wrap: wrap;
    overflow-x: visible;
    padding-bottom: 0;
  }

  .rtw-grid--filtered .rtw-col {
    flex: 0 1 calc(50% - 6px);
  }

  .collection-label__right {
    display: none;
  }

  .collection-aside {
    max-width: 100%;
  }

  .catalog-toolbar--full-page {
    align-items: stretch;
  }

  .catalog-full-search {
    align-items: stretch;
    flex-direction: column;
  }

  .catalog-full-search__field {
    max-width: none;
  }

  .collection--full-page .rtw-grid,
  .collection--full-page .rtw-grid--filtered {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
    overflow: visible;
    padding-bottom: 0;
  }

  .collection--full-page .rtw-col,
  .collection--full-page .rtw-grid--filtered .rtw-col {
    flex: initial;
    min-width: 0;
  }

  .rtw-card__image-box {
    aspect-ratio: 3 / 4.2;
    padding: 12px 8px 14px;
  }

  .rtw-img {
    inset: 12px 8px 14px;
    width: calc(100% - 16px);
    height: calc(100% - 26px);
  }

  .category-row {
    grid-template-columns: 28px minmax(0, 1fr) auto 32px;
    gap: 10px;
    padding: 16px 4px;
  }

  .category-count {
    display: none;
  }

  .collection-cta {
    align-items: flex-start;
    flex-direction: column;
  }

  .collection-cta .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .collection {
    padding-top: 48px;
  }

  .collection-head {
    gap: 18px;
  }

  .collection-aside {
    gap: 9px;
  }

  .rtw-card__name {
    font-size: 0.72rem;
  }

  .rtw-card__price {
    font-size: 0.7rem;
  }

  .rtw-card__footer {
    padding: 9px 9px 10px;
  }

  .rtw-grid--filtered .rtw-col {
    flex-basis: calc(50% - 7px);
  }

  .categories-section {
    margin-top: 42px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rtw-img,
  .rtw-quick-add,
  .category-row,
  .category-arrow {
    transition: none;
  }
}

/* Catalogue filters */
.catalog-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 20px;
  margin-bottom: 18px;
  scroll-margin-top: 104px;
}

.catalog-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.catalog-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border: 1px solid var(--line);
  border-radius: var(--pill);
  background: var(--surface);
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.catalog-chip span {
  color: var(--text-muted);
  font-size: 0.64rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.catalog-chip:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.catalog-chip--active {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--white);
}

.catalog-chip--active span {
  color: rgba(255, 255, 255, 0.72);
}

.catalog-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.catalog-select {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--pill);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-select select {
  height: 34px;
  padding: 0 22px 0 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0;
  text-transform: none;
  cursor: pointer;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - 9px) 14px, calc(100% - 4px) 14px;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
}

.catalog-select select:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}

.catalog-full-search {
  display: flex;
  flex: 1 1 100%;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.2rem;
}

.catalog-full-search__field {
  display: grid;
  flex: 1 1 auto;
  gap: 0.35rem;
  max-width: 34rem;
  color: var(--text-muted);
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-full-search__field input {
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: var(--btn-radius);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.82rem;
  letter-spacing: 0;
  text-transform: none;
}

.catalog-full-search__field input::placeholder {
  color: var(--text-muted);
}

.catalog-in-stock {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  color: var(--ink);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.catalog-in-stock input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
}

.collection--full-page {
  max-width: none;
  padding-top: clamp(1.75rem, 4vw, 3.5rem);
  background: var(--surface);
  color: var(--ink);
}

.collection-editorial {
  position: relative;
  width: min(100%, var(--max));
  height: clamp(17rem, 39vw, 36rem);
  margin: 0 auto clamp(3rem, 6vw, 5rem);
  overflow: hidden;
  border-radius: 0.85rem;
  background: var(--cream);
}

.collection-editorial img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.collection-editorial__caption {
  position: absolute;
  z-index: 2;
  right: clamp(1rem, 3vw, 2.5rem);
  bottom: clamp(1rem, 3vw, 2.5rem);
  left: clamp(1rem, 3vw, 2.5rem);
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  color: var(--ink);
  font-size: 0.68rem;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.collection-editorial__caption span {
  padding: 0.4rem 0.55rem;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
}

.collection--full-page .collection-head {
  max-width: var(--max);
  margin-inline: auto;
}

.collection--full-page .collection-label {
  justify-content: center;
}

.collection--full-page .collection-head__row {
  align-items: center;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}

.collection--full-page .collection-title {
  color: var(--ink);
  font-size: clamp(2rem, 4.2vw, 3.5rem);
  font-weight: 550;
  letter-spacing: -0.045em;
  line-height: 1;
}

.collection--full-page .collection-title__static {
  display: inline-block;
  margin-left: 0.12em;
  color: var(--ink);
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
}

.collection--full-page .collection-aside {
  justify-items: center;
  max-width: 40rem;
  text-align: center;
}

.collection--full-page .collection-label__index {
  color: var(--ink);
}

.collection--full-page .collection-label__rule {
  background: var(--line-strong);
}

.collection--full-page .collection-label__badge {
  background: var(--cream);
  color: var(--muted);
}

.collection--full-page .catalog-chip--active {
  border-color: var(--ink);
  background: var(--ink);
}

.collection--full-page .catalog-full-search input {
  accent-color: var(--ink);
}

.collection--full-page .rtw-grid-container {
  border: 0;
  background: transparent;
}

.collection--full-page .rtw-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.65rem, 1.35vw, 1.25rem);
  background: transparent;
}

.collection--full-page .rtw-grid--filtered {
  display: grid;
  flex-wrap: initial;
  justify-content: initial;
}

.collection--full-page .rtw-col {
  min-width: 0;
  border: 0.09375rem solid var(--line-strong);
  border-radius: 0.125rem;
  background: transparent;
  box-shadow: 0 0.125rem 0.25rem color-mix(in srgb, var(--ink) 12%, transparent);
}

.collection--full-page .rtw-card__image-box {
  background: transparent;
  transition: none;
}

.collection--full-page .rtw-img {
  inset: 0.375rem 0.625rem 1.125rem;
  width: calc(100% - 1.25rem);
  height: calc(100% - 1.5rem);
  object-position: center top;
  transition: none;
}

.collection--full-page .rtw-card__name,
.collection--full-page .rtw-card__price {
  transition: none;
}

.collection--full-page .rtw-col:hover .rtw-card__image-box,
.collection--full-page .rtw-col:focus-within .rtw-card__image-box,
.collection--full-page .rtw-col:active .rtw-card__image-box {
  background: transparent;
}

.collection--full-page .rtw-col:hover .rtw-img,
.collection--full-page .rtw-col:focus-within .rtw-img {
 transform: none;
}

.collection--full-page .rtw-col:hover .rtw-card__name,
.collection--full-page .rtw-col:focus-within .rtw-card__name {
  color: inherit;
  letter-spacing: inherit;
}

.collection--full-page .rtw-col:hover .rtw-card__price,
.collection--full-page .rtw-col:focus-within .rtw-card__price {
  color: inherit;
}

/* Product card flags & meta */
.rtw-flag {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 4px 8px;
  border-radius: var(--btn-radius);
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink);
  font-size: 0.54rem;
  font-weight: 750;
  letter-spacing: 0.1em;
  line-height: 1.4;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.rtw-flag--sale {
  background: var(--yellow);
  color: var(--ink);
}

.rtw-flag--out {
  background: rgba(11, 18, 32, 0.86);
  color: var(--white);
}

.rtw-quick-add:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.rtw-col:hover .rtw-quick-add:disabled {
  opacity: 0.6;
}

.rtw-card__text {
  min-width: 0;
}

.rtw-card__meta {
  margin-top: 3px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.62rem;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rtw-card__meta--low {
  color: var(--rust);
}

.rtw-card__prices {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.rtw-card__compare {
  color: var(--text-muted);
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
}

/* Categories as filter buttons */
.category-row {
  width: 100%;
  border-top: 0;
  border-right: 0;
  border-left: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.category-row--active {
  background: var(--sky);
}

.category-row--active .category-name {
  color: var(--primary);
}

.category-row--active .category-arrow {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--white);
}

@media (max-width: 900px) {
  .catalog-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .catalog-tools {
    width: 100%;
  }

  .catalog-select {
    flex: 1;
    justify-content: space-between;
  }

  .rtw-card__meta {
    font-size: 0.58rem;
  }
}

@media (max-width: 480px) {
  .catalog-chip {
    padding: 7px 11px;
    font-size: 0.66rem;
  }

  .catalog-select {
    padding-left: 10px;
  }

  .catalog-select span {
    display: none;
  }

  .rtw-card__compare {
    display: none;
  }
}

@media (max-width: 1080px) {
  .collection--full-page .rtw-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .collection--full-page .rtw-grid,
  .collection--full-page .rtw-grid--filtered {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
    overflow: visible;
    padding-bottom: 0;
  }

  .collection--full-page .rtw-col,
  .collection--full-page .rtw-grid--filtered .rtw-col {
    flex: initial;
    min-width: 0;
  }
}

.collection--full-page *,
.collection--full-page *::before,
.collection--full-page *::after {
  animation: none;
  scroll-behavior: auto;
  transition: none;
}

</style>
