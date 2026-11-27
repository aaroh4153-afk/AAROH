<script setup lang="ts">
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Product } from '~/data/products'
import { getHeroRailImages } from '~/utils/productDisplayImages'

const props = defineProps<{ products?: Product[] }>()
const active = defineModel<number>('active', { default: 0 })
const router = useRouter()

// The six hanging hoodies drawn from the studio photography: one facing front, the
// rest in side profile along the rail. Live rail pieces replace them once the
// store has items marked for the hero.
const RAIL_FRONT_IMAGE = '/images/products/hoodie-hanger-front.png'
const RAIL_SIDE_IMAGE = '/images/products/hoodie-side.png'
const RAIL_PIECE_COUNT = 6

function railArtwork(index: number): Product {
  return {
    id: `hero-rail-${index}`,
    sku: `HERO-${index}`,
    name: 'AAROH. hoodie',
    colour: 'Royal Blue',
    hex: '#1E40AF',
    category: 'hoodies',
    collection: 'core-blues',
    price: 0,
    description: '',
    details: [],
    images: [RAIL_FRONT_IMAGE, RAIL_SIDE_IMAGE],
    sizes: [],
    status: 'active',
    featured: false,
    rail: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

const railSource = props.products?.length
  ? props.products
  : Array.from({ length: RAIL_PIECE_COUNT }, (_, index) => railArtwork(index))

const products = railSource.map((product) => ({
  ...product,
  images: getHeroRailImages(product),
}))

const root = ref<HTMLDivElement | null>(null)
const failed = ref(false)
const fallbackViews = ref<Record<string, 'front' | 'side'>>({})

const SPACING = 0.88
const FOV = 28
const PLANE_WIDTH = 1.48
const PLANE_HEIGHT = 1.98
const MAX_INDEX = Math.max(products.length - 1, 0)
const DEFAULT_CURSOR = 'grab'

interface Slot {
  item: THREE.Group
  frontMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  sideMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  hitBox: THREE.Mesh
  baseX: number
  currentX: number
  currentZ: number
  currentRotY: number
  currentScale: number
  viewBlend: number
}

const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
const hoverPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const hoverPoint = new THREE.Vector3()

let slots: Slot[] = []
let hitMeshes: THREE.Mesh[] = []
let textures: THREE.Texture[] = []

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let rig: THREE.Group | null = null
let pmrem: THREE.PMREMGenerator | null = null
let environmentTexture: THREE.Texture | null = null
let io: IntersectionObserver | null = null
let ro: ResizeObserver | null = null
let raf = 0
let running = false
let reduceMotion = false
let inside = false
let hovered = -1
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let dragOffset = 0
let compact = false
let stageHeight = 440
let contextLost = false

function setCursor(cursor: string) {
  if (root.value) root.value.style.cursor = cursor
}

function buildRail() {
  if (!rig) return
  const railLength = (products.length - 1) * SPACING + 3.2

  // Rich walnut rail, kept warm against the blue showroom.
  const woodRailMaterial = new THREE.MeshStandardMaterial({
    color: '#4e2d14',
    roughness: 0.45,
    metalness: 0.04,
  })

  const brassMaterial = new THREE.MeshStandardMaterial({
    color: '#8b6938',
    metalness: 0.85,
    roughness: 0.28,
  })

  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, railLength, 32), woodRailMaterial)
  rail.rotation.z = Math.PI / 2
  rig.add(rail)

  for (const side of [-1, 1]) {
    const bracket = new THREE.Group()
    bracket.position.x = (side * railLength) / 2

    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.035, 32), brassMaterial)
    flange.rotation.z = Math.PI / 2
    flange.position.x = side * 0.015

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.08, 32), brassMaterial)
    collar.rotation.z = Math.PI / 2
    collar.position.x = -side * 0.025

    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.052, 24, 16), brassMaterial)
    finial.position.x = side * 0.045

    bracket.add(flange, collar, finial)
    rig.add(bracket)
  }
}

function loadTexture(loader: THREE.TextureLoader, src: string) {
  const texture = loader.load(
    src,
    undefined,
    undefined,
    () => {
      console.warn(`[RailStage] Could not load texture: ${src}`)
    },
  )

  texture.colorSpace = THREE.SRGBColorSpace
  if (renderer) texture.anisotropy = Math.min(6, renderer.capabilities.getMaxAnisotropy())
  textures.push(texture)

  return texture
}

