<script setup lang="ts">
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  reload,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { useCart } from '~/composables/useCart'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useStore } from '~/composables/useStore'
import { requestFirebaseVerification, syncFirebaseUser } from '~/utils/firebaseAuth'
import { formatPrice } from '~/utils/format'

definePageMeta({ chrome: false })
useHead({ title: 'Your account · AAROH.' })

const route = useRoute()
const router = useRouter()
const { auth, user, profile } = useFirebaseAuth()
const { orders, products } = useStore()
const {
  items: cartItems,
  count: cartCount,
  subtotal: cartSubtotal,
  increment,
  decrement,
  removeItem,
  toggleCart,
  addItem,
} = useCart()
const verifiedInSession = ref(false)
const verifiedProfile = computed(() =>
  user.value?.emailVerified || verifiedInSession.value ? user.value : null,
)

type AccountTab = 'orders' | 'cart' | 'addresses' | 'profile'

interface Address {
  id: string
  label: string
  name: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

const activeTab = ref<AccountTab>('orders')
const addresses = ref<Address[]>([])
const addressEditing = ref(false)
const addressNotice = ref('')
const addressDraft = reactive<Address>({
  id: '',
  label: 'Home',
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
})

const accountEmail = computed(
  () => (verifiedProfile.value?.email || profile.value?.email || '').toLowerCase(),
)
const myOrders = computed(() =>
  accountEmail.value
    ? orders.value.filter(
        (order) => order.customer.email.toLowerCase() === accountEmail.value,
      )
    : [],
)
const accountTabs = computed<{ id: AccountTab; label: string; count: number }[]>(() => [
  { id: 'orders', label: 'Orders', count: myOrders.value.length },
  { id: 'cart', label: 'Cart', count: cartCount.value },
  { id: 'addresses', label: 'Addresses', count: addresses.value.length },
  { id: 'profile', label: 'Profile', count: 0 },
])
const addressStorageKey = computed(
  () => `aaroh-address-book:${accountEmail.value || 'guest'}`,
)

function formatOrderDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function loadAddresses() {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(addressStorageKey.value)
    addresses.value = raw ? (JSON.parse(raw) as Address[]) : []
  } catch {
    addresses.value = []
  }
}

function persistAddresses() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(addressStorageKey.value, JSON.stringify(addresses.value))
  } catch {
    // Storage can be unavailable; the in-memory address book still works.
  }
}

function resetAddressDraft() {
  Object.assign(addressDraft, {
    id: '',
    label: 'Home',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  })
  addressEditing.value = false
}

function startAddressEdit(address: Address) {
  Object.assign(addressDraft, address)
  addressEditing.value = true
  addressNotice.value = ''
}

function saveAddress() {
  const required = [
    addressDraft.name,
    addressDraft.phone,
    addressDraft.line1,
    addressDraft.city,
    addressDraft.state,
    addressDraft.pincode,
  ]
  if (required.some((value) => !value.trim())) {
    addressNotice.value = 'Add a name, phone, street, city, state and pincode.'
    return
  }

  const entry: Address = {
    ...addressDraft,
    label: addressDraft.label.trim() || 'Home',
    id: addressDraft.id || `addr-${Date.now()}`,
  }
  const index = addresses.value.findIndex((address) => address.id === entry.id)

  if (index >= 0) {
    addresses.value.splice(index, 1, entry)
  } else {
    if (!addresses.value.length) entry.isDefault = true
    addresses.value.push(entry)
  }

  if (entry.isDefault) {
    addresses.value.forEach((address) => {
      if (address.id !== entry.id) address.isDefault = false
    })
  }

  persistAddresses()
  resetAddressDraft()
  addressNotice.value = 'Address saved.'
}

function makeDefaultAddress(id: string) {
  addresses.value.forEach((address) => {
    address.isDefault = address.id === id
  })
  persistAddresses()
}

function removeAddress(id: string) {
  addresses.value = addresses.value.filter((address) => address.id !== id)
  if (addresses.value.length && !addresses.value.some((address) => address.isDefault)) {
    addresses.value[0]!.isDefault = true
  }
  persistAddresses()
}

