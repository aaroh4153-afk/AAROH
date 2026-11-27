<script setup lang="ts">
import { useAccount } from '~/composables/useAccount'
import { useCart } from '~/composables/useCart'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useStore } from '~/composables/useStore'
import type { AccountProfile, UserAddress } from '~/data/account'
import type { Order, PaymentMethod } from '~/data/orders'
import { isVerifiedAccount } from '~/utils/firebaseAuth'
import { formatPrice } from '~/utils/format'

definePageMeta({ chrome: false })
useHead({ title: 'Checkout · AAROH.' })

const router = useRouter()
const { user } = useFirebaseAuth()
const { items, subtotal, clear, hydrate, hydrated } = useCart()
const { placeOrder } = useStore()
const {
  addresses: savedAddresses,
  profile: accountProfile,
  loadOverview,
  updateProfile: saveAccountProfile,
  saveAddress: saveAccountAddress,
} = useAccount()

const signedIn = computed(() => isVerifiedAccount(user.value))
const selectedAddressId = ref('')
const idempotencyKey = ref('')

interface CheckoutDraft {
  name: string
  email: string
  phone: string
  line1: string
  line2: string
  landmark: string
  city: string
  state: string
  pincode: string
  deliveryInstructions: string
  specialRequests: string
}

const draft = reactive<CheckoutDraft>({
  name: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  deliveryInstructions: '',
  specialRequests: '',
})

const paymentMethod = ref<PaymentMethod>('UPI')
const paymentOptions: { id: PaymentMethod; label: string; note: string }[] = [
  { id: 'UPI', label: 'UPI', note: 'Pay by UPI after placing the order' },
  { id: 'Card', label: 'Card', note: 'Credit or debit card' },
  { id: 'Net Banking', label: 'Net banking', note: 'All major Indian banks' },
  { id: 'Cash on Delivery', label: 'Cash on delivery', note: 'Pay when the parcel arrives' },
]

const busy = ref(false)
const errorMessage = ref('')
const placedOrder = ref<Order | null>(null)

const shipping = 0
const total = computed(() => subtotal.value + shipping)
const itemCount = computed(() => items.value.reduce((count, item) => count + item.quantity, 0))

const cartLines = computed(() =>
  items.value.map((item) => ({
    ...item,
    lineTotal: item.price * item.quantity,
  })),
)

watch(
  user,
  (account) => {
    if (!account) return
    if (!draft.email) draft.email = account.email ?? ''
    if (!draft.name) draft.name = account.displayName ?? ''
  },
  { immediate: true },
)

/** Copies one saved account address into the delivery form. */
function applyAddress(address: UserAddress) {
  selectedAddressId.value = address.id
  if (address.name) draft.name = address.name
  if (address.phone) draft.phone = address.phone
  draft.line1 = address.line1
  draft.line2 = address.line2
  draft.landmark = ''
  draft.city = address.city
  draft.state = address.state
  draft.pincode = address.pincode
}

/** Clears the form so the customer can type a different delivery address. */
function useNewAddress() {
  selectedAddressId.value = ''
  draft.line1 = ''
  draft.line2 = ''
  draft.landmark = ''
  draft.city = ''
  draft.state = ''
  draft.pincode = ''
}

/** Prefills contact details and the default address from the signed-in account. */
async function loadAccountDetails() {
  if (!isVerifiedAccount(user.value)) return

  try {
    const data = await loadOverview()
    const profile: AccountProfile | null = data?.profile ?? accountProfile.value
    if (profile) {
      if (!draft.name) draft.name = profile.displayName
      if (!draft.phone) draft.phone = profile.phone
      if (!draft.email) draft.email = profile.email
    }

    const preferred =
      savedAddresses.value.find((address) => address.isDefault) ?? savedAddresses.value[0]
    if (preferred && !draft.line1) applyAddress(preferred)
  } catch (error) {
    console.warn('[aaroh/checkout] Could not load the saved account details.', error)
  }
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

onMounted(() => {
  idempotencyKey.value = newIdempotencyKey()
  void hydrate()
  void loadAccountDetails()
})

function goBack() {
  if (import.meta.client && window.history.length > 1) router.back()
  else navigateTo('/shop')
}

function formatPlacedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

function validate(): string {
  if (!draft.name.trim()) return 'Add the full name for this delivery.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim())) {
    return 'Add a valid email address so we can send the order confirmation.'
  }
  if (!/^[0-9+\-\s()]{10,16}$/.test(draft.phone.trim())) {
    return 'Add a valid mobile number with 10 digits.'
  }
  if (!draft.line1.trim()) return 'Add the street, house or building address.'
  if (!draft.city.trim()) return 'Add the city for this delivery.'
  if (!draft.state.trim()) return 'Add the state for this delivery.'
  if (!/^[0-9]{6}$/.test(draft.pincode.trim())) return 'Add a valid 6-digit PIN code.'
  if (!items.value.length) return 'Your cart is empty.'
  return ''
}

