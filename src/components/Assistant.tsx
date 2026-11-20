import { useEffect, useRef, useState } from 'react'
import { ArrowUp, X } from 'lucide-react'
import { experience, levelInfo, profile, projects, skillGroups, workflow } from '../data'
import { onAppEvent, scrollToTarget } from '../lib/scroll'

type Msg = { from: 'bot' | 'me'; text: string; action?: { label: string; run: () => void } }

const allSkills = skillGroups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })))
const has = (t: string, words: string[]) => words.some((w) => t.includes(w))
const GENERIC = new Set(
  'api apis development design management integration integrations architecture configuration optimization performance responsive modern cloud server backend frontend production secure maintainable web mobile app apps cross-platform platform ui ux implementation tasks jobs fundamentals push notifications templates troubleshooting auth session'.split(' '),
)

/**
 * A scripted helper: it matches keywords against the portfolio's own data.
 * It is labelled as such in the UI — no model, no network calls.
 */
function answer(raw: string): Msg {
  const t = raw.toLowerCase()

  if (has(t, ['hi', 'hello', 'hey', 'namaste']) && t.length < 12) {
    return { from: 'bot', text: `Hi! Ask me about Satyam’s skills, projects, experience, or how to reach him.` }
  }
  if (has(t, ['avail', 'freelance', 'hire', 'hiring', 'open to', 'job', 'role'])) {
    return {
      from: 'bot',
      text: `${profile.availability}. The quickest route is email: ${profile.email}.`,
      action: { label: 'Go to contact', run: () => scrollToTarget('#contact') },
    }
  }
  if (has(t, ['contact', 'email', 'phone', 'call', 'reach', 'linkedin', 'talk'])) {
    return {
      from: 'bot',
      text: `Email ${profile.email}, phone ${profile.phone}, or LinkedIn. There’s also a form at the bottom of the page.`,
      action: { label: 'Open the form', run: () => scrollToTarget('#contact') },
    }
  }
  if (has(t, ['resume', 'résumé', 'cv'])) {
    return { from: 'bot', text: 'Here’s his résumé as a PDF.', action: { label: 'Download résumé', run: () => window.open(profile.resume, '_blank') } }
  }
  if (has(t, ['project', 'built', 'crm', 'demo', 'case stud', 'shipped'])) {
    return {
      from: 'bot',
      text: `${projects.length} areas: ${projects.map((p) => p.title).join('; ')}. Most is private company work, so there are no public links.`,
      action: { label: 'See the folders', run: () => scrollToTarget('#work') },
    }
  }
  if (has(t, ['experience', 'year', 'company', 'digicrome', 'job history', 'career'])) {
    return {
      from: 'bot',
      text: `${experience.role} at ${experience.company}, ${experience.duration}. He owns ${experience.tracks.map((x) => x.title.toLowerCase()).join(', ')}.`,
      action: { label: 'See experience', run: () => scrollToTarget('#experience') },
    }
  }
  if (has(t, ['process', 'workflow', 'how do', 'how does', 'approach'])) {
    return { from: 'bot', text: `Seven steps: ${workflow.map((w) => w.step).join(' → ')}.`, action: { label: 'See the process', run: () => scrollToTarget('#experience') } }
  }
  const words = t.split(/[^a-z0-9.+#]+/)
  const skill = allSkills.find((s) => {
    const name = s.name.toLowerCase()
    return t.includes(name) || name.split(/[\s/(),&]+/).some((w) => w.length > 2 && !GENERIC.has(w) && words.includes(w))
  })
  if (skill) {
    return {
      from: 'bot',
      text: `${skill.name} — ${skill.level} (${levelInfo[skill.level].note.toLowerCase()}), part of his ${skill.group} work.`,
    }
  }
  if (has(t, ['mobile', 'app', 'ios', 'android'])) {
    const g = skillGroups.find((x) => x.id === 'mobile')!
    return { from: 'bot', text: `${g.description} Honest level: Flutter is ${g.items[0].level.toLowerCase()} — he’s actively building depth.` }
  }
  if (has(t, ['cloud', 'devops', 'deploy', 'server', 'hosting', 'nginx', 'linux', 'aws'])) {
    const g = skillGroups.find((x) => x.id === 'cloud')!
    return { from: 'bot', text: `${g.description} Strongest: ${g.items.filter((i) => i.level === 'Strong' || i.level === 'Core').map((i) => i.name).slice(0, 6).join(', ')}.` }
  }
  if (has(t, ['skill', 'stack', 'tech', 'know', 'language', 'framework', 'tools', 'good at'])) {
    const core = allSkills.filter((s) => s.level === 'Core').map((s) => s.name)
    return {
      from: 'bot',
      text: `Backend-first: ${core.slice(0, 8).join(', ')}. Also React (working), Flutter (growing) and Linux/Nginx/AWS for deployment.`,
      action: { label: 'See the toolbox', run: () => scrollToTarget('#skills') },
    }
  }
  return {
    from: 'bot',
    text: `I only know what’s on this site. Try skills, projects, experience or contact — or email Satyam at ${profile.email}.`,
  }
}

const QUICK = ['What’s his stack?', 'Is he available?', 'Show me projects', 'How do I contact him?']

export function Assistant() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: `Hi! I’m a scripted guide to ${profile.firstName}’s portfolio. Ask about skills, projects, experience or how to reach him.` },
  ])
  const [q, setQ] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('assistant-open', open)
    if (open) window.setTimeout(() => input.current?.focus(), 60)
  }, [open])

  useEffect(
    () =>
      onAppEvent((e) => {
        if (e.type === 'open-assistant') {
          setOpen(true)
          if (e.prompt) ask(e.prompt)
        }
      }),
    [],
  )

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open])

  function ask(text: string) {
    const t = text.trim()
    if (!t) return
    setMsgs((m) => [...m, { from: 'me', text: t }])
    setQ('')
    window.setTimeout(() => setMsgs((m) => [...m, answer(t)]), 380)
  }

  return (
    <>
      <button type="button" className={`ask-chip${open ? ' hide' : ''}`} onClick={() => setOpen(true)} aria-label="Open the portfolio assistant">
        <span className="ask-ring" aria-hidden />
        Ask
      </button>
      {open && (
        <div className="assistant" role="dialog" aria-label="Portfolio assistant" data-lenis-prevent>
          <header>
            <span className="assistant-av" aria-hidden>
              S
            </span>
            <div>
              <p className="assistant-name">Ask about {profile.firstName}</p>
              <p className="assistant-sub">Scripted answers from this site</p>
            </div>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close assistant">
              <X size={16} aria-hidden />
            </button>
          </header>
          <div className="assistant-list" ref={list} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                <p>{m.text}</p>
                {m.action && (
                  <button
                    type="button"
                    onClick={() => {
                      m.action!.run()
                      if (window.innerWidth < 700) setOpen(false)
                    }}
                  >
                    {m.action.label} →
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="assistant-quick">
            {QUICK.map((x) => (
              <button key={x} type="button" onClick={() => ask(x)}>
                {x}
              </button>
            ))}
          </div>
          <form
            className="assistant-input"
            onSubmit={(e) => {
              e.preventDefault()
              ask(q)
            }}
          >
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Ask about ${profile.firstName}…`} aria-label="Your question" />
            <button type="submit" aria-label="Send" disabled={!q.trim()}>
              <ArrowUp size={15} aria-hidden />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
