<script setup lang="ts">
import {
  deliveryStatuses,
  paymentStatuses,
  type DeliveryStatus,
  type Order,
  type PaymentStatus,
} from '~/data/orders'

const props = defineProps<{
  modelValue: boolean
  order: Order | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const {
  setPaymentStatus,
  setDeliveryStatus,
  cancelOrder,
} = useStore()

function close() {
  emit('update:modelValue', false)
}

const steps = ['Processing', 'Packed', 'Shipped', 'Delivered'] as const

const stepIndex = computed(() => {
  if (!props.order) return 0
  return steps.indexOf(props.order.deliveryStatus as (typeof steps)[number])
})

const isClosed = computed(() =>
  props.order ? ['Cancelled', 'Returned'].includes(props.order.deliveryStatus) : false,
)

const itemCount = computed(() =>
  props.order ? props.order.items.reduce((total, item) => total + item.quantity, 0) : 0,
)

function onPayment(event: Event) {
  if (!props.order) return
  setPaymentStatus(props.order.id, (event.target as HTMLSelectElement).value as PaymentStatus)
}

function onDelivery(event: Event) {
  if (!props.order) return
  setDeliveryStatus(props.order.id, (event.target as HTMLSelectElement).value as DeliveryStatus)
}

function markPaid() {
  if (props.order) setPaymentStatus(props.order.id, 'Paid')
}

function markDelivered() {
  if (props.order) {
    setDeliveryStatus(props.order.id, 'Delivered')
    setPaymentStatus(props.order.id, 'Paid')
  }
}

function onCancel() {
  if (!props.order) return
  cancelOrder(props.order.id)
}

watch(
  () => props.modelValue,
  (open) => {
    if (import.meta.client) {
      document.documentElement.style.overflow = open ? 'hidden' : ''
    }
  },
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (import.meta.client) document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="modelValue && order" class="order-drawer">
        <div class="order-drawer__backdrop" @click="close" />

        <aside class="order-drawer__panel" role="dialog" aria-modal="true" :aria-label="`Order ${order.id}`">
          <header class="order-drawer__head">
            <div>
              <span class="order-drawer__eyebrow">Order detail</span>
              <h2>{{ order.id }}</h2>
              <p>{{ formatDateTime(order.placedAt) }} · {{ order.channel }}</p>
            </div>
            <button class="studio-btn studio-btn--icon" type="button" aria-label="Close" @click="close">
              <DashIcon name="close" :size="16" />
            </button>
          </header>

          <div class="order-drawer__body">
            <section class="order-drawer__statuses">
              <div class="order-drawer__status">
                <span class="order-drawer__status-label">Payment</span>
                <StatusBadge :status="order.paymentStatus" />
              </div>
              <div class="order-drawer__status">
                <span class="order-drawer__status-label">Delivery</span>
                <StatusBadge :status="order.deliveryStatus" />
              </div>
              <div class="order-drawer__status order-drawer__status--total">
                <span class="order-drawer__status-label">Total</span>
                <strong>{{ formatPrice(order.total) }}</strong>
              </div>
            </section>

            <section v-if="!isClosed" class="order-drawer__track">
              <div
                v-for="(step, index) in steps"
                :key="step"
                class="order-drawer__step"
                :class="{
                  'order-drawer__step--done': index < stepIndex,
                  'order-drawer__step--current': index === stepIndex,
                }"
              >
                <span class="order-drawer__step-dot">
                  <DashIcon v-if="index < stepIndex" name="check" :size="10" :stroke-width="3" />
                </span>
                <span>{{ step }}</span>
              </div>
            </section>
            <p v-else class="studio-note">
              This order is {{ order.deliveryStatus.toLowerCase() }}. Payment is
              {{ order.paymentStatus.toLowerCase() }}.
            </p>

            <section class="order-drawer__block">
              <h3>Customer</h3>
              <div class="order-drawer__customer">
                <span class="studio-avatar">{{ initials(order.customer.name) }}</span>
                <div>
                  <strong>{{ order.customer.name }}</strong>
                  <a :href="`mailto:${order.customer.email}`">{{ order.customer.email }}</a>
                  <span>{{ order.customer.phone }}</span>
                </div>
              </div>
              <div class="order-drawer__address">
                <DashIcon name="pin" :size="14" />
                <p>
                  {{ order.customer.line1 }}, {{ order.customer.city }}<br />
                  {{ order.customer.state }} — {{ order.customer.pincode }}
                </p>
              </div>
            </section>

            <section class="order-drawer__block">
              <h3>
                Items
                <small>{{ itemCount }} {{ itemCount === 1 ? 'unit' : 'units' }}</small>
              </h3>
              <ul class="order-drawer__items">
                <li v-for="item in order.items" :key="item.productId + item.size">
                  <img :src="item.image" :alt="item.name" class="order-drawer__thumb" />
                  <div class="order-drawer__item-text">
                    <strong>{{ item.name }}</strong>
                    <span>Size {{ item.size }} · Qty {{ item.quantity }}</span>
                  </div>
                  <div class="order-drawer__item-price">
                    <strong>{{ formatPrice(item.price * item.quantity) }}</strong>
                    <span>{{ formatPrice(item.price) }} each</span>
                  </div>
                </li>
              </ul>
            </section>

            <section class="order-drawer__block">
              <h3>Summary</h3>
              <dl class="order-drawer__totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{{ formatPrice(order.subtotal) }}</dd>
                </div>
                <div v-if="order.discount">
                  <dt>Discount</dt>
                  <dd class="order-drawer__discount">−{{ formatPrice(order.discount) }}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{{ order.shipping ? formatPrice(order.shipping) : 'Free' }}</dd>
                </div>
                <div class="order-drawer__grand">
                  <dt>Total paid</dt>
                  <dd>{{ formatPrice(order.total) }}</dd>
                </div>
              </dl>
              <p v-if="order.notes" class="studio-note">
                <strong>Note:</strong> {{ order.notes }}
              </p>
            </section>

            <section class="order-drawer__block">
              <h3>Update</h3>
              <div class="studio-grid-2">
                <label class="studio-field">
                  <span class="studio-label">Payment status</span>
                  <select class="studio-select" :value="order.paymentStatus" @change="onPayment">
                    <option v-for="status in paymentStatuses" :key="status" :value="status">
                      {{ status }}
                    </option>
                  </select>
                </label>

                <label class="studio-field">
                  <span class="studio-label">Delivery status</span>
                  <select class="studio-select" :value="order.deliveryStatus" @change="onDelivery">
                    <option v-for="status in deliveryStatuses" :key="status" :value="status">
                      {{ status }}
                    </option>
                  </select>
                </label>
              </div>

              <div class="order-drawer__actions">
                <button
                  v-if="order.paymentStatus !== 'Paid'"
                  class="studio-btn studio-btn--primary studio-btn--sm"
                  type="button"
                  @click="markPaid"
                >
                  <DashIcon name="check" :size="13" />
                  Mark paid
                </button>
                <button
                  v-if="!isClosed && order.deliveryStatus !== 'Delivered'"
                  class="studio-btn studio-btn--sm"
                  type="button"
                  @click="markDelivered"
                >
                  <DashIcon name="truck" :size="13" />
                  Mark delivered
                </button>
                <button
                  v-if="!isClosed"
                  class="studio-btn studio-btn--danger studio-btn--sm"
                  type="button"
                  @click="onCancel"
                >
                  <DashIcon name="close" :size="12" />
                  Cancel order
                </button>
              </div>
            </section>
          </div>

          <footer class="order-drawer__foot">
            <span>Payment via {{ order.paymentMethod }}</span>
            <span>Demo data · changes stay in this session</span>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.order-drawer {
  position: fixed;
  inset: 0;
  z-index: 80;
}

.order-drawer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(11, 18, 32, 0.42);
  backdrop-filter: blur(2px);
}

