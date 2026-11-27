let motionPromise: ReturnType<typeof createMotion> | null = null

async function createMotion() {
  const [gsapModule, scrollTriggerModule] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ])

  const gsap = gsapModule.gsap ?? gsapModule.default
  const ScrollTrigger = scrollTriggerModule.ScrollTrigger ?? scrollTriggerModule.default

  gsap.registerPlugin(ScrollTrigger)

  return { gsap, ScrollTrigger }
}

/**
 * Loads GSAP and ScrollTrigger only on the client, and only once.
 * Components keep their own gsap.context so animations clean up on unmount.
 */
export const useMotion = () => {
  const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const load = () => {
    if (!motionPromise) motionPromise = createMotion()
    return motionPromise
  }

  return { load, prefersReducedMotion }
}
