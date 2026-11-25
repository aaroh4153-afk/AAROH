<script setup lang="ts">
import { animate, stagger } from 'animejs'
import {
  INSTAGRAM_URL,
  discountPercent,
  firstAvailableSize,
  stockLabel,
  stockState,
  type Product,
  type SizeName,
} from '~/data/products'
import { useCart } from '~/composables/useCart'
import { useCatalog } from '~/composables/useCatalog'
import { useStore } from '~/composables/useStore'
import { formatPrice } from '~/utils/format'

const route = useRoute()
const { products, categories } = useStore()
const { addItem } = useCart()
const { clearFilters, setCategory } = useCatalog()

const product = computed(() => products.value.find((item) => item.id === String(route.params.id)))

if (!product.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Piece not found',
    fatal: true,
  })
}

const piece = computed(() => product.value as Product)
const gallery = computed(() => piece.value.images)

/** Start on the first studio image, like the reference product gallery. */
function defaultImageIndex() {
  return 0
}

/** Start on the middle of the size run, then fall back to the first available. */
function defaultSize(): SizeName | '' {
  const middle = piece.value.sizes.find((entry) => entry.size === 'M' && entry.stock > 0)
  return middle?.size ?? firstAvailableSize(piece.value) ?? ''
}

const activeImage = ref(defaultImageIndex())
const selectedSize = ref<SizeName | ''>(defaultSize())
const added = ref('')
const saved = ref(false)
const showSizeGuide = ref(false)

function nextImage() {
  if (gallery.value.length < 2) return
  activeImage.value = (activeImage.value + 1) % gallery.value.length
}

function prevImage() {
  if (gallery.value.length < 2) return
  activeImage.value = (activeImage.value - 1 + gallery.value.length) % gallery.value.length
}

let touchStartX: number | null = null

function onGalleryTouchStart(event: TouchEvent) {
  touchStartX = event.changedTouches[0]?.clientX ?? null
}

function onGalleryTouchEnd(event: TouchEvent) {
  if (touchStartX === null) return
  const endX = event.changedTouches[0]?.clientX ?? touchStartX
  const delta = endX - touchStartX
  if (Math.abs(delta) > 42) {
    if (delta < 0) nextImage()
    else prevImage()
  }
  touchStartX = null
}

const category = computed(
  () => categories.value.find((entry) => entry.id === piece.value.category)?.name ?? 'Collection',
)

const saving = computed(() => discountPercent(piece.value))
const availability = computed(() => stockState(piece.value))

const selectedStock = computed(() => {
  if (!selectedSize.value) return 0
  return piece.value.sizes.find((entry) => entry.size === selectedSize.value)?.stock ?? 0
})

const composition = computed(() => {
  if (piece.value.category === 'shirts') {
    return 'Breathable poplin — 100% cotton, pre-washed for softness. Cut and finished by hand in small batches.'
  }
  if (piece.value.category === 'tees') {
    return 'Heavyweight jersey — 100% combed cotton with a dry, structured hand-feel. Cut and finished in small batches.'
  }
  if (piece.value.category === 'outerwear') {
    return 'Cotton twill shell with a soft brushed lining. Cut and finished by hand in small batches.'
  }
  return 'Heavyweight brushed fleece — 80% cotton, 20% recycled polyester. Cut and finished by hand in small batches.'
})

const care = computed(() => {
  const careDetail = piece.value.details.find((detail) => /wash|dry|care/i.test(detail))
  return careDetail ?? 'Cold wash, inside out, with like colours. Line dry in shade. Warm iron if needed.'
})

const related = computed(() => {
  const current = piece.value
  const sameCollection = products.value.filter(
    (item) =>
      item.status === 'active' &&
      item.id !== current.id &&
      item.collection === current.collection,
  )
  const others = products.value.filter(
    (item) =>
      item.status === 'active' &&
      item.id !== current.id &&
      item.collection !== current.collection,
  )
  return [...sameCollection, ...others].slice(0, 3)
})

let addedTimer: ReturnType<typeof setTimeout> | null = null
let relatedObserver: IntersectionObserver | null = null

useHead({
  bodyAttrs: { class: 'pdp-page' },
})

