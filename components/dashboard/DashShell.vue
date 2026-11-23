<script setup lang="ts">
import { INSTAGRAM_URL } from '~/data/products'
import { useStore } from '~/composables/useStore'

const props = withDefaults(defineProps<{ variant?: 'brand' | 'admin' }>(), {
  variant: 'brand',
})

const route = useRoute()
const { pendingOrders } = useStore()

const collapsed = ref(false)
const mobileOpen = ref(false)

const brandNav = [
  { label: 'Overview', to: '/dashboard', icon: 'grid' },
  { label: 'Products', to: '/dashboard/products', icon: 'box' },
  { label: 'Orders', to: '/dashboard/orders', icon: 'receipt', badge: true },
  { label: 'Customers', to: '/dashboard/customers', icon: 'users' },
  { label: 'Reports', to: '/dashboard/reports', icon: 'chart' },
]

const adminNav = [
  { label: 'Order management', to: '/admin', icon: 'receipt', badge: true },
  { label: 'Products', to: '/admin/products', icon: 'box' },
  { label: 'Customers', to: '/admin/customers', icon: 'users' },
]

const nav = computed(() => (props.variant === 'admin' ? adminNav : brandNav))

const title = computed(() => {
  const metaTitle = route.meta.title
  if (typeof metaTitle === 'string' && metaTitle) return metaTitle
  return props.variant === 'admin' ? 'Admin console' : 'Overview'
})

function isActive(to: string) {
  if (to === '/dashboard' || to === '/admin') return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}

