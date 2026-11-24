<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { INSTAGRAM_URL, stockLabel } from '../data/products'
import { useCart } from '../composables/useCart'
import { useCatalog } from '../composables/useCatalog'
import { useFirebaseAuth } from '../composables/useFirebaseAuth'
import { useMotion } from '../composables/useMotion'
import { useStore } from '../composables/useStore'
import { formatPrice, initials } from '../utils/format'

const { count, toggleCart } = useCart()
const { featuredProducts } = useStore()
const { user: accountUser, profile: accountProfile } = useFirebaseAuth()
const route = useRoute()
const { query, isSearchOpen, filteredProducts, isFiltering, toggleSearch, closeSearch } = useCatalog()

const headerRef = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const scrolled = ref(false)
const progress = ref(0)
const menuOpen = ref(false)

const { load, prefersReducedMotion } = useMotion()

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop all', href: '/shop' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Our story', href: '/story' },
]

const accountLabel = computed(
  () => accountUser.value?.displayName?.trim() || accountUser.value?.email || 'My profile',
)
const accountInitials = computed(() => initials(accountLabel.value) || 'AA')
const accountPhotoUrl = computed(
  () => accountUser.value?.photoURL?.trim() || accountProfile.value?.photoUrl?.trim() || '',
)
const accountPhotoFailed = ref(false)
const accountContact = computed(
  () =>
    accountUser.value?.email ??
    (accountUser.value ? 'AAROH. member' : 'Sign in or create an account'),
)

watch(accountPhotoUrl, () => {
  accountPhotoFailed.value = false
})

const wordmarkLetters = ['A', 'A', 'R', 'O', 'H', '.']

const searchTags = ['Royal Blue', 'Cobalt', 'Indigo', 'Midnight', 'Azure']

let cleanupMotion: (() => void) | null = null
let scrollFrame = 0
let desktopQuery: MediaQueryList | null = null

function onScroll() {
  if (scrollFrame) return
  scrollFrame = requestAnimationFrame(() => {
    const y = window.scrollY
    const max = document.documentElement.scrollHeight - window.innerHeight

    scrolled.value = y > 12
    progress.value = max > 0 ? Math.min(1, y / max) : 0
    scrollFrame = 0
  })
}

async function submitSearch() {
  closeSearch()
  menuOpen.value = false
  await navigateTo('/shop')
}

function applyTag(tag: string) {
  query.value = tag
  searchInput.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  closeSearch()
  menuOpen.value = false
}

function closeMenu() {
  menuOpen.value = false
}

function onDesktopChange(event: MediaQueryListEvent) {
  if (event.matches) menuOpen.value = false
}

function syncScrollLock() {
  if (!import.meta.client) return
  document.body.style.overflow = isSearchOpen.value || menuOpen.value ? 'hidden' : ''
}

watch(isSearchOpen, async (open) => {
  if (open) menuOpen.value = false
  syncScrollLock()
  if (!open) return
  await nextTick()
  searchInput.value?.focus()
})

watch(menuOpen, (open) => {
  if (open) closeSearch()
  syncScrollLock()
})

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  desktopQuery = window.matchMedia('(min-width: 901px)')
  desktopQuery.addEventListener('change', onDesktopChange)
  onScroll()

  const header = headerRef.value
  if (route.path === '/story' || route.path === '/shop' || prefersReducedMotion() || !header) return

  const { gsap } = await load()
  const ctx = gsap.context(() => {
    gsap.from('.nav-reveal', {
      y: -10,
      duration: 0.6,
      stagger: 0.05,
      ease: 'power2.out',
      delay: 0.15,
      clearProps: 'transform',
    })
  }, header)

  cleanupMotion = () => ctx.revert()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  desktopQuery?.removeEventListener('change', onDesktopChange)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  document.body.style.overflow = ''
  cleanupMotion?.()
})
</script>

