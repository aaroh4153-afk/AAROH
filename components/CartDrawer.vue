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
      <div class="cart-header">
        <div class="cart-header__title">
          <span class="cart-icon" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
          <h3>Your Bag</h3>
          <span class="cart-badge">{{ count }}</span>
        </div>
        <button class="cart-close" type="button" aria-label="Close cart" @click="toggleCart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div class="cart-body">
        <div v-if="items.length === 0" class="cart-empty">
          <span class="cart-empty__icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
          <p class="cart-empty__title">Your bag is empty.</p>
          <p class="cart-empty__copy">Find the piece that feels like yours.</p>
          <button class="btn btn--primary cart-empty__cta" type="button" @click="toggleCart">
            Explore Ready-To-Wear
          </button>
        </div>

        <ul v-else class="cart-list">
          <li v-for="item in items" :key="item.id" class="cart-item">
            <img :src="item.image" :alt="item.name" class="cart-item__thumb" />
            <div class="cart-item__info">
              <h4>{{ item.name }}</h4>
              <p class="cart-item__colour">
                {{ item.colour }}<template v-if="item.size"> · Size {{ item.size }}</template>
              </p>
              <div class="cart-item__price-row">
                <span class="cart-item__price">{{ formatPrice(item.price) }}</span>
                <span class="cart-item__qty">
                  <button type="button" :aria-label="`Decrease quantity of ${item.name}`" @click="decrement(item.id)">−</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" :aria-label="`Increase quantity of ${item.name}`" @click="increment(item.id)">+</button>
                </span>
              </div>
            </div>
            <button class="cart-item__remove" type="button" :aria-label="`Remove ${item.name}`" @click="removeItem(item.id)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 15H6L5 6" />
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <div v-if="items.length > 0" class="cart-footer">
        <div class="cart-shipping">
          <span aria-hidden="true" /> Complimentary shipping on every order
        </div>
        <div class="cart-subtotal">
          <span>Subtotal</span>
          <strong>{{ formatPrice(subtotal) }}</strong>
        </div>
        <p class="cart-note">Shipping is complimentary. Taxes included at checkout.</p>
        <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" class="btn btn--cta cart-checkout">
          Get Now — Checkout
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      </div>
    </aside>
  </Teleport>
</template>

<style scoped>
.cart-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: rgba(11, 18, 32, 0.55);
  backdrop-filter: blur(4px);
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  width: min(100vw, 400px);
  flex-direction: column;
  background: var(--surface);
  color: var(--text);
  box-shadow: -16px 0 50px rgba(11, 18, 32, 0.18);
  transform: translateX(101%);
  transition: transform 0.4s var(--ease);
}

.cart-drawer--open {
  transform: translateX(0);
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 21px 24px;
  border-bottom: 1px solid var(--line);
}

.cart-header__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-icon {
  display: inline-flex;
  color: var(--primary);
}

.cart-header__title h3 {
  padding: 0;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.cart-badge {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: var(--pill);
  background: var(--primary);
  color: #fff;
  font-size: 0.66rem;
  font-weight: 700;
}

.cart-close {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--btn-radius);
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.cart-close:hover {
  background: var(--sky);
  color: var(--primary);
}

.cart-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 58px 0 40px;
  text-align: center;
}

.cart-empty__icon {
  display: grid;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  place-items: center;
  border-radius: 50%;
  background: var(--sky);
  color: var(--primary);
}

.cart-empty__title {
  font-size: 1.05rem;
  font-weight: 700;
}

.cart-empty__copy {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.cart-empty__cta {
  margin-top: 20px;
  padding-inline: 22px;
  font-size: 0.78rem;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 11px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-subtle);
}

.cart-item__thumb {
  width: 58px;
  height: 72px;
  border-radius: 3px;
  background: var(--surface);
  object-fit: contain;
}

.cart-item__info {
  flex: 1;
  min-width: 0;
}

.cart-item__info h4 {
  overflow: hidden;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item__colour {
  margin: 2px 0 6px;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.cart-item__price-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8rem;
}

.cart-item__price {
  color: var(--primary);
  font-weight: 700;
}

.cart-item__qty {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--pill);
}

.cart-item__qty button {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  font-size: 0.8rem;
  line-height: 1;
  cursor: pointer;
}

.cart-item__qty button:hover {
  background: var(--sky);
  color: var(--primary);
}

.cart-item__qty > span {
  min-width: 16px;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 650;
  text-align: center;
}

.cart-note {
  color: var(--text-muted);
  font-size: 0.64rem;
  line-height: 1.45;
  text-align: center;
}

.cart-item__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.cart-item__remove:hover {
  background: #ffe7e7;
  color: #d12b2b;
}

.cart-footer {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 20px 24px 24px;
  border-top: 1px solid var(--line);
}

.cart-shipping {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 550;
}

.cart-shipping span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--blue);
}

.cart-subtotal {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 1rem;
}

.cart-subtotal strong {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 750;
}

.cart-checkout {
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .cart-header {
    padding: 18px 20px;
  }

  .cart-body {
    padding: 16px 20px;
  }

  .cart-footer {
    padding: 18px 20px 22px;
  }
}
</style>