function reorder(order: (typeof orders.value)[number]) {
  for (const item of order.items) {
    const product = products.value.find((entry) => entry.id === item.productId)
    if (product) addItem(product, item.size, item.quantity)
  }
}

function goBack() {
  if (import.meta.client && window.history.length > 1) router.back()
  else navigateTo('/')
}

watch(addressStorageKey, loadAddresses, { immediate: true })
const mode = ref<'signin' | 'signup'>('signin')
const name = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
const notice = ref('')
const errorMessage = ref('')

function formatMemberSince(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function messageFromError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String(error.code)
    if (code === 'auth/email-already-in-use') return 'An account already uses this email. Sign in instead.'
    if (code === 'auth/invalid-email') return 'Enter a valid email address.'
    if (code === 'auth/invalid-credential') return 'That email and password combination was not recognized.'
    if (code === 'auth/weak-password') return 'Choose a password with at least six characters.'
    if (code === 'auth/popup-closed-by-user') return 'The Google sign-in window was closed before finishing.'
    if (code === 'auth/unauthorized-domain') {
      return 'Render domain is not authorized in Firebase. Go to Firebase Console → Authentication → Settings tab → Authorized domains → Add "aaroh-z7b8.onrender.com".'
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Google sign-in is disabled in Firebase. Enable Google under Authentication sign-in providers.'
    }
    if (code === 'auth/invalid-api-key') return 'The Firebase web API key is invalid. Check the public Firebase settings.'
    if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.'
  }

  if (error instanceof Error) return error.message
  return 'The account request could not be completed. Please try again.'
}

async function finishGoogleSignIn(accountUser: User) {
  user.value = accountUser

  try {
    const result = await syncFirebaseUser(accountUser)
    profile.value = result.user
    notice.value = result.welcomeEmailSent
      ? 'Thank you for being part of AAROH.'
      : 'Welcome to AAROH.'
    errorMessage.value = ''
  } catch (error) {
    console.warn('[aaroh/auth] Google sign-in succeeded; backend profile sync deferred.', error)
    notice.value = 'Signed in successfully with Google.'
    errorMessage.value = ''
  }
}

async function submitForm() {
  if (!auth) {
    errorMessage.value = 'Account sign-in is not configured yet. Add the Firebase web settings to the deployment environment.'
    return
  }

  busy.value = true
  errorMessage.value = ''
  notice.value = ''

  try {
    if (mode.value === 'signup') {
      const credential = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value)
      await updateProfile(credential.user, { displayName: name.value.trim() })
      await requestFirebaseVerification(credential.user)
      notice.value = `A verification email has been sent to ${credential.user.email}. Verify it to finish joining AAROH.`
      return
    }

    const credential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    if (!credential.user.emailVerified) {
      await requestFirebaseVerification(credential.user)
      notice.value = 'Please verify your email. We sent you a fresh verification link.'
      return
    }

    const result = await syncFirebaseUser(credential.user)
    profile.value = result.user
    notice.value = result.welcomeEmailSent
      ? 'Thank you for being part of AAROH.'
      : 'Your profile is saved. The welcome email could not be sent; please check the SMTP settings.'
  } catch (error) {
    errorMessage.value = messageFromError(error)
  } finally {
    busy.value = false
  }
}

async function signInWithGoogle() {
  if (!auth) {
    errorMessage.value = 'Account sign-in is not configured yet. Add the Firebase web settings to the deployment environment.'
    return
  }

  busy.value = true
  errorMessage.value = ''
  notice.value = ''

  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    let credential: UserCredential

    try {
      credential = await signInWithPopup(auth, provider)
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
      if (code !== 'auth/popup-blocked' && code !== 'auth/operation-not-supported-in-this-environment') {
        throw error
      }

      await signInWithRedirect(auth, provider)
      return
    }

    await finishGoogleSignIn(credential.user)
  } catch (error) {
    errorMessage.value = messageFromError(error)
  } finally {
    busy.value = false
  }
}

