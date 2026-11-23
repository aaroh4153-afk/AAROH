<script setup lang="ts">
import { mountTechText } from './bits/techTextEngine.js'

const props = withDefaults(
  defineProps<{
    text?: string
    fontFamily?: string
    fontWeight?: number
    fontSize?: number
    letterSpacing?: number
    color?: string
    accentColor?: string
    align?: 'left' | 'center' | 'right'
    reach?: number
    softness?: number
    dashLength?: number
    dashGap?: number
    strokeWidth?: number
    lineStyle?: 'dashed' | 'solid'
    reveal?: 'area' | 'letter' | 'off'
    specks?: number
    selection?: boolean
    labels?: boolean
    draggable?: boolean
    bounce?: number
    sweep?: boolean
    speed?: number
    clickKick?: boolean
    intro?: 'none' | 'type' | 'assemble' | 'metrics'
    introDuration?: number
    guides?: boolean
  }>(),
  {
    text: 'React Bits',
    fontFamily: '',
    fontWeight: 600,
    fontSize: 150,
    letterSpacing: -0.05,
    color: 'currentColor',
    accentColor: 'currentColor',
    align: 'center',
    reach: 200,
    softness: 0.7,
    dashLength: 4,
    dashGap: 2,
    strokeWidth: 1.5,
    lineStyle: 'dashed',
    reveal: 'letter',
    specks: 15,
    selection: true,
    labels: true,
    draggable: true,
    bounce: 0.4,
    sweep: true,
    speed: 1,
    clickKick: true,
    intro: 'none',
    introDuration: 2,
    guides: false,
  },
)

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const settingsRef = { current: null as Record<string, unknown> | null }
const wakeRef = { current: () => {} }

watchEffect(() => {
  settingsRef.current = {
    text: props.text,
    fontFamily: props.fontFamily,
    fontWeight: props.fontWeight,
    fontSize: props.fontSize,
    letterSpacing: props.letterSpacing,
    color: props.color,
    accentColor: props.accentColor,
    align: props.align,
    reach: props.reach,
    softness: props.softness,
    dashLength: props.dashLength,
    dashGap: props.dashGap,
    strokeWidth: props.strokeWidth,
    lineStyle: props.lineStyle,
    reveal: props.reveal,
    specks: props.specks,
    selection: props.selection,
    labels: props.labels,
    draggable: props.draggable,
    bounce: props.bounce,
    sweep: props.sweep,
    speed: props.speed,
    clickKick: props.clickKick,
    intro: props.intro,
    introDuration: props.introDuration,
    guides: props.guides,
  }
  wakeRef.current()
})

let teardown: (() => void) | null = null

onMounted(() => {
  if (!containerRef.value || !canvasRef.value) return
  teardown = mountTechText(containerRef.value, canvasRef.value, settingsRef, wakeRef)
})

onBeforeUnmount(() => {
  teardown?.()
})
</script>

<template>
  <div ref="containerRef" class="tech-text" role="img" :aria-label="text">
    <span class="tech-text__fallback" aria-hidden="true">{{ text }}</span>
    <canvas ref="canvasRef" class="tech-text-canvas" />
  </div>
</template>

<style>
.tech-text {
  position: relative;
  width: 100%;
  height: 100%;
  color: inherit;
  touch-action: pan-y;
  user-select: none;
}

.tech-text-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.tech-text__fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: clamp(4.5rem, 12vw, 9.5rem);
  letter-spacing: -0.06em;
  line-height: 0.9;
  pointer-events: none;
}

.tech-text.is-live .tech-text__fallback {
  visibility: hidden;
}
</style>
