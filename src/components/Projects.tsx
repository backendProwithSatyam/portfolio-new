import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Lock, X } from 'lucide-react'
import { projects, type Project } from '../data'
import { lockScroll, onAppEvent } from '../lib/scroll'
import { SectionLabel } from './About'

function Folder({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <article className="folder-item" data-reveal>
      <button type="button" className="folder" onClick={onOpen} aria-label={`Open ${p.title}`}>
        <span className="folder-back" aria-hidden />
        <span className="paper paper-3" aria-hidden />
        <span className="paper paper-2" aria-hidden>
          <span className="paper-stack">
            {p.stack.slice(0, 4).map((s) => (
              <i key={s}>{s}</i>
            ))}
          </span>
        </span>
        <span className="paper paper-1" aria-hidden>
          <span className="paper-head">
            <b>{p.index}</b> / {p.category.split('·')[0].trim()}
          </span>
          <span className="paper-lines">
            {p.features.slice(0, 3).map((f) => (
              <span key={f}>{f}</span>
            ))}
          </span>
        </span>
        <span className="folder-front">
          <span className="folder-title">{p.title}</span>
          <span className="folder-go" aria-hidden>
            <ArrowUpRight size={15} />
          </span>
        </span>
      </button>
      <div className="folder-meta">
        <p>{p.category}</p>
        <button type="button" onClick={onOpen}>
          View project <ArrowUpRight size={13} aria-hidden />
        </button>
      </div>
    </article>
  )
}

function ProjectSheet({ p, onClose }: { p: Project; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    lockScroll(true)
    const prev = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', key)
      prev?.focus?.()
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
        <header className="sheet-head">
          <span className="sheet-index">{p.index}</span>
          <button ref={closeBtn} type="button" className="icon-btn" onClick={onClose} aria-label="Close project">
            <X size={18} aria-hidden />
          </button>
        </header>
        <p className="label">{`{{ ${p.category.toUpperCase()} }}`}</p>
        <h3 id="sheet-title" className="sheet-title">
          {p.title}
        </h3>
        <p className="sheet-summary">{p.summary}</p>
        <div className="sheet-grid">
          <div>
            <h4>What it does</h4>
            <ul className="sheet-list">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Built with</h4>
            <ul className="chips">
              {p.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <h4>Status</h4>
            <p className="sheet-status">
              <Lock size={13} aria-hidden /> {p.status}
            </p>
          </div>
        </div>
        {p.links && p.links.length > 0 ? (
          <div className="sheet-links">
            {p.links.map((l) => (
              <a key={l.href} className="btn btn-light" href={l.href} target="_blank" rel="noreferrer">
                {l.label} <ArrowUpRight size={15} aria-hidden />
              </a>
            ))}
          </div>
        ) : (
          <p className="sheet-note">Client and company work is private, so there’s no public link. Happy to walk through it on a call.</p>
        )}
      </div>
    </div>
  )
}

export function Projects() {
  const [open, setOpen] = useState<Project | null>(null)

  useEffect(
    () =>
      onAppEvent((e) => {
        if (e.type === 'open-project') setOpen(projects.find((p) => p.id === e.id) ?? null)
      }),
    [],
  )

  return (
    <section id="work" className="section work">
      <div className="wrap">
        <div className="section-head">
          <div>
            <SectionLabel n="03">WORK</SectionLabel>
            <h2 className="h2" data-reveal>
              Featured
              <br />
              Projects
            </h2>
          </div>
          <p className="section-sub" data-reveal>
            Company work and growing side practice. Open a folder to explore a project.
          </p>
        </div>
        <div className="folders">
          {projects.map((p) => (
            <Folder key={p.id} p={p} onOpen={() => setOpen(p)} />
          ))}
        </div>
      </div>
      {open && <ProjectSheet p={open} onClose={() => setOpen(null)} />}
    </section>
  )
}