.order-drawer__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  width: min(460px, 100%);
  flex-direction: column;
  background: #fff;
  box-shadow: -24px 0 60px -30px rgba(16, 24, 40, 0.5);
}

.order-drawer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid var(--studio-line);
}

.order-drawer__eyebrow {
  color: var(--studio-muted);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.order-drawer__head h2 {
  margin: 3px 0 0;
  color: var(--studio-ink);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.order-drawer__head p {
  margin-top: 2px;
  color: var(--studio-muted);
  font-size: 0.7rem;
}

.order-drawer__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18px;
  padding: 18px 22px 26px;
  overflow-y: auto;
}

.order-drawer__statuses {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 22px;
  padding: 12px 14px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fafbff;
}

.order-drawer__status {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.order-drawer__status-label {
  color: #98a1b3;
  font-size: 0.54rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.order-drawer__status--total {
  margin-left: auto;
  align-items: flex-end;
}

.order-drawer__status--total strong {
  color: var(--studio-ink);
  font-size: 1.05rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.order-drawer__track {
  display: flex;
  gap: 4px;
}

.order-drawer__step {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #a3abbd;
  font-size: 0.57rem;
  font-weight: 650;
  text-align: center;
}

.order-drawer__step::before {
  content: '';
  position: absolute;
  top: 7px;
  right: calc(50% + 10px);
  left: -50%;
  height: 2px;
  background: #e9ebf3;
}

.order-drawer__step:first-child::before {
  display: none;
}

.order-drawer__step-dot {
  display: grid;
  width: 16px;
  height: 16px;
  place-items: center;
  border: 2px solid #dfe3ee;
  border-radius: 50%;
  background: #fff;
  color: #fff;
}

.order-drawer__step--done {
  color: #14804a;
}

.order-drawer__step--done::before {
  background: #b6ebc7;
}

.order-drawer__step--done .order-drawer__step-dot {
  border-color: var(--studio-green);
  background: var(--studio-green);
}

.order-drawer__step--current {
  color: var(--primary);
}

.order-drawer__step--current .order-drawer__step-dot {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(13, 24, 120, 0.14);
}

.order-drawer__step--current::before {
  background: #b6ebc7;
}

.order-drawer__block h3 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 10px;
  color: var(--studio-ink);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.order-drawer__block h3 small {
  color: var(--studio-muted);
  font-size: 0.6rem;
  font-weight: 600;
}

.order-drawer__customer {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.order-drawer__customer > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  font-size: 0.7rem;
  color: var(--studio-muted);
}

.order-drawer__customer strong {
  color: var(--studio-ink);
  font-size: 0.8rem;
  font-weight: 650;
}

.order-drawer__customer a {
  color: var(--primary);
  text-decoration: none;
}

.order-drawer__customer a:hover {
  text-decoration: underline;
}

.order-drawer__address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  margin-top: 10px;
  border-radius: 4px;
  background: #f7f8fc;
  color: var(--studio-muted);
}

.order-drawer__address p {
  font-size: 0.7rem;
  line-height: 1.55;
}

.order-drawer__items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.order-drawer__items li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border: 1px solid var(--studio-line-soft);
  border-radius: 2px;
}

.order-drawer__thumb {
  width: 44px;
  height: 48px;
  flex: none;
  padding: 3px;
  border-radius: 2px;
  background: #f7f8fc;
  object-fit: contain;
}

.order-drawer__item-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.order-drawer__item-text strong {
  overflow: hidden;
  color: var(--studio-ink);
  font-size: 0.74rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-drawer__item-text span,
.order-drawer__item-price span {
  color: var(--studio-muted);
  font-size: 0.62rem;
}

.order-drawer__item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.order-drawer__item-price strong {
  color: var(--studio-ink);
  font-size: 0.74rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.order-drawer__totals {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 14px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
}

.order-drawer__totals > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  color: var(--studio-muted);
  font-size: 0.7rem;
}

.order-drawer__totals dd {
  color: var(--studio-ink);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.order-drawer__discount {
  color: #14804a !important;
}

.order-drawer__grand {
  padding-top: 8px;
  margin-top: 3px;
  border-top: 1px dashed var(--studio-line);
}

.order-drawer__grand dt {
  color: var(--studio-ink);
  font-weight: 700;
}

.order-drawer__grand dd {
  font-size: 0.95rem;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.order-drawer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.order-drawer__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px;
  padding: 11px 22px;
  border-top: 1px solid var(--studio-line);
  background: #fbfbfd;
  color: #a3abbd;
  font-size: 0.58rem;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .order-drawer__panel,
.drawer-leave-active .order-drawer__panel {
  transition: transform 0.3s var(--ease);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .order-drawer__panel,
.drawer-leave-to .order-drawer__panel {
  transform: translateX(100%);
}

@media (max-width: 560px) {
  .order-drawer__panel {
    width: 100%;
  }

  .order-drawer__body {
    padding-inline: 16px;
  }

  .order-drawer__head {
    padding-inline: 16px;
  }

  .order-drawer__foot {
    padding-inline: 16px;
  }
}
</style>