useSeoMeta({
  title: `${piece.value.name} — AAROH.`,
  description: `${piece.value.name} in ${piece.value.colour}. ${formatPrice(piece.value.price)}. ${piece.value.description}`,
  ogTitle: `${piece.value.name} — AAROH.`,
  ogDescription: `Shop the ${piece.value.name} in ${piece.value.colour} from AAROH.`,
  ogImage: piece.value.images[0],
})

function addToBag() {
  if (!selectedSize.value || selectedStock.value === 0) return

  addItem(piece.value, selectedSize.value, 1)

  added.value = `Added · ${selectedSize.value}`
  if (addedTimer) clearTimeout(addedTimer)
  addedTimer = setTimeout(() => {
    added.value = ''
  }, 2400)
}

async function shopCategory() {
  clearFilters()
  setCategory(piece.value.category)
  await navigateTo('/#ready-to-wear')
}

function imageLabel(index: number): string {
  if (index === 0) return 'Front view'
  if (index === 1) return 'Alternate view'
  return 'Campaign view'
}

watch(
  () => route.params.id,
  () => {
    activeImage.value = defaultImageIndex()
    selectedSize.value = defaultSize()
    added.value = ''
    saved.value = false
    showSizeGuide.value = false
    if (import.meta.client) window.scrollTo(0, 0)
  },
)

