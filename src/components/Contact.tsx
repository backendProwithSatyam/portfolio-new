import { useState } from 'react'
import { ArrowUpRight, Check, Copy, Linkedin, Phone } from 'lucide-react'
import { profile } from '../data'
import { SectionLabel } from './About'

const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Fields = { name: string; email: string; subject: string; message: string }
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'mailto' } | { kind: 'error'; message: string }

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email address.'
  if (f.message.trim().length < 20) e.message = 'Tell me a little more — at least 20 characters.'
  if (f.message.length > 3000) e.message = 'Please keep it under 3000 characters.'
  return e
}

export function Contact() {
  const [f, setF] = useState<Fields>({ name: '', email: '', subject: '', message: '' })
  const [touched, setTouched] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [copied, setCopied] = useState(false)
  const errors = touched ? validate(f) : {}

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((v) => ({ ...v, [k]: e.target.value }))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (Object.keys(validate(f)).length) return
    const subject = f.subject.trim() || `Portfolio enquiry from ${f.name.trim()}`

    if (!ACCESS_KEY) {
      const body = `${f.message.trim()}\n\n— ${f.name.trim()} (${f.email.trim()})`
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setStatus({ kind: 'mailto' })
      return
    }

    setStatus({ kind: 'sending' })
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject,
          from_name: 'Portfolio contact form',
          name: f.name.trim(),
          email: f.email.trim(),
          replyto: f.email.trim(),
          message: f.message.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setStatus({ kind: 'sent' })
        setF({ name: '', email: '', subject: '', message: '' })
        setTouched(false)
      } else {
        setStatus({ kind: 'error', message: data.message || `The server responded with ${res.status}.` })
      }
    } catch {
      setStatus({ kind: 'error', message: 'Network error — your message was not sent.' })
    }
  }

  const field = (k: keyof Fields, label: string, el: React.ReactNode) => (
    <div className={`field${errors[k] ? ' bad' : ''}`}>
      <label htmlFor={`cf-${k}`}>{label}</label>
      {el}
      {errors[k] && (
        <p className="field-err" id={`cf-${k}-err`}>
          {errors[k]}
        </p>
      )}
    </div>
  )

  return (
    <section id="contact" className="section contact">
      <div className="wrap contact-grid">
        <div className="contact-left">
          <SectionLabel n="05">CONTACT</SectionLabel>
          <h2 className="talk" data-reveal>
            Let’s talk.
          </h2>
          <p className="contact-sub" data-reveal>
            Whether it’s a full-time role or a freelance project, my inbox is open.
          </p>
          <div className="contact-mail" data-reveal>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <button type="button" className="icon-btn" onClick={copy} aria-label="Copy email address">
              {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
            </button>
            <span className="sr-only" aria-live="polite">
              {copied ? 'Email copied' : ''}
            </span>
          </div>
          <ul className="contact-links" data-reveal>
            <li>
              <a href={profile.phoneHref}>
                <Phone size={14} aria-hidden /> {profile.phone}
              </a>
            </li>
            <li>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                <Linkedin size={14} aria-hidden /> LinkedIn <ArrowUpRight size={13} aria-hidden />
              </a>
            </li>
          </ul>
        </div>

        <form className="contact-form" onSubmit={submit} noValidate data-reveal>
          <div className="form-row">
            {field(
              'name',
              'Your name',
              <input id="cf-name" value={f.name} onChange={set('name')} autoComplete="name" placeholder="What should I call you?" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'cf-name-err' : undefined} />,
            )}
            {field(
              'email',
              'Email address',
              <input id="cf-email" type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@company.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'cf-email-err' : undefined} />,
            )}
          </div>
          {field('subject', 'What do you want to build?', <input id="cf-subject" value={f.subject} onChange={set('subject')} placeholder="A CRM, an API, a website, a role…" />)}
          {field(
            'message',
            'Message',
            <textarea id="cf-message" rows={4} value={f.message} onChange={set('message')} placeholder="A few lines about the project, timeline and team." aria-invalid={!!errors.message} aria-describedby={errors.message ? 'cf-message-err' : undefined} />,
          )}
          <div className="form-foot">
            <button type="submit" className="btn btn-light" disabled={status.kind === 'sending'}>
              {status.kind === 'sending' ? 'Sending…' : 'Send message'} <ArrowUpRight size={16} aria-hidden />
            </button>
            <p className={`form-status ${status.kind}`} role="status" aria-live="polite">
              {status.kind === 'sent' && 'Thanks — your message was delivered. I’ll reply soon.'}
              {status.kind === 'mailto' && 'Your email app should open with the message ready to send.'}
              {status.kind === 'error' && status.message}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