<template>
  <header
    ref="headerRef"
    class="site-header"
    :class="{
      'site-header--scrolled': scrolled,
      'site-header--static-page': route.path === '/story' || route.path === '/shop',
    }"
  >
    <div class="nav-shell">
      <!-- Left side: On desktop shows Logo, on mobile shows Menu + Search buttons -->
      <div class="nav-left nav-reveal">
        <!-- Desktop Logo -->
        <NuxtLink to="/" class="wordmark wordmark--desktop" aria-label="AAROH. home">
          <span class="wordmark__text">AAROH<span class="wordmark__dot">.</span></span>
        </NuxtLink>

        <!-- Mobile controls: Menu + Search -->
        <div class="mobile-nav-group">
          <button
            class="menu-btn"
            type="button"
            :class="{ 'menu-btn--open': menuOpen }"
            :aria-expanded="menuOpen"
            aria-controls="mobile-menu"
            :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
            @click="menuOpen = !menuOpen"
          >
            <span class="menu-btn__lines" aria-hidden="true"><i /><i /></span>
          </button>

          <button
            class="icon-btn mobile-search-btn"
            type="button"
            :aria-expanded="isSearchOpen"
            aria-controls="collection-search"
            aria-label="Search the collection"
            @click="toggleSearch"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.8-3.8" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Center: On desktop shows Nav Links, on mobile shows centered Wordmark -->
      <div class="nav-center nav-reveal">
        <nav class="desktop-nav-links" aria-label="Primary Navigation">
          <NuxtLink v-for="link in navLinks" :key="link.href" :to="link.href" class="desktop-nav-link">
            {{ link.label }}
          </NuxtLink>
        </nav>

        <NuxtLink to="/" class="wordmark wordmark--mobile" aria-label="AAROH. home">
          <span class="wordmark__text">AAROH<span class="wordmark__dot">.</span></span>
        </NuxtLink>
      </div>

      <!-- Right side: Search (desktop) + Account + Cart -->
      <div class="nav-right nav-reveal">
        <!-- Desktop search trigger -->
        <button
          class="desktop-search-trigger"
          type="button"
          :aria-expanded="isSearchOpen"
          aria-controls="collection-search"
          aria-label="Search the collection"
          @click="toggleSearch"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <span class="desktop-search-text">Search</span>
        </button>

        <!-- Account button -->
        <NuxtLink
          class="account-btn"
          :class="{ 'account-btn--signed-in': Boolean(accountUser) }"
          to="/account"
          :aria-label="accountUser ? `Account for ${accountUser.displayName || accountUser.email}` : 'Sign in or create an account'"
        >
          <span class="account-btn__avatar" aria-hidden="true">
            <img
              v-if="accountPhotoUrl && !accountPhotoFailed"
              :src="accountPhotoUrl"
              alt=""
              referrerpolicy="no-referrer"
              @error="accountPhotoFailed = true"
            />
            <span v-else-if="accountUser" class="account-btn__initials">{{ accountInitials }}</span>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </span>
        </NuxtLink>

        <!-- Solid Black Cart Block -->
        <button
          class="cart-btn"
          type="button"
          :aria-label="`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`"
          @click="toggleCart"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span class="cart-count" :class="{ 'cart-count--empty': count === 0 }">{{ count }}</span>
        </button>
      </div>

      <div class="scroll-progress" aria-hidden="true">
        <span :style="{ transform: `scaleX(${progress})` }" />
      </div>
    </div>

    <!-- Search Modal with border-radius: 2px -->
    <Teleport to="body">
      <Transition name="search-fade">
        <div
          v-if="isSearchOpen"
          id="collection-search"
          class="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Search the collection"
          @click.self="closeSearch"
        >
          <div class="search-modal-card">
            <!-- Search Input Header -->
            <div class="search-modal-header">
              <div class="search-modal-input-wrap">
                <svg class="search-modal-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.8-3.8" />
                </svg>
                <input
                  ref="searchInput"
                  v-model="query"
                  type="search"
                  placeholder="Search"
                  aria-label="Search products"
                  autocomplete="off"
                  class="search-modal-input"
                />
              </div>

              <button class="search-modal-close" type="button" aria-label="Close search" @click="closeSearch">
                ✕
              </button>
            </div>

            <!-- Search Results Content: Responsive Grid with border-radius 2px -->
            <div class="search-modal-body">
              <h3 class="search-modal-label">Products</h3>

              <div class="search-cards-grid">
                <NuxtLink
                  v-for="product in (filteredProducts.length ? filteredProducts.slice(0, 8) : featuredProducts.slice(0, 4))"
                  :key="product.id"
                  :to="`/product/${product.id}`"
                  class="search-card"
                  @click="closeSearch"
                >
                  <div class="search-card__thumb">
                    <img :src="product.images[0]" :alt="product.name" />
                  </div>
                  <h4 class="search-card__title">{{ product.name }}</h4>
                  <div class="search-card__prices">
                    <span class="search-card__orig">{{ formatPrice(Math.round(product.price * 1.35)) }}</span>
                    <span class="search-card__price">{{ formatPrice(product.price) }}</span>
                  </div>
                </NuxtLink>
              </div>

              <div v-if="isFiltering && !filteredProducts.length" class="search-modal-empty">
                <p>No products found for “{{ query }}”.</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="menu-overlay">
        <div v-if="menuOpen" class="menu-backdrop">
          <button class="menu-scrim" type="button" aria-label="Close menu" @click="closeMenu" />
          <aside id="mobile-menu" class="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
            <button class="mobile-menu__close" type="button" aria-label="Close menu" @click="closeMenu">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1">
                <path d="m5 5 22 22M27 5 5 27" />
              </svg>
            </button>
            <span class="mobile-menu__eyebrow">Menu</span>
            <nav aria-label="Primary">
              <NuxtLink v-for="link in navLinks" :key="link.href" :to="link.href" @click="closeMenu">
                <span>{{ link.label }}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </NuxtLink>
            </nav>

            <NuxtLink class="mobile-menu__profile" to="/account" @click="closeMenu">
              <span class="mobile-menu__profile-avatar" aria-hidden="true">
                <img
                  v-if="accountUser?.photoURL"
                  :src="accountUser.photoURL"
                  alt=""
                  referrerpolicy="no-referrer"
                />
                <span v-else-if="accountUser">{{ accountInitials }}</span>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
              </span>
              <span class="mobile-menu__profile-copy">
                <strong>{{ accountUser ? accountLabel : 'Your profile' }}</strong>
                <small>{{ accountContact }}</small>
              </span>
              <svg class="mobile-menu__profile-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </NuxtLink>

            <a class="btn btn--dark mobile-menu__cta" :href="INSTAGRAM_URL" target="_blank" rel="noopener">
              Get Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
            <p class="mobile-menu__handle">Everyday essentials · @_aaroh.in</p>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
  background: transparent;
}