onMounted(() => {
  window.scrollTo(0, 0)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  animate('.pdp__title-word', {
    y: ['110%', '0%'],
    opacity: [0, 1],
    duration: 820,
    delay: stagger(55, { start: 80 }),
    ease: 'out(4)',
  })

  animate('.pdp__main img', {
    scale: [1.04, 1],
    duration: 1100,
    ease: 'out(3)',
  })

  animate('.pdp__reveal', {
    y: [16, 0],
    opacity: [0, 1],
    duration: 680,
    delay: stagger(55, { start: 160 }),
    ease: 'out(3)',
  })

  const relatedCards = document.querySelectorAll<HTMLElement>('.pdp__related-card')
  if (relatedCards.length && 'IntersectionObserver' in window) {
    relatedObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('pdp__related-card--visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.15 })

    relatedCards.forEach((card) => {
      card.classList.add('pdp__related-card--pending')
      relatedObserver?.observe(card)
    })
  }
})

onBeforeUnmount(() => {
  if (addedTimer) clearTimeout(addedTimer)
  relatedObserver?.disconnect()
})
</script>

<template>
  <article v-if="piece" class="pdp">
    <div class="pdp__shell">
      <nav class="pdp__crumbs" aria-label="Breadcrumb">
        <NuxtLink to="/">Home</NuxtLink>
        <span aria-hidden="true">/</span>
        <button type="button" class="pdp__crumb-link" @click="shopCategory">{{ category }}</button>
        <span aria-hidden="true">/</span>
        <span class="pdp__crumbs-current">{{ piece.name }}</span>
      </nav>

      <div class="pdp__layout">
        <aside class="pdp__info">
          <h1 class="pdp__title">
            <span
              v-for="(word, index) in piece.name.split(' ')"
              :key="`${word}-${index}`"
              class="pdp__title-word"
            >{{ word }}&nbsp;</span>
          </h1>

          <div class="pdp__intro pdp__reveal">
            <span class="pdp__label">Product info</span>
            <p class="pdp__lede">{{ piece.description }}</p>
          </div>

          <div class="pdp__accordion pdp__reveal">
            <details>
              <summary>Style</summary>
              <ul>
                <li v-for="detail in piece.details" :key="detail">{{ detail }}</li>
              </ul>
            </details>

            <details>
              <summary>Composition</summary>
              <p>{{ composition }}</p>
            </details>

            <details>
              <summary>Care</summary>
              <p>{{ care }}</p>
            </details>
          </div>

          <p class="pdp__legal pdp__reveal">All contents of this website are the property of AAROH.</p>
        </aside>

        <div class="pdp__media">
          <figure
            class="pdp__main"
            :class="{ 'pdp__main--campaign': activeImage > 1 }"
            :style="{ '--tint': piece.hex }"
            @touchstart.passive="onGalleryTouchStart"
            @touchend.passive="onGalleryTouchEnd"
          >
            <div class="pdp__track" :style="{ transform: `translateX(-${activeImage * 100}%)` }">
              <img
                v-for="(image, index) in gallery"
                :key="`${image}-${index}`"
                :src="image"
                :alt="`${piece.name} — ${imageLabel(index)}`"
                :loading="index === 0 ? 'eager' : 'lazy'"
                decoding="async"
                draggable="false"
              />
            </div>
          </figure>

          <div v-if="gallery.length > 1" class="pdp__gallery-nav" aria-label="Product image navigation">
            <button type="button" aria-label="Previous image" @click="prevImage">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <span>{{ activeImage + 1 }} / {{ gallery.length }}</span>
            <button type="button" aria-label="Next image" @click="nextImage">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <aside class="pdp__buy">
          <div
            class="pdp__thumbs"
            :style="{ '--thumb-cols': Math.min(gallery.length, 3) }"
            role="group"
            aria-label="Product images"
          >
            <button
              v-for="(image, index) in gallery"
              :key="image"
              type="button"
              :class="{ 'pdp__thumb--active': activeImage === index }"
              :aria-label="imageLabel(index)"
              :aria-pressed="activeImage === index"
              @click="activeImage = index"
            >
              <img :src="image" :alt="imageLabel(index)" />
            </button>
          </div>

          <div class="pdp__field pdp__field--size pdp__reveal">
            <div class="pdp__field-head">
              <label for="pdp-size">Choose size</label>
              <button
                class="pdp__guide"
                type="button"
                :aria-expanded="showSizeGuide"
                @click="showSizeGuide = !showSizeGuide"
              >
                {{ showSizeGuide ? 'Hide size guide' : 'Size guide' }}
              </button>
            </div>

            <div class="pdp__select">
              <select id="pdp-size" v-model="selectedSize" aria-label="Choose a size">
                <option v-if="!selectedSize" value="" disabled>Select a size</option>
                <option
                  v-for="size in piece.sizes"
                  :key="size.size"
                  :value="size.size"
                  :disabled="size.stock === 0"
                >
                  {{ size.size }}{{ size.stock === 0 ? ' — Sold out' : '' }}
                </option>
              </select>
              <svg class="pdp__select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <div v-if="showSizeGuide" class="pdp__size-guide">
              <table>
                <thead>
                  <tr><th>Size</th><th>Chest (in)</th><th>Length (in)</th></tr>
                </thead>
                <tbody>
                  <tr><td>XS</td><td>38</td><td>26</td></tr>
                  <tr><td>S</td><td>40</td><td>27</td></tr>
                  <tr><td>M</td><td>42</td><td>28</td></tr>
                  <tr><td>L</td><td>44</td><td>29</td></tr>
                  <tr><td>XL</td><td>46</td><td>30</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="pdp__field pdp__field--colour pdp__reveal">
            <span id="pdp-colour-label" class="pdp__field-label">Selected colour</span>
            <div class="pdp__select pdp__select--static" role="group" aria-labelledby="pdp-colour-label">
              <i class="pdp__colour-dot" :style="{ background: piece.hex }" aria-hidden="true" />
              <span>{{ piece.colour }}</span>
              <svg class="pdp__select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div class="pdp__price-row pdp__reveal">
            <span class="pdp__price">{{ formatPrice(piece.price) }}</span>
            <s v-if="piece.compareAtPrice" class="pdp__compare">{{ formatPrice(piece.compareAtPrice) }}</s>
            <span v-if="saving" class="pdp__save">Save {{ saving }}%</span>
          </div>

          <div class="pdp__actions pdp__reveal">
            <button
              class="pdp__bag"
              type="button"
              :disabled="availability === 'out' || !selectedSize"
              @click="addToBag"
            >
              {{ added || (availability === 'out' ? 'Sold out' : 'Buy Now') }}
            </button>
          </div>

          <div class="pdp__payment pdp__reveal">
            <span class="pdp__upi" role="img" aria-label="UPI accepted">
              <span class="pdp__upi-mark" aria-hidden="true">
                <b>U</b><b>P</b><b>I</b>
              </span>
              <span class="pdp__upi-copy">UPI accepted</span>
            </span>

            <button
              class="pdp__wish"
              type="button"
              :aria-pressed="saved"
              :aria-label="saved ? 'Saved to your pieces' : 'Save this piece'"
              @click="saved = !saved"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                :fill="saved ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.7"
                aria-hidden="true"
              >
                <path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7 3.7C19 15.6 12 20 12 20Z" />
              </svg>
            </button>
          </div>

          <a class="pdp__enquire pdp__reveal" :href="INSTAGRAM_URL" target="_blank" rel="noopener">
            Enquire on Instagram
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </aside>
      </div>
    </div>

    <section class="pdp__related" aria-label="Related pieces">
      <header class="pdp__related-head">
        <NuxtLink to="/#ready-to-wear" class="pdp__related-link" @click="clearFilters()">
          See the full rail
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </NuxtLink>
      </header>

      <div class="pdp__related-grid">
        <NuxtLink
          v-for="item in related"
          :key="item.id"
          :to="`/product/${item.id}`"
          class="pdp__related-card"
          :style="{ '--tint': item.hex }"
        >
          <span class="pdp__related-image">
            <img :src="item.images[0]" :alt="item.name" class="pdp__related-image-front" loading="lazy" />
            <img
              v-if="item.images[1]"
              :src="item.images[1]"
              :alt="`${item.name} — alternate view`"
              class="pdp__related-image-alt"
              loading="lazy"
            />
            <span v-if="item.compareAtPrice" class="pdp__related-flag">−{{ discountPercent(item) }}%</span>
          </span>
          <span class="pdp__related-row">
            <strong>{{ item.name }}</strong>
            <span>{{ formatPrice(item.price) }}</span>
          </span>
          <span class="pdp__related-colour">{{ item.colour }} · {{ stockLabel(item) }}</span>
        </NuxtLink>
      </div>
    </section>
  </article>
</template>

<style scoped>
.pdp {
  width: 100%;
  padding: clamp(12px, 1.8vw, 24px) 0 clamp(48px, 6vw, 84px);
  background: #fff;
}

.pdp__shell {
  width: 100%;
  max-width: var(--max);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

.pdp__crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  padding: 0 2px 14px;
  color: var(--text-muted);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.pdp__crumbs a {
  color: var(--text-secondary);
  text-decoration: none;
}

.pdp__crumb-link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-secondary);
  font: inherit;
  cursor: pointer;
}