function buildTees() {
  if (!rig) return
  slots = []
  hitMeshes = []

  const loader = new THREE.TextureLoader()
  const geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT)
  geometry.translate(0, -PLANE_HEIGHT / 2 + 0.034, 0)

  const hitGeometry = new THREE.PlaneGeometry(PLANE_WIDTH * 0.95, PLANE_HEIGHT * 0.98)
  hitGeometry.translate(0, -PLANE_HEIGHT / 2 + 0.034, 0)
  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })

  const safeActive = THREE.MathUtils.clamp(Math.round(active.value) || 0, 0, MAX_INDEX)

  products.forEach((product, i) => {
    const item = new THREE.Group()
    const baseX = (i - (products.length - 1) / 2) * SPACING
    item.position.x = baseX

    const frontMaterial = new THREE.MeshBasicMaterial({
      map: loadTexture(loader, product.images[0] ?? ''),
      transparent: true,
      alphaTest: 0.05,
      opacity: i === safeActive ? 1 : 0,
      side: THREE.DoubleSide,
    })
    const frontMesh = new THREE.Mesh(geometry, frontMaterial)

    const sideMaterial = new THREE.MeshBasicMaterial({
      map: loadTexture(loader, product.images[1] ?? product.images[0] ?? ''),
      transparent: true,
      alphaTest: 0.05,
      opacity: i === safeActive ? 0 : 1,
      side: THREE.DoubleSide,
    })
    const sideMesh = new THREE.Mesh(geometry, sideMaterial)
    // Prevent z-fighting while the two views cross-fade.
    sideMesh.position.z = -0.002

    const hitBox = new THREE.Mesh(hitGeometry, hitMaterial)
    hitBox.userData.index = i

    item.add(frontMesh, sideMesh, hitBox)
    rig!.add(item)

    hitMeshes.push(hitBox)
    slots.push({
      item,
      frontMesh,
      sideMesh,
      hitBox,
      baseX,
      currentX: baseX,
      currentZ: 0,
      currentRotY: 0,
      currentScale: 1,
      viewBlend: i === safeActive ? 1 : 0,
    })
  })
}

function resize() {
  const host = root.value
  if (!host || !renderer || !camera) return

  const width = host.clientWidth
  const height = host.clientHeight
  if (width === 0 || height === 0) return

  renderer.setSize(width, height, false)
  camera.aspect = width / height
  compact = width < 820
  stageHeight = height

  const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))

  if (compact) {
    // On phones, keep three pieces legible and let the camera follow the selection.
    camera.position.z = 5.1
  } else {
    const needed = ((products.length - 1) * SPACING) / 2 + 0.72
    camera.position.z = THREE.MathUtils.clamp(needed / (tan * camera.aspect), 4.4, 9)
  }

  camera.position.y = compact ? -0.36 : -0.42
  camera.updateProjectionMatrix()
}

