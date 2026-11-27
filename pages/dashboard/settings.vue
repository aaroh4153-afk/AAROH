<script setup lang="ts">
import {
  defaultPageBanners,
  type CampaignBanner,
  type PageBanners,
  type ShopBanner,
  type StoreBanner,
} from '~/data/banners'
import { cloneSettings, type StoryReview } from '~/data/settings'

definePageMeta({ chrome: false, title: 'Store settings', layout: 'studio' })

useHead({ title: 'Store settings · AAROH. Studio' })

const { settings, saveSettings } = useStore()
const { auth } = useFirebaseAuth()
const { session: studioSession } = useStudioSession()

const form = reactive({ ...settings.value.brand })
const storefront = reactive({ ...settings.value.storefront })
const story = reactive(cloneSettings(settings.value).story)
const storyImages = ref<string[]>(story.image ? [story.image] : [])
const payments = reactive({ ...settings.value.payments })
const notifications = reactive({ ...settings.value.notifications })

const savedNote = ref('')
const saveError = ref('')
const bannerImages = ref<string[]>([])
const campaignBanner = reactive<CampaignBanner>({ ...defaultPageBanners.campaign })
const campaignImages = ref<string[]>([])
const shopBanner = reactive<ShopBanner>({ ...defaultPageBanners.shop })
const shopImages = ref<string[]>([])
const bannersLoading = ref(true)
const bannerLoadFailed = ref(false)
const saving = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  try {
    const [banners, pages] = await Promise.all([
      $fetch<StoreBanner[]>('/api/banners'),
      $fetch<PageBanners>('/api/page-banners'),
    ])
    bannerImages.value = banners.map((banner) => banner.image)
    Object.assign(campaignBanner, pages.campaign)
    Object.assign(shopBanner, pages.shop)
    campaignImages.value = pages.campaign.image ? [pages.campaign.image] : []
    shopImages.value = pages.shop.image ? [pages.shop.image] : []
  } catch (error) {
    console.error('[aaroh/banners] Could not load banners in store settings.', error)
    bannerLoadFailed.value = true
    saveError.value = 'Could not load the current banners. Reload before saving to avoid replacing them.'
  } finally {
    bannersLoading.value = false
  }
})

function addStoryReview() {
  if (story.reviews.length >= 3) return
  const review: StoryReview = { text: '', name: '', role: '', stars: 5 }
  story.reviews.push(review)
}

function removeStoryReview(index: number) {
  story.reviews.splice(index, 1)
}

