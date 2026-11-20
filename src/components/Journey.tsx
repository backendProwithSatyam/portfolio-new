import { useLayoutEffect, useRef } from 'react'
import { experience, workflow } from '../data'
import { gsap, prefersReduced } from '../lib/scroll'
import { SectionLabel } from './About'

const N = workflow.length
// Node positions in a 1000 x 400 box: evenly spaced, alternating high / low.
const pts = workflow.map((_, i) => ({ x: ((i + 0.5) / N) * 1000, y: i % 2 ? 268 : 132 }))

function wavePath() {
  let d = `M0 ${pts[0].y + 60} C ${pts[0].x * 0.5} ${pts[0].y + 60}, ${pts[0].x * 0.5} ${pts[0].y}, ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < N; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const mx = (a.x + b.x) / 2
    d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
  }
  const last = pts[N - 1]
  d += ` C ${(last.x + 1000) / 2} ${last.y}, ${(last.x + 1000) / 2} ${last.y - 60}, 1000 ${last.y - 60}`
  return d
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden>
      <path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z" fill="currentColor" />
    </svg>
  )
}

export function Journey() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el || prefersReduced()) return
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 861px)', () => {
        const path = el.querySelector<SVGPathElement>('.wave-line')!
        const len = path.getTotalLength()
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '.wave', start: 'top 75%', end: 'bottom 55%', scrub: 0.5 },
        })
        tl.to(path, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
        el.querySelectorAll('.wave-node').forEach((n, i) => {
          tl.fromTo(n, { opacity: 0, y: i % 2 ? -14 : 14 }, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, (i + 0.4) / N - 0.06)
        })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="experience" ref={root} className="section journey">
      <div className="wrap">
        <div className="section-head">
          <div>
            <SectionLabel n="04">EXPERIENCE</SectionLabel>
            <h2 className="h2" data-reveal>
              Where I’ve been
              <br />
              building.
            </h2>
          </div>
        </div>

        <article className="role" data-reveal>
          <div className="role-side">
            <span className="date-pill">{experience.duration}</span>
            <h3>{experience.role}</h3>
            <p className="role-co">{experience.company}</p>
            <p className="role-sum">{experience.summary}</p>
          </div>
          <ul className="role-tracks">
            {experience.tracks.map((t, i) => (
              <li key={t.title}>
                <span className="track-n">0{i + 1}</span>
                <div>
                  <h4>{t.title}</h4>
                  <p>{t.body}</p>
                  <p className="track-tags">{t.tags.join(' · ')}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <div className="wave-head" data-reveal>
          <h3>How I ship</h3>
          <p>The same seven steps, whether it’s a CRM module or a landing page.</p>
        </div>

        <div className="wave">
          <svg className="wave-svg" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden>
            <path className="wave-ghost" d={wavePath()} vectorEffect="non-scaling-stroke" />
            <path className="wave-line" d={wavePath()} vectorEffect="non-scaling-stroke" />
          </svg>
          <ol className="wave-nodes">
            {workflow.map((w, i) => (
              <li
                key={w.step}
                className={`wave-node ${i % 2 ? 'low' : 'high'}`}
                style={{ left: `${(pts[i].x / 1000) * 100}%`, top: `${(pts[i].y / 400) * 100}%` }}
              >
                <span className="wave-dot">
                  <Star />
                </span>
                <div className="wave-text">
                  <span className="date-pill">Step {String(i + 1).padStart(2, '0')}</span>
                  <h4>{w.step}</h4>
                  <p>{w.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
