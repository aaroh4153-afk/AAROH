import type { AccountOverview, AccountProfile, AddressInput, UserAddress } from '~/data/account'
import type { Order } from '~/data/orders'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { isVerifiedAccount } from '~/utils/firebaseAuth'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string; message?: string } }).data
    if (data?.statusMessage || data?.message) return data.statusMessage || data.message || fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export async function accountFetch<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown } = {},
): Promise<T> {
  const { user } = useFirebaseAuth()
  const account = user.value
  if (!isVerifiedAccount(account) || !account) {
    throw new Error('Sign in with a verified account to continue.')
  }
  const token = await account.getIdToken()
  return await $fetch<T>(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const useAccount = () => {
  const { user } = useFirebaseAuth()
  const profile = useState<AccountProfile | null>('account-profile', () => null)
  const addresses = useState<UserAddress[]>('account-addresses', () => [])
  const orders = useState<Order[]>('account-orders', () => [])
  const overview = useState<AccountOverview | null>('account-overview', () => null)
  const loading = useState<boolean>('account-loading', () => false)
  const error = useState<string>('account-error', () => '')
  const loadedUid = useState<string>('account-loaded-uid', () => '')

  function reset() {
    profile.value = null
    addresses.value = []
    orders.value = []
    overview.value = null
    loadedUid.value = ''
    error.value = ''
  }

  /** Profile, addresses, orders, cart and saved pieces in a single request. */
  async function loadOverview() {
    const account = user.value
    if (!isVerifiedAccount(account) || !account) {
      reset()
      return null
    }

    loading.value = true
    error.value = ''
    try {
      const data = await accountFetch<AccountOverview>('/api/account/overview')
      overview.value = data
      profile.value = data.profile
      addresses.value = data.addresses
      orders.value = data.orders
      loadedUid.value = account.uid
      return data
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Your saved account details could not be loaded.')
      throw loadError
    } finally {
      loading.value = false
    }
  }

  async function loadProfile() {
    profile.value = await accountFetch<AccountProfile>('/api/account/profile')
    return profile.value
  }

  async function loadAddresses() {
    addresses.value = await accountFetch<UserAddress[]>('/api/account/addresses')
    return addresses.value
  }

  async function loadOrders() {
    orders.value = await accountFetch<Order[]>('/api/orders?mine=1')
    return orders.value
  }

  async function loadAll() {
    const account = user.value
    if (!isVerifiedAccount(account) || !account) {
      reset()
      return
    }
    loading.value = true
    error.value = ''
    try {
      await Promise.all([loadProfile(), loadAddresses(), loadOrders()])
      loadedUid.value = account.uid
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, 'Your saved account details could not be loaded.')
      throw loadError
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(input: { displayName: string; phone: string }) {
    profile.value = await accountFetch<AccountProfile>('/api/account/profile', {
      method: 'PATCH',
      body: input,
    })
    return profile.value
  }

  async function saveAddress(input: AddressInput, id?: string) {
    const saved = await accountFetch<UserAddress>(
      id ? `/api/account/addresses/${encodeURIComponent(id)}` : '/api/account/addresses',
      { method: id ? 'PATCH' : 'POST', body: input },
    )
    await loadAddresses()
    return saved
  }

  async function deleteAddress(id: string) {
    await accountFetch<{ ok: boolean }>(`/api/account/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    await loadAddresses()
  }

  async function makeDefaultAddress(id: string) {
    const address = addresses.value.find((entry) => entry.id === id)
    if (!address) return
    await saveAddress(
      {
        label: address.label,
        name: address.name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: true,
      },
      id,
    )
  }

  return {
    profile,
    addresses,
    orders,
    overview,
    loading,
    error,
    loadedUid,
    reset,
    loadOverview,
    loadProfile,
    loadAddresses,
    loadOrders,
    loadAll,
    updateProfile,
    saveAddress,
    deleteAddress,
    makeDefaultAddress,
  }
}
