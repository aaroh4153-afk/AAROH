<script setup lang="ts">
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { getHeroRailImages } from '~/utils/productDisplayImages'

const active = defineModel<number>('active', { default: 0 })

const store = useStore()
const liveRail = store.products.value.filter(
  (product) => product.rail && product.status === 'active',
)
const products = liveRail.map((product) => ({
  ...product,
  images: getHeroRailImages(product),
}))

const root = ref<HTMLDivElement | null>(null)
const failed = ref(false)

const SPACING = 0.88
const FOV = 28
const PLANE_WIDTH = 1.18
const PLANE_HEIGHT = 1.58
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
  geometry.translate(0, -PLANE_HEIGHT / 2 + 0.036, 0)

  const hitGeometry = new THREE.PlaneGeometry(PLANE_WIDTH * 0.88, PLANE_HEIGHT * 0.92)
  hitGeometry.translate(0, -PLANE_HEIGHT / 2 + 0.036, 0)
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false })

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
    let targetBlend = products.length > 1 ? 1 : 0
    let targetScale = 1

    if (!reduceMotion) {
      if (products.length === 1) {
        targetBlend = hovered >= 0 ? 1 : 0
      } else if (i === currentTarget) {
        targetZ = 0.52
        targetBlend = 1
        targetScale = 1.05
      } else if (i < currentTarget) {
        const diff = currentTarget - i
        targetRotY = Math.min(1.05, 0.65 + diff * 0.08)
        targetZ = -0.05
        targetXOffset = -0.16 - (diff === 1 ? 0.08 : 0)
        targetBlend = 0
        targetScale = 0.98
      } else {
        const diff = i - currentTarget
        targetRotY = -Math.min(1.05, 0.65 + diff * 0.08)
        targetZ = -0.05
        targetXOffset = 0.16 + (diff === 1 ? 0.08 : 0)
        targetBlend = 0
        targetScale = 0.98
      }
    } else if (i === currentTarget) {
      targetScale = 1.02
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
    slot.item.rotation.z = 0
    slot.item.scale.setScalar(slot.currentScale)

    slot.frontMesh.material.opacity = slot.viewBlend
    slot.sideMesh.material.opacity = 1 - slot.viewBlend
    slot.frontMesh.visible = slot.viewBlend > 0.02
    slot.sideMesh.visible = slot.viewBlend < 0.98
  })

  if (compact) {
    const activeSlot = slots[safeActive]
    const followX = activeSlot ? activeSlot.baseX : 0
    camera.position.x += (followX - camera.position.x) * 0.085
    camera.lookAt(camera.position.x, -0.78, 0)
  } else {
    const targetCamX = inside && !reduceMotion && !isDragging ? pointer.x * 0.35 : 0
    camera.position.x += (targetCamX - camera.position.x) * 0.05
    camera.lookAt(0, -0.78, 0)
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

  // If the ray misses, snap to the nearest hanger within a reasonable distance.
  if (raycaster.ray.intersectPlane(hoverPlane, hoverPoint)) {
    let closest = -1
    let minDist = 0.55

    slots.forEach((slot, index) => {
      const distance = Math.abs(slot.currentX - hoverPoint.x)
      if (distance < minDist) {
        minDist = distance
        closest = index
      }
    })

    setHovered(closest)
    return
  }

  setHovered(-1)
}

function onPointerMove(event: PointerEvent) {
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
  } else if (!moved && event.pointerType === 'touch') {
    setPointer(event)
    updateHoverFromPointer()
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
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (error) {
    console.warn('[RailStage] WebGL unavailable; using static fallback.', error)
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
    <div v-if="failed" class="rail-fallback">
      <figure
        v-for="(product, index) in products"
        :key="product.id"
        class="rail-fallback__item"
        :class="{ 'rail-fallback__item--active': index === active }"
      >
        <img :src="product.images[0]" alt="" draggable="false" />
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
}

.rail-stage--fallback :deep(canvas) {
  display: none;
}

.rail-fallback {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 1%;
  padding: 5%;
}

.rail-fallback__item {
  display: flex;
  width: 16%;
  max-width: 130px;
  height: 82%;
  align-items: center;
  justify-content: center;
  margin: 0;
  opacity: 0.78;
  transform: scale(0.94);
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.rail-fallback__item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.rail-fallback__item--active {
  opacity: 1;
  transform: scale(1.04);
}
</style>