function tick() {
  raf = requestAnimationFrame(tick)
  const host = root.value
  if (!host || !renderer || !scene || !camera || !rig) return

  if (!isDragging) {
    dragOffset *= 0.78
    if (Math.abs(dragOffset) < 0.001) dragOffset = 0
  }

  const safeActive = THREE.MathUtils.clamp(Math.round(active.value) || 0, 0, MAX_INDEX)
  const currentTarget = hovered >= 0 ? hovered : safeActive

  slots.forEach((slot, i) => {
    let targetRotY = 0
    let targetZ = 0
    let targetXOffset = 0
    let targetBlend = 0
    let targetScale = 1

    if (!reduceMotion) {
      if (hovered < 0 && active.value < 0) {
        // When nothing is hovered or selected, all show side profile along the rail
        targetBlend = 0
        targetRotY = 0.85
      } else if (i === currentTarget) {
        targetZ = 0.08
        targetBlend = 1 // Face front!
        targetScale = 1.05
        targetRotY = 0
      } else if (i < currentTarget) {
        const diff = currentTarget - i
        targetRotY = Math.min(1.15, 0.72 + diff * 0.08)
        targetZ = -0.05
        targetXOffset = -0.16 - (diff === 1 ? 0.08 : 0)
        targetBlend = 0 // Face side
        targetScale = 0.98
      } else {
        const diff = i - currentTarget
        targetRotY = -Math.min(1.15, 0.72 + diff * 0.08)
        targetZ = -0.05
        targetXOffset = 0.16 + (diff === 1 ? 0.08 : 0)
        targetBlend = 0 // Face side
        targetScale = 0.98
      }
    } else if (i === currentTarget) {
      targetScale = 1.02
      targetBlend = 1
    }

    // One damped factor keeps every property stable on 60/120/144Hz displays.
    const lerpSpeed = 0.14
    slot.currentX += (slot.baseX + targetXOffset + dragOffset - slot.currentX) * lerpSpeed
    slot.currentZ += (targetZ - slot.currentZ) * lerpSpeed
    slot.currentRotY += (targetRotY - slot.currentRotY) * lerpSpeed
    slot.currentScale += (targetScale - slot.currentScale) * lerpSpeed
    slot.viewBlend += (targetBlend - slot.viewBlend) * 0.15

    slot.item.position.x = slot.currentX
    slot.item.position.y = 0
    slot.item.position.z = slot.currentZ

    slot.item.rotation.y = slot.currentRotY
    slot.item.rotation.z = reduceMotion
      ? 0
      : Math.sin(performance.now() * 0.0009 + i * 0.6) * 0.035
    slot.item.scale.setScalar(slot.currentScale)

    slot.frontMesh.material.opacity = slot.viewBlend
    slot.sideMesh.material.opacity = 1 - slot.viewBlend
    slot.frontMesh.visible = slot.viewBlend > 0.02
    slot.sideMesh.visible = slot.viewBlend < 0.98
  })

  if (compact) {
    const activeSlot = slots[safeActive]
    let dragFollow = 0
    if (activeSlot && isDragging) {
      const visibleHalfWidth =
        camera.position.z * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camera.aspect
      const maxVisibleOffset = Math.max(0, visibleHalfWidth - PLANE_WIDTH / 2 - 0.04)
      dragFollow = THREE.MathUtils.clamp(
        dragOffset * 0.62,
        dragOffset - maxVisibleOffset,
        dragOffset + maxVisibleOffset,
      )
    }
    const followX = activeSlot ? activeSlot.baseX + dragFollow : 0
    camera.position.x += (followX - camera.position.x) * (isDragging ? 0.2 : 0.085)
    camera.lookAt(camera.position.x, -0.98, 0)
  } else {
    camera.position.x = 0
    camera.lookAt(0, -0.98, 0)
  }

  // Keep the framing pleasant when the stage is extremely short.
  if (compact && stageHeight < 300) {
    camera.position.y = -0.3
  }

  renderer.render(scene, camera)
}

function start() {
  if (running || !renderer || contextLost) return
  running = true
  raf = requestAnimationFrame(tick)
}

function stop() {
  running = false
  cancelAnimationFrame(raf)
  raf = 0
}

function setPointer(event: PointerEvent) {
  const host = root.value
  if (!host) return
  const rect = host.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  )
}

function setHovered(index: number) {
  hovered = index
  if (index >= 0) {
    active.value = index
    setCursor('pointer')
  } else {
    setCursor(DEFAULT_CURSOR)
  }
}

function updateHoverFromPointer() {
  if (!camera) return
  raycaster.setFromCamera(pointer, camera)

  const hit = raycaster.intersectObjects(hitMeshes, false)[0]
  if (hit && typeof hit.object.userData.index === 'number') {
    setHovered(hit.object.userData.index)
    return
  }

  // Intersect the z=0 plane to pick the nearest hoodie when moving across the rail
  if (raycaster.ray.intersectPlane(hoverPlane, hoverPoint)) {
    if (hoverPoint.y >= -PLANE_HEIGHT * 1.15 && hoverPoint.y <= 0.35) {
      let closest = -1
      let minDist = SPACING * 0.75

      slots.forEach((slot, index) => {
        const distance = Math.abs(slot.currentX - hoverPoint.x)
        if (distance < minDist) {
          minDist = distance
          closest = index
        }
      })

      if (closest >= 0) {
        setHovered(closest)
        return
      }
    }
  }

  setHovered(-1)
}

function onPointerMove(event: PointerEvent) {
  if (failed.value) return
  setPointer(event)
  inside = true

  if (isDragging) {
    dragOffset = THREE.MathUtils.clamp((event.clientX - dragStartX) * 0.0038, -1.15, 1.15)
    return
  }

  if (event.pointerType === 'touch') return
  updateHoverFromPointer()
}

function onPointerLeave() {
  inside = false
  if (isDragging) return
  hovered = -1
  setCursor(DEFAULT_CURSOR)
}

function onPointerDown(event: PointerEvent) {
  if (failed.value) return
  setPointer(event)
  isDragging = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragOffset = 0

  try {
    ;(event.target as HTMLElement)?.setPointerCapture?.(event.pointerId)
  } catch {
    // Pointer capture is best-effort; the drag still works without it.
  }

  if (event.pointerType !== 'touch') updateHoverFromPointer()
  setCursor('grabbing')
}

