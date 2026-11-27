<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string[]
    max?: number
    maxFileSize?: number
    imageLabel?: string
    accept?: string
  }>(),
  { max: 5, maxFileSize: 4 * 1024 * 1024, imageLabel: 'Product image', accept: 'image/*' },
)

const emit = defineEmits<{ 'update:modelValue': [images: string[]] }>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const error = ref('')
const urlDraft = ref('')

const canAdd = computed(() => props.modelValue.length < props.max)
const maxFileSizeLabel = computed(() => `${Math.round(props.maxFileSize / (1024 * 1024))} MB`)

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

async function prepareImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)

  try {
    const largestDimension = Math.max(bitmap.width, bitmap.height)
    if (file.size <= 250 * 1024 && largestDimension <= 1400) {
      return await readAsDataUrl(file)
    }

    const scale = Math.min(1, 1400 / largestDimension)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare that image.')

    const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
    if (!supportsWebp) {
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL(supportsWebp ? 'image/webp' : 'image/jpeg', 0.82)
  } finally {
    bitmap.close()
  }
}

function addImages(images: string[]) {
  const merged = [...props.modelValue, ...images].slice(0, props.max)
  emit('update:modelValue', merged)
}

function readFiles(files: FileList | null) {
  if (!files?.length) return
  error.value = ''

  const accepted = [...files].slice(0, props.max - props.modelValue.length)
  const readers: Promise<string>[] = []
  const allowedTypes = props.accept.split(',').map((type) => type.trim())

  for (const file of accepted) {
    if (
      !file.type.startsWith('image/') ||
      (!allowedTypes.includes('image/*') && !allowedTypes.includes(file.type))
    ) {
      error.value = 'Choose a supported image format.'
      continue
    }
    if (file.size > props.maxFileSize) {
      error.value = `Each image must be under ${maxFileSizeLabel.value}.`
      continue
    }
    readers.push(prepareImage(file))
  }

  Promise.all(readers)
    .then((images) => {
      if (images.length) addImages(images)
    })
    .catch(() => {
      error.value = error instanceof Error ? error.message : 'Could not prepare one of those images.'
    })
}

function onFiles(event: Event) {
  const target = event.target as HTMLInputElement
  readFiles(target.files)
  target.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  readFiles(event.dataTransfer?.files ?? null)
}

function remove(index: number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, position) => position !== index),
  )
}

function makeCover(index: number) {
  if (index === 0) return
  const next = [...props.modelValue]
  const [picked] = next.splice(index, 1)
  if (picked) next.unshift(picked)
  emit('update:modelValue', next)
}

function addUrl() {
  const value = urlDraft.value.trim()
  if (!value || !canAdd.value) return
  addImages([value])
  urlDraft.value = ''
}
</script>

<template>
  <div class="uploader">
    <div
      class="uploader__drop"
      :class="{ 'uploader__drop--active': dragging, 'uploader__drop--full': !canAdd }"
      role="button"
      tabindex="0"
      @click="canAdd && input?.click()"
      @keydown.enter="canAdd && input?.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="uploader__icon">
        <DashIcon name="upload" :size="18" />
      </span>
      <strong>{{ canAdd ? 'Drop images here or browse' : 'Image limit reached' }}</strong>
      <small>Image files up to {{ maxFileSizeLabel }} each · {{ modelValue.length }}/{{ max }} added</small>
      <input
        ref="input"
        type="file"
        :accept="accept"
        multiple
        class="uploader__input"
        @change="onFiles"
      />
    </div>

    <p v-if="error" class="studio-error">{{ error }}</p>

    <ul v-if="modelValue.length" class="uploader__grid">
      <li v-for="(image, index) in modelValue" :key="image.slice(0, 32) + index" class="uploader__item">
        <img :src="image" :alt="`${imageLabel} ${index + 1}`" />
        <span v-if="index === 0" class="uploader__cover">Cover</span>
        <div class="uploader__tools">
          <button
            v-if="index !== 0"
            type="button"
            class="uploader__tool"
            aria-label="Make cover image"
            @click="makeCover(index)"
          >
            <DashIcon name="check" :size="12" />
          </button>
          <button
            type="button"
            class="uploader__tool uploader__tool--danger"
            aria-label="Remove image"
            @click="remove(index)"
          >
            <DashIcon name="close" :size="12" />
          </button>
        </div>
      </li>
    </ul>

    <div class="uploader__url">
      <input
        v-model="urlDraft"
        class="studio-input"
        type="url"
        placeholder="…or paste an image URL"
        :disabled="!canAdd"
        @keydown.enter.prevent="addUrl"
      />
      <button class="studio-btn studio-btn--sm" type="button" :disabled="!canAdd || !urlDraft.trim()" @click="addUrl">
        Add
      </button>
    </div>

    <p class="studio-hint">
      The first image is used as the catalogue cover. 
    </p>
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.uploader__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 20px 16px;
  border: 1.5px dashed #d6dcec;
  border-radius: 2px;
  background: #fafbff;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.uploader__drop:hover,
.uploader__drop--active {
  border-color: var(--primary);
  background: #f4f7ff;
}

.uploader__drop--full {
  cursor: default;
  opacity: 0.7;
}

.uploader__icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  margin-bottom: 3px;
  border-radius: 4px;
  background: #fff;
  box-shadow: inset 0 0 0 1px var(--studio-line);
  color: var(--primary);
}

.uploader__drop strong {
  color: var(--studio-ink);
  font-size: 0.76rem;
  font-weight: 650;
}

.uploader__drop small {
  color: var(--studio-muted);
  font-size: 0.62rem;
}

.uploader__input {
  display: none;
}

.uploader__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
  gap: 8px;
  list-style: none;
}

.uploader__item {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border: 1px solid var(--studio-line);
  border-radius: 4px;
  background: #f7f8fc;
}

.uploader__item img {
  width: 100%;
  height: 100%;
  padding: 4px;
  object-fit: contain;
}

.uploader__cover {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.uploader__tools {
  position: absolute;
  right: 4px;
  bottom: 4px;
  display: flex;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.uploader__item:hover .uploader__tools,
.uploader__item:focus-within .uploader__tools {
  opacity: 1;
}

.uploader__tool {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--studio-line);
  border-radius: 3px;
  background: #fff;
  color: var(--studio-ink);
  cursor: pointer;
}

.uploader__tool:hover {
  border-color: #ccd2e2;
}

.uploader__tool--danger {
  color: #c02626;
}

.uploader__url {
  display: flex;
  gap: 6px;
}

.uploader__url .studio-input {
  height: 36px;
  font-size: 0.72rem;
}
</style>
