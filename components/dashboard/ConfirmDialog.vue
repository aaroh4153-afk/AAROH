<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    tone?: 'danger' | 'primary'
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', tone: 'danger' },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm')
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="modelValue" class="confirm">
        <div class="confirm__backdrop" @click="close" />
        <div class="confirm__panel" role="dialog" aria-modal="true" :aria-label="title">
          <span class="confirm__icon" :class="`confirm__icon--${tone}`">
            <DashIcon :name="tone === 'danger' ? 'warning' : 'check'" :size="20" />
          </span>
          <h2>{{ title }}</h2>
          <p>{{ message }}</p>
          <div class="confirm__actions">
            <button class="studio-btn" type="button" @click="close">{{ cancelLabel }}</button>
            <button
              class="studio-btn"
              :class="tone === 'danger' ? 'studio-btn--danger' : 'studio-btn--primary'"
              type="button"
              @click="confirm"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 20px;
}

.confirm__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(11, 18, 32, 0.42);
  backdrop-filter: blur(2px);
}

.confirm__panel {
  position: relative;
  width: min(400px, 100%);
  padding: 24px;
  border-radius: 2px;
  background: #fff;
  box-shadow: 0 40px 80px -40px rgba(16, 24, 40, 0.55);
  text-align: center;
}

.confirm__icon {
  display: grid;
  width: 42px;
  height: 42px;
  margin: 0 auto 12px;
  place-items: center;
  border-radius: 2px;
}

.confirm__icon--danger {
  background: #ffeded;
  color: #c02626;
}

.confirm__icon--primary {
  background: var(--studio-navy-soft);
  color: var(--primary);
}

.confirm__panel h2 {
  margin: 0;
  color: var(--studio-ink);
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.confirm__panel p {
  margin: 7px auto 0;
  max-width: 34ch;
  color: var(--studio-muted);
  font-size: 0.75rem;
  line-height: 1.55;
}

.confirm__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-enter-active .confirm__panel,
.confirm-leave-active .confirm__panel {
  transition: transform 0.22s var(--ease);
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}

.confirm-enter-from .confirm__panel,
.confirm-leave-to .confirm__panel {
  transform: translateY(8px) scale(0.98);
}
</style>