function closeMobile() {
  mobileOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <div class="studio-shell" :class="{ 'studio-shell--collapsed': collapsed }">
    <div v-if="mobileOpen" class="studio-backdrop" @click="closeMobile" />

    <aside class="studio-sidebar" :class="{ 'studio-sidebar--open': mobileOpen }">
      <div class="studio-sidebar__scroll">
        <div class="studio-brand">
          <NuxtLink to="/" class="studio-brand__logo" aria-label="AAROH. home">
            <span class="studio-brand__mark">A</span>
            <span class="studio-brand__word">
              AAROH.
              <small>{{ variant === 'admin' ? 'admin' : 'studio' }}</small>
            </span>
          </NuxtLink>

          <button
            class="studio-collapse"
            type="button"
            :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            @click="collapsed = !collapsed"
          >
            <DashIcon name="chevronLeft" :size="14" />
          </button>
        </div>

        <div class="studio-workspace">
          <span class="studio-workspace__avatar" aria-hidden="true">
            {{ variant === 'admin' ? 'AR' : 'AS' }}
          </span>
          <span class="studio-workspace__text">
            <strong>{{ variant === 'admin' ? 'AAROH. Platform' : 'Aaroh Studio' }}</strong>
            <small>{{ variant === 'admin' ? 'Admin access' : 'Brand owner' }}</small>
          </span>
          <DashIcon name="chevronDown" :size="14" class="studio-workspace__chevron" />
        </div>

        <nav class="studio-nav" :aria-label="variant === 'admin' ? 'Admin' : 'Studio'">
          <div class="studio-nav__group">
            <span class="studio-nav__label">Main menu</span>
            <NuxtLink
              v-for="item in nav"
              :key="item.to"
              :to="item.to"
              class="studio-nav__link"
              :class="{ 'studio-nav__link--active': isActive(item.to) }"
              :title="item.label"
            >
              <DashIcon :name="item.icon" :size="18" />
              <span class="studio-nav__text">{{ item.label }}</span>
              <span v-if="item.badge && pendingOrders.length" class="studio-nav__badge">
                {{ pendingOrders.length }}
              </span>
            </NuxtLink>
          </div>

          <div class="studio-nav__group">
            <span class="studio-nav__label">Sales channels</span>
            <a href="/" class="studio-nav__link" title="Online store">
              <DashIcon name="store" :size="18" />
              <span class="studio-nav__text">Online store</span>
              <span class="studio-nav__dot studio-nav__dot--live" aria-label="Live" />
            </a>
            <a
              :href="INSTAGRAM_URL"
              target="_blank"
              rel="noopener"
              class="studio-nav__link"
              title="Instagram shop"
            >
              <DashIcon name="instagram" :size="18" />
              <span class="studio-nav__text">Instagram shop</span>
              <DashIcon name="external" :size="12" class="studio-nav__external" />
            </a>
          </div>

          <div v-if="variant === 'brand'" class="studio-nav__group">
            <span class="studio-nav__label">Workspace</span>
            <NuxtLink
              to="/dashboard/settings"
              class="studio-nav__link"
              :class="{ 'studio-nav__link--active': isActive('/dashboard/settings') }"
              title="Store settings"
            >
              <DashIcon name="settings" :size="18" />
              <span class="studio-nav__text">Store settings</span>
            </NuxtLink>
          </div>
        </nav>
      </div>

      <div class="studio-sidebar__bottom">
        <div class="studio-sidebar__links">
          <NuxtLink v-if="variant === 'brand'" to="/admin" class="studio-sidebar__link">
            <DashIcon name="shield" :size="15" />
            <span>Admin console</span>
          </NuxtLink>
          <NuxtLink v-else to="/dashboard" class="studio-sidebar__link">
            <DashIcon name="store" :size="15" />
            <span>Brand studio</span>
          </NuxtLink>
          <NuxtLink to="/" class="studio-sidebar__link">
            <DashIcon name="external" :size="15" />
            <span>View storefront</span>
          </NuxtLink>
        </div>

        <div class="studio-user">
          <span class="studio-user__avatar">{{ variant === 'admin' ? 'AD' : 'HK' }}</span>
          <span class="studio-user__text">
            <strong>{{ variant === 'admin' ? 'AAROH. Admin' : 'Harshikesh' }}</strong>
            <small>{{ variant === 'admin' ? 'Platform admin' : 'Brand owner' }}</small>
          </span>
          <DashIcon name="dots" :size="16" class="studio-user__more" />
        </div>

        <p class="studio-demo-note">Database connected · live store</p>
      </div>
    </aside>

    <div class="studio-main">
      <header class="studio-topbar">
        <div class="studio-topbar__left">
          <button
            class="studio-menu"
            type="button"
            aria-label="Open studio menu"
            @click="mobileOpen = true"
          >
            <DashIcon name="menu" :size="18" />
          </button>

          <div class="studio-topbar__titles">
            <span>{{ variant === 'admin' ? 'Admin' : 'Studio' }}</span>
            <h1>{{ title }}</h1>
          </div>
        </div>

        <div class="studio-topbar__actions">
          <span class="studio-live"><i aria-hidden="true" />Store live</span>

          <button class="studio-topbar__icon" type="button" aria-label="Notifications">
            <DashIcon name="bell" :size="17" />
            <span aria-hidden="true" />
          </button>

          <NuxtLink
            v-if="variant === 'brand'"
            to="/dashboard/products/new"
            class="studio-btn studio-btn--primary studio-btn--icon studio-topbar__add"
            aria-label="Add product"
            title="Add product"
          >
            <DashIcon name="plus" :size="16" />
          </NuxtLink>
        </div>
      </header>

      <main class="studio-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.studio-shell {
  display: flex;
  min-height: 100vh;
  background: var(--studio-bg);
  color: var(--studio-ink);
}

.studio-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  width: 254px;
  height: 100vh;
  flex: none;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px;
  border-right: 1px solid var(--studio-line);
  background: #fff;
  transition: width 0.25s var(--ease);
}

.studio-sidebar__scroll {
  overflow: hidden;
}

.studio-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 4px 14px;
}

.studio-brand__logo {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--studio-ink);
  text-decoration: none;
}

.studio-brand__mark {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 4px;
  background: var(--primary);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 850;
}

