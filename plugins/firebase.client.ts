import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth'
import { syncFirebaseUser, type FirebaseProfile } from '~/utils/firebaseAuth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const user = useState<User | null>('aaroh.firebase.user', () => null)
  const profile = useState<FirebaseProfile | null>('aaroh.firebase.profile', () => null)
  let auth: Auth | null = null

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
      user.value = nextUser
      if (!nextUser?.emailVerified) {
        profile.value = null
        return
      }

      void syncFirebaseUser(nextUser)
        .then((result) => {
          profile.value = result.user
          if (!result.welcomeEmailSent) {
            console.warn('[aaroh/auth] Profile saved, but the welcome email was not sent.')
          }
        })
        .catch((error: unknown) => {
          console.error('[aaroh/auth] Could not sync the signed-in user.', error)
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
