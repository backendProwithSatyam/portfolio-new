# Satyam Shukla — style Portfolio

A second, separate portfolio in a black-and-white, editorial style. It lives entirely in this
folder and does not touch the original site in the parent directory.

React 18 + TypeScript + Vite, GSAP ScrollTrigger and Lenis smooth scrolling. No CSS framework.

## Run it

```bash
cd portfolio
npm install
npm run dev        # http://localhost:5174  (the original site stays on 5173)
npm run build      # production build → reel-portfolio/dist
npm run preview    # serve the build locally
```

## What's on the page

| Section | What it does |
| --- | --- |
| Intro | `< SOFTWARE ENGINEER />` over a field of code glyphs that light up around the cursor; the B&W portrait grows up from the bottom. |
| Hero | Scrolling clears the intro, settles the portrait in the middle and brings in "Hi, I'm Satyam." (desktop: pinned scroll scene; phones: stacked). |
| Pill nav | Floating pill with the current section. The search / ••• buttons (or Ctrl+K) open a search over sections, projects, skills and actions. |
| About / Skills | Scroll-lit lead paragraph, principles, real numbers; skills by group with a Core → Growing filter. |
| Projects | Each project is a folder: hover opens it and the papers slide out; click for the case-study panel. |
| Experience | Role card plus a curved "How I ship" timeline that draws itself as you scroll. |
| Let's talk | Underlined form. Uses Web3Forms when `VITE_WEB3FORMS_ACCESS_KEY` is set (copy `.env.example` to `.env`); otherwise it opens the visitor's email app. It never shows a fake "sent". |
| Footer | "See you around." with a big `SATYAM.` watermark and an interactive crowd. |
| Ask | Bottom-right chip opens a scripted assistant that answers from `src/data.ts` (labelled as scripted — no AI model, no network). The crowd greys out while it's open. |

## The footer crowd

`src/crowd/people.tsx` draws every person from seeded choices — build, outfit (tee, shirt, hoodie,
blazer, stripes, dupatta, jacket…), hair (crop, long, bun, curly, hijab, cap, beanie…), glasses,
beards, headphones, lanyards. No images. The middle one in the dark blazer with the beard is you
("that's me").

- **It's a street.** Every row walks sideways and wraps around: nearer rows walk faster, and
  neighbouring rows go in opposite directions. People bob with each step and look where they're
  going. You stand still at the front while everyone walks past behind you.
- Point at the crowd and the street slows to a stroll; point at a person and it stops. They stand up
  with a speech bubble, and everyone nearby turns to look at the cursor. Click (or tap) someone to
  make them jump.
- **Pause / Let them walk** stops the movement (people with reduced-motion turned on start paused).
  **New crowd** reshuffles the seed. Lines people say are in `LINES` / `ME_LINES` in `people.tsx`;
  walking speeds per row are `LANE_SPEED` (px per second, back to front).
- The crowd re-draws to fit the width, so phones get fewer, larger people. It only animates while
  it's on screen.

## Content

Everything comes from `src/data.ts`, copied from the original site's `src/data/profile.ts` so this
folder can be deployed on its own. If your details change, update both files.

## Deploy

Static hosting. Vercel / Netlify: set the root directory to `reel-portfolio`, build command
`npm run build`, output `dist`.