.pdp__crumb-link:hover {
  color: var(--primary);
}

.pdp__crumbs-current {
  color: var(--ink);
}

/* The card owns the padding; all three columns start on the same top line. */
.pdp__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.55fr) minmax(0, 0.86fr);
  gap: clamp(18px, 2.2vw, 34px);
  min-height: clamp(560px, 68vh, 700px);
  padding: clamp(18px, 2vw, 30px);
  overflow: hidden;
  border: 1px solid rgba(11, 18, 32, 0.09);
  border-radius: 14px;
  background: var(--surface);
}

/* Info column */
.pdp__info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding-top: 2px;
}

.pdp__title {
  display: flex;
  flex-wrap: wrap;
  max-width: 8.7em;
  color: var(--ink);
  font-family: var(--font-outfit);
  font-size: clamp(2.1rem, 3.2vw, 3.2rem);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 0.98;
  text-transform: uppercase;
}

.pdp__title-word {
  display: inline-block;
}

.pdp__intro {
  margin-top: clamp(18px, 2vw, 26px);
}

.pdp__label {
  display: block;
  color: var(--ink);
  font-family: var(--font-outfit);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.pdp__lede {
  max-width: 40ch;
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.66;
}

.pdp__accordion {
  margin-top: clamp(18px, 2vw, 26px);
  border-top: 1px solid rgba(11, 18, 32, 0.14);
}

.pdp__accordion details {
  border-bottom: 1px solid rgba(11, 18, 32, 0.14);
}

.pdp__accordion summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  color: var(--ink);
  font-family: var(--font-outfit);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  list-style: none;
  text-transform: uppercase;
  cursor: pointer;
}

.pdp__accordion summary::-webkit-details-marker {
  display: none;
}

.pdp__accordion summary::after {
  content: '+';
  color: var(--ink);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1;
}

.pdp__accordion details[open] summary::after {
  content: '−';
}

.pdp__accordion p,
.pdp__accordion ul {
  padding: 0 0 16px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.74rem;
  line-height: 1.65;
}

.pdp__accordion ul {
  display: grid;
  gap: 6px;
  padding-left: 0;
  list-style: none;
}

