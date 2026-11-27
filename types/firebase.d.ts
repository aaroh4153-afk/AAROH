import type { Auth, User } from 'firebase/auth'
import type { Ref } from 'vue'

declare module '#app' {
  interface NuxtApp {
    $firebaseAuth: Auth | null
    $firebaseUser: Ref<User | null>
  }
}

export {}