.nav-shell {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 2rem);
  width: 100%;
  max-width: none;
  margin-inline: auto;
  padding: 0.55rem clamp(1.25rem, 3vw, 3.5rem);
  border-bottom: 1px solid transparent;
  background: transparent;
  transition: background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}

.site-header--scrolled .nav-shell {
  border-bottom-color: color-mix(in srgb, var(--ink) 10%, transparent);
  background: color-mix(in srgb, var(--lime-strong) 38%, var(--cream));
  box-shadow: 0 0.6rem 1.5rem -1.2rem color-mix(in srgb, var(--ink) 48%, transparent);
}

.site-header--static-page .scroll-progress {
  display: none;
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.4vw, 1.25rem);
}

.nav-left {
  justify-self: start;
}

.nav-right {
  justify-self: end;
}

.wordmark {
  display: inline-flex;
  align-items: baseline;
  justify-self: center;
  padding-inline: 8px;
  color: var(--primary);
  font-family: var(--font-logo);
  font-size: clamp(1.45rem, 2.2vw, 1.85rem);
  font-stretch: 118%;
  font-weight: 750;
  line-height: 1;
  letter-spacing: 0.07em;
  text-decoration: none;
  white-space: nowrap;
}

.wordmark__letter {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
}

.wordmark__letter > span {
  display: inline-block;
  transition: transform 0.4s var(--ease);
}

.wordmark__dot > span {
  color: transparent;
}

.wordmark__dot > span::after {
  content: '';
  display: block;
  width: 0.17em;
  height: 0.17em;
  background: var(--primary);
  transform: translateY(-0.02em);
}

.wordmark:hover .wordmark__letter:nth-child(1) > span {
  transform: translateY(-2px);
}

.wordmark:hover .wordmark__letter:nth-child(2) > span {
  transform: translateY(-2px);
  transition-delay: 0.03s;
}

.wordmark:hover .wordmark__letter:nth-child(3) > span {
  transform: translateY(-2px);
  transition-delay: 0.06s;
}

.wordmark:hover .wordmark__letter:nth-child(4) > span {
  transform: translateY(-2px);
  transition-delay: 0.09s;
}

.wordmark:hover .wordmark__letter:nth-child(5) > span {
  transform: translateY(-2px);
  transition-delay: 0.12s;
}

.wordmark:hover .wordmark__letter:nth-child(6) > span {
  transform: translateY(-2px);
  transition-delay: 0.15s;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1.5px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.35rem 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  text-transform: uppercase;
}

