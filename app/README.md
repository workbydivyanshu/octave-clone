# Octave web player — static demo clone

A dependency-free, build-step-free, static reconstruction of the Octave web player
(`music.octavestreaming.com`), built from the read-only recon in
`/tmp/octave-app-recon/`.

Open `index.html` directly (`file://` works) or serve the folder with any static
host. There is **no backend, no build step, and no network access of any kind.**

---

## Hard constraints honoured

| Constraint | How |
|---|---|
| **No secrets** | The recon flagged a Last.fm API key (`/api/lastfm/status`) and a VAPID push key (`/api/push/vapid-key`) in live responses. Neither is present, quoted, or derivable here. There is no analytics, telemetry, service worker, or push code at all. |
| **No third-party artwork** | None of the 30 `artwork-sample/` covers (Deezer / Apple CDN) were copied or hotlinked. Every piece of cover art is generated at runtime by `assets/js/art.js` from a deterministic hash of the item id: a seeded gradient stack plus initials. Brand marks and the Inter woff2 subsets from the recon's `assets/brand` + `assets/fonts` are owner-authorized and are the only binaries shipped. |
| **No backend calls** | Zero `fetch` / `XMLHttpRequest` / `WebSocket` / `EventSource` / `sendBeacon` / dynamic `import()` / service worker in any file. All catalogue data is an inline JS object (`assets/js/data.js`) authored from the recon copy dumps. |
| **Shared design system** | The `:root` token layer is lifted from the shared app/marketing stylesheet — `--accent #fb2c5a`, the four glass tiers × four frost strengths, the Now Playing accent ramp, the Inter variable stack, the 256px sidebar, the 57px top bar, the 88px player reservation, the radii scale, and the `--ease-out` / `--ease-spring` curves. |

---

## Layout

```
index.html                 Player Home
search.html                Search — live filtering + results tabs
charts.html                Charts (Top 100, per-city charts)
new.html / browse.html     New & editorial + #genres anchor
library.html               Library hub (8 tabs, ?tab=)
album.html                 Album  (?a=al-habibti | al-showgirl)
artist.html                Artist
genre.html                 Genre (?g=Pop)
radio.html                 Radio
podcasts.html              Podcasts home
podcasts-charts.html       Podcasts Top Charts
podcast-show.html          Podcast show (Light Box)
episode.html               Episode (The Clancy Trial) + chapters table
settings.html              Settings — all 19 sections
stats.html wrapped.html party.html profile.html collab.html mix.html playlist.html
                           Empty / gated states
gate-members.html          Gate 1 — members-only overlay (inert)
gate-onboarding.html       Gate 2 — onboarding warm-up (inert)

assets/css/app.css         Design tokens + all component CSS
assets/js/icons.js         Inline SVG icon set (lucide geometry, authored locally)
assets/js/art.js           Deterministic generated cover art
assets/js/data.js          Inline demo dataset
assets/js/player.js        Player state + WebAudio demo-tone engine
assets/js/shell.js         Shared shell: nav, topbar, player bar, queue,
                           Now Playing, context menus, shortcuts, keyboard
assets/js/views/*.js       One module per view
assets/brand/ assets/fonts/   Owner-authorized binaries only
```

Library sub-views live behind `library.html?tab=…` (Playlists / Artists / Albums /
Podcasts / Songs / Downloaded / Local Files / Recently Played) rather than as eight
separate files; the Local Files tab is a dedicated view with no tab strip, matching
the real app's `/library/local` route.

---

## What actually works

* **Transport** — play / pause / stop / next / prev / skip ±10s, shuffle, repeat
  (off → all → one). Play buttons on rows, cards, playlists, stations and shows.
* **Audio** — every track renders a **locally synthesized WebAudio tone**. The
  scale, root note, waveform, ADSR and shimmer rate are derived from a hash of the
  track id, so each track is audibly distinct, and the pitch envelope (rise → decay
  → late lift) varies per track. Progress is driven by a virtual clock so seek,
  volume, mute and lyrics stay in sync.
* **Progress / seek / volume** — pointer-drag and keyboard-operable scrubber,
  volume slider + mute.
* **Queue** — add from any row's ⋯ menu or the row button, play next, remove,
  drag-to-reorder, shuffle, clear, play-from-queue. Entirely in memory.
* **Lyrics** — static synced lines per track with line highlighting and auto-scroll
  on the demo clock; line-emphasis toggle (Animated / Static); `.lrc` export is a stub.
* **Now Playing** — full-screen surface with album-derived adaptive colour ramp.
* **Search** — live filtering across tracks/artists/albums/playlists/podcasts/lyrics,
  as-you-type suggestion dropdown, 7 result tabs, filters stub.
* **Context menus** — right-click a row for the full menu, `⋯` for the row menu,
  `⋯` on collections for the collection menu.
* **Keyboard** — the full Music.app-style shortcut table in a `?` dialog, plus live
  bindings for Play/Pause, Stop, Next/Prev, Skip, Volume, Mute, Shuffle, Repeat,
  Like, Queue, Lyrics, Full Screen Player, Search, Home/New/Radio, Library jumps and
  Settings. Shortcuts suspend while typing in a field.
* **Settings** — all 19 sections with working toggles, segmented controls, sliders,
  a 10-band EQ with 23 presets + Manual and ±12 dB preamp, and settings search.
* **Gates** — the members-only overlay and the onboarding warm-up dialog are
  reproduced verbatim as **faithful, deliberately inert UI**. No Discord OAuth, no
  Turnstile, no challenge is ever attempted.

## What is mocked / non-functional (honest list)

* **Audio is a synthesized demo tone**, not real music. No audio files ship.
* **No lyrics service.** Lines are hand-written for 4 tracks and generated
  deterministically for the rest; there is no word-by-word karaoke timing, no `.lrc`
  download, no ±2s nudge applied to real timing.
* **Animated Art / adaptive theming** use a seeded colour ramp, not the `npLook` /
  `motion` endpoints. The artist hero is a generated panel, not a video loop.
* **Equalizer, Sound Check, crossfade, AutoMix, Data Saver and Audio Quality** are UI
  only — they do not process the tone (the real app uses an AudioWorklet).
* **Downloading, IndexedDB local files, playlists CRUD, likes persistence, follows,
  sync, Stats and Wrapped** are stubs or empty states, matching what the real app
  shows without an account.
* **Voice search, mic, share, music video, concert/radio schedules and every external
  link** open a toast saying they are demo stubs — nothing leaves the page.
* **Storefront picker, category chips and Filters** are cosmetic (one dataset).
* The **members-only gate does not block playback** here. The live app gates every
  play; this clone makes transport work so the demo is explorable, and keeps the gate
  reachable as its own page instead.

## Design notes

Cover art, blurred album backdrops and the Now Playing ramp all come from one
hash-seeded generator, so a given album looks identical everywhere it appears
without shipping a single third-party image. Initials scale with the tile using
container-query units (`cqw`).