import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, CornerDownLeft, MoreHorizontal, Search, X } from 'lucide-react'
import { profile, projects, skillGroups } from '../data'
import { emit, onAppEvent, scrollToTarget } from '../lib/scroll'

export const SECTIONS = [
  { id: 'top', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'work', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
  { id: 'footer', label: 'See you' },
]

type Item = { id: string; group: string; label: string; hint?: string; run: () => void }

export function PillNav() {
  const [active, setActive] = useState('top')
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id))
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', key)
    const off = onAppEvent((ev) => ev.type === 'open-search' && setOpen(true))
    return () => {
      window.removeEventListener('keydown', key)
      off()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setQ('')
    setSel(0)
    const t = window.setTimeout(() => input.current?.focus(), 30)
    const click = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', click)
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', click)
    }
  }, [open])

  const items = useMemo<Item[]>(() => {
    const go = (hash: string) => () => {
      setOpen(false)
      scrollToTarget(hash)
    }
    return [
      ...SECTIONS.filter((s) => s.id !== 'footer').map((s) => ({ id: `s-${s.id}`, group: 'Sections', label: s.label, run: go(`#${s.id}`) })),
      ...projects.map((p) => ({
        id: `p-${p.id}`,
        group: 'Projects',
        label: p.title,
        hint: p.category,
        run: () => {
          setOpen(false)
          scrollToTarget('#work')
          window.setTimeout(() => emit({ type: 'open-project', id: p.id }), 900)
        },
      })),
      ...skillGroups.map((g) => ({
        id: `g-${g.id}`,
        group: 'Skills',
        label: g.title,
        hint: g.items.slice(0, 4).map((i) => i.name).join(', '),
        run: go('#skills'),
      })),
      { id: 'a-resume', group: 'Actions', label: 'Download résumé', run: () => { setOpen(false); window.open(profile.resume, '_blank') } },
      { id: 'a-email', group: 'Actions', label: 'Email Satyam', hint: profile.email, run: () => { setOpen(false); window.location.href = `mailto:${profile.email}` } },
      { id: 'a-linkedin', group: 'Actions', label: 'Open LinkedIn', run: () => { setOpen(false); window.open(profile.linkedin, '_blank', 'noopener') } },
      { id: 'a-ask', group: 'Actions', label: 'Ask the portfolio assistant', run: () => { setOpen(false); emit({ type: 'open-assistant' }) } },
    ]
  }, [])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return items
    return items.filter((i) => `${i.label} ${i.hint ?? ''} ${i.group}`.toLowerCase().includes(t))
  }, [q, items])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(results.length - 1, s + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(0, s - 1))
    } else if (e.key === 'Enter') {
      results[sel]?.run()
    }
  }

  const label = SECTIONS.find((s) => s.id === active)?.label ?? 'Home'
  let lastGroup = ''

  return (
    <div className={`pill-wrap${open ? ' open' : ''}`} ref={wrap}>
      <nav className="pill" aria-label="Primary">
        <a href="#top" className="pill-brand" onClick={(e) => { e.preventDefault(); scrollToTarget('#top') }}>
          {profile.firstName}.
        </a>
        <span className="pill-sep" aria-hidden />
        <span className="pill-section" aria-live="polite">
          <span key={label} className="pill-section-in">
            {label}
          </span>
        </span>
        <button type="button" className="pill-search" onClick={() => setOpen((o) => !o)} aria-label="Search the site (Ctrl+K)" aria-expanded={open}>
          {open ? <X size={14} aria-hidden /> : <Search size={14} aria-hidden />}
        </button>
        <button type="button" className="pill-more" onClick={() => setOpen((o) => !o)} aria-label="Open menu" aria-expanded={open}>
          <MoreHorizontal size={16} aria-hidden />
        </button>
      </nav>

      {open && (
        <div className="pill-panel" role="dialog" aria-label="Search">
          <label className="pill-input">
            <Search size={15} aria-hidden />
            <input
              ref={input}
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setSel(0)
              }}
              onKeyDown={onKey}
              placeholder="Search sections, projects, skills…"
              aria-label="Search sections, projects, skills"
            />
            <kbd>esc</kbd>
          </label>
          <ul className="pill-results" role="listbox">
            {results.length === 0 && <li className="pill-empty">Nothing matches “{q}”.</li>}
            {results.map((it, i) => {
              const head = it.group !== lastGroup ? it.group : null
              lastGroup = it.group
              return (
                <li key={it.id}>
                  {head && <p className="pill-group">{head}</p>}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === sel}
                    className={i === sel ? 'sel' : ''}
                    onMouseEnter={() => setSel(i)}
                    onClick={it.run}
                  >
                    <span className="pill-label">{it.label}</span>
                    {it.hint && <span className="pill-hint">{it.hint}</span>}
                    {i === sel ? <CornerDownLeft size={13} aria-hidden /> : <ArrowUpRight size={13} aria-hidden className="pill-arrow" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