async function resendVerification() {
  if (!auth?.currentUser) return

  busy.value = true
  errorMessage.value = ''
  notice.value = ''

  try {
    await requestFirebaseVerification(auth.currentUser)
    notice.value = `A new verification email has been sent to ${auth.currentUser.email}.`
  } catch (error) {
    errorMessage.value = messageFromError(error)
  } finally {
    busy.value = false
  }
}

async function signOutAccount() {
  if (!auth) return
  await signOut(auth)
  verifiedInSession.value = false
  profile.value = null
  notice.value = 'You have signed out.'
  errorMessage.value = ''
}

function setMode(nextMode: 'signin' | 'signup') {
  mode.value = nextMode
  notice.value = ''
  errorMessage.value = ''
}

onMounted(async () => {
  if (!auth) {
    if (route.query.verified === '1') {
      notice.value = 'Your email is verified. Thank you for becoming part of AAROH.'
    }
    return
  }

  try {
    const redirectCredential = await getRedirectResult(auth)
    if (redirectCredential) await finishGoogleSignIn(redirectCredential.user)

    if (route.query.verified === '1') {
      notice.value = 'Your email is verified. Thank you for becoming part of AAROH.'
      await auth.authStateReady()
      const currentUser = auth.currentUser
      if (!currentUser) return

      await reload(currentUser)
      if (currentUser.emailVerified) {
        verifiedInSession.value = true
        user.value = null
        await nextTick()
        user.value = currentUser
        const result = await syncFirebaseUser(currentUser, true)
        profile.value = result.user
        if (!result.welcomeEmailSent) {
          notice.value = 'Your profile is saved. The welcome email could not be sent; please check the SMTP settings.'
        }
      }
    }
  } catch (error) {
    errorMessage.value = messageFromError(error)
  }
})
</script>

