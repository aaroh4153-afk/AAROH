<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    value: string
    delta?: number
    deltaLabel?: string
    icon?: string
    spark?: number[]
    tone?: 'blue' | 'green' | 'orange' | 'violet'
  }>(),
  { tone: 'blue' },
)

const trendUp = computed(() => (props.delta ?? 0) >= 0)

const sparkPath = computed(() => {
  const values = props.spark ?? []
  if (values.length < 2) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = 26 - ((value - min) / span) * 22
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})
</script>

<template>
  <article class="stat" :class="`stat--${tone}`">
    <header class="stat__head">
      <span class="stat__label">{{ label }}</span>
      <span v-if="icon" class="stat__icon">
        <DashIcon :name="icon" :size="16" />
      </span>
    </header>

    <div class="stat__value">{{ value }}</div>

    <footer class="stat__foot">
      <span
        v-if="delta !== undefined"
        class="stat__delta"
        :class="{ 'stat__delta--down': !trendUp }"
      >
        <DashIcon :name="trendUp ? 'arrowUp' : 'arrowDown'" :size="11" :stroke-width="2.4" />
        {{ Math.abs(delta).toFixed(1) }}%
      </span>
      <span class="stat__note">{{ deltaLabel ?? 'vs previous period' }}</span>

      <svg v-if="sparkPath" class="stat__spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
        <path :d="sparkPath" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    </footer>
  </article>
</template>

<style scoped>
.stat {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 18px 14px;
  overflow: hidden;
  border: 1px solid var(--studio-line);
  border-radius: 2px;
  background: #fff;
  box-shadow: var(--studio-shadow);
}

.stat__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.stat__label {
  color: #667085;
  font-size: 0.67rem;
  font-weight: 650;
  letter-spacing: 0.02em;
}

.stat__icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 4px;
  background: var(--studio-navy-soft);
  color: var(--primary);
}

.stat__value {
  color: var(--studio-ink);
  font-size: clamp(1.35rem, 2.2vw, 1.72rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat__foot {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 22px;
}

.stat__delta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px 2px 4px;
  border-radius: 999px;
  background: var(--studio-lime-soft);
  color: #3d7a10;
  font-size: 0.6rem;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.stat__delta--down {
  background: #ffeded;
  color: #c02626;
}

.stat__note {
  overflow: hidden;
  color: #a3abbd;
  font-size: 0.59rem;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat__spark {
  width: 58px;
  height: 20px;
  flex: none;
  margin-left: auto;
  color: var(--primary);
  opacity: 0.65;
}

.stat--green .stat__icon {
  background: #eafbef;
  color: #14804a;
}

.stat--green .stat__spark {
  color: #14804a;
}

.stat--orange .stat__icon {
  background: #fff4e8;
  color: #b65a12;
}

.stat--orange .stat__spark {
  color: #d97706;
}

.stat--violet .stat__icon {
  background: #f2ecff;
  color: #6d3cd6;
}

.stat--violet .stat__spark {
  color: #7c3aed;
}
</style>