.menu-btn__lines {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 2.1rem;
}

.menu-btn__lines i {
  display: block;
  width: 100%;
  height: 1px;
  background: currentColor;
  transition: transform 0.3s var(--ease);
}

.menu-btn__label {
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.04em;
}

.menu-btn--open .menu-btn__lines i:first-child {
  transform: translateY(0.22rem) rotate(45deg);
}

.menu-btn--open .menu-btn__lines i:last-child {
  transform: translateY(-0.22rem) rotate(-45deg);
}

.nav-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.9rem;
  padding-inline: 1.4rem;
  border: 1px solid var(--upi-orange);
  border-radius: 0.4rem;
  background: var(--upi-orange);
  color: var(--ink);
  font-size: 0.74rem;
  font-weight: 750;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.nav-cta:hover {
  transform: translateY(-0.1rem);
  background: var(--yellow);
}

.account-btn {
  display: inline-flex;
  min-width: 2.65rem;
  height: 2.65rem;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  overflow: hidden;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border: 1px solid color-mix(in srgb, var(--ink) 22%, transparent);
  border-radius: var(--pill);
  background: color-mix(in srgb, var(--white) 30%, transparent);
  color: var(--ink);
  text-decoration: none;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.account-btn:not(.account-btn--signed-in) {
  width: 2.65rem;
  padding: 0.25rem;
  border-radius: 50%;
}

.account-btn:hover {
  transform: translateY(-0.1rem);
  background: var(--white);
}

.account-btn__avatar {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary) 12%, var(--white));
  color: var(--primary);
}

.account-btn__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-btn__initials {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.account-btn__name {
  max-width: 8rem;
  overflow: hidden;
  font-size: 0.68rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.65rem;
  padding-inline: 0.8rem;
  border: 1px solid color-mix(in srgb, var(--ink) 20%, transparent);
  border-radius: var(--pill);
  background: color-mix(in srgb, var(--white) 32%, transparent);
  color: var(--ink);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cart-btn:hover {
  background: var(--white);
}

.cart-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 50%;
  background: var(--blue);
  color: #fff;
  font-size: 0.64rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.cart-count--empty {
  background: var(--sky);
  color: var(--blue);
}

.scroll-progress {
  position: absolute;
  right: 18px;
  bottom: 0;
  left: 18px;
  height: 1.5px;
  overflow: hidden;
  border-radius: 2px;
  pointer-events: none;
}

.scroll-progress span {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--red);
  transform-origin: left center;
  will-change: transform;
}

/* Clean Floating Modal Search */
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 40px);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.search-modal-card {
  width: min(100%, 860px);
  max-height: 85vh;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes modalPop {
  0% {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.search-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  gap: 16px;
}

.search-modal-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-modal-icon {
  color: #666666;
  flex-shrink: 0;
}

.search-modal-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 1.05rem;
  color: #111111;
  outline: none;
  appearance: none;
}

.search-modal-input::placeholder {
  color: #888888;
}

.search-modal-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #111111;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: opacity 0.15s;
}

.search-modal-close:hover {
  opacity: 0.6;
}

.search-modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.search-modal-label {
  margin: 0;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #222222;
  letter-spacing: 0.04em;
}

.search-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.search-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-decoration: none;
  color: #111111;
  transition: transform 0.2s ease;
}

.search-card:hover {
  transform: translateY(-2px);
}

.search-card__thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f4f4f4;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.search-card__title {
  margin: 0;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.35;
  color: #111111;
}

.search-card__prices {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.74rem;
}

.search-card__orig {
  color: #888888;
  text-decoration: line-through;
}

.search-card__price {
  font-weight: 700;
  color: #111111;
}

.search-modal-empty {
  padding: 30px;
  text-align: center;
  font-family: var(--font-mono), monospace;
  font-size: 0.82rem;
  color: #666666;
}

@media (max-width: 768px) {
  .search-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .search-modal-body {
    padding: 16px 18px;
  }
}

.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.3s ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}

/* ── Desktop / Mobile nav layout ───────────────────────────────────────── */

/* Desktop logo — shown on ≥820px, hidden on mobile */
.wordmark--desktop {
  display: inline-flex;
}

/* Mobile wordmark — hidden on desktop, shown centered on mobile */
.wordmark--mobile {
  display: none;
}