async function placeOrderNow() {
  if (busy.value) return
  errorMessage.value = validate()
  if (errorMessage.value) return

  busy.value = true

  try {
    const now = new Date()
    const orderNumber = `${now.getTime().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`
    const notes = [draft.deliveryInstructions.trim(), draft.specialRequests.trim()]
      .filter(Boolean)
      .join(' · ')

    const order: Order & { idempotencyKey: string } = {
      id: `ARH-${orderNumber}`,
      idempotencyKey: idempotencyKey.value,
      customer: {
        name: draft.name.trim(),
        email: draft.email.trim().toLowerCase(),
        phone: draft.phone.trim(),
        line1: draft.line1.trim(),
        line2: draft.line2.trim() || undefined,
        landmark: draft.landmark.trim() || undefined,
        city: draft.city.trim(),
        state: draft.state.trim(),
        pincode: draft.pincode.trim(),
        deliveryInstructions: draft.deliveryInstructions.trim() || undefined,
        specialRequests: draft.specialRequests.trim() || undefined,
      },
      items: items.value.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        size: item.size ?? 'M',
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: subtotal.value,
      shipping,
      discount: 0,
      total: total.value,
      paymentMethod: paymentMethod.value,
      paymentStatus: 'Pending',
      deliveryStatus: 'Processing',
      placedAt: now.toISOString(),
      channel: 'Online store',
      notes: notes || undefined,
    }

    placedOrder.value = await placeOrder(order)

    // Keep the contact details on the profile so the next sign-in prefills them.
    if (signedIn.value) {
      try {
        await saveAccountProfile({
          displayName: order.customer.name,
          phone: order.customer.phone,
        })
      } catch (profileError) {
        console.warn('[aaroh/checkout] Order placed, but the profile was not updated.', profileError)
      }
    }

    // Keep this delivery address on the account for the next checkout.
    if (signedIn.value && !selectedAddressId.value) {
      try {
        await saveAccountAddress({
          label: savedAddresses.value.length ? 'Delivery' : 'Home',
          name: order.customer.name,
          phone: order.customer.phone,
          line1: order.customer.line1,
          line2: order.customer.line2 ?? '',
          city: order.customer.city,
          state: order.customer.state,
          pincode: order.customer.pincode,
          isDefault: savedAddresses.value.length === 0,
        })
      } catch (addressError) {
        console.warn('[aaroh/checkout] Order placed, but the address was not saved.', addressError)
      }
    }

    const token = user.value ? await user.value.getIdToken().catch(() => undefined) : undefined
    clear(token)
    idempotencyKey.value = newIdempotencyKey()
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('[aaroh/checkout] Order could not be placed.', error)
    errorMessage.value =
      'The order could not be saved. Check the connection and try again, or write to us on Instagram.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="checkout">
    <header class="checkout__header">
      <button class="checkout__back" type="button" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
          <path d="M9 12h12" />
        </svg>
        Back
      </button>
      <NuxtLink class="checkout__wordmark" to="/" aria-label="AAROH. home">AAROH.</NuxtLink>
      <span class="checkout__spacer" aria-hidden="true" />
    </header>

    <ClientOnly>
      <p v-if="!hydrated" class="checkout-loading" role="status">Loading your bag…</p>
      <section v-else-if="placedOrder" class="checkout-confirm" aria-labelledby="checkout-confirm-title">
      <p class="checkout-confirm__eyebrow">Order placed</p>
      <h1 id="checkout-confirm-title">Thank you, {{ placedOrder.customer.name.split(' ')[0] }}.</h1>
      <p class="checkout-confirm__copy">
        Your order <strong>{{ placedOrder.id }}</strong> is confirmed. We will send tracking
        updates to {{ placedOrder.customer.email }}.
      </p>

      <dl class="checkout-confirm__meta">
        <div>
          <dt>Order ID</dt>
          <dd>{{ placedOrder.id }}</dd>
        </div>
        <div>
          <dt>Placed</dt>
          <dd>{{ formatPlacedAt(placedOrder.placedAt) }}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>{{ placedOrder.paymentMethod }} · {{ placedOrder.paymentStatus }}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>{{ placedOrder.deliveryStatus }}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{{ formatPrice(placedOrder.total) }}</dd>
        </div>
      </dl>

      <div class="checkout-confirm__address">
        <span>Delivering to</span>
        <p>
          {{ placedOrder.customer.name }} · {{ placedOrder.customer.phone }}<br />
          {{ placedOrder.customer.line1 }}<template v-if="placedOrder.customer.line2">, {{ placedOrder.customer.line2 }}</template><br />
          {{ placedOrder.customer.city }}, {{ placedOrder.customer.state }} {{ placedOrder.customer.pincode }}
        </p>
      </div>

      <div class="checkout-confirm__actions">
        <NuxtLink class="checkout-button" to="/account">View in your account</NuxtLink>
        <NuxtLink class="checkout-link" to="/shop">Continue shopping</NuxtLink>
      </div>
    </section>

    <section v-else-if="!items.length" class="checkout-confirm" aria-labelledby="checkout-empty-title">
      <p class="checkout-confirm__eyebrow">Checkout</p>
      <h1 id="checkout-empty-title">Your cart is empty.</h1>
      <p class="checkout-confirm__copy">Add a piece to your cart before checking out.</p>
      <div class="checkout-confirm__actions">
        <NuxtLink class="checkout-button" to="/shop">Shop the collection</NuxtLink>
      </div>
    </section>

    <div v-else class="checkout__grid">
      <form class="checkout-form" @submit.prevent="placeOrderNow">
        <section class="checkout-block" aria-labelledby="checkout-contact">
          <header class="checkout-block__head">
            <span>01</span>
            <h2 id="checkout-contact">Contact</h2>
          </header>

          <div class="checkout-fields">
            <label class="checkout-field">
              <span>Full name</span>
              <input v-model="draft.name" type="text" autocomplete="name" required />
            </label>
            <label class="checkout-field">
              <span>Email</span>
              <input v-model="draft.email" type="email" autocomplete="email" required />
            </label>
            <label class="checkout-field checkout-field--wide">
              <span>Mobile number</span>
              <input
                v-model="draft.phone"
                type="tel"
                inputmode="numeric"
                autocomplete="tel"
                placeholder="10-digit mobile number"
                required
              />
            </label>
          </div>
        </section>

        <section class="checkout-block" aria-labelledby="checkout-address">
          <header class="checkout-block__head">
            <span>02</span>
            <h2 id="checkout-address">Delivery address</h2>
          </header>

          <div v-if="savedAddresses.length" class="checkout-saved">
            <p class="checkout-saved__label">Saved addresses</p>
            <button
              v-for="address in savedAddresses"
              :key="address.id"
              class="checkout-saved__option"
              :class="{ 'checkout-saved__option--active': selectedAddressId === address.id }"
              type="button"
              @click="applyAddress(address)"
            >
              <strong>
                {{ address.label }}
                <span v-if="address.isDefault">Default</span>
              </strong>
              <small>{{ address.name }} · {{ address.phone }}</small>
              <small>
                {{ address.line1 }}<template v-if="address.line2">, {{ address.line2 }}</template>
              </small>
              <small>{{ address.city }}, {{ address.state }} {{ address.pincode }}</small>
            </button>
            <button class="checkout-saved__new" type="button" @click="useNewAddress">
              Deliver to a different address
            </button>
          </div>
          <p v-else-if="signedIn" class="checkout-note">
            This delivery address will be saved to your account.
          </p>

          <div class="checkout-fields">
            <label class="checkout-field checkout-field--wide">
              <span>Street, house or building</span>
              <input v-model="draft.line1" type="text" autocomplete="address-line1" required />
            </label>
            <label class="checkout-field checkout-field--wide">
              <span>Apartment, floor, area (optional)</span>
              <input v-model="draft.line2" type="text" autocomplete="address-line2" />
            </label>
            <label class="checkout-field">
              <span>Nearby landmark (optional)</span>
              <input v-model="draft.landmark" type="text" placeholder="e.g. opposite the metro station" />
            </label>
            <label class="checkout-field">
              <span>PIN code</span>
              <input
                v-model="draft.pincode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="postal-code"
                required
              />
            </label>
            <label class="checkout-field">
              <span>City</span>
              <input v-model="draft.city" type="text" autocomplete="address-level2" required />
            </label>
            <label class="checkout-field">
              <span>State</span>
              <input v-model="draft.state" type="text" autocomplete="address-level1" required />
            </label>
          </div>
        </section>

        <section class="checkout-block" aria-labelledby="checkout-delivery">
          <header class="checkout-block__head">
            <span>03</span>
            <h2 id="checkout-delivery">Delivery notes</h2>
          </header>

          <div class="checkout-fields">
            <label class="checkout-field checkout-field--wide">
              <span>Delivery instructions (optional)</span>
              <textarea
                v-model="draft.deliveryInstructions"
                rows="2"
                placeholder="Gate code, best time to deliver, call before arriving…"
              />
            </label>
            <label class="checkout-field checkout-field--wide">
              <span>Special delivery requests (optional)</span>
              <textarea
                v-model="draft.specialRequests"
                rows="2"
                placeholder="Gift note, packaging request, anything else we should know…"
              />
            </label>
          </div>
        </section>

        <section class="checkout-block" aria-labelledby="checkout-payment">
          <header class="checkout-block__head">
            <span>04</span>
            <h2 id="checkout-payment">Payment</h2>
          </header>

          <div class="checkout-payments">
            <label
              v-for="option in paymentOptions"
              :key="option.id"
              class="checkout-payment"
              :class="{ 'checkout-payment--active': paymentMethod === option.id }"
            >
              <input v-model="paymentMethod" type="radio" name="payment" :value="option.id" />
              <span class="checkout-payment__copy">
                <strong>{{ option.label }}</strong>
                <small>{{ option.note }}</small>
              </span>
            </label>
          </div>

          <p class="checkout-note">
            No online payment is taken here. We confirm the order and share a secure payment
            link or collect on delivery.
          </p>
        </section>

        <p v-if="errorMessage" class="checkout-message" role="alert">{{ errorMessage }}</p>

        <button class="checkout-button checkout-button--submit" type="submit" :disabled="busy">
          {{ busy ? 'Placing your order…' : `Place order · ${formatPrice(total)}` }}
        </button>
      </form>

      <aside class="checkout-summary" aria-labelledby="checkout-summary-title">
        <header class="checkout-summary__head">
          <h2 id="checkout-summary-title">Your order</h2>
          <span>{{ itemCount }} {{ itemCount === 1 ? 'piece' : 'pieces' }}</span>
        </header>

        <div class="checkout-summary__items">
          <article v-for="item in cartLines" :key="item.id" class="checkout-summary__item">
            <img :src="item.image" :alt="item.name" loading="lazy" decoding="async" />
            <div class="checkout-summary__copy">
              <strong>{{ item.name }}</strong>
              <small>
                {{ item.colour }}<template v-if="item.size"> · Size {{ item.size }}</template>
                · Qty {{ item.quantity }}
              </small>
            </div>
            <span class="checkout-summary__price">{{ formatPrice(item.lineTotal) }}</span>
          </article>
        </div>

        <dl class="checkout-summary__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{{ formatPrice(subtotal) }}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{{ shipping === 0 ? 'Complimentary' : formatPrice(shipping) }}</dd>
          </div>
          <div class="checkout-summary__grand">
            <dt>Total</dt>
            <dd>{{ formatPrice(total) }}</dd>
          </div>
        </dl>

        <p class="checkout-summary__note">
          Every piece is packed by hand in small studio batches.
        </p>
      </aside>
    </div>

      <template #fallback>
        <p class="checkout-loading" role="status">Loading your bag…</p>
      </template>
    </ClientOnly>

    <p class="checkout__footer">Everyday essentials, made to be worn.</p>
  </main>
</template>

<style scoped>
.checkout {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  align-items: center;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  padding: clamp(1.5rem, 4vw, 3rem) 1.25rem;
  background: var(--cream);
  color: var(--ink);
}

.checkout__header {
  display: grid;
  width: min(100%, 74rem);
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.checkout__back {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
}

.checkout__back svg {
  width: 1rem;
  height: 1rem;
}

.checkout__back:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.checkout__wordmark {
  color: var(--primary);
  font-family: var(--font-logo);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-stretch: 118%;
  font-weight: 750;
  letter-spacing: 0.06em;
  line-height: 1;
  text-decoration: none;
}

.checkout__grid {
  display: grid;
  width: min(100%, 74rem);
  grid-template-columns: minmax(0, 1.35fr) minmax(17rem, 0.65fr);
  align-items: start;
  gap: clamp(1.25rem, 3vw, 2.5rem);
}

.checkout-form {
  display: grid;
  gap: 1rem;
}

.checkout-block {
  display: grid;
  gap: 0.9rem;
  padding: clamp(1rem, 2.4vw, 1.5rem);
  border: 1px solid var(--line);
  background: var(--white);
}

.checkout-block__head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--line);
}

.checkout-block__head span {
  color: var(--primary);
  font-family: var(--font-outfit);
  font-size: 0.6rem;
  font-weight: 750;
  letter-spacing: 0.12em;
}

.checkout-block__head h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-logo);
  font-size: 0.98rem;
  font-stretch: 100%;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.checkout-saved {
  display: grid;
  gap: 0.5rem;
}

