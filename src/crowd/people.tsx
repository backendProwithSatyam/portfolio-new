/**
 * Procedural line-art people. Every person is drawn from a handful of seeded choices
 * (build, outfit, hair, face, accessories) — no images, nothing traced.
 *
 * Local coordinates: the head is an ellipse centred on (0,0), rx 16 / ry 19.
 * The torso runs down to y=260 so the crowd panel always crops it.
 */
import type { ReactNode } from 'react'

export type Outfit = 'tee' | 'darkTee' | 'shirt' | 'hoodie' | 'blazer' | 'stripes' | 'dupatta' | 'jacket' | 'kurta' | 'sweater'
export type Hair =
  | 'crop' | 'swept' | 'sidepart' | 'long' | 'bob' | 'bun' | 'pony' | 'curly' | 'afro' | 'bald' | 'grey' | 'hijab' | 'cap' | 'beanie'
export type Eyes = 'dot' | 'smile' | 'open'
export type Mouth = 'smile' | 'grin' | 'flat' | 'o'

export type Person = {
  id: number
  x: number
  y: number
  s: number
  row: number
  sw: number
  outfit: Outfit
  hair: Hair
  eyes: Eyes
  mouth: Mouth
  glasses: null | 'round' | 'square'
  beard: null | 'full' | 'short' | 'mustache' | 'stubble'
  headphones: boolean
  lanyard: boolean
  strap: boolean
  earrings: boolean
  bindi: boolean
  blush: boolean
  brows: 'thin' | 'thick'
  tilt: number
  blinkDelay: number
  me?: boolean
}

/** mulberry32 — tiny deterministic PRNG so the same seed always draws the same crowd. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)]
const chance = (r: () => number, p: number) => r() < p

const OUTFITS: Outfit[] = ['tee', 'tee', 'darkTee', 'darkTee', 'shirt', 'hoodie', 'blazer', 'stripes', 'dupatta', 'jacket', 'kurta', 'sweater']
const HAIRS: Hair[] = ['crop', 'crop', 'swept', 'sidepart', 'long', 'long', 'bob', 'bun', 'pony', 'curly', 'afro', 'bald', 'grey', 'hijab', 'cap', 'beanie']

/** Rows from back to front: [scale, head-centre y as a fraction of panel height]. */
const ROWS: [number, number][] = [
  [0.6, 0.33],
  [0.72, 0.45],
  [0.86, 0.585],
  [1.02, 0.74],
]

/** A row of the crowd walking sideways. People wrap around once they're off-screen. */
export type Lane = { dir: 1 | -1; speed: number; length: number; margin: number }

/** Walking speed per row in px/s, back to front — nearer rows move faster (parallax). */
const LANE_SPEED = [14, 20, 27, 36]

export function makeCrowd(width: number, height: number, seed: number): { people: Person[]; lanes: Lane[] } {
  const r = rng(seed)
  const people: Person[] = []
  const lanes: Lane[] = []
  let id = 0
  const mid = width / 2
  const k = height / 340 // panel height scales everyone a little on small screens

  ROWS.forEach(([baseS, yFrac], row) => {
    const s = baseS * k
    const gap = 66 * s
    const margin = 58 * s
    const length = width + margin * 2
    lanes.push({ dir: row % 2 ? -1 : 1, speed: LANE_SPEED[row] * (width < 560 ? 0.7 : 1), length, margin })
    // Lay people out along the whole lane (including the off-screen margins) so the wrap seam
    // has the same spacing as everywhere else.
    let x = r() * gap * 0.5
    while (x < length - gap * 0.75) {
      people.push(randomPerson(r, id++, x - margin, height * yFrac + (r() - 0.5) * 10 * k, s * (0.94 + r() * 0.12), row))
      x += gap * (0.85 + r() * 0.35)
    }
  })

  // The main character: dark blazer, white shirt, swept-back hair and a short beard. They stand
  // still in front of everyone while the street walks past behind them.
  const front = ROWS[ROWS.length - 1]
  people.push({
    id: id++,
    x: mid,
    y: height * (front[1] - 0.17),
    s: front[0] * k,
    row: ROWS.length,
    sw: 37,
    outfit: 'blazer',
    hair: 'swept',
    eyes: 'dot',
    mouth: 'smile',
    glasses: null,
    beard: 'short',
    headphones: false,
    lanyard: false,
    strap: false,
    earrings: false,
    bindi: false,
    blush: false,
    brows: 'thick',
    tilt: 0,
    blinkDelay: 2.4,
    me: true,
  })

  // Painter's order: back rows first; the main character stands just in front of their row.
  return { people: people.sort((a, b) => a.row - b.row || (a.me ? 1 : 0) - (b.me ? 1 : 0)), lanes }
}

