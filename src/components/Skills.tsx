import { useState } from 'react'
import { levelInfo, skillGroups, tools, type Level } from '../data'
import { SectionLabel } from './About'

const LEVELS: Level[] = ['Core', 'Strong', 'Working', 'Growing']

function Dots({ level }: { level: Level }) {
  const n = levelInfo[level].dots
  return (
    <span className="dots" aria-label={`${level}: ${levelInfo[level].note}`} title={`${level} — ${levelInfo[level].note}`}>
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={i < n ? 'on' : ''} />
      ))}
    </span>
  )
}

export function Skills() {
  const [focus, setFocus] = useState<Level | null>(null)
  return (
    <section id="skills" className="section skills">
      <div className="wrap">
        <div className="section-head">
          <div>
            <SectionLabel n="02">SKILLS</SectionLabel>
            <h2 className="h2" data-reveal>
              The toolbox.
            </h2>
          </div>
          <div className="legend" role="group" aria-label="Filter by proficiency">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={focus === l}
                className={focus === l ? 'on' : ''}
                onClick={() => setFocus((f) => (f === l ? null : l))}
              >
                <Dots level={l} />
                <span>
                  {l}
                  <small>{levelInfo[l].note}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={`skill-grid${focus ? ' filtering' : ''}`}>
          {skillGroups.map((g, gi) => (
            <article key={g.id} className="skill-col" data-reveal style={{ transitionDelay: `${gi * 80}ms` }}>
              <header>
                <span className="skill-n">0{gi + 1}</span>
                <h3>{g.title}</h3>
                <p className="skill-kicker">{g.kicker}</p>
              </header>
              <p className="skill-desc">{g.description}</p>
              <ul>
                {g.items.map((it) => (
                  <li key={it.name} className={focus && focus !== it.level ? 'mute' : ''}>
                    <span>{it.name}</span>
                    <Dots level={it.level} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div className="tools" aria-label="Everyday tools">
        <div className="tools-track">
          {[0, 1].map((k) => (
            <div key={k} className="tools-set" aria-hidden={k === 1}>
              {tools.map((t) => (
                <span key={t}>
                  {t} <i>✦</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
