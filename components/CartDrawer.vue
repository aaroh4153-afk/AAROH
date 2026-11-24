<script setup lang="ts">
import { useCart } from '~/composables/useCart'
import { INSTAGRAM_URL } from '~/data/products'
import { formatPrice } from '~/utils/format'

const { items, isOpen, count, subtotal, increment, decrement, removeItem, toggleCart } = useCart()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) toggleCart()
}

watch(
  isOpen,
  (open) => {
    if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="cart-backdrop" @click="toggleCart" />
    </Transition>

    <aside
      class="cart-drawer"
      :class="{ 'cart-drawer--open': isOpen }"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
    >
      <!-- Cart Header -->
      <div class="cart-header">
        <div class="cart-header__title">
          <span class="cart-label">CART</span>
          <span class="cart-badge">{{ count }}</span>
        </div>
        <button class="cart-close" type="button" aria-label="Close cart" @click="toggleCart">
          ✕
        </button>
      </div>

      <!-- Cart Body: Empty State -->
      <div v-if="items.length === 0" class="cart-empty">
        <h3 class="cart-empty__heading">YOUR CART IS EMPTY</h3>
        <p class="cart-empty__sub">
          Have an account?
          <NuxtLink to="/account" class="cart-empty__login" @click="toggleCart">Log in</NuxtLink>
          to check out faster.
        </p>
        <button class="cart-empty__btn" type="button" @click="toggleCart">
          CONTINUE SHOPPING
        </button>
      </div>

      <!-- Cart Body: Items State -->
      <div v-else class="cart-content">
        <!-- Info Banner -->
        <div class="cart-info-banner">
          <span class="cart-info-icon">ⓘ</span>
          <span class="cart-info-text">
            <strong>Complimentary Delivery:</strong> You will get tracking updates immediately after checkout. Handcrafted in small studio batches.
          </span>
        </div>

        <!-- Items List -->
        <div class="cart-items-scroll">
          <article v-for="item in items" :key="item.id" class="cart-item">
            <img :src="item.image" :alt="item.name" class="cart-item__img" />
            <div class="cart-item__details">
              <div class="cart-item__top-row">
                <h4 class="cart-item__title">{{ item.name }}</h4>
                <div class="cart-item__price">{{ formatPrice(item.price) }}</div>
              </div>
              <div class="cart-item__strikethrough">
                {{ formatPrice(Math.round(item.price * 1.35)) }}
              </div>
              <div v-if="item.colour || item.size" class="cart-item__meta">
                {{ item.colour }}<template v-if="item.size"> / Size {{ item.size }}</template>
              </div>

              <div class="cart-item__actions">
                <div class="cart-item__qty">
                  <button type="button" aria-label="Decrease quantity" @click="decrement(item.id)">−</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" aria-label="Increase quantity" @click="increment(item.id)">+</button>
                </div>
                <button
                  type="button"
                  class="cart-item__remove"
                  @click="removeItem(item.id)"
                >
                  REMOVE
                </button>
              </div>
            </div>
          </article>
        </div>

        <!-- Sticky Footer Checkout -->
        <div class="cart-footer">
          <div class="cart-footer__total-row">
            <span class="cart-footer__total-label">ESTIMATED TOTAL</span>
            <span class="cart-footer__total-price">{{ formatPrice(subtotal) }}</span>
          </div>
          <p class="cart-footer__note">
            Taxes, discounts and shipping calculated at checkout.
          </p>

          <NuxtLink to="/account" class="cart-checkout-btn" @click="toggleCart">
            CHECK OUT
          </NuxtLink>

          <div class="cart-express-pay">
            <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" class="cart-pay-btn cart-pay-btn--shop">
              Shop Pay
            </a>
            <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" class="cart-pay-btn cart-pay-btn--paypal">
              PayPal / UPI
            </a>
          </div>
        </div>
      </div>
    </aside>
  </Teleport>
</template>

<style scoped>
.cart-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  width: min(100vw, 440px);
  background: #ffffff;
  color: #111111;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
  transform: translateX(100%);
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.cart-drawer--open {
  transform: translateX(0);
}

/* Header */
.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.cart-header__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-label {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #111111;
}

.cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding-inline: 6px;
  background: #000000;
  color: #ffffff;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 2px;
}

.cart-close {
  background: transparent;
  border: none;
  font-size: 1.15rem;
  color: #111111;
  cursor: pointer;
  padding: 6px 10px;
  line-height: 1;
}

/* Empty State */
.cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.cart-empty__heading {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0 0 12px;
  color: #000000;
}

.cart-empty__sub {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.78rem;
  color: #555555;
  margin: 0 0 28px;
}

.cart-empty__login {
  color: #000000;
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
}

.cart-empty__btn {
  background: #000000;
  color: #ffffff;
  border: none;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 13px 26px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.2s;
}

.cart-empty__btn:hover {
  background: #2b2b2b;
}

/* Content State */
.cart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 20px;
  background: #f7f7f6;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.74rem;
  color: #444444;
  line-height: 1.5;
}

.cart-info-icon {
  font-size: 0.95rem;
  color: #000000;
  line-height: 1;
}

.cart-items-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 16px;
  align-items: start;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.cart-item__img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  background: #f4f4f4;
  border-radius: 4px;
}

.cart-item__details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cart-item__top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.cart-item__title {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0;
  color: #111111;
}

.cart-item__price {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: #111111;
  white-space: nowrap;
}

.cart-item__strikethrough {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.72rem;
  color: #888888;
  text-decoration: line-through;
}

.cart-item__meta {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.72rem;
  color: #666666;
}

.cart-item__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.cart-item__qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.cart-item__qty button {
  background: transparent;
  border: none;
  padding: 4px 10px;
  font-family: var(--font-mono), monospace;
  font-size: 0.85rem;
  cursor: pointer;
  color: #111111;
}

.cart-item__qty span {
  font-family: var(--font-mono), monospace;
  font-size: 0.76rem;
  font-weight: 700;
  padding-inline: 4px;
}

.cart-item__remove {
  background: transparent;
  border: none;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #666666;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.cart-item__remove:hover {
  color: #000000;
}

/* Footer */
.cart-footer {
  padding: 20px 24px 24px;
  background: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-footer__total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-footer__total-label {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #111111;
}

.cart-footer__total-price {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 1.05rem;
  font-weight: 800;
  color: #000000;
}

.cart-footer__note {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.68rem;
  color: #666666;
  margin: 0;
}

.cart-checkout-btn {
  display: block;
  width: 100%;
  text-align: center;
  background: #000000;
  color: #ffffff;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 14px 20px;
  text-decoration: none;
  border-radius: 2px;
  transition: background 0.2s;
}

.cart-checkout-btn:hover {
  background: #2b2b2b;
}

.cart-express-pay {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.cart-pay-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  font-family: var(--font-mono), sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 2px;
}

.cart-pay-btn--shop {
  background: #5a31f4;
  color: #ffffff;
}

.cart-pay-btn--paypal {
  background: #ffc439;
  color: #111111;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