function randomPerson(r: () => number, id: number, x: number, y: number, s: number, row: number): Person {
  const hair = pick(r, HAIRS)
  const femaleCoded = ['long', 'bob', 'bun', 'pony', 'hijab'].includes(hair)
  const outfit = femaleCoded && chance(r, 0.35) ? 'dupatta' : pick(r, OUTFITS)
  const elder = hair === 'grey' || hair === 'bald'
  return {
    id,
    x,
    y,
    s,
    row,
    sw: 31 + r() * 11,
    outfit,
    hair,
    eyes: pick(r, ['dot', 'dot', 'dot', 'smile', 'open'] as const),
    mouth: pick(r, ['smile', 'smile', 'grin', 'flat', 'o'] as const),
    glasses: chance(r, elder ? 0.6 : 0.24) ? pick(r, ['round', 'square'] as const) : null,
    beard: !femaleCoded && chance(r, 0.38) ? pick(r, ['full', 'short', 'mustache', 'stubble'] as const) : null,
    headphones: chance(r, 0.1),
    lanyard: chance(r, 0.1),
    strap: chance(r, 0.14),
    earrings: femaleCoded && chance(r, 0.5),
    bindi: femaleCoded && hair !== 'hijab' && chance(r, 0.3),
    blush: chance(r, 0.3),
    brows: chance(r, 0.4) ? 'thick' : 'thin',
    tilt: (r() - 0.5) * 9,
    blinkDelay: r() * 7,
  }
}

/* ------------------------------------------------------------------ drawing */

const INK = 'var(--ink)'
const PAPER = 'var(--paper)'
const SW = 1.7

const line = (d: string, extra: Record<string, string | number> = {}) => (
  <path d={d} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" {...extra} />
)

function torsoPath(sw: number) {
  return `M-8 27 C-18 28 ${-sw + 3} 31 ${-sw} 46 L${-sw - 4} 260 L${sw + 4} 260 L${sw} 46 C${sw - 3} 31 18 28 8 27 Z`
}

