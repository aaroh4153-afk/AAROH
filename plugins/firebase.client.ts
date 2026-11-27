import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth'
import { isVerifiedAccount, syncFirebaseUser, type FirebaseProfile } from '~/utils/firebaseAuth'
import { useCart } from '~/composables/useCart'
import { useWishlist } from '~/composables/useWishlist'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public
  const user = useState<User | null>('aaroh.firebase.user', () => null)
  const profile = useState<FirebaseProfile | null>('aaroh.firebase.profile', () => null)
  let auth: Auth | null = null
  let authGeneration = 0

  // Hydrate the cart after the first client render so the server-rendered
  // header and cart badge stay in sync during hydration.
  const { hydrate } = useCart()
  const { hydrate: hydrateWishlist } = useWishlist()
  nuxtApp.hook('app:mounted', () => {
    void hydrate()
    void hydrateWishlist()
  })

  if (
    !config.firebaseApiKey ||
    !config.firebaseAuthDomain ||
    !config.firebaseProjectId ||
    !config.firebaseAppId
  ) {
    console.warn('[aaroh/auth] Firebase web configuration is incomplete.')
  } else {
    const app =
      getApps().find((entry) => entry.name === 'aaroh-client') ??
      initializeApp(
        {
          apiKey: config.firebaseApiKey,
          authDomain: config.firebaseAuthDomain,
          projectId: config.firebaseProjectId,
          appId: config.firebaseAppId,
          messagingSenderId: config.firebaseMessagingSenderId,
        },
        'aaroh-client',
      )
    auth = getAuth(app)

    onAuthStateChanged(auth, (nextUser) => {
      const generation = ++authGeneration
      user.value = nextUser
      if (!nextUser || !isVerifiedAccount(nextUser)) {
        profile.value = null
        void hydrate()
        void hydrateWishlist()
        return
      }

      void syncFirebaseUser(nextUser)
        .then(async (result) => {
          if (generation !== authGeneration) return
          profile.value = result.user
          if (!result.welcomeEmailSent) {
            console.warn('[aaroh/auth] Profile saved, but the welcome email was not sent.')
          }
          await Promise.all([hydrate(), hydrateWishlist()])
        })
        .catch(async (error: unknown) => {
          if (generation !== authGeneration) return
          console.error('[aaroh/auth] Could not sync the signed-in user.', error)
          // Cart and wishlist ownership still follow the verified Firebase identity.
          await Promise.all([hydrate(), hydrateWishlist()])
        })
    })
  }

  return {
    provide: {
      firebaseAuth: auth,
      firebaseUser: user,
      firebaseProfile: profile,
    },
  }
})