function isNavigableProduct(index: number) {
  const product = products[index]
  return Boolean(product && !product.id.startsWith('hero-rail-'))
}

function navigateToRailProduct(index: number) {
  const product = products[index]
  if (!product || product.id.startsWith('hero-rail-')) return
  router.push(`/product/${product.id}`)
}

function finishDrag(event: PointerEvent) {
  if (!isDragging) return

  const dx = event.clientX - dragStartX
  const dy = event.clientY - dragStartY
  const moved = Math.abs(dx) > 12 || Math.abs(dy) > 12

  if (compact && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    active.value = THREE.MathUtils.clamp(
      (Math.round(active.value) || 0) + (dx < 0 ? 1 : -1),
      0,
      MAX_INDEX,
    )
    hovered = -1
  } else if (!moved) {
    setPointer(event)
    updateHoverFromPointer()
    if (hovered >= 0 && isNavigableProduct(hovered)) {
      isDragging = false
      dragOffset = 0
      setCursor('pointer')
      try {
        ;(event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId)
      } catch {
        // Ignore browsers that already released the pointer.
      }
      navigateToRailProduct(hovered)
      return
    }
  }

  isDragging = false
  dragOffset = 0
  setCursor(hovered >= 0 ? 'pointer' : DEFAULT_CURSOR)

  try {
    ;(event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId)
  } catch {
    // Ignore browsers that already released the pointer.
  }
}

function onPointerUp(event: PointerEvent) {
  finishDrag(event)
}

function onPointerCancel(event: PointerEvent) {
  finishDrag(event)
}

function onFallbackScroll(event: Event) {
  const container = event.currentTarget as HTMLDivElement
  const center = container.getBoundingClientRect().left + container.clientWidth / 2
  const items = Array.from(container.querySelectorAll<HTMLElement>('.rail-fallback__item'))
  if (!items.length) return

  let closest = 0
  let minDistance = Number.POSITIVE_INFINITY
  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect()
    const distance = Math.abs(rect.left + rect.width / 2 - center)
    if (distance < minDistance) {
      minDistance = distance
      closest = index
    }
  })

  if (active.value !== closest) active.value = closest
}

function toggleFallbackView(productId: string) {
  const product = products.find((entry) => entry.id === productId)
  if (!product || product.images.length < 2) return

  fallbackViews.value[productId] = fallbackViews.value[productId] === 'front' ? 'side' : 'front'
}

function onContextLost(event: Event) {
  event.preventDefault()
  contextLost = true
  failed.value = true
  stop()
}

function init() {
  const host = root.value || (document.querySelector('.rail-stage') as HTMLDivElement | null)
  if (!host) {
    failed.value = true
    return
  }

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
    })
  } catch (error) {
    console.warn('[RailStage] WebGL unavailable; using static fallback.', error)
    failed.value = true
    return
  }

  if (!renderer.getContext()) {
    console.warn('[RailStage] WebGL context is null; using static fallback.')
    failed.value = true
    return
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  host.appendChild(renderer.domElement)
  renderer.domElement.addEventListener('webglcontextlost', onContextLost)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)

  try {
    pmrem = new THREE.PMREMGenerator(renderer)
    environmentTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environmentTexture
  } catch (error) {
    console.warn('[RailStage] Environment setup skipped.', error)
  }

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4)
  keyLight.position.set(2, 5, 6)
  const fillLight = new THREE.DirectionalLight(0xf0f4ff, 0.6)
  fillLight.position.set(-3, -1, 4)
  scene.add(keyLight, fillLight, new THREE.HemisphereLight(0xffffff, 0xb0b8c8, 0.85))

  rig = new THREE.Group()
  scene.add(rig)
  buildRail()
  buildTees()

  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  resize()
  ro = new ResizeObserver(resize)
  ro.observe(host)

  io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) start()
      else stop()
    },
    { threshold: 0 },
  )
  io.observe(host)

  setCursor(DEFAULT_CURSOR)
  start()
}

function dispose() {
  stop()
  io?.disconnect()
  ro?.disconnect()

  if (renderer) {
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
  }

  if (scene) {
    const disposedGeometries = new Set<THREE.BufferGeometry>()
    const disposedMaterials = new Set<THREE.Material>()

    scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry && !disposedGeometries.has(mesh.geometry)) {
        disposedGeometries.add(mesh.geometry)
        mesh.geometry.dispose()
      }

      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const material of materials) {
          if (!material || disposedMaterials.has(material)) continue
          disposedMaterials.add(material)
          material.dispose()
        }
      }
    })
  }

  for (const texture of textures) texture.dispose()
  textures = []

  environmentTexture?.dispose()
  pmrem?.dispose()

  renderer?.dispose()
  renderer?.domElement?.remove()

  slots = []
  hitMeshes = []
  renderer = null
  scene = null
  camera = null
  rig = null
  pmrem = null
  environmentTexture = null
  contextLost = false
}

