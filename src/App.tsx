import { useEffect } from 'react'
import { PillNav } from './components/PillNav'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Skills } from './components/Skills'
import { Projects } from './components/Projects'
import { Journey } from './components/Journey'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { Assistant } from './components/Assistant'
import { ScrollTrigger, startSmoothScroll, stopSmoothScroll } from './lib/scroll'

/** Fade-up anything marked data-reveal the first time it enters the viewport. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export function App() {
  useReveal()
  useEffect(() => {
    startSmoothScroll()
    // Fonts change line heights; re-measure the scroll-driven scenes once they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => stopSmoothScroll()
  }, [])

  return (
    <>
      <a className="skip" href="#about">
        Skip to content
      </a>
      <PillNav />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Journey />
        <Contact />
      </main>
      <Footer />
      <Assistant />
    </>
  )
}