.checkout-saved__label {
  color: var(--text-muted);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.checkout-saved__option {
  display: grid;
  gap: 0.1rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.7rem;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.checkout-saved__option strong {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 700;
}

.checkout-saved__option strong span {
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 12%, var(--white));
  color: var(--primary);
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.checkout-saved__option:hover {
  border-color: var(--line-strong);
}

.checkout-saved__option--active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 5%, var(--white));
}

.checkout-saved__new {
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 0.68rem;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}

.checkout-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.checkout-field {
  display: grid;
  gap: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.02em;
}

.checkout-field--wide {
  grid-column: 1 / -1;
}

.checkout-field input,
.checkout-field textarea {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--line-strong);
  border-radius: 0;
  background: var(--white);
  color: var(--ink);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 400;
  letter-spacing: 0;
  resize: vertical;
}

.checkout-field textarea {
  min-height: 4.2rem;
}

.checkout-field input:focus-visible,
.checkout-field textarea:focus-visible {
  border-color: var(--brand-navy);
  outline: 2px solid color-mix(in srgb, var(--brand-navy) 22%, transparent);
  outline-offset: 1px;
}

.checkout-payments {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.checkout-payment {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.checkout-payment:hover {
  border-color: var(--line-strong);
}

.checkout-payment--active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 5%, var(--white));
}