/* Mobile controls group: menu btn + mobile search btn */
.mobile-nav-group {
  display: none;
  align-items: center;
  gap: 0.5rem;
}

/* Nav center: desktop = nav links, mobile = centered wordmark */
.nav-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Desktop nav links */
.desktop-nav-links {
  display: flex;
  align-items: center;
  gap: clamp(1.1rem, 2vw, 2rem);
}

.desktop-nav-link {
  color: var(--ink);
  font-size: 0.84rem;
  font-weight: 580;
  letter-spacing: 0.01em;
  text-decoration: none;
  transition: color 0.18s ease;
  white-space: nowrap;
}

.desktop-nav-link:hover,
.desktop-nav-link.router-link-active {
  color: var(--primary);
}

/* Desktop search trigger — pill-shaped search button on the right */
.desktop-search-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 2.4rem;
  padding: 0 1rem;
  border: 1.5px solid color-mix(in srgb, var(--ink) 18%, transparent);
  border-radius: 2px;
  background: color-mix(in srgb, var(--white) 50%, transparent);
  color: var(--ink);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease;
  white-space: nowrap;
}

.desktop-search-trigger:hover {
  background: var(--white);
  border-color: color-mix(in srgb, var(--ink) 32%, transparent);
}

.desktop-search-text {
  color: color-mix(in srgb, var(--ink) 55%, transparent);
  font-size: 0.8rem;
}

.mobile-search-btn {
  display: none;
}

/* ── Responsive breakpoint: switch to mobile nav ──────────────────────── */
@media (max-width: 820px) {
  .wordmark--desktop {
    display: none;
  }

  .wordmark--mobile {
    display: inline-flex;
  }

  .mobile-nav-group {
    display: flex;
  }

  .desktop-nav-links {
    display: none;
  }

  .desktop-search-trigger {
    display: none;
  }

  .mobile-search-btn {
    display: inline-flex;
  }

  /* On mobile, nav-left shows mobile-nav-group (menu + search), nav-center shows wordmark */
  .nav-left .wordmark--desktop {
    display: none;
  }
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: stretch;
  background: color-mix(in srgb, var(--ink) 35%, transparent);
  backdrop-filter: blur(0.55rem);
  -webkit-backdrop-filter: blur(0.55rem);
}

.menu-scrim {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.mobile-menu {
  position: relative;
  display: flex;
  width: min(43vw, 42rem);
  min-width: 24rem;
  height: calc(100% - 1rem);
  flex-direction: column;
  margin: 0.5rem;
  overflow-y: auto;
  padding: clamp(5.5rem, 10vh, 7.5rem) clamp(2rem, 4vw, 4.5rem) 2rem;
  border-radius: 0.65rem;
  background: var(--cream);
  color: var(--ink);
  box-shadow: 0 1.5rem 5rem -2rem color-mix(in srgb, var(--ink) 52%, transparent);
}

.mobile-menu__close {
  position: absolute;
  top: 1.5rem;
  left: clamp(2rem, 4vw, 4.5rem);
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.mobile-menu__eyebrow {
  margin-bottom: 1.25rem;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.mobile-menu nav {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.mobile-menu nav a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.22rem;
  color: var(--ink);
  font-family: var(--font-logo);
  font-size: clamp(1.65rem, 3vw, 2.35rem);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.15;
  text-decoration: none;
  transition: color 0.2s ease, padding 0.2s ease;
}

.mobile-menu nav a svg {
  opacity: 0;
  transform: translateX(-0.3rem);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-menu nav a:hover {
  padding-inline-start: 0.25rem;
  color: var(--red);
}

.mobile-menu nav a:hover svg {
  opacity: 1;
  transform: translateX(0);
}

.mobile-menu__profile {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1.5rem;
  padding: 0.75rem;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--white) 72%, transparent);
  color: var(--ink);
  text-decoration: none;
}

.mobile-menu__profile-avatar {
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary) 12%, var(--white));
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 800;
}