async function save(label = 'Store settings saved.') {
  if (saving.value || bannersLoading.value || bannerLoadFailed.value) return

  saving.value = true
  saveError.value = ''

  try {
    const currentUser = auth?.currentUser
    if (!currentUser && !studioSession.value) {
      throw new Error('Sign in to the studio before saving settings.')
    }

    const authorization = currentUser ? `Bearer ${await currentUser.getIdToken()}` : undefined
    await saveSettings({
      brand: { ...form },
      storefront: { ...storefront },
      story: {
        ...story,
        image: storyImages.value[0] ?? '',
        reviews: story.reviews.map((review) => ({ ...review })),
      },
      payments: { ...payments },
      notifications: { ...notifications },
    }, authorization)

    await $fetch<StoreBanner[]>('/api/banners', {
      method: 'PUT',
      headers: authorization ? { authorization } : undefined,
      body: {
        banners: bannerImages.value.map((image, index) => ({
          image,
          altText: `AAROH. editorial banner ${index + 1}`,
        })),
      },
    })

    await $fetch<PageBanners>('/api/page-banners', {
      method: 'PUT',
      headers: authorization ? { authorization } : undefined,
      body: {
        campaign: { ...campaignBanner, image: campaignImages.value[0] ?? '' },
        shop: { ...shopBanner, image: shopImages.value[0] ?? '' },
      },
    })

    savedNote.value = label
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      savedNote.value = ''
    }, 2800)
  } catch (error) {
    console.error('[aaroh/settings] Could not save store settings or banners.', error)
    const statusMessage =
      typeof error === 'object' && error !== null && 'statusMessage' in error
        ? String(error.statusMessage)
        : ''
    saveError.value =
      statusMessage ||
      (error instanceof Error
        ? error.message
        : 'Could not save your changes. Check the database connection and try again.')
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="settings">
    <header class="studio-page-head">
      <div>
        <h1 class="studio-page-title">Store settings</h1>
        <p class="studio-page-sub">How the studio appears at checkout, on the storefront and in your inbox.</p>
      </div>
      <div class="studio-page-actions">
        <NuxtLink v-if="!studioSession" class="studio-btn" to="/dashboard">Sign in to save</NuxtLink>
        <button
          class="studio-btn studio-btn--primary"
          type="button"
          :disabled="saving || bannersLoading || bannerLoadFailed"
          @click="save()"
        >
          <DashIcon name="check" :size="15" />
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </header>

    <Transition name="settings-toast">
      <div v-if="savedNote" class="settings__toast">
        <DashIcon name="check" :size="14" />
        {{ savedNote }}
      </div>
    </Transition>
    <p v-if="saveError" class="studio-error" role="alert">{{ saveError }}</p>

    <div class="settings__grid">
      <div class="settings__main">
        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Brand profile</h2>
              <p class="studio-card__sub">Shown on invoices, order emails and the contact page.</p>
            </div>
          </div>
          <div class="studio-card__body settings__stack">
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Store name</span>
                <input v-model="form.storeName" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Legal entity</span>
                <input v-model="form.legalName" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Support email</span>
                <input v-model="form.email" class="studio-input" type="email" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Phone</span>
                <input v-model="form.phone" class="studio-input" type="tel" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Instagram</span>
                <input v-model="form.instagram" class="studio-input" type="url" />
              </label>
              <label class="studio-field">
                <span class="studio-label">GSTIN</span>
                <input v-model="form.gstin" class="studio-input" type="text" />
              </label>
            </div>
            <label class="studio-field">
              <span class="studio-label">Registered address</span>
              <textarea v-model="form.address" class="studio-textarea" rows="2" />
            </label>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Editorial banners</h2>
              <p class="studio-card__sub">Two image-led panels shown below Ready-to-wear.</p>
            </div>
          </div>
          <div class="studio-card__body settings__stack">
            <ImageUploader
              v-model="bannerImages"
              :max="2"
              :max-file-size="1048576"
              image-label="Editorial banner"
              accept="image/png,image/jpeg,image/webp"
            />
            <p class="studio-hint">
              Images are saved in Neon and served on the storefront. Use PNG, JPEG or WebP under 1 MB each.
            </p>
            <p v-if="!studioSession" class="studio-hint" role="status">
              Sign in with the studio owner email and password to save settings and banners.
            </p>
            <p v-if="bannersLoading" class="studio-hint" role="status">Loading current banners…</p>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Homepage campaign</h2>
              <p class="studio-card__sub">
                The full-width campaign panel at the bottom of the home page.
              </p>
            </div>
          </div>
          <div class="studio-card__body settings__stack">
            <ImageUploader
              v-model="campaignImages"
              :max="1"
              :max-file-size="1048576"
              image-label="Campaign image"
              accept="image/png,image/jpeg,image/webp"
            />
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Section label</span>
                <input v-model="campaignBanner.label" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Season line</span>
                <input v-model="campaignBanner.season" class="studio-input" type="text" />
              </label>
            </div>
            <label class="studio-field">
              <span class="studio-label">Headline</span>
              <textarea v-model="campaignBanner.title" class="studio-textarea" rows="2" />
            </label>
            <label class="studio-field">
              <span class="studio-label">Description</span>
              <textarea v-model="campaignBanner.note" class="studio-textarea" rows="3" />
            </label>
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Button label</span>
                <input v-model="campaignBanner.ctaLabel" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Button link</span>
                <input v-model="campaignBanner.ctaHref" class="studio-input" type="text" placeholder="/shop" />
              </label>
            </div>
            <label class="studio-field">
              <span class="studio-label">Image alt text</span>
              <input v-model="campaignBanner.altText" class="studio-input" type="text" />
            </label>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Shop page banner</h2>
              <p class="studio-card__sub">
                The leading image on the shop page. Remove the image to hide this banner.
              </p>
            </div>
          </div>
          <div class="studio-card__body settings__stack">
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Title</span>
                <input
                  v-model="shopBanner.title"
                  class="studio-input"
                  type="text"
                  maxlength="200"
                  placeholder="Everyday essentials, made to be worn."
                />
              </label>
              <label class="studio-field">
                <span class="studio-label">Subtitle</span>
                <input
                  v-model="shopBanner.note"
                  class="studio-input"
                  type="text"
                  maxlength="500"
                  placeholder="Small-batch hoodies, shirts and layers in a quiet palette."
                />
              </label>
            </div>
            <ImageUploader
              v-model="shopImages"
              :max="1"
              :max-file-size="1048576"
              image-label="Shop banner"
              accept="image/png,image/jpeg,image/webp"
            />
          </div>
        </section>

        <section class="studio-card">
          <header class="studio-card__head">
            <h2 class="studio-card__title">Our story</h2>
          </header>
          <section class="studio-card__body settings__stack">
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Story badge</span>
                <input v-model="story.badge" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Home heading</span>
                <input v-model="story.heading" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Page eyebrow</span>
                <input v-model="story.eyebrow" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Page title</span>
                <input v-model="story.title" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Page title accent</span>
                <input v-model="story.titleAccent" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Note label</span>
                <input v-model="story.noteEyebrow" class="studio-input" type="text" />
              </label>
            </div>
            <label class="studio-field">
              <span class="studio-label">Home introduction</span>
              <textarea v-model="story.lead" class="studio-textarea" rows="3" />
            </label>
            <label class="studio-field">
              <span class="studio-label">Story page introduction</span>
              <textarea v-model="story.intro" class="studio-textarea" rows="3" />
            </label>
            <label class="studio-field">
              <span class="studio-label">Studio note</span>
              <textarea v-model="story.note" class="studio-textarea" rows="4" />
            </label>
            <ImageUploader
              v-model="storyImages"
              :max="1"
              :max-file-size="1048576"
              image-label="Story image"
              accept="image/png,image/jpeg,image/webp"
            />
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Image alt text</span>
                <input v-model="story.imageAlt" class="studio-input" type="text" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Image caption</span>
                <input v-model="story.caption" class="studio-input" type="text" />
              </label>
            </div>
          </section>
        </section>

        <section class="studio-card">
          <header class="studio-card__head">
            <h2 class="studio-card__title">Customer reviews</h2>
            <button
              class="studio-btn studio-btn--sm"
              type="button"
              :disabled="story.reviews.length >= 3"
              @click="addStoryReview"
            >
              Add review
            </button>
          </header>
          <section class="studio-card__body settings__stack">
            <p v-if="!story.reviews.length" class="studio-hint">
              No reviews are shown until you add real customer feedback here.
            </p>
            <label v-for="(review, index) in story.reviews" :key="index" class="studio-field">
              <span class="studio-label">Review {{ index + 1 }}</span>
              <textarea v-model="review.text" class="studio-textarea" rows="3" />
              <span class="studio-grid-2">
                <input v-model="review.name" class="studio-input" type="text" placeholder="Customer name" />
                <input v-model="review.role" class="studio-input" type="text" placeholder="Role or city" />
              </span>
              <span class="studio-hint">
                Rating
                <select v-model.number="review.stars" class="studio-select" aria-label="Review rating">
                  <option :value="1">1 star</option>
                  <option :value="2">2 stars</option>
                  <option :value="3">3 stars</option>
                  <option :value="4">4 stars</option>
                  <option :value="5">5 stars</option>
                </select>
                <button class="studio-btn studio-btn--sm" type="button" @click="removeStoryReview(index)">
                  Remove
                </button>
              </span>
            </label>
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Rating summary</span>
                <input v-model="story.rating" class="studio-input" type="text" placeholder="4.9/5" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Rating note</span>
                <input v-model="story.ratingNote" class="studio-input" type="text" />
              </label>
            </div>
          </section>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Shipping &amp; tax</h2>
              <p class="studio-card__sub">Applied at checkout across India.</p>
            </div>
          </div>
          <div class="studio-card__body settings__stack">
            <div class="studio-grid-2">
              <label class="studio-field">
                <span class="studio-label">Free shipping above <span>₹</span></span>
                <input v-model.number="form.freeShipping" class="studio-input" type="number" min="0" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Flat rate <span>₹</span></span>
                <input v-model.number="form.flatRate" class="studio-input" type="number" min="0" />
              </label>
              <label class="studio-field">
                <span class="studio-label">Currency</span>
                <select v-model="form.currency" class="studio-select">
                  <option value="INR">INR — Indian rupee</option>
                  <option value="USD" disabled>USD — coming later</option>
                </select>
              </label>
              <label class="studio-field">
                <span class="studio-label">COD order limit <span>₹</span></span>
                <input v-model.number="form.codLimit" class="studio-input" type="number" min="0" />
              </label>
            </div>
            <p class="studio-hint">
              Orders below the free-shipping threshold are charged the flat rate. Prices include GST.
            </p>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Payment methods</h2>
              <p class="studio-card__sub">Toggle what shoppers can use at checkout.</p>
            </div>
          </div>
          <div class="studio-card__body settings__options">
            <label class="settings__option">
              <span class="settings__option-icon"><DashIcon name="wallet" :size="16" /></span>
              <span class="settings__option-text">
                <strong>UPI</strong>
                <small>GPay, PhonePe, Paytm and any UPI app</small>
              </span>
              <input v-model="payments.upi" type="checkbox" class="settings__switch" />
            </label>
            <label class="settings__option">
              <span class="settings__option-icon"><DashIcon name="card" :size="16" /></span>
              <span class="settings__option-text">
                <strong>Cards</strong>
                <small>Visa, Mastercard, RuPay and Amex</small>
              </span>
              <input v-model="payments.cards" type="checkbox" class="settings__switch" />
            </label>
            <label class="settings__option">
              <span class="settings__option-icon"><DashIcon name="store" :size="16" /></span>
              <span class="settings__option-text">
                <strong>Net banking</strong>
                <small>All major Indian banks</small>
              </span>
              <input v-model="payments.netbanking" type="checkbox" class="settings__switch" />
            </label>
            <label class="settings__option">
              <span class="settings__option-icon"><DashIcon name="truck" :size="16" /></span>
              <span class="settings__option-text">
                <strong>Cash on delivery</strong>
                <small>Available up to {{ formatPrice(form.codLimit) }}</small>
              </span>
              <input v-model="payments.cod" type="checkbox" class="settings__switch" />
            </label>
          </div>
        </section>
      </div>

      <div class="settings__side">
        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Storefront</h2>
              <p class="studio-card__sub">What shoppers see today.</p>
            </div>
          </div>
          <div class="studio-card__body settings__stack">
            <div class="settings__live" :class="{ 'settings__live--off': !storefront.live }">
              <span class="settings__live-dot" />
              <div>
                <strong>{{ storefront.live ? 'Store is live' : 'Store is paused' }}</strong>
                <small>{{ storefront.live ? 'Customers can browse and check out.' : 'The storefront shows a holding page.' }}</small>
              </div>
              <input v-model="storefront.live" type="checkbox" class="settings__switch" />
            </div>

            <label class="studio-field">
              <span class="studio-label">Featured collection</span>
              <select v-model="storefront.featuredCollection" class="studio-select">
                <option value="core-blues">The Core Blues</option>
                <option value="everyday">Everyday Shirts</option>
                <option value="studio-drop">Studio Drop 02</option>
                <option value="layering">The Layering Edit</option>
              </select>
            </label>

            <label class="studio-field">
              <span class="studio-label">Announcement bar</span>
              <textarea v-model="storefront.announcement" class="studio-textarea" rows="2" maxlength="110" />
              <span class="studio-hint">{{ storefront.announcement.length }}/110 characters</span>
            </label>

            <NuxtLink to="/" class="studio-btn">
              <DashIcon name="external" :size="14" />
              Open storefront
            </NuxtLink>
          </div>
        </section>

        <section class="studio-card">
          <div class="studio-card__head">
            <div>
              <h2 class="studio-card__title">Notifications</h2>
              <p class="studio-card__sub">Sent to {{ form.email }}.</p>
            </div>
          </div>
          <div class="studio-card__body settings__options">
            <label class="studio-check settings__check">
              <input v-model="notifications.newOrder" type="checkbox" />
              New order placed
            </label>
            <label class="studio-check settings__check">
              <input v-model="notifications.lowStock" type="checkbox" />
              Stock drops below 3 units
            </label>
            <label class="studio-check settings__check">
              <input v-model="notifications.weeklyDigest" type="checkbox" />
              Weekly sales digest
            </label>
          </div>
        </section>

      </div>
    </div>

  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  align-items: start;
  gap: 14px;
}

