<script setup lang="ts">
interface Point {
  label: string
  value: number
}

const props = withDefaults(
  defineProps<{
    data: Point[]
    height?: number
    accent?: string
    formatter?: (value: number) => string
    showGrid?: boolean
  }>(),
  { height: 220, accent: '#0d1878', showGrid: true },
)

const WIDTH = 720
const PAD_X = 6
const PAD_TOP = 18
const PAD_BOTTOM = 14
const gradientId = `trend-${useId()}`

const format = computed(() => props.formatter ?? ((value: number) => String(value)))

const max = computed(() => Math.max(1, ...props.data.map((point) => point.value)))
const min = computed(() => Math.min(0, ...props.data.map((point) => point.value)))

const coords = computed(() => {
  const span = max.value - min.value || 1
  const usableW = WIDTH - PAD_X * 2
  const usableH = props.height - PAD_TOP - PAD_BOTTOM
  return props.data.map((point, index) => {
    const x = PAD_X + (props.data.length === 1 ? usableW / 2 : (index / (props.data.length - 1)) * usableW)
    const y = PAD_TOP + usableH - ((point.value - min.value) / span) * usableH
    return { ...point, x, y, index }
  })
})

/** Catmull-Rom → cubic bezier for a soft, editorial line. */
const linePath = computed(() => {
  const points = coords.value
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`

  let path = `M ${points[0]!.x} ${points[0]!.y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index]!
    const p1 = points[index]!
    const p2 = points[index + 1]!
    const p3 = points[index + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return path
})

const areaPath = computed(() => {
  const points = coords.value
  if (!points.length) return ''
  const bottom = props.height - PAD_BOTTOM
  return `${linePath.value} L ${points[points.length - 1]!.x} ${bottom} L ${points[0]!.x} ${bottom} Z`
})

const gridLines = computed(() => {
  const usableH = props.height - PAD_TOP - PAD_BOTTOM
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => PAD_TOP + usableH * ratio)
})

const hovered = ref<number | null>(null)

const active = computed(() =>
  hovered.value === null ? null : coords.value[hovered.value],
)

const activeLeft = computed(() =>
  active.value ? `${(active.value.x / WIDTH) * 100}%` : '0%',
)
</script>

<template>
  <div class="trend" :style="{ '--accent': accent }">
    <div class="trend__canvas" :style="{ aspectRatio: `${WIDTH} / ${height}` }">
      <svg
        :viewBox="`0 0 ${WIDTH} ${height}`"
        class="trend__svg"
        role="img"
        :aria-label="`Trend chart across ${data.length} points`"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="accent" stop-opacity="0.22" />
            <stop offset="100%" :stop-color="accent" stop-opacity="0" />
          </linearGradient>
        </defs>

        <g v-if="showGrid">
          <line
            v-for="(line, index) in gridLines"
            :key="index"
            :x1="0"
            :x2="WIDTH"
            :y1="line"
            :y2="line"
            class="trend__grid"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <path :d="areaPath" :fill="`url(#${gradientId})`" />
        <path
          :d="linePath"
          fill="none"
          :stroke="accent"
          stroke-width="2.2"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />

        <line
          v-if="active"
          :x1="active.x"
          :x2="active.x"
          :y1="PAD_TOP - 8"
          :y2="height - PAD_BOTTOM"
          class="trend__cursor"
          vector-effect="non-scaling-stroke"
        />
        <circle
          v-if="active"
          :cx="active.x"
          :cy="active.y"
          r="4.5"
          :fill="accent"
          class="trend__dot"
          vector-effect="non-scaling-stroke"
        />

        <rect
          v-for="point in coords"
          :key="point.index"
          :x="point.x - WIDTH / (coords.length * 2)"
          :y="0"
          :width="WIDTH / coords.length"
          :height="height"
          fill="transparent"
          @pointerenter="hovered = point.index"
          @pointerleave="hovered = null"
        />
      </svg>

      <div
        v-if="active"
        class="trend__tip"
        :style="{ left: activeLeft, top: `${(active.y / height) * 100}%` }"
      >
        <span>{{ active.label }}</span>
        <strong>{{ format(active.value) }}</strong>
      </div>
    </div>

    <div class="trend__axis">
      <span v-for="(point, index) in data" :key="point.label + index">
        {{ index % 2 === 0 || data.length <= 8 ? point.label : '' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.trend {
  width: 100%;
}

.trend__canvas {
  position: relative;
  width: 100%;
}

.trend__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.trend__grid {
  stroke: #eef0f6;
  stroke-width: 1;
}

.trend__cursor {
  stroke: #c9d1e4;
  stroke-dasharray: 3 4;
}

.trend__dot {
  stroke: #fff;
  stroke-width: 2.5;
}

.trend__tip {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 9px;
  border: 1px solid var(--studio-line);
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 10px 26px -18px rgba(16, 24, 40, 0.5);
  transform: translate(-50%, calc(-100% - 12px));
  pointer-events: none;
  white-space: nowrap;
}

.trend__tip span {
  color: var(--studio-muted);
  font-size: 0.54rem;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.trend__tip strong {
  color: var(--studio-ink);
  font-size: 0.73rem;
  font-weight: 750;
}

.trend__axis {
  display: flex;
  justify-content: space-between;
  gap: 2px;
  padding-top: 6px;
  color: #a3abbd;
  font-size: 0.52rem;
  font-weight: 650;
  letter-spacing: 0.03em;
}

.trend__axis span {
  flex: 1;
  text-align: center;
  white-space: nowrap;
}
</style>
