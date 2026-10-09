# The Frontend Bar — distilled from octavestreaming.com

Every frontend we ship is measured against this file. It exists because one
site showed what "finished" actually looks like: not more sections, but total
control over type, motion, and detail. Nothing here is taste — everything is
measurable. If a rule can't be verified, it doesn't belong.

## 0. The standard in one paragraph

Black canvas, one ink, one accent. Oversized display type with a width axis.
Every scroll position is a designed frame, not a waypoint between frames.
Every control works — copy buttons copy, accordions accord, toggles toggle.
Zero network calls for decoration. Zero console errors. Zero failed requests.
Desktop and mobile are both designed, never adapted.

## 1. Tokens before components — no exceptions

- All color, type, spacing, radius, duration, and easing values live in ONE
  token file. No raw hex, px, or ms anywhere else. (The bar: 207 vars.)
- One background, one text ink, ONE accent. A second accent must justify itself
  in writing or it doesn't ship.
- Overlines: 10px, uppercase, tracked-out mono or caps (`letter-spacing: .16em`
  class). Section eyebrows on every section (`01 — LINER NOTES` pattern).
- Hairlines are inset shadows, not borders. Radii are tiered: pills for
  buttons, ~14px cards, 8–10px media. Never invent a new radius.

## 2. Typography is the design

- Display face must have a width axis (or equivalent punch); headings run
  wide (`wdth` ~112) with tight negative tracking (-0.02em class).
- Body text never competes with display text: dim it (60% ink) and let size
  contrast do the work.
- Data (times, counts, versions, labels) goes mono. Always tabular numbers
  where values change (timers, progress).
- One giant word per idea when it matters (FLAC, Press play.). Scale is a
  feature, not decoration.

## 3. Scroll is choreography, not navigation

- Every scroll position must be a composed frame. Scrub-driven sequences
  (pinned sections with progress-interpolated color/type/state), never
  dead space between sections.
- Text reveals are word-level and scroll-linked (ink sweep across ghost
  text), not fade-on-enter.
- Motion is progress-derived (deterministic function of scroll), never
  time-derived, so scrubbing backwards looks as correct as forwards.
- Idle motion (drifts, marquees) is slow, seamless-looping, and pauses
  under `prefers-reduced-motion`. Motion sickness is a defect.

## 4. Every control works, every state designed

- If it looks clickable, it responds: hover states on everything hoverable,
  active/pressed states, focus-visible rings, disabled states.
- Hover on touch devices must degrade to something sane (tap = hover state),
  never to nothing. "Hover a record" needs a touch equivalent.
- Copy buttons flip to COPIED. Accordions animate. Toggles label-flip
  (SOUND OFF → SOUND ON) AND do the thing.
- Empty, loading, and error states are designed screens, not afterthoughts.
- No control may depend on a backend to *appear* functional in the demo;
  mock states must be indistinguishable from live ones visually.

## 5. Media discipline

- Hero media is edge-to-edge and dense — no black voids, no letterboxing.
  Grid fills its frame at every breakpoint (double the cells before you
  accept a gap).
- Grayscale-until-hover for galleries; the hovered item gets full color
  AND a spotlight (radial glow), with a hint label teaching the gesture.
- Lazy-load below the fold, but layout must be exact with or without the
  images loaded (reserve space; never shift).
- No audio/video files for synthesized effects — WebAudio oscillators,
  canvas, and CSS do the job at zero bytes.

## 6. Responsive is two designs

- 1440px and 390px are both first-class: separate section geometry, not
  scaled-down desktop. Verify both, every time.
- Touch targets ≥44px. Hover-only features get tap equivalents.
- Page heights must match the desktop design intent within 1% at both
  widths — height drift is how you detect broken pins, unwrapped grids,
  and unloaded-lazy-layout shifts.

## 7. Performance as a feature

- Zero network calls for decoration. Zero console errors. Zero failed
  requests — on `http://` AND `file://`.
- Fonts self-hosted (woff2, `font-display: swap`), preloaded without
  CORS noise.
- Entrance animations must not leave content invisible: any staggered
  reveal needs a cancel path when its container expands (no 3-second
  invisible rows, ever).

## 8. Verification gate (blocks every frontend delivery)

1. Screenshot every route at 1440 + 390, plus interaction states
   (hover, open menus, toggles on, expanded accordions).
2. Compare against the design reference: layout/heights within 1%,
   0 page errors, 0 failed requests.
3. `file://` run: everything loads and works with no server.
4. Keyboard pass: tab order sane, Esc closes overlays, focus visible.
5. `prefers-reduced-motion`: all idle/looping motion stops.
6. Candid residual list: anything that doesn't match is written down
   with a reason, never silently shipped.

## 9. The bar for "done"

A frontend is done when a hostile reviewer with screenshots can't find a
frame — at any scroll position, either width, any interaction state —
that looks undesigned. That is the whole standard. The OG site clears it;
that's why it's the reference.