.studio-brand__word {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-family: var(--font-logo);
  font-size: 1.12rem;
  font-weight: 850;
  letter-spacing: -0.04em;
}

.studio-brand__word small {
  color: var(--studio-muted);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.studio-collapse {
  display: grid;
  width: 26px;
  height: 26px;
  flex: none;
  place-items: center;
  padding: 0;
  border: 1px solid var(--studio-line);
  border-radius: 4px;
  background: #fff;
  color: var(--studio-muted);
  cursor: pointer;
}

.studio-collapse:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.studio-workspace {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  margin-bottom: 16px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #f9fafd;
}

.studio-workspace__avatar {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;
  border-radius: 8px;
  background: #fff;
  box-shadow: inset 0 0 0 1px var(--studio-line);
  color: var(--primary);
  font-size: 0.62rem;
  font-weight: 800;
}

.studio-workspace__text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  line-height: 1.25;
}

.studio-workspace__text strong {
  overflow: hidden;
  font-size: 0.76rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio-workspace__text small {
  color: var(--studio-muted);
  font-size: 0.6rem;
}

.studio-workspace__chevron {
  color: var(--studio-muted);
}

.studio-nav {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.studio-nav__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.studio-nav__label {
  padding: 0 10px;
  margin-bottom: 5px;
  color: #a3abbd;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.studio-nav__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 2px;
  color: #5b6478;
  font-size: 0.77rem;
  font-weight: 600;
  letter-spacing: 0.005em;
  text-decoration: none;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.studio-nav__link:hover {
  background: #f4f6fc;
  color: var(--studio-ink);
}

.studio-nav__link--active {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 10px 20px -14px rgba(13, 24, 120, 0.85);
}

.studio-nav__link--active:hover {
  background: var(--primary);
  color: #fff;
}

.studio-nav__text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio-nav__badge {
  display: inline-flex;
  min-width: 20px;
  height: 19px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 999px;
  background: #eef1f7;
  color: #5b6478;
  font-size: 0.58rem;
  font-weight: 750;
}

.studio-nav__link--active .studio-nav__badge {
  background: var(--studio-lime);
  color: #17300a;
}

.studio-nav__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c7cddb;
}

.studio-nav__dot--live {
  background: var(--studio-lime-deep);
  box-shadow: 0 0 0 3px rgba(146, 255, 95, 0.22);
}

.studio-nav__external {
  color: #a3abbd;
}

.studio-sidebar__bottom {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding-top: 12px;
}

.studio-sidebar__links {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--studio-line-soft);
}

.studio-sidebar__link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 2px;
  color: #7c869c;
  font-size: 0.68rem;
  font-weight: 600;
  text-decoration: none;
}

.studio-sidebar__link:hover {
  background: #f4f6fc;
  color: var(--primary);
}

.studio-user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fff;
}

.studio-user__avatar {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(140deg, #dbe4ff, #b9c9ff);
  color: #1a3bd6;
  font-size: 0.62rem;
  font-weight: 800;
}

.studio-user__text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  line-height: 1.3;
}

.studio-user__text strong {
  overflow: hidden;
  font-size: 0.74rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio-user__text small {
  color: var(--studio-muted);
  font-size: 0.6rem;
}

.studio-user__more {
  color: #a3abbd;
}

.studio-demo-note {
  color: #b0b7c6;
  font-size: 0.53rem;
  letter-spacing: 0.03em;
  text-align: center;
}

/* Main */
.studio-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.studio-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px clamp(16px, 2.4vw, 30px);
  border-bottom: 1px solid var(--studio-line);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
}

.studio-topbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.studio-menu {
  display: none;
  width: 36px;
  height: 36px;
  flex: none;
  place-items: center;
  padding: 0;
  border: 1px solid var(--studio-line);
  border-radius: 4px;
  background: #fff;
  color: var(--studio-ink);
  cursor: pointer;
}

