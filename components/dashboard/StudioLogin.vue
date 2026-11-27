<script setup lang="ts">
const { signIn, pending, error } = useStudioSession()

const email = ref('aaroh4153@gmail.com')
const password = ref('')
const localError = ref('')

const message = computed(() => localError.value || error.value)

async function submit() {
  localError.value = ''

  if (!email.value.trim() || !password.value) {
    localError.value = 'Enter the studio email and password.'
    return
  }

  try {
    await signIn(email.value, password.value)
  } catch {
    // The composable keeps the server message for the alert below.
  }
}
</script>

<template>
  <main class="studio-login">
    <section class="studio-login__card" aria-labelledby="studio-login-title">
      <p class="studio-login__brand">AAROH.</p>
      <h1 id="studio-login-title">Studio sign in</h1>
      <p class="studio-login__sub">Use the owner email and password to manage products, orders and settings.</p>

      <form class="studio-login__form" @submit.prevent="submit">
        <label class="studio-login__field">
          <span>Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            placeholder="owner@aaroh.in"
          />
        </label>

        <label class="studio-login__field">
          <span>Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="Studio password"
          />
        </label>

        <p v-if="message" class="studio-login__error" role="alert">{{ message }}</p>

        <button class="studio-login__submit" type="submit" :disabled="pending">
          {{ pending ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <NuxtLink class="studio-login__back" to="/">← Back to the store</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.studio-login {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background: var(--studio-bg, #f5f4f1);
  color: var(--studio-ink, #111);
  font-family: var(--font-bricolage);
}

.studio-login__card {
  width: min(100%, 24rem);
  padding: clamp(1.5rem, 4vw, 2.25rem);
  border: 1px solid var(--studio-line, #e2e0da);
  background: var(--studio-card, #fff);
}

.studio-login__brand {
  color: var(--primary);
  font-family: var(--font-logo);
  font-size: 1.35rem;
  font-weight: 750;
  letter-spacing: 0.06em;
}

.studio-login h1 {
  margin: 0.9rem 0 0;
  font-size: 1.35rem;
  font-weight: 650;
}

.studio-login__sub {
  margin: 0.35rem 0 1.25rem;
  color: var(--text-secondary, #666);
  font-size: 0.82rem;
  line-height: 1.5;
}

.studio-login__form {
  display: grid;
  gap: 0.85rem;
}

.studio-login__field {
  display: grid;
  gap: 0.35rem;
}

.studio-login__field span {
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.studio-login__field input {
  min-height: 2.6rem;
  padding-inline: 0.75rem;
  border: 1px solid var(--studio-line, #e2e0da);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.9rem;
}

.studio-login__field input:focus {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.studio-login__error {
  margin: 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid #d9534f;
  background: #fdf1f0;
  color: #a5342f;
  font-size: 0.76rem;
  line-height: 1.4;
}

.studio-login__submit {
  min-height: 2.7rem;
  border: 0;
  background: var(--primary);
  color: #fff;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

.studio-login__submit:disabled {
  opacity: 0.6;
  cursor: progress;
}

.studio-login__back {
  display: inline-block;
  margin-top: 1.25rem;
  color: var(--text-secondary, #666);
  font-size: 0.72rem;
  text-decoration: none;
}

.studio-login__back:hover {
  color: var(--primary);
}
</style>