.checkout-payment input {
  width: 1rem;
  height: 1rem;
  margin-top: 0.15rem;
  accent-color: var(--primary);
}

.checkout-payment__copy {
  display: grid;
  gap: 0.1rem;
}

.checkout-payment__copy strong {
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 650;
}

.checkout-payment__copy small {
  color: var(--text-secondary);
  font-size: 0.65rem;
  line-height: 1.35;
}

.checkout-note {
  color: var(--text-secondary);
  font-size: 0.7rem;
  line-height: 1.5;
}

.checkout-message {
  padding: 0.7rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--rust) 40%, var(--line));
  background: color-mix(in srgb, var(--rust) 6%, var(--white));
  color: var(--rust);
  font-size: 0.8rem;
  line-height: 1.5;
}

.checkout-button {
  display: flex;
  width: 100%;
  min-height: 3.25rem;
  align-items: center;
  justify-content: center;
  padding-inline: 1.2rem;
  border: 1px solid var(--brand-navy);
  background: var(--brand-navy);
  color: var(--white);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.checkout-button:hover:not(:disabled) {
  transform: translateY(-0.1rem);
  background: var(--brand-navy-deep);
}

.checkout-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.checkout-button--submit {
  min-height: 3.5rem;
  letter-spacing: 0.02em;
}

.checkout-summary {
  position: sticky;
  top: 1.5rem;
  display: grid;
  gap: 0.9rem;
  padding: clamp(1rem, 2.4vw, 1.4rem);
  border: 1px solid var(--line);
  background: var(--white);
}

.checkout-summary__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid var(--line);
}

