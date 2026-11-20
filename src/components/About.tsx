import { useLayoutEffect, useRef } from 'react'
import { about, profile, projects, skillGroups } from '../data'
import { gsap, prefersReduced } from '../lib/scroll'

const skillCount = skillGroups.reduce((n, g) => n + g.items.length, 0)

export function SectionLabel({ n, children }: { n: string; children: string }) {
  return (
    <p className="label">
      {'{{ '}
      {n} — {children}
      {' }}'}
    </p>
  )
}

export function About() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (!root.current || prefersReduced()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.lead-word',
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: '.about-lead', start: 'top 82%', end: 'bottom 45%', scrub: true },
        },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  const stats = [
    { value: profile.experienceYears, unit: 'yrs', label: `building Laravel products at ${profile.company}` },
    { value: String(projects.length), unit: '', label: 'kinds of product shipped — CRMs, sites, cloud, web & mobile' },
    { value: String(skillCount), unit: '', label: 'skills across backend, frontend, cloud and mobile' },
    { value: String(skillGroups.length), unit: '', label: 'layers of the stack I work in, end to end' },
  ]

  return (
    <section id="about" ref={root} className="section about">
      <div className="wrap">
        <SectionLabel n="01">ABOUT</SectionLabel>
        <p className="about-lead">
          {about.lead.split(' ').map((w, i) => (
            <span key={i} className="lead-word">
              {w}{' '}
            </span>
          ))}
        </p>

        <div className="about-grid">
          <div className="about-copy" data-reveal>
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </div>
          <ol className="principles">
            {about.principles.map((p, i) => (
              <li key={p.title} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="principle-n">0{i + 1}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <ul className="stats">
          {stats.map((s, i) => (
            <li key={s.label} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
              <p className="stat-v">
                {s.value}
                {s.unit && <small>{s.unit}</small>}
              </p>
              <p className="stat-l">{s.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