watch(
  active,
  (value) => {
    const next = THREE.MathUtils.clamp(Math.round(Number(value) || 0), 0, MAX_INDEX)
    if (value !== next) active.value = next
  },
  { immediate: true },
)

onMounted(() => {
  nextTick(init)
})

onBeforeUnmount(dispose)
</script>

<template>
  <div
    ref="root"
    class="rail-stage"
    :class="{ 'rail-stage--fallback': failed }"
    aria-hidden="true"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @lostpointercapture="onPointerCancel"
    @contextmenu.prevent
  >
    <!-- Fixed Rod Element for Fallback: stays firmly anchored across the stage, never wobbling or scrolling -->
    <div v-if="failed" class="rail-fixed-rod" aria-hidden="true">
      <div class="rail-rod-finial rail-rod-finial--left" />
      <div class="rail-rod-shaft" />
      <div class="rail-rod-finial rail-rod-finial--right" />
    </div>

    <div v-if="failed" class="rail-fallback" @scroll.passive="onFallbackScroll">
      <figure
        v-for="(product, index) in products"
        :key="product.id"
        class="rail-fallback__item"
        :class="{ 'rail-fallback__item--active': index === active }"
        @mouseenter="fallbackViews[product.id] = 'front'; active = index"
        @mouseleave="fallbackViews[product.id] = 'side'"
        @click="active = index; !product.id.startsWith('hero-rail-') ? navigateToRailProduct(index) : toggleFallbackView(product.id)"
      >
        <img
          :src="fallbackViews[product.id] === 'front' ? (product.images[0] ?? '/images/products/hoodie-front.png') : (product.images[1] ?? '/images/products/hoodie-side.png')"
          :alt="product.name"
          draggable="false"
        />
      </figure>
    </div>
  </div>
</template>

<style scoped>
.rail-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.rail-stage :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.rail-stage--fallback {
  cursor: default;
  touch-action: pan-x pan-y;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rail-stage--fallback :deep(canvas) {
  display: none;
}

/* Dedicated Fixed Rail Rod for Fallback */
.rail-fixed-rod {
  position: absolute;
  top: clamp(28px, 6vw, 44px);
  left: 2%;
  right: 2%;
  height: 9px;
  display: flex;
  align-items: center;
  z-index: 10;
  pointer-events: none;
}

.rail-rod-shaft {
  flex: 1;
  height: 9px;
  background: linear-gradient(180deg, #784822 0%, #46250f 55%, #2a1608 100%);
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.rail-rod-finial {
  width: 14px;
  height: 20px;
  background: linear-gradient(180deg, #d4a76a 0%, #8b622b 50%, #583c16 100%);
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.rail-rod-finial--left {
  margin-right: -2px;
}

.rail-rod-finial--right {
  margin-left: -2px;
}

/* Fallback items container */
.rail-fallback {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: flex-start;
  justify-content: center;
  gap: clamp(8px, 1.6vw, 28px);
  padding-top: clamp(26px, 5.8vw, 42px);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.rail-fallback::-webkit-scrollbar {
  display: none;
}

.rail-fallback__item {
  display: flex;
  position: relative;
  z-index: 2;
  width: clamp(130px, 14vw, 210px);
  height: clamp(260px, 28vw, 390px);
  flex: 0 0 clamp(130px, 14vw, 210px);
  align-items: flex-start;
  justify-content: center;
  margin: 0;
  opacity: 0.88;
  transform: scale(0.96);
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.28s ease;
  cursor: pointer;
}

.rail-fallback__item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center top;
}

.rail-fallback__item:hover,
.rail-fallback__item--active {
  opacity: 1;
  transform: scale(1.05);
  z-index: 5;
}

@media (prefers-reduced-motion: reduce) {
  .rail-fallback__item {
    transition: none;
  }
}

@media (max-width: 819px) {
  .rail-stage--fallback .rail-fallback {
    justify-content: flex-start;
    padding-inline: 18%;
    scroll-snap-type: x mandatory;
  }

  .rail-stage--fallback .rail-fallback__item {
    flex: 0 0 64%;
    width: 64%;
    height: clamp(260px, 60vw, 360px);
    scroll-snap-align: center;
  }
}
</style>