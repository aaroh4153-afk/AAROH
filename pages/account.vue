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
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { requestFirebaseVerification, syncFirebaseUser } from '~/utils/firebaseAuth'

definePageMeta({ chrome: false })
useHead({ title: 'Your account · AAROH.' })

const route = useRoute()
const { auth, user, profile } = useFirebaseAuth()
const verifiedInSession = ref(false)
const verifiedProfile = computed(() =>
  user.value?.emailVerified || verifiedInSession.value ? user.value : null,
)
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
      return 'This site is not authorized in Firebase. Add localhost and your Vercel domain to Authentication’s authorized domains.'
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
      : 'Your profile is saved. The welcome email could not be sent; please check the SMTP settings.'
    errorMessage.value = ''
  } catch (error) {
    console.error('[aaroh/auth] Google sign-in succeeded, but profile sync failed.', error)
    errorMessage.value =
      'Google sign-in succeeded, but your profile could not be saved to Neon. Check DATABASE_URL and Neon connectivity.'
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
      <NuxtLink class="account-page__back" to="/shop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
          <path d="M9 12h12" />
        </svg>
        Back to shop
      </NuxtLink>
      <NuxtLink class="account-page__wordmark" to="/" aria-label="AAROH. home">AAROH.</NuxtLink>
      <span class="account-page__header-spacer" aria-hidden="true" />
    </header>

    <section class="account-panel" aria-labelledby="account-title">
      <template v-if="verifiedProfile">
        <div class="account-avatar" aria-hidden="true">
          <img
            v-if="profile?.photoUrl || verifiedProfile.photoURL"
            :src="profile?.photoUrl || verifiedProfile.photoURL || ''"
            alt=""
            referrerpolicy="no-referrer"
          />
          <span v-else>{{ (verifiedProfile.displayName || verifiedProfile.email || 'A').slice(0, 1).toUpperCase() }}</span>
        </div>
        <h1 id="account-title">Your account</h1>
        <p class="account-panel__sub">{{ profile?.displayName || verifiedProfile.displayName || verifiedProfile.email }}</p>
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
        <p v-else-if="!errorMessage" class="account-panel__sub" role="status">Loading your saved profile…</p>
        <p v-if="notice" class="account-message account-message--success" role="status">{{ notice }}</p>
        <p v-if="errorMessage" class="account-message account-message--error" role="alert">{{ errorMessage }}</p>
        <button class="account-button account-button--secondary" type="button" :disabled="busy" @click="signOutAccount">
          Sign out
        </button>
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
  color: var(--ink);
  font-family: var(--font-logo);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 750;
  letter-spacing: -0.07em;
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
