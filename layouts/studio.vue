<script setup lang="ts">
const { session, load } = useStudioSession()
const { loadAdminOrders } = useStore()

await load()

watch(
  () => session.value?.email,
  async (email) => {
    if (!email) return
    try {
      await loadAdminOrders()
    } catch (error) {
      console.warn('[aaroh/studio] Could not load the studio orders.', error)
    }
  },
  { immediate: true },
)
</script>

<template>
  <StudioLogin v-if="!session" />

  <DashShell v-else variant="brand">
    <slot />
  </DashShell>
</template>