<template>
  <main class="account-page">
    <header class="account-page__header">
      <button class="account-page__back" type="button" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
          <path d="M9 12h12" />
        </svg>
        Back
      </button>
      <NuxtLink class="account-page__wordmark" to="/" aria-label="AAROH. home">AAROH.</NuxtLink>
      <span class="account-page__header-spacer" aria-hidden="true" />
    </header>

    <section
      class="account-panel"
      :class="{ 'account-panel--wide': Boolean(verifiedProfile) }"
      aria-labelledby="account-title"
    >
      <template v-if="verifiedProfile">
        <header class="account-hero">
          <div class="account-avatar" aria-hidden="true">
            <img
              v-if="profile?.photoUrl || verifiedProfile.photoURL"
              :src="profile?.photoUrl || verifiedProfile.photoURL || ''"
              alt=""
              referrerpolicy="no-referrer"
            />
            <span v-else>{{ (verifiedProfile.displayName || verifiedProfile.email || 'A').slice(0, 1).toUpperCase() }}</span>
          </div>
          <div class="account-hero__copy">
            <p class="account-hero__eyebrow">AAROH. account</p>
            <h1 id="account-title">{{ profile?.displayName || verifiedProfile.displayName || 'Your account' }}</h1>
            <p class="account-panel__sub">{{ verifiedProfile.email }}</p>
          </div>
          <button class="account-signout" type="button" :disabled="busy" @click="signOutAccount">
            Sign out
          </button>
        </header>

        <nav class="account-tabs" aria-label="Account sections">
          <button
            v-for="tab in accountTabs"
            :key="tab.id"
            type="button"
            :class="{ 'account-tabs__active': activeTab === tab.id }"
            :aria-current="activeTab === tab.id ? 'page' : undefined"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
            <span v-if="tab.count">{{ tab.count }}</span>
          </button>
        </nav>

        <p v-if="notice" class="account-message account-message--success" role="status">{{ notice }}</p>
        <p v-if="errorMessage" class="account-message account-message--error" role="alert">{{ errorMessage }}</p>

        <section v-if="activeTab === 'orders'" class="account-section" aria-labelledby="account-orders">
          <div class="account-section__head">
            <h2 id="account-orders">Orders</h2>
            <span>{{ myOrders.length }} {{ myOrders.length === 1 ? 'order' : 'orders' }}</span>
          </div>

          <div v-if="myOrders.length" class="account-orders">
            <article v-for="order in myOrders" :key="order.id" class="account-order">
              <header class="account-order__head">
                <div>
                  <strong>{{ order.id }}</strong>
                  <span>{{ formatOrderDate(order.placedAt) }} · {{ order.paymentMethod }}</span>
                </div>
                <span class="account-order__total">{{ formatPrice(order.total) }}</span>
              </header>

              <div class="account-order__items">
                <figure v-for="item in order.items" :key="`${order.id}-${item.productId}-${item.size}`">
                  <img :src="item.image" :alt="item.name" loading="lazy" decoding="async" />
                  <figcaption>
                    <span>{{ item.name }}</span>
                    <small>{{ item.size }} · Qty {{ item.quantity }}</small>
                  </figcaption>
                </figure>
              </div>

              <footer class="account-order__foot">
                <span class="account-order__status" :class="`account-order__status--${order.deliveryStatus.toLowerCase()}`">
                  {{ order.deliveryStatus }}
                </span>
                <span class="account-order__pay">{{ order.paymentStatus }}</span>
                <button class="account-order__reorder" type="button" @click="reorder(order)">Reorder</button>
              </footer>
            </article>
          </div>

          <div v-else class="account-empty">
            <p>No orders on this account yet.</p>
            <NuxtLink class="account-button" to="/shop">Shop the collection</NuxtLink>
          </div>
        </section>

        <section v-else-if="activeTab === 'cart'" class="account-section" aria-labelledby="account-cart">
          <div class="account-section__head">
            <h2 id="account-cart">Cart</h2>
            <span>{{ cartCount }} {{ cartCount === 1 ? 'item' : 'items' }}</span>
          </div>

          <div v-if="cartItems.length" class="account-cart">
            <article v-for="item in cartItems" :key="item.id" class="account-cart__row">
              <img :src="item.image" :alt="item.name" loading="lazy" decoding="async" />
              <div class="account-cart__copy">
                <strong>{{ item.name }}</strong>
                <small>{{ item.size ? `Size ${item.size} · ` : '' }}{{ item.colour }}</small>
                <span>{{ formatPrice(item.price) }}</span>
              </div>
              <div class="account-cart__qty">
                <button type="button" :aria-label="`Decrease quantity of ${item.name}`" @click="decrement(item.id)">−</button>
                <span>{{ item.quantity }}</span>
                <button type="button" :aria-label="`Increase quantity of ${item.name}`" @click="increment(item.id)">+</button>
              </div>
              <button class="account-cart__remove" type="button" @click="removeItem(item.id)">Remove</button>
            </article>

            <footer class="account-cart__foot">
              <div class="account-cart__subtotal">
                <span>Subtotal</span>
                <strong>{{ formatPrice(cartSubtotal) }}</strong>
              </div>
              <div class="account-cart__actions">
                <button class="account-button account-button--secondary" type="button" @click="toggleCart">
                  Open cart
                </button>
                <NuxtLink class="account-button" to="/checkout">Checkout</NuxtLink>
              </div>
            </footer>
          </div>

          <div v-else class="account-empty">
            <p>Your cart is empty.</p>
            <NuxtLink class="account-button" to="/shop">Add a piece</NuxtLink>
          </div>
        </section>

        <section v-else-if="activeTab === 'addresses'" class="account-section" aria-labelledby="account-addresses">
          <div class="account-section__head">
            <h2 id="account-addresses">Addresses</h2>
            <span>{{ addresses.length }} saved</span>
          </div>

          <div v-if="addresses.length" class="account-addresses">
            <article
              v-for="address in addresses"
              :key="address.id"
              class="account-address"
              :class="{ 'account-address--default': address.isDefault }"
            >
              <header>
                <strong>{{ address.label }}</strong>
                <span v-if="address.isDefault">Default</span>
              </header>
              <p>{{ address.name }} · {{ address.phone }}</p>
              <p>{{ address.line1 }}<template v-if="address.line2">, {{ address.line2 }}</template></p>
              <p>{{ address.city }}, {{ address.state }} {{ address.pincode }}</p>
              <div class="account-address__actions">
                <button type="button" @click="startAddressEdit(address)">Edit</button>
                <button v-if="!address.isDefault" type="button" @click="makeDefaultAddress(address.id)">Make default</button>
                <button type="button" @click="removeAddress(address.id)">Delete</button>
              </div>
            </article>
          </div>

          <form class="account-address-form" @submit.prevent="saveAddress">
            <h3>{{ addressEditing ? 'Edit address' : 'Add an address' }}</h3>
            <div class="account-address-grid">
              <label class="account-field">
                <span>Label</span>
                <input v-model="addressDraft.label" type="text" placeholder="Home / Studio" />
              </label>
              <label class="account-field">
                <span>Full name</span>
                <input v-model="addressDraft.name" type="text" autocomplete="name" required />
              </label>
              <label class="account-field">
                <span>Phone</span>
                <input v-model="addressDraft.phone" type="tel" autocomplete="tel" required />
              </label>
              <label class="account-field">
                <span>Street</span>
                <input v-model="addressDraft.line1" type="text" autocomplete="address-line1" required />
              </label>
              <label class="account-field">
                <span>Apartment, floor (optional)</span>
                <input v-model="addressDraft.line2" type="text" autocomplete="address-line2" />
              </label>
              <label class="account-field">
                <span>City</span>
                <input v-model="addressDraft.city" type="text" autocomplete="address-level2" required />
              </label>
              <label class="account-field">
                <span>State</span>
                <input v-model="addressDraft.state" type="text" autocomplete="address-level1" required />
              </label>
              <label class="account-field">
                <span>Pincode</span>
                <input v-model="addressDraft.pincode" type="text" inputmode="numeric" autocomplete="postal-code" required />
              </label>
            </div>

            <label class="account-check">
              <input v-model="addressDraft.isDefault" type="checkbox" />
              <span>Make this my default address</span>
            </label>

            <p v-if="addressNotice" class="account-message account-message--success" role="status">{{ addressNotice }}</p>

            <div class="account-address-form__actions">
              <button class="account-button" type="submit">{{ addressEditing ? 'Save address' : 'Add address' }}</button>
              <button v-if="addressEditing" class="account-switch" type="button" @click="resetAddressDraft">
                Cancel
              </button>
            </div>
          </form>
        </section>

        <section v-else class="account-section" aria-labelledby="account-profile">
          <div class="account-section__head">
            <h2 id="account-profile">Profile</h2>
            <span>{{ formatMemberSince(profile?.createdAt || verifiedProfile.metadata.creationTime || '') }}</span>
          </div>

          <dl v-if="profile" class="account-details">
            <div>
              <dt>Name</dt>
              <dd>{{ profile.displayName || 'Not provided' }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ profile.email }}</dd>
            </div>
            <div>
              <dt>Email status</dt>
              <dd>{{ profile.emailVerified ? 'Verified' : 'Not verified' }}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{{ formatMemberSince(profile.createdAt) }}</dd>
            </div>
          </dl>
          <p v-else class="account-panel__sub" role="status">Loading your saved profile…</p>
        </section>
      </template>

      <template v-else-if="user && !user.emailVerified">
        <h1 id="account-title">Verify your email</h1>
        <p class="account-panel__sub">Check your inbox to complete your AAROH. account.</p>
        <p v-if="notice" class="account-message account-message--success" role="status">{{ notice }}</p>
        <p v-if="errorMessage" class="account-message account-message--error" role="alert">{{ errorMessage }}</p>
        <button class="account-button" type="button" :disabled="busy" @click="resendVerification">
          {{ busy ? 'Sending…' : 'Resend verification email' }}
        </button>
        <button class="account-switch" type="button" :disabled="busy" @click="signOutAccount">Use another account</button>
      </template>

      <template v-else>
        <h1 id="account-title">{{ mode === 'signup' ? 'Create your account' : 'Sign in' }}</h1>
        <p class="account-panel__sub">Sign in or create an account</p>

        <p v-if="route.query.verified === '1' && notice" class="account-message account-message--success" role="status">
          {{ notice }}
        </p>

        <button class="account-button account-button--google" type="button" :disabled="busy" @click="signInWithGoogle">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
            <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
            <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" />
            <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z" />
          </svg>
          Continue with Google
        </button>

        <div class="account-divider"><span>or</span></div>

        <form class="account-form" @submit.prevent="submitForm">
          <label v-if="mode === 'signup'" class="account-field">
            <span>Name</span>
            <input v-model="name" name="name" type="text" autocomplete="name" required />
          </label>
          <label class="account-field">
            <span>Email</span>
            <input v-model="email" name="email" type="email" autocomplete="email" required />
          </label>
          <label class="account-field">
            <span>Password</span>
            <input
              v-model="password"
              name="password"
              type="password"
              :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
              minlength="6"
              required
            />
          </label>

          <p v-if="notice" class="account-message account-message--success" role="status">{{ notice }}</p>
          <p v-if="errorMessage" class="account-message account-message--error" role="alert">{{ errorMessage }}</p>

          <button class="account-button" type="submit" :disabled="busy">
            {{ busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Continue with email' }}
          </button>
        </form>

        <p class="account-panel__toggle">
          {{ mode === 'signup' ? 'Already part of AAROH?' : 'New to AAROH?' }}
          <button type="button" :disabled="busy" @click="setMode(mode === 'signup' ? 'signin' : 'signup')">
            {{ mode === 'signup' ? 'Sign in' : 'Create an account' }}
          </button>
        </p>
      </template>
    </section>

    <p class="account-page__footer">Everyday essentials, made to be worn.</p>
  </main>
</template>

<style scoped>
.account-page {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: clamp(1.5rem, 4vw, 3rem) 1.25rem;
  background: var(--cream);
  color: var(--ink);
}

.account-page__header {
  display: grid;
  width: min(100%, 72rem);
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.account-page__back {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.4rem;
  color: var(--ink);
  font-size: 0.75rem;
  font-weight: 650;
  text-decoration: none;
}

.account-page__back svg {
  width: 1rem;
  height: 1rem;
}

.account-page__back:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.account-page__wordmark {
  color: var(--primary);
  font-family: var(--font-logo);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-stretch: 118%;
  font-weight: 750;
  letter-spacing: 0.06em;
  line-height: 1;
  text-decoration: none;
}

.account-panel {
  width: min(100%, 28rem);
  margin-block: auto;
  padding: clamp(1.5rem, 4vw, 2.5rem);
}

.account-panel h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 1.55rem;
  font-weight: 650;
  line-height: 1.2;
}

.account-panel__sub {
  margin-block: 0.35rem 1.5rem;
  color: var(--text-secondary);
  font-size: 0.92rem;
}

.account-details {
  display: grid;
  margin-block: 1.25rem 1.5rem;
  border-top: 1px solid var(--line);
}

.account-details > div {
  display: grid;
  grid-template-columns: minmax(6rem, 0.55fr) minmax(0, 1fr);
  gap: 1rem;
  padding-block: 0.75rem;
  border-bottom: 1px solid var(--line);
}

.account-details dt {
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 650;
}

.account-details dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 600;
  text-align: right;
}

/* Signed-in account workspace */
.account-panel--wide {
  width: min(100%, 64rem);
  padding: clamp(1.15rem, 3vw, 2.25rem);
  border: 1px solid var(--line);
  background: var(--white);
}

.account-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--line);
}

