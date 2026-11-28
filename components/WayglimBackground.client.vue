<script setup lang="ts">
type WayglimWindow = Window & { WayglimMountHeroBackground?: () => void }
type WayglimHost = HTMLElement & { __wayglimInstance?: { destroy: () => void } }

const ENGINE_SRC = '/wayglim/engine.js'
const LOOK_SRC = '/wayglim/hero-background.js'

const stage = ref<HTMLElement | null>(null)
let retryTimer: number | undefined

function injectScript(src: string) {
  if (document.querySelector(`script[data-wayglim-src="${src}"]`)) return
  const script = document.createElement('script')
  script.src = src
  script.async = false
  script.dataset.wayglimSrc = src
  document.body.appendChild(script)
}

// The look script only mounts once per page load, so ask it to mount again
// whenever this component comes back (client-side navigation back to the hero).
function mountBackground() {
  ;(window as WayglimWindow).WayglimMountHeroBackground?.()
  return Boolean(stage.value?.hasAttribute('data-wayglim-ready'))
}

onMounted(() => {
  injectScript(ENGINE_SRC)
  injectScript(LOOK_SRC)

  if (mountBackground()) return

  let tries = 0
  retryTimer = window.setInterval(() => {
    tries += 1
    if (mountBackground() || tries >= 60) {
      window.clearInterval(retryTimer)
      retryTimer = undefined
    }
  }, 100)
})

onBeforeUnmount(() => {
  if (retryTimer !== undefined) window.clearInterval(retryTimer)
  retryTimer = undefined
  ;(stage.value as WayglimHost | null)?.__wayglimInstance?.destroy()
})
</script>

<template>
  <div class="wayglim" aria-hidden="true">
    <div ref="stage" class="wayglim__stage" data-wayglim="wl-16ui5k2" />
  </div>
</template>

<style scoped>
.wayglim {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: rgb(249, 249, 249);
}

.wayglim__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.wayglim__stage::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 45%);
}
</style>
