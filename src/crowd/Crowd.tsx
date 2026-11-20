import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RefreshCw } from 'lucide-react'
import { CrowdDefs, LINES, ME_LINES, makeCrowd, PersonShape, rng, type Person } from './people'
import { prefersReduced } from '../lib/scroll'

type Bubble = { key: number; pid: number; text: string; x: number; y: number; flip: boolean }

function panelHeight(w: number) {
  if (w < 560) return 250
  if (w < 1000) return 300
  return 360
}

const mod = (n: number, m: number) => ((n % m) + m) % m

/**
 * The footer crowd: a seeded, procedurally drawn street. Every row walks sideways (nearer
 * rows faster, neighbouring rows in opposite directions) while the main character stands
 * still in the middle. Pointing at the crowd slows the street; pointing at a person stops it
 * so they can say something. A click makes them jump.
 */
export function Crowd() {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 360 })
  const [seed, setSeed] = useState(2026)
  const [hot, setHot] = useState<number | null>(null)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [live, setLive] = useState(false)
  const [walking, setWalking] = useState(() => !prefersReduced())
  const [shuffling, setShuffling] = useState(false)

  const { people, lanes } = useMemo(
    () => (size.w ? makeCrowd(size.w, size.h, seed) : { people: [] as Person[], lanes: [] }),
    [size.w, size.h, seed],
  )
  const me = people.find((p) => p.me)
  const indexOf = useMemo(() => new Map(people.map((p, i) => [p.id, i])), [people])

  // Per-person DOM handles + animated values, indexed by array position.
  const outers = useRef<(SVGGElement | null)[]>([])
  const lifts = useRef<(SVGGElement | null)[]>([])
  const faces = useRef<(SVGGElement | null)[]>([])
  const state = useRef<{ lift: number; fx: number; fy: number }[]>([])
  const xs = useRef<number[]>([])
  const offsets = useRef<number[]>([])
  const speed = useRef(0) // 0 = standing still, 1 = full walking pace
  const bubbleEls = useRef(new Map<number, HTMLDivElement>())
  const pointer = useRef({ x: 0, y: 0, cx: 0, cy: 0, inside: false, mouse: true })
  const hotRef = useRef<number | null>(null)
  const liveRef = useRef(false)
  const walkRef = useRef(walking)
  const frame = useRef(0)
  const last = useRef(0)
  const tickCount = useRef(0)
  const lineRand = useRef(rng(7))
  const bubbleKey = useRef(0)

  useEffect(() => {
    state.current = people.map(() => ({ lift: 0, fx: 0, fy: 0 }))
    xs.current = people.map((p) => p.x)
    offsets.current = lanes.map(() => 0)
  }, [people, lanes])

  // Size the drawing to the panel so 1 SVG unit = 1 CSS pixel.
  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = (width: number) => {
      const w = Math.round(width / 8) * 8
      if (w > 0) setSize((s) => (s.w === w ? s : { w, h: panelHeight(w) }))
    }
    measure(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([entry]) => measure(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const lineFor = useCallback((p: Person) => {
    const list = p.me ? ME_LINES : LINES
    return list[Math.floor(lineRand.current() * list.length)]
  }, [])

  const bubbleFor = useCallback(
    (p: Person): Bubble => {
      const x = xs.current[indexOf.get(p.id) ?? -1] ?? p.x
      return { key: ++bubbleKey.current, pid: p.id, text: lineFor(p), x, y: p.y - 46 * p.s - 6, flip: x > size.w - 140 }
    },
    [indexOf, lineFor, size.w],
  )

  /** Make `pid` the person under the pointer: they stand up and say something. */
  const setHotPerson = useCallback(
    (pid: number | null) => {
      if (pid === hotRef.current) return
      const prev = hotRef.current
      hotRef.current = pid
      setHot(pid)
      const p = pid === null ? undefined : people[indexOf.get(pid) ?? -1]
      setBubbles((list) => {
        const kept = list.filter((b) => b.pid !== prev)
        return p ? [...kept.filter((b) => b.pid !== p.id).slice(-2), bubbleFor(p)] : kept
      })
    },
    [people, indexOf, bubbleFor],
  )

  const tick = useCallback(
    (now: number) => {
      frame.current = 0
      const dt = last.current ? Math.min(0.05, (now - last.current) / 1000) : 1 / 60
      last.current = now
      const reduced = prefersReduced()
      const { x: px, y: py, inside } = pointer.current

      // Street speed eases towards: walking, strolling (pointer over the crowd) or stopped.
      const canWalk = walkRef.current && liveRef.current && !reduced
      const target = !canWalk ? 0 : hotRef.current !== null ? 0 : inside ? 0.3 : 1
      speed.current += (target - speed.current) * (1 - Math.exp(-dt * 3.2))
      if (Math.abs(speed.current - target) < 0.002) speed.current = target
      const v = speed.current
      lanes.forEach((lane, l) => {
        offsets.current[l] += lane.dir * lane.speed * v * dt
      })

      // People keep moving under a still mouse, so re-check who's under it now and then.
      if (inside && pointer.current.mouse && v > 0.01 && ++tickCount.current % 5 === 0) {
        const el = document.elementFromPoint(pointer.current.cx, pointer.current.cy)?.closest('[data-pid]')
        setHotPerson(el ? Number(el.getAttribute('data-pid')) : null)
      }

      let busy = v > 0 || canWalk
      for (let i = 0; i < people.length; i++) {
        const p = people[i]
        const st = state.current[i]
        if (!st) continue
        let x = p.x
        let bob = 0
        let sway = 0
        let dir = 0
        if (!p.me && lanes[p.row]) {
          const lane = lanes[p.row]
          x = mod(p.x + lane.margin + offsets.current[p.row], lane.length) - lane.margin
          if (Math.abs(x - xs.current[i]) > 0.02) {
            xs.current[i] = x
            outers.current[i]?.setAttribute('transform', `translate(${x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.s.toFixed(3)})`)
          }
          // One bob per step; the step length scales with the person.
          const step = Math.abs(offsets.current[p.row]) / (22 * p.s) + p.blinkDelay
          const walkAmt = Math.min(1, v * 1.4)
          bob = Math.abs(Math.sin(step * Math.PI)) * 2.6 * walkAmt
          sway = Math.sin(step * Math.PI) * 1.8 * walkAmt
          dir = lane.dir
        }

        const dx = px - x
        const near = inside ? Math.max(0, 1 - Math.abs(dx) / 120) : 0
        const isHot = hotRef.current === p.id
        const tLift = reduced ? 0 : isHot ? 15 : near * near * 8
        // Faces look at the pointer, otherwise where they're walking.
        const tfx = inside ? Math.max(-1, Math.min(1, dx / 90)) * 2.8 : dir * 2 * Math.min(1, v * 1.4)
        const tfy = inside ? Math.max(-1, Math.min(1, (py - p.y) / 140)) * 1.6 : 0
        const k = 1 - Math.exp(-dt * 10)
        const nl = st.lift + (tLift - st.lift) * k
        const nfx = st.fx + (tfx - st.fx) * k
        const nfy = st.fy + (tfy - st.fy) * k
        const settled = Math.abs(nl - st.lift) < 0.01 && Math.abs(nfx - st.fx) < 0.005 && Math.abs(nfy - st.fy) < 0.005
        if (!settled) busy = true
        if (!settled || bob > 0.001 || v > 0) {
          st.lift = nl
          st.fx = nfx
          st.fy = nfy
          lifts.current[i]?.setAttribute('transform', `translate(0 ${(-(nl + bob)).toFixed(2)}) rotate(${sway.toFixed(2)} 0 30)`)
          faces.current[i]?.setAttribute('transform', `translate(${nfx.toFixed(2)} ${nfy.toFixed(2)})`)
        }
      }

      // Speech bubbles follow whoever is talking.
      bubbleEls.current.forEach((el, pid) => {
        if (!el.isConnected) {
          bubbleEls.current.delete(pid)
          return
        }
        const i = indexOf.get(pid)
        if (i !== undefined) el.style.left = `${xs.current[i].toFixed(1)}px`
      })

      if (busy || inside) frame.current = requestAnimationFrame(tick)
      else last.current = 0
    },
    [people, lanes, indexOf, setHotPerson],
  )

  const kick = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(tick)
  }, [tick])

  useEffect(() => {
    liveRef.current = live
    walkRef.current = walking
    kick()
  }, [live, walking, kick])

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      frame.current = 0
    },
    [tick],
  )

  const pidFromEvent = (e: React.PointerEvent) => {
    const g = (e.target as Element).closest('[data-pid]')
    return g ? Number(g.getAttribute('data-pid')) : null
  }

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect()
    const mouse = e.pointerType === 'mouse'
    pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top, cx: e.clientX, cy: e.clientY, inside: true, mouse }
    if (mouse) setHotPerson(pidFromEvent(e))
    kick()
  }

  const onLeave = () => {
    pointer.current.inside = false
    setHotPerson(null)
    kick()
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const pid = pidFromEvent(e)
    const i = pid === null ? -1 : (indexOf.get(pid) ?? -1)
    if (i < 0) return
    const p = people[i]
    const g = lifts.current[i]?.firstElementChild
    if (g && !prefersReduced()) {
      g.classList.remove('jump')
      void (g as unknown as HTMLElement).getBoundingClientRect()
      g.classList.add('jump')
    }
    if (e.pointerType !== 'mouse') {
      // Touch: hold the street still around the tapped person for a moment.
      pointer.current = { ...pointer.current, x: xs.current[i], y: p.y, inside: true, mouse: false }
      setHotPerson(p.id)
      kick()
      window.setTimeout(() => {
        if (hotRef.current === p.id) onLeave()
      }, 2600)
      return
    }
    const b = bubbleFor(p)
    setBubbles((list) => [...list.filter((x) => x.pid !== p.id).slice(-2), b])
    window.setTimeout(() => setBubbles((list) => list.filter((x) => x.key !== b.key)), 2600)
  }

  const shuffle = () => {
    setShuffling(true)
    window.setTimeout(() => {
      setBubbles([])
      hotRef.current = null
      setHot(null)
      speed.current = 0
      setSeed((s) => s + 101)
      setShuffling(false)
    }, prefersReduced() ? 0 : 260)
  }

  return (
    <div className="crowd">
      <div ref={wrap} className={`crowd-stage${live ? ' live' : ''}${shuffling ? ' shuffling' : ''}`} style={{ height: size.h }}>
        <div className="crowd-word" aria-hidden>
          SATYAM.
        </div>
        {size.w > 0 && (
          <svg
            ref={svgRef}
            className={`crowd-svg${hot !== null ? ' has-hot' : ''}`}
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            role="img"
            aria-label={`An illustrated street of ${people.length} people drawn in code, walking past Satyam, who stands still in the middle. Point at someone to hear what they think.`}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            onPointerDown={onDown}
          >
            <CrowdDefs />
            {people.map((p, i) => (
              <g
                key={`${seed}-${p.id}`}
                ref={(el) => (outers.current[i] = el)}
                data-pid={p.id}
                className={`person${p.me ? ' me' : ''}${hot === p.id ? ' is-hot' : ''}`}
                transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.s.toFixed(3)})`}
              >
                <PersonShape p={p} liftRef={(el) => (lifts.current[i] = el)} faceRef={(el) => (faces.current[i] = el)} />
              </g>
            ))}
          </svg>
        )}
        {me && (
          <div
            className={`me-tag${hot === me.id || bubbles.some((b) => b.pid === me.id) ? ' hide' : ''}`}
            style={{ left: me.x, top: me.y - 36 * me.s - 6 }}
            aria-hidden
          >
            <span className="me-dot" /> that’s me
          </div>
        )}
        {bubbles.map((b) => (
          <div
            key={b.key}
            ref={(el) => {
              if (el) bubbleEls.current.set(b.pid, el)
              else if (bubbleEls.current.get(b.pid) && !bubbleEls.current.get(b.pid)!.isConnected) bubbleEls.current.delete(b.pid)
            }}
            className={`bubble${b.flip ? ' flip' : ''}`}
            style={{ left: b.x, top: b.y }}
            role="status"
          >
            {b.text}
          </div>
        ))}
      </div>
      <div className="crowd-foot">
        <span>
          {people.length} people, drawn in code — no images. Point at anyone to stop the street; click to make them jump.
        </span>
        <span className="crowd-actions">
          <button type="button" className="crowd-shuffle" onClick={() => setWalking((w) => !w)} aria-pressed={!walking}>
            {walking ? <Pause size={13} aria-hidden /> : <Play size={13} aria-hidden />} {walking ? 'Pause' : 'Let them walk'}
          </button>
          <button type="button" className="crowd-shuffle" onClick={shuffle}>
            <RefreshCw size={13} aria-hidden /> New crowd
          </button>
        </span>
      </div>
    </div>
  )
}
