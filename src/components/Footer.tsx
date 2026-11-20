import { ArrowUp, ArrowUpRight, MoreHorizontal, Search } from 'lucide-react'
import { profile } from '../data'
import { Crowd } from '../crowd/Crowd'
import { emit, scrollToTarget } from '../lib/scroll'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#work', label: 'Projects' },
  { href: '#experience', label: 'Experience' },
  { href: '#contact', label: 'Contact' },
]

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer id="footer" className="footer">
      <div className="wrap footer-top">
        <div className="footer-brand">
          <p className="footer-name">{profile.firstName}.</p>
          <p className="footer-role">
            Laravel Specialist
            <br />
            Full-Stack Developer
          </p>
        </div>

        <div className="footer-explore">
          <p className="footer-k">Explore</p>
          <button type="button" className="mini-pill" onClick={() => emit({ type: 'open-search' })} aria-label="Search the site">
            <span>{profile.firstName}</span>
            <Search size={13} aria-hidden />
            <span className="mini-more">
              <MoreHorizontal size={14} aria-hidden />
            </span>
          </button>
          <ul className="footer-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToTarget(l.href)
                  }}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a href={profile.resume} download>
                Résumé
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-touch">
          <p className="footer-k">Get in touch</p>
          <a className="footer-mail" href={`mailto:${profile.email}`}>
            {profile.email} <ArrowUpRight size={13} aria-hidden />
          </a>
          <a className="footer-li" href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn <ArrowUpRight size={13} aria-hidden />
          </a>
          <p className="footer-copy">© {year} {profile.name}</p>
        </div>
      </div>

      <div className="wrap footer-bye">
        <p>See you around.</p>
        <button type="button" onClick={() => scrollToTarget('#top')}>
          Back to top <ArrowUp size={14} aria-hidden />
        </button>
      </div>

      <Crowd />
    </footer>
  )
}