.studio-topbar__titles {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.studio-topbar__titles > span {
  color: var(--studio-muted);
  font-size: 0.54rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.studio-topbar__titles h1 {
  margin: 2px 0 0;
  color: var(--studio-ink);
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.studio-topbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.studio-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--studio-line);
  border-radius: 999px;
  color: #667085;
  font-size: 0.63rem;
  font-weight: 650;
}

.studio-live i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--studio-lime-deep);
  box-shadow: 0 0 0 3px rgba(146, 255, 95, 0.22);
}

.studio-topbar__icon {
  position: relative;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--studio-line);
  border-radius: 4px;
  background: #fff;
  color: #5b6478;
  cursor: pointer;
}

.studio-topbar__icon > span {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--studio-orange);
}

.studio-content {
  width: 100%;
  max-width: 1440px;
  padding: clamp(18px, 2.4vw, 30px);
  margin-inline: auto;
}

/* Collapsed state */
.studio-shell--collapsed .studio-sidebar {
  width: 78px;
  padding-inline: 10px;
}

.studio-shell--collapsed .studio-brand {
  justify-content: center;
}

.studio-shell--collapsed .studio-brand__word,
.studio-shell--collapsed .studio-collapse,
.studio-shell--collapsed .studio-workspace__text,
.studio-shell--collapsed .studio-workspace__chevron,
.studio-shell--collapsed .studio-nav__label,
.studio-shell--collapsed .studio-nav__text,
.studio-shell--collapsed .studio-nav__badge,
.studio-shell--collapsed .studio-nav__external,
.studio-shell--collapsed .studio-sidebar__link span,
.studio-shell--collapsed .studio-user__text,
.studio-shell--collapsed .studio-user__more,
.studio-shell--collapsed .studio-demo-note {
  display: none;
}

.studio-shell--collapsed .studio-workspace,
.studio-shell--collapsed .studio-nav__link,
.studio-shell--collapsed .studio-sidebar__link,
.studio-shell--collapsed .studio-user {
  justify-content: center;
  padding-inline: 0;
}

.studio-shell--collapsed .studio-nav__dot {
  position: absolute;
  margin: 10px 0 0 14px;
}

.studio-shell--collapsed .studio-nav__link {
  position: relative;
}

@media (max-width: 1024px) {
  .studio-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 60;
    width: 270px;
    transform: translateX(-102%);
    transition: transform 0.28s var(--ease);
  }

  .studio-sidebar--open {
    transform: translateX(0);
  }

  .studio-backdrop {
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(11, 18, 32, 0.45);
    backdrop-filter: blur(2px);
  }

  .studio-menu {
    display: grid;
  }

  .studio-shell--collapsed .studio-sidebar {
    width: 270px;
  }

  .studio-shell--collapsed .studio-brand__word,
  .studio-shell--collapsed .studio-workspace__text,
  .studio-shell--collapsed .studio-workspace__chevron,
  .studio-shell--collapsed .studio-nav__label,
  .studio-shell--collapsed .studio-nav__text,
  .studio-shell--collapsed .studio-nav__badge,
  .studio-shell--collapsed .studio-nav__external,
  .studio-shell--collapsed .studio-sidebar__link span,
  .studio-shell--collapsed .studio-user__text,
  .studio-shell--collapsed .studio-user__more {
    display: initial;
  }

  .studio-shell--collapsed .studio-nav__label {
    display: block;
  }

  .studio-shell--collapsed .studio-nav__link,
  .studio-shell--collapsed .studio-sidebar__link,
  .studio-shell--collapsed .studio-user,
  .studio-shell--collapsed .studio-workspace {
    justify-content: flex-start;
    padding-inline: 10px;
  }

  .studio-shell--collapsed .studio-nav__dot {
    position: static;
    margin: 0;
  }
}

@media (max-width: 700px) {
  .studio-live {
    display: none;
  }

  .studio-topbar__add span {
    display: none;
  }

  .studio-topbar__add {
    width: 38px;
    padding: 0;
  }
}
</style>