.account-hero .account-avatar {
  width: 3.25rem;
  height: 3.25rem;
  margin: 0;
  flex: 0 0 auto;
}

.account-hero__copy {
  min-width: 0;
  flex: 1;
}

.account-hero__eyebrow {
  color: var(--primary);
  font-family: var(--font-outfit);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.account-hero__copy h1 {
  margin-top: 0.2rem;
  font-size: clamp(1.35rem, 2.4vw, 1.8rem);
}

.account-hero__copy .account-panel__sub {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
}

.account-signout {
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 650;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.account-signout:hover:not(:disabled) {
  border-color: var(--ink);
  background: var(--bg-subtle);
}

.account-tabs {
  display: flex;
  gap: 0.35rem;
  margin-block: 1.1rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.account-tabs::-webkit-scrollbar {
  display: none;
}

.account-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.74rem;
  font-weight: 650;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.account-tabs button:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.account-tabs .account-tabs__active {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--white);
}

.account-tabs button span {
  display: inline-grid;
  min-width: 1.2rem;
  height: 1.2rem;
  place-items: center;
  padding-inline: 0.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 16%, transparent);
  font-size: 0.6rem;
  font-variant-numeric: tabular-nums;
}

.account-section {
  display: grid;
  gap: 1rem;
}

.account-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.account-section__head h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-logo);
  font-size: 1.05rem;
  font-stretch: 100%;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.account-section__head span {
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.account-orders {
  display: grid;
  gap: 0.85rem;
}

.account-order {
  border: 1px solid var(--line);
}

.account-order__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--line);
  background: var(--bg-subtle);
}