.checkout-summary__head h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-logo);
  font-size: 0.98rem;
  font-weight: 700;
}

.checkout-summary__head span {
  color: var(--text-muted);
  font-size: 0.64rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.checkout-summary__items {
  display: grid;
  gap: 0.75rem;
}

.checkout-summary__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
}

.checkout-summary__item img {
  width: 3.2rem;
  height: 3.9rem;
  border: 1px solid var(--line);
  background: var(--white);
  object-fit: contain;
}

.checkout-summary__copy {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.checkout-summary__copy strong {
  overflow: hidden;
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checkout-summary__copy small {
  color: var(--text-secondary);
  font-size: 0.66rem;
}

.checkout-summary__price {
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.checkout-summary__totals {
  display: grid;
  gap: 0.45rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--line);
}

.checkout-summary__totals div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.checkout-summary__totals dt {
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.checkout-summary__totals dd {
  margin: 0;
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.checkout-summary__grand {
  padding-top: 0.55rem;
  border-top: 1px solid var(--line);
}

.checkout-summary__grand dt {
  color: var(--ink);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.checkout-summary__grand dd {
  font-size: 1.05rem;
  font-weight: 750;
}

.checkout-summary__note {
  color: var(--text-secondary);
  font-size: 0.66rem;
  line-height: 1.5;
}

/* Confirmation */
.checkout-confirm {
  display: grid;
  gap: 1rem;
  width: min(100%, 40rem);
  margin-block: auto;
  padding: clamp(1.25rem, 3vw, 2.25rem);
  border: 1px solid var(--line);
  background: var(--white);
}

.checkout-confirm__eyebrow {
  color: var(--primary);
  font-family: var(--font-outfit);
  font-size: 0.6rem;
  font-weight: 750;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.checkout-confirm h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 650;
  line-height: 1.15;
}

.checkout-confirm__copy {
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.55;
}

.checkout-confirm__copy strong {
  color: var(--ink);
}

.checkout-confirm__meta {
  display: grid;
  border-top: 1px solid var(--line);
}

.checkout-confirm__meta div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.6rem;
  border-bottom: 1px solid var(--line);
}

.checkout-confirm__meta dt {
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.checkout-confirm__meta dd {
  margin: 0;
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 650;
  text-align: right;
}

.checkout-confirm__address {
  display: grid;
  gap: 0.3rem;
  padding: 0.85rem;
  border: 1px dashed var(--line-strong);
}

.checkout-confirm__address span {
  color: var(--text-muted);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.checkout-confirm__address p {
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.55;
}

.checkout-confirm__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem;
}

.checkout-confirm__actions .checkout-button {
  width: auto;
  min-height: 2.8rem;
  padding-inline: 1.3rem;
  font-size: 0.78rem;
}

.checkout-link {
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 0.22em;
}

.checkout__footer {
  color: var(--text-secondary);
  font-size: 0.76rem;
  text-align: center;
}

.checkout-loading {
  margin-block: auto;
  padding: 3rem 1rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 900px) {
  .checkout__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .checkout-summary {
    position: static;
    order: -1;
  }
}

@media (max-width: 560px) {
  .checkout {
    padding: 1rem 0.85rem 1.5rem;
  }

  .checkout-fields,
  .checkout-payments {
    grid-template-columns: minmax(0, 1fr);
  }

  .checkout-block {
    padding: 0.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .checkout-button,
  .checkout-payment {
    transition: none;
  }
}
</style>
