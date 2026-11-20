import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }

export const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null

function raf(time: number) {
  lenis?.raf(time * 1000)
}

/** Lenis drives the scroll; GSAP's ticker drives Lenis so ScrollTrigger stays in sync. */
export function startSmoothScroll() {
  if (lenis || prefersReduced()) return
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
}

export function stopSmoothScroll() {
  gsap.ticker.remove(raf)
  lenis?.destroy()
  lenis = null
}

export function scrollToTarget(target: string | number) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : null
  if (typeof target === 'string' && !el) return
  if (lenis) {
    lenis.scrollTo(el ?? (target as number), { offset: 0, duration: 1.4 })
    return
  }
  if (el) el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' })
  else window.scrollTo({ top: target as number, behavior: prefersReduced() ? 'auto' : 'smooth' })
}

export function lockScroll(locked: boolean) {
  if (locked) lenis?.stop()
  else lenis?.start()
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

/** Small cross-component event bus (open a project, open the assistant, open search). */
export type AppEvent =
  | { type: 'open-project'; id: string }
  | { type: 'open-assistant'; prompt?: string }
  | { type: 'open-search' }

export function emit(e: AppEvent) {
  window.dispatchEvent(new CustomEvent('app-event', { detail: e }))
}

export function onAppEvent(fn: (e: AppEvent) => void) {
  const h = (ev: Event) => fn((ev as CustomEvent<AppEvent>).detail)
  window.addEventListener('app-event', h)
  return () => window.removeEventListener('app-event', h)
}