.account-order__head div {
  display: grid;
  gap: 0.1rem;
}

.account-order__head strong {
  color: var(--ink);
  font-family: var(--font-outfit);
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.06em;
}

.account-order__head span {
  color: var(--text-secondary);
  font-size: 0.68rem;
}

.account-order__total {
  color: var(--ink) !important;
  font-size: 0.86rem !important;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.account-order__items {
  display: grid;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
}

.account-order__items figure {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.account-order__items img {
  width: 3rem;
  height: 3.6rem;
  flex: 0 0 auto;
  border: 1px solid var(--line);
  background: var(--white);
  object-fit: contain;
}

.account-order__items figcaption {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.account-order__items figcaption span {
  overflow: hidden;
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-order__items figcaption small {
  color: var(--text-secondary);
  font-size: 0.68rem;
}

.account-order__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 0.9rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--line);
}

.account-order__status {
  padding: 0.2rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--ink) 16%, transparent);
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.account-order__status--delivered {
  border-color: #2f7a4f;
  color: #2f7a4f;
}

.account-order__status--shipped {
  border-color: var(--primary);
  color: var(--primary);
}

.account-order__status--cancelled,
.account-order__status--returned {
  border-color: var(--rust);
  color: var(--rust);
}

.account-order__pay {
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 600;
}

.account-order__reorder {
  margin-left: auto;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.account-order__reorder:hover {
  background: var(--ink);
  color: var(--white);
}

.account-cart {
  display: grid;
  gap: 0.6rem;
}

.account-cart__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem;
  border: 1px solid var(--line);
}

.account-cart__row img {
  width: 3.4rem;
  height: 4.1rem;
  border: 1px solid var(--line);
  background: var(--white);
  object-fit: contain;
}

.account-cart__copy {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.account-cart__copy strong {
  overflow: hidden;
  color: var(--ink);
  font-size: 0.8rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-cart__copy small {
  color: var(--text-secondary);
  font-size: 0.68rem;
}

.account-cart__copy span {
  color: var(--ink);
  font-size: 0.74rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.account-cart__qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
}

.account-cart__qty button {
  width: 1.8rem;
  height: 1.8rem;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.account-cart__qty button:hover {
  background: var(--bg-subtle);
}

.account-cart__qty span {
  min-width: 1.5rem;
  text-align: center;
  font-size: 0.74rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.account-cart__remove {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.66rem;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 0.18em;
  cursor: pointer;
}

.account-cart__remove:hover {
  color: var(--rust);
}

.account-cart__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-top: 0.35rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--line);
}

.account-cart__subtotal {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
}

.account-cart__subtotal span {
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.account-cart__subtotal strong {
  color: var(--ink);
  font-size: 1rem;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.account-cart__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.account-cart__actions .account-button {
  width: auto;
  min-height: 2.5rem;
  padding-inline: 1.1rem;
  margin-top: 0;
  font-size: 0.74rem;
  text-decoration: none;
}

.account-addresses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 0.7rem;
}

.account-address {
  padding: 0.9rem 1rem;
  border: 1px solid var(--line);
}

.account-address--default {
  border-color: color-mix(in srgb, var(--primary) 40%, var(--line));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 14%, transparent);
}

.account-address header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.account-address header strong {
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.account-address header span {
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: var(--primary);
  color: var(--white);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.account-address p {
  color: var(--text-secondary);
  font-size: 0.74rem;
  line-height: 1.45;
}

.account-address__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.65rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--line);
}

.account-address__actions button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 0.66rem;
  font-weight: 650;
  cursor: pointer;
}

.account-address__actions button:hover {
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.account-address-form {
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  border: 1px dashed var(--line-strong);
}

.account-address-form h3 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-logo);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.account-address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.7rem;
}

.account-address-grid .account-field input {
  min-height: 2.6rem;
  font-size: 0.85rem;
}

.account-check {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.74rem;
  cursor: pointer;
}

.account-check input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
}

