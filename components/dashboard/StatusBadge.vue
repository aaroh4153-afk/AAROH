<script setup lang="ts">
import type { DeliveryStatus, PaymentStatus } from '~/data/orders'

const props = withDefaults(
  defineProps<{
    status: DeliveryStatus | PaymentStatus | 'active' | 'draft' | 'archived' | 'live'
    tone?: 'solid' | 'soft'
  }>(),
  { tone: 'soft' },
)

const variants: Record<string, string> = {
  // Delivery
  Processing: 'warn',
  Packed: 'info',
  Shipped: 'violet',
  Delivered: 'success',
  Cancelled: 'danger',
  Returned: 'neutral',
  // Payment
  Paid: 'success',
  Pending: 'warn',
  Refunded: 'neutral',
  Failed: 'danger',
  // Product
  active: 'success',
  draft: 'neutral',
  archived: 'neutral',
  live: 'success',
}

const variant = computed(() => variants[props.status] ?? 'neutral')
</script>

<template>
  <span class="studio-badge" :class="[`studio-badge--${variant}`, { 'studio-badge--solid': tone === 'solid' }]">
    {{ status }}
  </span>
</template>

<style scoped>
.studio-badge--solid {
  color: #fff;
}

.studio-badge--solid.studio-badge--success {
  background: var(--studio-green);
}

.studio-badge--solid.studio-badge--warn {
  background: #d97706;
}

.studio-badge--solid.studio-badge--info {
  background: var(--primary);
}

.studio-badge--solid.studio-badge--violet {
  background: #7c3aed;
}

.studio-badge--solid.studio-badge--danger {
  background: #dc2626;
}

.studio-badge--solid.studio-badge--neutral {
  background: #667085;
}
</style>