.settings__main,
.settings__side,
.settings__stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings__stack {
  gap: 13px;
}

.settings__options {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.settings__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--studio-line);
  border-radius: 11px;
  cursor: pointer;
}

.settings__option:hover {
  border-color: #d6dcec;
  background: #fbfcff;
}

.settings__option-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;
  border-radius: 8px;
  background: #f1f4ff;
  color: var(--primary);
}

.settings__option-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.settings__option-text strong {
  color: var(--studio-ink);
  font-size: 0.75rem;
  font-weight: 650;
}

.settings__option-text small {
  color: var(--studio-muted);
  font-size: 0.62rem;
}

.settings__switch {
  width: 36px;
  height: 20px;
  flex: none;
  accent-color: var(--primary);
  cursor: pointer;
}

.settings__live {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 12px;
  border: 1px solid #c8f0d5;
  border-radius: 11px;
  background: #f3fdf6;
}

.settings__live--off {
  border-color: var(--studio-line);
  background: #f8f9fc;
}

.settings__live-dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--studio-green);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.14);
}

.settings__live--off .settings__live-dot {
  background: #a3abbd;
  box-shadow: none;
}

.settings__live div {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.settings__live strong {
  color: var(--studio-ink);
  font-size: 0.72rem;
  font-weight: 650;
}

.settings__live small {
  color: var(--studio-muted);
  font-size: 0.6rem;
}

.settings__check {
  padding: 6px 2px;
}

.settings__danger {
  border-color: #ffe3e3;
}

.settings__toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 70;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border: 1px solid #c8f0d5;
  border-radius: 10px;
  background: #f0fdf4;
  box-shadow: 0 18px 40px -24px rgba(16, 24, 40, 0.6);
  color: #14804a;
  font-size: 0.72rem;
  font-weight: 650;
}

.settings-toast-enter-active,
.settings-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.settings-toast-enter-from,
.settings-toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 980px) {
  .settings__grid {
    grid-template-columns: 1fr;
  }
}
</style>