.pdp__accordion li {
  position: relative;
  padding-left: 14px;
}

.pdp__accordion li::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
}

.pdp__legal {
  max-width: 30ch;
  margin-top: auto;
  padding-top: 28px;
  color: var(--text-muted);
  font-size: 0.56rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

/* Media column */
.pdp__media {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.pdp__main {
  position: relative;
  width: 100%;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  margin: 0;
  border: 1px solid rgba(11, 18, 32, 0.14);
  border-radius: 10px;
  background:
    radial-gradient(90% 70% at 50% 20%, #fff, transparent 72%),
    linear-gradient(180deg, #fafafa 0%, color-mix(in srgb, var(--tint) 10%, #f1f2f4) 100%);
}

.pdp__track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.55s var(--ease);
  will-change: transform;
}

.pdp__track img {
  width: 100%;
  height: 100%;
  flex: 0 0 100%;
  padding: 5%;
  object-fit: contain;
  object-position: 50% 50%;
  user-select: none;
}

/* The campaign shot already carries its own warm-grey studio sweep. */
.pdp__main--campaign {
  background: #dfdcdf;
}

.pdp__main--campaign .pdp__track img {
  padding: 0;
  object-position: 50% 50%;
}

.pdp__gallery-nav {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 1.1rem;
  min-height: 26px;
}

.pdp__gallery-nav button {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
}

.pdp__gallery-nav button:hover {
  color: var(--primary);
  transform: scale(1.08);
}

.pdp__gallery-nav button:focus-visible {
  outline: 1px solid var(--ink);
  outline-offset: 2px;
}

.pdp__gallery-nav span {
  color: var(--ink);
  font-family: var(--font-outfit);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
}

/* Buy column */
.pdp__buy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: clamp(14px, 1.5vw, 20px);
  padding-top: 1px;
}

.pdp__thumbs {
  display: grid;
  grid-template-columns: repeat(var(--thumb-cols, 3), minmax(0, 1fr));
  gap: 8px;
}

.pdp__thumbs button {
  aspect-ratio: 1 / 1.08;
  padding: 4px;
  overflow: hidden;
  border: 1px solid rgba(11, 18, 32, 0.12);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.pdp__thumbs button:hover {
  border-color: rgba(11, 18, 32, 0.4);
}

.pdp__thumb--active {
  border-color: var(--ink) !important;
}

.pdp__thumbs img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pdp__field {
  margin: 0;
}

.pdp__field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
}

.pdp__field-head > label,
.pdp__field-label {
  display: block;
  margin-bottom: 7px;
  color: var(--ink);
  font-family: var(--font-outfit);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.pdp__field-head > label {
  margin-bottom: 0;
}

.pdp__guide {
  padding: 0 0 1px;
  border: none;
  border-bottom: 1px solid currentColor;
  background: none;
  color: var(--text-muted);
  font-size: 0.56rem;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.pdp__select {
  position: relative;
  display: flex;
  height: 44px;
  align-items: center;
  border: 1px solid rgba(11, 18, 32, 0.2);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  transition: border-color 0.2s ease;
}

.pdp__select:focus-within {
  border-color: var(--ink);
}

.pdp__select select {
  width: 100%;
  height: 100%;
  padding: 0 36px 0 12px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.pdp__select-chevron {
  position: absolute;
  right: 12px;
  flex: none;
  color: var(--text-secondary);
  pointer-events: none;
}

.pdp__select--static {
  gap: 8px;
  padding: 0 12px;
  font-size: 0.78rem;
  font-weight: 600;
}

.pdp__select--static .pdp__select-chevron {
  position: static;
  margin-left: auto;
}

.pdp__colour-dot {
  width: 13px;
  height: 13px;
  flex: none;
  border: 1px solid rgba(11, 18, 32, 0.24);
  border-radius: 50%;
}

.pdp__size-guide {
  margin-top: 8px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.pdp__size-guide table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.62rem;
  text-align: left;
}

.pdp__size-guide th,
.pdp__size-guide td {
  padding: 6px 9px;
  border-bottom: 1px solid var(--line);
  color: var(--text-secondary);
  font-weight: 500;
}

.pdp__size-guide th {
  background: var(--bg-subtle);
  color: var(--ink);
  font-weight: 650;
}

.pdp__size-guide tr:last-child td {
  border-bottom: 0;
}

.pdp__price-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
}

.pdp__price {
  color: var(--ink);
  font-family: var(--font-outfit);
  font-size: clamp(2.1rem, 2.6vw, 2.8rem);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
}

.pdp__compare {
  color: var(--text-muted);
  font-size: 0.86rem;
  font-variant-numeric: tabular-nums;
}

.pdp__save {
  padding: 3px 7px;
  border-radius: var(--btn-radius);
  background: var(--sky);
  color: var(--primary);
  font-size: 0.58rem;
  font-weight: 750;
  letter-spacing: 0.04em;
}

.pdp__actions {
  display: flex;
  margin-top: 2px;
}

.pdp__bag {
  display: inline-flex;
  width: 100%;
  height: 50px;
  align-items: center;
  justify-content: center;
  padding-inline: 20px;
  border: 1px solid var(--blue);
  border-radius: var(--pill);
  background: var(--blue);
  box-shadow: var(--shadow-blue);
  color: var(--white);
  font-family: var(--font);
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.03em;
  cursor: pointer;
}

.pdp__bag:disabled {
  border-color: #c8cedb;
  background: #c8cedb;
  box-shadow: none;
  cursor: not-allowed;
}

.pdp__payment {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pdp__upi {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.pdp__upi-mark {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--white);
  box-shadow: 0 1px 2px rgba(11, 18, 32, 0.16);
  font-family: var(--font);
  font-size: 0.6rem;
  font-weight: 850;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.pdp__upi-mark b:nth-child(1) {
  color: var(--upi-orange);
}

.pdp__upi-mark b:nth-child(2) {
  color: var(--upi-green);
}

.pdp__upi-mark b:nth-child(3) {
  color: var(--upi-blue);
}

.pdp__upi-copy {
  color: var(--text-secondary);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.pdp__wish {
  display: grid;
  width: 40px;
  height: 40px;
  flex: none;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(11, 18, 32, 0.24);
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
}

.pdp__wish[aria-pressed='true'] {
  border-color: var(--primary);
  color: var(--primary);
}

.pdp__enquire {
  display: inline-flex;
  align-items: center;
  align-self: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.64rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.pdp__enquire:hover {
  color: var(--blue);
}

/* Related */
.pdp__related {
  width: 100%;
  max-width: var(--max);
  margin-inline: auto;
  padding: clamp(40px, 5vw, 70px) var(--gutter) 0;
}

.pdp__related-head {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 24px;
  margin-bottom: clamp(20px, 2.6vw, 30px);
}

.pdp__related-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding-bottom: 3px;
  border-bottom: 1px solid currentColor;
  color: var(--ink);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.pdp__related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(10px, 1.6vw, 20px);
}

.pdp__related-card {
  display: block;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  color: var(--ink);
  text-decoration: none;
  transition: border-color 0.25s ease, opacity 0.55s ease, transform 0.55s var(--ease);
}

.pdp__related-card--pending {
  opacity: 0;
  transform: translateY(18px);
}

.pdp__related-card--visible {
  opacity: 1;
  transform: translateY(0);
}

.pdp__related-image {
  position: relative;
  display: grid;
  aspect-ratio: 4 / 4.6;
  place-items: center;
  overflow: hidden;
  padding: 18px;
  background:
    radial-gradient(90% 64% at 50% 18%, #fff, transparent 72%),
    linear-gradient(180deg, #fff, color-mix(in srgb, var(--tint) 24%, #f6f5f2));
}

.pdp__related-image img {
  position: absolute;
  inset: 4% 8%;
  width: 84%;
  height: 92%;
  object-fit: contain;
  transition: opacity 0.4s var(--ease), transform 0.5s var(--ease);
}

.pdp__related-image-alt {
  opacity: 0;
  transform: scale(0.975);
}

@media (hover: hover) and (pointer: fine) {
  .pdp__related-card:hover {
    border-color: var(--primary);
  }

  .pdp__related-card:hover .pdp__related-image-front {
    opacity: 0;
    transform: scale(0.975);
  }

  .pdp__related-card:hover .pdp__related-image-alt {
    opacity: 1;
    transform: scale(1);
  }
}

.pdp__related-flag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 7px;
  border-radius: 4px;
  background: var(--yellow);
  color: var(--ink);
  font-size: 0.55rem;
  font-weight: 750;
  letter-spacing: 0.06em;
}

.pdp__related-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-inline: 10px;
}

.pdp__related-row strong {
  overflow: hidden;
  font-size: 0.84rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pdp__related-row span {
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.pdp__related-colour {
  display: block;
  margin-top: 2px;
  padding: 0 10px 10px;
  color: var(--text-muted);
  font-size: 0.66rem;
}

/* Tablet: hero across the top, then copy and purchase controls side by side. */
@media (max-width: 1180px) {
  .pdp__layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    min-height: 0;
  }

  .pdp__media {
    grid-column: 1 / -1;
    grid-row: 1;
    min-height: clamp(420px, 56vw, 620px);
  }

  .pdp__info {
    grid-column: 1;
    grid-row: 2;
  }

  .pdp__buy {
    grid-column: 2;
    grid-row: 2;
  }

  .pdp__info .pdp__legal {
    margin-top: 28px;
    padding-top: 0;
  }
}

/* Single column */
@media (max-width: 820px) {
  .pdp__layout {
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(22px, 4vw, 30px);
  }

  .pdp__media {
    grid-column: 1;
    grid-row: 1;
    min-height: clamp(360px, 74vw, 520px);
  }

  .pdp__info {
    grid-column: 1;
    grid-row: 2;
  }

  .pdp__buy {
    grid-column: 1;
    grid-row: 3;
  }

  .pdp__title {
    max-width: 10em;
  }

}

@media (max-width: 620px) {
  .pdp {
    padding-top: 12px;
  }

  .pdp__crumbs {
    font-size: 0.56rem;
  }

  .pdp__layout {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    min-height: 0;
    width: calc(100% + var(--gutter) + var(--gutter));
    margin-inline: calc(0px - var(--gutter));
    padding: 16px;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .pdp__related-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .pdp__related-grid {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .pdp__related-grid::-webkit-scrollbar {
    display: none;
  }

  .pdp__related-card {
    flex: 0 0 min(72vw, 260px);
    scroll-snap-align: start;
  }

  .pdp__info,
  .pdp__buy {
    display: contents;
  }

  .pdp__media {
    grid-column: 1 / -1;
    grid-row: 1;
    height: auto;
    min-height: 250px;
    max-height: 330px;
    aspect-ratio: 4 / 3;
  }

  .pdp__main {
    min-height: 0;
  }

  .pdp__thumbs {
    grid-column: 1 / -1;
    grid-row: 2;
    grid-template-columns: repeat(var(--thumb-cols, 3), 54px);
    gap: 7px;
  }

  .pdp__thumbs button {
    aspect-ratio: 1;
  }

  .pdp__title {
    grid-column: 1 / -1;
    grid-row: 3;
    max-width: none;
    font-size: clamp(1.35rem, 5vw, 1.8rem);
  }

  .pdp__intro {
    grid-column: 1 / -1;
    grid-row: 4;
    margin-top: 0;
  }

  .pdp__price-row {
    grid-column: 1 / -1;
    grid-row: 5;
    margin-top: 0;
  }

  .pdp__price {
    font-size: clamp(1.8rem, 7vw, 2.2rem);
  }

  .pdp__field--size {
    grid-column: 1 / -1;
    grid-row: 6;
  }

  .pdp__field--colour {
    display: grid;
    grid-column: 1 / -1;
    grid-row: 7;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
    align-items: center;
    gap: 10px;
  }

  .pdp__field--colour .pdp__field-label {
    margin: 0;
  }

  .pdp__field--colour .pdp__select--static {
    min-width: 0;
  }

  .pdp__actions {
    grid-column: 1 / -1;
    grid-row: 8;
  }

  .pdp__payment {
    grid-column: 1 / -1;
    grid-row: 9;
  }

  .pdp__enquire {
    grid-column: 1 / -1;
    grid-row: 10;
  }

  .pdp__accordion {
    grid-column: 1 / -1;
    grid-row: 11;
    margin-top: 8px;
  }

  .pdp__legal {
    grid-column: 1 / -1;
    grid-row: 12;
    margin-top: 0;
    padding-top: 0;
  }

  .pdp__size-guide table {
    font-size: 0.6rem;
  }
}
</style>
