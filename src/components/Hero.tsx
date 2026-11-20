import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { ArrowDownRight, Download } from 'lucide-react'
import { profile } from '../data'
import { gsap, prefersReduced, scrollToTarget } from '../lib/scroll'

const GLYPHS = '{}[]<>/\\=+*;:$#@01_-|~.'

function GlyphField() {
  const text = useMemo(() => {
    let seed = 11
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const rows: string[] = []
    for (let y = 0; y < 72; y++) {
      let row = ''
      for (let x = 0; x < 260; x++) row += r() < 0.42 ? GLYPHS[Math.floor(r() * GLYPHS.length)] : ' '
      rows.push(row)
    }
    return rows.join('\n')
  }, [])
  return (
    <div className="glyphs" aria-hidden>
      <pre className="glyphs-dim">{text}</pre>
      <pre className="glyphs-lit">{text}</pre>
    </div>
  )
}

const Letters = ({ word }: { word: string }) => (
  <>
    {word.split('').map((c, i) => (
      <span key={i} className="ch">
        {c}
      </span>
    ))}
  </>
)

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const year = new Date().getFullYear()

  // Cursor spotlight on the glyph field.
  useEffect(() => {
    const el = section.current
    if (!el || window.matchMedia('(pointer: coarse)').matches) return
    const move = (e: PointerEvent) => {
      el.style.setProperty('--mx', `${e.clientX}px`)
      el.style.setProperty('--my', `${e.clientY}px`)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])

  useLayoutEffect(() => {
    const el = section.current
    if (!el || prefersReduced()) return
    const ctx = gsap.context(() => {
      // Entrance: letters rise, the portrait card grows up from the bottom edge.
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
      intro
        .from('.intro .ch', { yPercent: 115, duration: 1.1, stagger: 0.035 }, 0.15)
        .from('.intro .brk', { opacity: 0, x: (i) => (i ? 30 : -30), duration: 1 }, 0.55)
        .from('.portrait-inner', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' }, 0.35)
        .from('.portrait-inner img', { scale: 1.25, duration: 1.6 }, 0.35)
        .from('.intro-meta > *', { opacity: 0, y: 12, duration: 0.8, stagger: 0.08 }, 0.9)

      const mm = gsap.matchMedia()
      mm.add('(min-width: 861px)', () => {
        // Scroll: the intro clears, the portrait settles in the middle, the hero copy arrives.
        const card = el.querySelector<HTMLElement>('.portrait-card')!
        const startY = () => window.innerHeight * 0.56 - (window.innerHeight / 2 - card.offsetHeight / 2)
        gsap.set(card, { y: startY })
        gsap.set('.hero-left > *', { x: -50, opacity: 0 })
        gsap.set('.hero-right > *', { x: 50, opacity: 0 })
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
        })
        tl.to('.intro-title', { yPercent: -38, scale: 0.82, opacity: 0, duration: 0.42 }, 0)
          .to('.intro-meta', { opacity: 0, duration: 0.2 }, 0)
          .to('.glyphs', { opacity: 0.35, duration: 0.5 }, 0)
          .to(card, { y: 0, duration: 0.5, ease: 'power2.inOut' }, 0.08)
          .to('.hero-left > *', { x: 0, opacity: 1, stagger: 0.05, duration: 0.3, ease: 'power3.out' }, 0.42)
          .to('.hero-right > *', { x: 0, opacity: 1, stagger: 0.05, duration: 0.3, ease: 'power3.out' }, 0.48)
          .to({}, { duration: 0.15 })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="top" ref={section} className="hero" aria-label="Introduction">
      <div className="hero-stage">
        <GlyphField />
        <div className="intro">
          <h2 className="intro-title" aria-label="Software Engineer">
            <span className="row">
              <span className="brk">&lt;</span>
              <span className="word">
                <Letters word="SOFTWARE" />
              </span>
            </span>
            <span className="row">
              <span className="word">
                <Letters word="ENGINEER" />
              </span>
              <span className="brk">/&gt;</span>
            </span>
          </h2>
          <div className="intro-meta">
            <span className="intro-year">©{year}</span>
            <span className="intro-tag">{'{{ LARAVEL & FULL-STACK DEVELOPMENT }}'}</span>
            <span className="intro-scroll" aria-hidden>
              scroll <i />
            </span>
          </div>
        </div>

        <figure className="portrait-card">
          <div className="portrait-inner">
            <img src={profile.portrait} alt={`Portrait of ${profile.name}`} width={1092} height={1050} />
          </div>
          <figcaption className="portrait-cap">
            <span>{profile.name}</span>
            <span>{profile.experienceYears} yrs · Laravel</span>
          </figcaption>
        </figure>

        <div className="hero-copy">
          <div className="hero-left">
            <h1 className="hero-title">
              Hi, I’m <br />
              {profile.firstName}.
            </h1>
            <p className="hero-role">
              Laravel &amp; Full-Stack
              <br />
              Developer.
            </p>
            <dl className="hero-facts">
              <div>
                <dt>Currently</dt>
                <dd>Software Developer · {profile.company}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>~{profile.experienceYears} years shipping business software</dd>
              </div>
            </dl>
          </div>
          <div className="hero-right">
            <p className="hero-lede">
              I build <b>Laravel APIs</b>, <b>CRM systems</b> and the <b>Linux servers</b> they run on — from database schema to production.
            </p>
            <div className="hero-ctas">
              <button type="button" className="btn btn-light" onClick={() => scrollToTarget('#work')}>
                Explore projects <ArrowDownRight size={16} aria-hidden />
              </button>
              <a className="btn btn-ghost" href={profile.resume} download>
                Résumé <Download size={15} aria-hidden />
              </a>
            </div>
            <p className="hero-status">
              <span className="pulse" aria-hidden /> {profile.availability}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
