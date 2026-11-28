<script setup lang="ts">
const ENGINE_SRC = '/wayglim/engine.js'
const LOOK_SRC = '/wayglim/hero-background.js'

function injectScript(src: string) {
  if (document.querySelector(`script[data-wayglim-src="${src}"]`)) return
  const script = document.createElement('script')
  script.src = src
  script.async = false
  script.dataset.wayglimSrc = src
  document.body.appendChild(script)
}

onMounted(() => {
  injectScript(ENGINE_SRC)
  injectScript(LOOK_SRC)
})
</script>

<template>
  <div class="wayglim" aria-hidden="true">
    <div class="wayglim__stage" data-wayglim="wl-16ui5k2" />
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
