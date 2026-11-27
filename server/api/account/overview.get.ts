import { loadCanonicalCart, loadUserAddresses, loadWishlist } from '~/server/utils/commerce'
import { ensureCustomerRecord, verifyCustomerRequest } from '~/server/utils/firebaseAuth'
import { loadOrdersForUser } from '~/server/utils/store'

/** GET /api/account/overview — everything the account card, tabs and checkout need. */
export default defineEventHandler(async (event) => {
  const decoded = await verifyCustomerRequest(event)
  const profile = await ensureCustomerRecord(decoded)

  const [addresses, orders, cart, wishlist] = await Promise.all([
    loadUserAddresses(decoded.uid),
    loadOrdersForUser(decoded.uid),
    loadCanonicalCart(decoded.uid),
    loadWishlist(decoded.uid),
  ])

  return { profile, addresses, orders, cart, wishlist }
})