function Torso({ p }: { p: Person }) {
  const { sw, outfit } = p
  const fill =
    outfit === 'darkTee' || outfit === 'blazer'
      ? INK
      : outfit === 'stripes'
        ? 'url(#pat-stripes)'
        : outfit === 'jacket' || outfit === 'sweater'
          ? 'url(#pat-hatch)'
          : PAPER
  const dark = outfit === 'darkTee' || outfit === 'blazer'
  const detail = dark ? PAPER : INK
  const seam = (
    <>
      <path d={`M${-sw + 9} 64 L${-sw + 7} 260`} fill="none" stroke={detail} strokeWidth={1.2} strokeLinecap="round" opacity={0.85} />
      <path d={`M${sw - 9} 64 L${sw - 7} 260`} fill="none" stroke={detail} strokeWidth={1.2} strokeLinecap="round" opacity={0.85} />
    </>
  )
  let details: ReactNode = null
  switch (outfit) {
    case 'tee':
    case 'stripes':
      details = <path d="M-8 27 Q0 38 8 27" fill={PAPER} stroke={INK} strokeWidth={SW} />
      break
    case 'darkTee':
      details = <path d="M-8 27 Q0 37 8 27" fill={PAPER} stroke={PAPER} strokeWidth={1.4} />
      break
    case 'shirt':
      details = (
        <>
          {line('M0 31 V260')}
          <path d="M-8 26 L-3.5 39 L0 31 L3.5 39 L8 26 Z" fill={PAPER} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <circle cx={1.8} cy={48} r={1} fill={INK} />
          <circle cx={1.8} cy={60} r={1} fill={INK} />
        </>
      )
      break
    case 'hoodie':
      details = (
        <>
          <path d="M-21 31 C-16 47 16 47 21 31" fill={PAPER} stroke={INK} strokeWidth={SW} />
          {line('M-4 40 V58')}
          {line('M4 40 V58')}
          <circle cx={-4} cy={59.5} r={1.3} fill={INK} />
          <circle cx={4} cy={59.5} r={1.3} fill={INK} />
        </>
      )
      break
    case 'blazer':
      details = (
        <>
          <path d="M-8.5 26.5 L0 54 L8.5 26.5 Z" fill={PAPER} />
          <path d="M-8.5 26.5 L-4 36 L-0.5 30 M8.5 26.5 L4 36 L0.5 30" fill="none" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
          <path d="M-9 27 L-15 56 L-3 70 M9 27 L15 56 L3 70" fill="none" stroke={PAPER} strokeWidth={1.2} strokeLinejoin="round" opacity={0.9} />
          <circle cx={-0.5} cy={84} r={1.3} fill={PAPER} />
        </>
      )
      break
    case 'dupatta':
      details = (
        <>
          <path d="M-7 27 Q0 34 7 27" fill={PAPER} stroke={INK} strokeWidth={SW} />
          <path
            d={`M${-sw + 3} 44 C-20 31 -9 33 -2 52 L${sw + 2} 132 L${sw - 14} 146 L-9 70 C-14 58 ${-sw + 8} 54 ${-sw + 2} 52 Z`}
            fill="url(#pat-dots)"
            stroke={INK}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
        </>
      )
      break
    case 'jacket':
      details = (
        <>
          <path d="M-9 26 L-6 40 L6 40 L9 26" fill={PAPER} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M0 40 V260" fill="none" stroke={INK} strokeWidth={1.6} strokeDasharray="2 2" />
        </>
      )
      break
    case 'kurta':
      details = (
        <>
          <path d="M-7 27 Q0 33 7 27" fill={PAPER} stroke={INK} strokeWidth={SW} />
          {line('M0 31 V54')}
          <circle cx={2} cy={38} r={0.9} fill={INK} />
          <circle cx={2} cy={46} r={0.9} fill={INK} />
        </>
      )
      break
    case 'sweater':
      details = <path d="M-8 26 L-3.5 37 L0 31 L3.5 37 L8 26 Z" fill={PAPER} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      break
  }
  return (
    <>
      <path d={torsoPath(sw)} fill={fill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {outfit !== 'dupatta' && outfit !== 'kurta' && seam}
      {details}
      {p.strap && (
        <path d={`M${-sw + 6} 36 L${sw + 1} 118 M${-sw + 3} 44 L${sw - 1} 126`} fill="none" stroke={dark ? PAPER : INK} strokeWidth={1.4} strokeLinecap="round" />
      )}
      {p.lanyard && (
        <>
          <path d="M-7 29 L-2 64 M7 29 L2 64" fill="none" stroke={dark ? PAPER : INK} strokeWidth={1.2} />
          <rect x={-5.5} y={63} width={11} height={14} rx={1.5} fill={PAPER} stroke={INK} strokeWidth={1.3} />
          <path d="M-3 68 H3 M-3 71.5 H1.5" fill="none" stroke={INK} strokeWidth={1} />
        </>
      )}
    </>
  )
}

function HairBack({ hair }: { hair: Hair }) {
  switch (hair) {
    case 'long':
      return <path d="M-19 -4 C-22 -27 22 -27 19 -4 L23 44 C10 50 -10 50 -23 44 Z" fill={INK} stroke={INK} strokeWidth={SW} />
    case 'bob':
      return <path d="M-19.5 -4 C-22 -27 22 -27 19.5 -4 L21 17 C14 22 -14 22 -21 17 Z" fill={INK} stroke={INK} strokeWidth={SW} />
    case 'bun':
      return <circle cx={0} cy={-25} r={8} fill={INK} />
    case 'pony':
      return <path d="M11 -13 C27 -11 29 8 22 24 C20 11 16 1 9 -5 Z" fill={INK} />
    case 'afro':
      return (
        <g fill={INK}>
          <ellipse cx={0} cy={-8} rx={25} ry={23} />
          {[-24, -17, -8, 0, 8, 17, 24].map((x, i) => (
            <circle key={i} cx={x} cy={-8 - Math.sqrt(Math.max(0, 1 - (x / 26) ** 2)) * 22} r={6.5} />
          ))}
        </g>
      )
    case 'hijab':
      return (
        <path
          d="M-24 2 C-26 -26 26 -26 24 2 C25 20 33 28 42 38 L-42 38 C-33 28 -25 20 -24 2 Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      )
    default:
      return null
  }
}

function HairFront({ hair }: { hair: Hair }) {
  switch (hair) {
    case 'crop':
      return <path d="M-16.5 -1 C-18 -16 -10 -23 0 -23 C10 -23 18 -16 16.5 -1 C14 -9 9 -13 1 -13 C-7 -13 -13 -9 -16.5 -1 Z" fill={INK} />
    case 'swept':
      return (
        <>
          <path d="M-16.8 2 C-20.5 -15 -11 -27 2 -27 C14.5 -27 21.5 -16 16.9 2.5 C15.6 -7 12 -13 5 -15.5 C-2 -17.5 -10.5 -12 -16.8 2 Z" fill={INK} />
          <path d="M-6 -24 C-2 -21 3 -20 9 -21 M-9 -19 C-4 -16 2 -16 7 -17" fill="none" stroke={PAPER} strokeWidth={0.8} strokeLinecap="round" opacity={0.7} />
        </>
      )
    case 'sidepart':
      return (
        <>
          <path d="M-16.5 0 C-18 -17 -8 -24 2 -23 C12 -22 18 -15 16.5 -2 C12 -9 4 -12 -4 -11 C-10 -11 -14 -6 -16.5 0 Z" fill={INK} />
          {line('M-4 -11 C-8 -6 -12 -4 -16 -2')}
        </>
      )
    case 'long':
    case 'pony':
      return <path d="M-16.5 2 C-17 -17 -6 -22 2 -22 C11 -22 17 -16 16.5 2 C14 -8 8 -12 0 -12 C-3 -8 -10 -4 -16.5 2 Z" fill={INK} />
    case 'bob':
      return <path d="M-16.8 -2 C-17 -21 17 -21 16.8 -2 C12 -8 6 -8.5 -1 -8 C-7 -8 -12 -6 -16.8 -2 Z" fill={INK} />
    case 'bun':
      return <path d="M-16.5 0 C-17.5 -19 17.5 -19 16.5 0 C13 -10 7 -13 0 -13 C-7 -13 -13 -10 -16.5 0 Z" fill={INK} />
    case 'curly':
      return (
        <g fill={INK}>
          <path d="M-16.5 -1 C-18 -16 -10 -22 0 -22 C10 -22 18 -16 16.5 -1 C14 -9 9 -12 1 -12 C-7 -12 -13 -9 -16.5 -1 Z" />
          {[200, 222, 245, 270, 295, 318, 340].map((a, i) => {
            const t = (a * Math.PI) / 180
            return <circle key={i} cx={Math.cos(t) * 16.5} cy={Math.sin(t) * 18 - 3} r={5.6} />
          })}
        </g>
      )
    case 'afro':
      return <path d="M-16 -3 C-14 -12 -6 -14 0 -13 C6 -14 14 -12 16 -3 C16 -10 12 -17 0 -17 C-12 -17 -16 -10 -16 -3 Z" fill={INK} />
    case 'bald':
      return (
        <>
          {line('M-16 -2 C-16.5 -7 -15 -10 -12.5 -11.5')}
          {line('M16 -2 C16.5 -7 15 -10 12.5 -11.5')}
          <path d="M-6 -15 C-3 -17 1 -17 3 -16" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" opacity={0.6} />
        </>
      )
    case 'grey':
      return (
        <>
          <path
            d="M-16.5 -1 C-18 -16 -10 -23 0 -23 C10 -23 18 -16 16.5 -1 C14 -9 9 -13 1 -13 C-7 -13 -13 -9 -16.5 -1 Z"
            fill={PAPER}
            stroke={INK}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <path d="M-11 -17 C-8 -15 -5 -14 -2 -14 M-1 -20 C2 -17 6 -16 10 -16 M-14 -9 C-12 -12 -9 -13 -7 -13" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" />
        </>
      )
    case 'hijab':
      return (
        <>
          <ellipse cx={0} cy={0.5} rx={18.5} ry={21.5} fill="none" stroke={INK} strokeWidth={SW} />
          {line('M-21 22 C-12 30 12 30 21 22')}
        </>
      )
    case 'cap':
      return (
        <>
          <path d="M-17 -4 C-17.5 -26 17.5 -26 17 -4 Z" fill={INK} />
          <path d="M-17 -4.5 C-4 -9 16 -8.5 31 -2.5 C21 2 -4 0.5 -17 -4.5 Z" fill={INK} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <circle cx={0} cy={-24.5} r={1.6} fill={PAPER} />
        </>
      )
    case 'beanie':
      return (
        <>
          <path d="M-17.5 -3 C-18 -29 18 -29 17.5 -3 Z" fill="url(#pat-hatch)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <rect x={-18.5} y={-8} width={37} height={7} rx={2} fill={PAPER} stroke={INK} strokeWidth={SW} />
          <circle cx={0} cy={-28} r={4} fill={PAPER} stroke={INK} strokeWidth={SW} />
        </>
      )
  }
}

function Face({ p }: { p: Person }) {
  const ink = INK
  const beardDark = p.beard === 'full' || p.beard === 'short'
  const mouthStroke = beardDark ? PAPER : INK
  const browW = p.brows === 'thick' ? 2.3 : 1.3
  return (
    <>
      {p.beard === 'full' && (
        <path
          d="M-16 0 C-16 17 -8 25 0 25 C8 25 16 17 16 0 C14 6 12 8 9 8.5 C6 7 3 7.5 0 8 C-3 7.5 -6 7 -9 8.5 C-12 8 -14 6 -16 0 Z"
          fill={ink}
        />
      )}
      {p.beard === 'short' && (
        <path d="M-15.8 2 C-15 15 -8 22 0 22 C8 22 15 15 15.8 2 C14 7.5 10.5 9 6.5 8.6 L0 9.2 L-6.5 8.6 C-10.5 9 -14 7.5 -15.8 2 Z" fill={ink} />
      )}
      {p.beard === 'stubble' &&
        [-11, -8, -5, -2, 1, 4, 7, 10].map((x, i) => <circle key={i} cx={x} cy={14 + Math.abs(x) * -0.25 + (i % 2) * 1.6} r={0.55} fill={ink} />)}
      <g className="eyes" style={{ animationDelay: `${p.blinkDelay}s` }}>
        {p.eyes === 'dot' && (
          <>
            <circle cx={-6} cy={-1} r={1.8} fill={ink} />
            <circle cx={6} cy={-1} r={1.8} fill={ink} />
          </>
        )}
        {p.eyes === 'smile' && (
          <>
            {line('M-9 -0.5 Q-6 -3.8 -3 -0.5', { strokeWidth: 1.5 })}
            {line('M3 -0.5 Q6 -3.8 9 -0.5', { strokeWidth: 1.5 })}
          </>
        )}
        {p.eyes === 'open' && (
          <>
            <ellipse cx={-6} cy={-1} rx={3.1} ry={2.6} fill={PAPER} stroke={ink} strokeWidth={1.2} />
            <ellipse cx={6} cy={-1} rx={3.1} ry={2.6} fill={PAPER} stroke={ink} strokeWidth={1.2} />
            <circle className="pupil" cx={-6} cy={-1} r={1.45} fill={ink} />
            <circle className="pupil" cx={6} cy={-1} r={1.45} fill={ink} />
          </>
        )}
      </g>
      {line(`M-10 -6.5 Q-7 -8.8 -3.5 -7.2`, { strokeWidth: browW })}
      {line(`M3.5 -7.2 Q7 -8.8 10 -6.5`, { strokeWidth: browW })}
      {line('M0.6 0.5 Q2.6 5 -0.6 6.2', { strokeWidth: 1.3 })}
      {p.beard === 'mustache' && (
        <path d="M-6.5 8 C-3 5.8 -1 7 0 7.6 C1 7 3 5.8 6.5 8 C3 9.6 1 9.1 0 8.9 C-1 9.1 -3 9.6 -6.5 8 Z" fill={ink} />
      )}
      {p.mouth === 'smile' && line('M-5 10.5 Q0 14.5 5 10.5', { stroke: mouthStroke, strokeWidth: 1.5 })}
      {p.mouth === 'grin' && (
        <>
          <path d="M-6 9.6 Q0 9 6 9.6 Q5 16.4 0 16.4 Q-5 16.4 -6 9.6 Z" fill={beardDark ? PAPER : ink} />
          <path d="M-4.5 10.8 H4.5" stroke={beardDark ? ink : PAPER} strokeWidth={1} />
        </>
      )}
      {p.mouth === 'flat' && line('M-3.5 11.5 H3.5', { stroke: mouthStroke, strokeWidth: 1.5 })}
      {p.mouth === 'o' && <ellipse cx={0} cy={11.6} rx={2.1} ry={2.6} fill={beardDark ? PAPER : ink} />}
      {p.blush && !beardDark && (
        <path d="M-13 5.5 l2 -2 M-10.6 6.3 l2 -2 M8.6 6.3 l2 -2 M11 5.5 l2 -2" fill="none" stroke={ink} strokeWidth={0.9} strokeLinecap="round" />
      )}
      {p.bindi && <circle cx={0} cy={-6.4} r={1.15} fill={ink} />}
      {p.glasses === 'round' && (
        <>
          <circle cx={-6.3} cy={-1} r={4.7} fill="none" stroke={ink} strokeWidth={1.35} />
          <circle cx={6.3} cy={-1} r={4.7} fill="none" stroke={ink} strokeWidth={1.35} />
          {line('M-1.6 -1.6 Q0 -3 1.6 -1.6 M-11 -2 L-16 -3.5 M11 -2 L16 -3.5', { strokeWidth: 1.2 })}
        </>
      )}
      {p.glasses === 'square' && (
        <>
          <rect x={-11.6} y={-5} width={9.4} height={7.2} rx={1.6} fill="none" stroke={ink} strokeWidth={1.45} />
          <rect x={2.2} y={-5} width={9.4} height={7.2} rx={1.6} fill="none" stroke={ink} strokeWidth={1.45} />
          {line('M-2.2 -2.4 H2.2 M-11.6 -2.6 L-16 -3.6 M11.6 -2.6 L16 -3.6', { strokeWidth: 1.2 })}
        </>
      )}
    </>
  )
}

/** One person. `faceRef` and `liftRef` are moved every frame by the crowd's pointer loop. */
export function PersonShape({
  p,
  liftRef,
  faceRef,
}: {
  p: Person
  liftRef: (el: SVGGElement | null) => void
  faceRef: (el: SVGGElement | null) => void
}) {
  const showEars = p.hair !== 'hijab' && p.hair !== 'long' && p.hair !== 'bob' && p.hair !== 'afro'
  return (
    <g ref={liftRef} className="lift">
      <g className="hop">
      <Torso p={p} />
      <path d="M-6 13 L-6.6 30 L6.6 30 L6 13" fill={PAPER} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {p.headphones && (
        <>
          <path d="M-15 30 C-14 45 14 45 15 30" fill="none" stroke={INK} strokeWidth={3} />
          <ellipse cx={-15} cy={32} rx={3.6} ry={5.2} fill={INK} />
          <ellipse cx={15} cy={32} rx={3.6} ry={5.2} fill={INK} />
        </>
      )}
      <g transform={`rotate(${p.tilt.toFixed(1)} 0 14)`}>
        <HairBack hair={p.hair} />
        {showEars && (
          <>
            <ellipse cx={-16} cy={1.5} rx={3.3} ry={5} fill={PAPER} stroke={INK} strokeWidth={SW} />
            <ellipse cx={16} cy={1.5} rx={3.3} ry={5} fill={PAPER} stroke={INK} strokeWidth={SW} />
          </>
        )}
        <ellipse cx={0} cy={0} rx={16} ry={19} fill={PAPER} stroke={INK} strokeWidth={SW} />
        {p.earrings && (
          <>
            <circle cx={-16.4} cy={8.8} r={1.7} fill="none" stroke={INK} strokeWidth={1.1} />
            <circle cx={16.4} cy={8.8} r={1.7} fill="none" stroke={INK} strokeWidth={1.1} />
          </>
        )}
        <g ref={faceRef} className="face">
          <Face p={p} />
        </g>
        <HairFront hair={p.hair} />
      </g>
      </g>
    </g>
  )
}

export function CrowdDefs() {
  return (
    <defs>
      <pattern id="pat-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="4" height="4" fill="var(--paper)" />
        <line x1="0" y1="0" x2="0" y2="4" stroke="var(--ink)" strokeWidth="1.1" />
      </pattern>
      <pattern id="pat-stripes" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--paper)" />
        <rect y="0" width="8" height="3.2" fill="var(--ink)" />
      </pattern>
      <pattern id="pat-dots" width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="var(--paper)" />
        <circle cx="2.5" cy="2.5" r="0.95" fill="var(--ink)" />
      </pattern>
    </defs>
  )
}

/** Things people say when you point at them. */
export const LINES = [
  'Is it deployed yet?',
  'Works on my machine.',
  'Did someone say Laravel?',
  'php artisan migrate --force 😬',
  'Cache cleared. Still broken.',
  'SSL renewed ✓',
  'Who pushed to main?',
  'N+1 query? Not on my watch.',
  'Ship it!',
  'Nginx says 502…',
  "git commit -m 'final_final_v2'",
  'Coffee first, then queues.',
  'That API is so RESTful.',
  'Queue it, don’t block it.',
  'Tabs or spaces? Yes.',
  'You scrolled all the way down!',
  'I came for the CRM demo.',
  'Hire Satyam already.',
  'Have you tried a fresh deploy?',
  'Indexes fixed everything.',
  'It’s always DNS.',
  'Composer update… brb.',
  'Looks great on mobile too.',
  'Wait, this footer is drawn in code?',
]

export const ME_LINES = [
  'Hey, that’s me 👋',
  'Thanks for scrolling all the way here!',
  'Got a project? Let’s build it.',
  'Laravel, React, Flutter — and this crowd.',
]