.account-address-form__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.account-address-form__actions .account-button {
  width: auto;
  min-height: 2.6rem;
  padding-inline: 1.2rem;
  font-size: 0.76rem;
}

.account-address-form__actions .account-switch {
  margin: 0;
  font-size: 0.74rem;
}

.account-empty {
  display: grid;
  justify-items: start;
  gap: 0.85rem;
  padding: 1.5rem 1rem;
  border: 1px dashed var(--line-strong);
}

.account-empty p {
  color: var(--text-secondary);
  font-size: 0.84rem;
}

.account-empty .account-button {
  width: auto;
  min-height: 2.6rem;
  padding-inline: 1.2rem;
  font-size: 0.76rem;
  text-decoration: none;
}

@media (max-width: 700px) {
  .account-page {
    padding: 1rem 0.85rem 1.5rem;
  }

  .account-panel--wide {
    padding: 1rem 0.85rem 1.25rem;
  }

  .account-hero {
    gap: 0.75rem;
  }

  .account-signout {
    order: 3;
    width: 100%;
  }

  .account-cart__row {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .account-cart__remove {
    grid-column: 2 / -1;
    justify-self: start;
  }

  .account-cart__actions {
    width: 100%;
  }

  .account-cart__actions .account-button {
    flex: 1;
  }
}

.account-button {
  display: flex;
  width: 100%;
  min-height: 3.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding-inline: 1rem;
  border: 1px solid var(--brand-navy);
  background: var(--brand-navy);
  color: var(--white);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 650;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.account-button:hover:not(:disabled) {
  transform: translateY(-0.1rem);
  background: var(--brand-navy-deep);
}

.account-button:disabled,
.account-switch:disabled {
  cursor: wait;
  opacity: 0.65;
}

.account-button--google {
  border-color: var(--line-strong);
  background: var(--white);
  color: var(--ink);
}

.account-button--google:hover:not(:disabled) {
  background: var(--bg-subtle);
}

.account-button--secondary {
  margin-top: 1.25rem;
  border-color: var(--line-strong);
  background: transparent;
  color: var(--ink);
}

.account-button--secondary:hover:not(:disabled) {
  background: var(--white);
}

.account-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-block: 1.3rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.account-divider::before,
.account-divider::after {
  height: 1px;
  flex: 1;
  background: var(--line);
  content: '';
}

.account-form {
  display: grid;
  gap: 0.85rem;
}

.account-field {
  display: grid;
  gap: 0.4rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.account-field input {
  width: 100%;
  min-height: 3.15rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--line-strong);
  border-radius: 0;
  background: var(--white);
  color: var(--ink);
  font: inherit;
  font-size: 0.95rem;
}

.account-field input:focus-visible {
  border-color: var(--brand-navy);
  outline: 2px solid color-mix(in srgb, var(--brand-navy) 24%, transparent);
  outline-offset: 1px;
}

.account-panel__toggle {
  margin-top: 1.25rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
  text-align: center;
}

.account-panel__toggle button,
.account-switch {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--brand-navy);
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.account-switch {
  display: block;
  margin: 1rem auto 0;
}

.account-message {
  margin-block: 0.9rem;
  font-size: 0.84rem;
  line-height: 1.5;
}

.account-message--success {
  color: #236239;
}

.account-message--error {
  color: var(--rust);
}

.account-avatar {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--white);
  color: var(--brand-navy);
  font-size: 1.2rem;
  font-weight: 700;
}

.account-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-page__footer {
  color: var(--text-secondary);
  font-size: 0.76rem;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .account-button,
  .account-panel__toggle button,
  .account-switch {
    transition: none;
  }
}
</style>