.mobile-menu__profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-menu__profile-copy {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.mobile-menu__profile-copy strong,
.mobile-menu__profile-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu__profile-copy strong {
  font-size: 0.82rem;
}

.mobile-menu__profile-copy small {
  color: var(--muted);
  font-size: 0.68rem;
}

.mobile-menu__profile-arrow {
  flex: 0 0 auto;
  margin-left: auto;
}

.mobile-menu__cta {
  align-self: flex-start;
  min-height: 3rem;
  margin-top: auto;
  padding-inline: 1.5rem;
}

.mobile-menu__handle {
  margin-top: 1rem;
  color: var(--muted);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.menu-overlay-enter-active,
.menu-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.menu-overlay-enter-active .mobile-menu,
.menu-overlay-leave-active .mobile-menu {
  transition: transform 0.4s var(--ease);
}

.menu-overlay-enter-from,
.menu-overlay-leave-to {
  opacity: 0;
}

.menu-overlay-enter-from .mobile-menu,
.menu-overlay-leave-to .mobile-menu {
  transform: translateX(-1.5rem);
}

@media (max-width: 900px) {
  .nav-cta {
    display: none;
  }

  .nav-shell {
    grid-template-columns: 1fr auto 1fr;
    gap: 8px;
    padding: 8px clamp(14px, 3vw, 22px);
    border-radius: 2px;
  }

  .site-header--scrolled .nav-shell {
    padding-block: 7px;
  }

  .nav-left,
  .nav-right {
    gap: 0.5rem;
    min-width: 0;
  }

  .menu-btn__lines {
    width: 1.75rem;
  }

  .menu-btn__label {
    font-size: 0.68rem;
  }

  .account-btn:not(.account-btn--signed-in) {
    width: 2.4rem;
    height: 2.4rem;
  }

  .account-btn--signed-in {
    height: 2.4rem;
  }

  .cart-btn {
    position: relative;
    width: 42px;
    justify-content: center;
    padding: 0;
  }

  .cart-count {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border: 1.5px solid var(--surface);
    font-size: 0.56rem;
  }

  .wordmark {
    padding-inline: 4px;
    font-size: clamp(1.3rem, 4.9vw, 1.6rem);
  }

  .mobile-menu {
    width: min(86vw, 28rem);
    min-width: 0;
    padding-inline: clamp(1.5rem, 7vw, 2.5rem);
  }

  .mobile-menu__close {
    left: clamp(1.5rem, 7vw, 2.5rem);
  }
}

@media (max-width: 620px) {
  .account-btn__name {
    display: none;
  }

  .account-btn,
  .account-btn--signed-in {
    width: 2.5rem;
    height: 2.5rem;
    min-width: 2.5rem;
    max-width: 2.5rem;
    aspect-ratio: 1 / 1;
    justify-content: center;
    align-items: center;
    padding: 0;
    border-radius: 50% !important;
    overflow: hidden;
  }

  .account-btn__avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  .menu-btn__label {
    display: none;
  }

  .menu-btn__lines {
    width: 1.65rem;
  }

  .nav-right {
    gap: 0.35rem;
  }

  .cart-btn {
    width: 2.4rem;
    height: 2.4rem;
    justify-content: center;
    padding: 0;
  }

  .cart-count {
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    min-width: 1rem;
    height: 1rem;
    padding-inline: 0.2rem;
    border: 1px solid var(--surface);
    font-size: 0.52rem;
  }

  .wordmark {
    font-size: clamp(1.15rem, 5vw, 1.45rem);
  }
}

@media (max-width: 620px) {
  .search-overlay__top {
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding-block: 14px;
  }

  .search-overlay__eyebrow {
    display: none;
  }

  .search-pill {
    height: 54px;
    gap: 9px;
    padding: 0 6px 0 16px;
    border-radius: 27px;
  }

  .search-pill__count {
    display: none;
  }

  .search-pill__submit {
    width: 42px;
    height: 42px;
  }

  .search-hint {
    display: none;
  }

  .search-panel {
    padding: 6px;
  }

  .search-row {
    grid-template-columns: 46px minmax(0, 1fr) auto 34px;
    gap: 11px;
    padding: 8px 9px;
  }

  .search-row__thumb {
    width: 46px;
    height: 54px;
  }

  .search-chip {
    display: none;
  }

  .search-row__go {
    width: 34px;
    height: 34px;
  }

  .search-panel__meta {
    display: none;
  }
}

@media (max-width: 22.5rem) {
  .wordmark {
    font-size: 1.2rem;
  }

  .nav-right {
    gap: 0.25rem;
  }

  .account-btn,
  .account-btn:not(.account-btn--signed-in),
  .account-btn--signed-in,
  .cart-btn {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 50% !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wordmark__letter > span,
  .nav-cta,
  .nav-cta svg,
  .menu-btn__lines i {
    transition: none;
  }
}
</style>
