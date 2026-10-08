/* ============================================================================
 * Octave — static clone behaviour.
 * Plain ES5-ish script, no modules, no CDN: works from file:// and offline.
 *
 * Replaces the original GSAP + ScrollTrigger + Lenis stack:
 *   pin        -> position:sticky inside a padded .v2-pin wrapper (see clone.css)
 *   scrub      -> rAF loop reading scroll progress + exponential catch-up
 *   timeline   -> 40-line tween runner below (same positions/durations/eases)
 *   SplitText  -> walkText() word/char splitter
 *   WebAudio   -> octave-audio section, a faithful port of the captured synth
 * ========================================================================== */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- utils */
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function mmss(sec) {
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + pad2(Math.floor(sec % 60));
  }
  function hhmmss(sec) { sec = Math.max(0, Math.floor(sec)); return pad2(Math.floor(sec / 60)) + ':' + pad2(Math.floor(sec % 60)); }

  /* GSAP easing ports (names match the original timeline) */
  var E = {
    none: function (t) { return t; },
    power1inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    power2in: function (t) { return t * t * t; },
    power2inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    power3inOut: function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; },
    sineinOut: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; },
    expoout: function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    backout22: function (t) { var u = t - 1; return u * u * (3.2 * u + 2.2) + 1; }
  };

  /* ----------------------------------------------------- tiny tween runner */
  function TL() { this.items = []; this.len = 0; }
  TL.prototype.add = function (at, dur, ease, fn) {
    this.items.push({ a: at, d: dur, e: ease, f: fn });
    if (at + dur > this.len) this.len = at + dur;
    return this;
  };
  TL.prototype.seek = function (p) {
    var T = this.len * clamp(p, 0, 1);
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      var u = it.d <= 0 ? (T >= it.a ? 1 : 0) : clamp((T - it.a) / it.d, 0, 1);
      if (u > 0) it.f(it.e ? it.e(u) : u, u);
    }
  };

  /* --------------------------------------------------------- text splitting */
  /* Wrap every word (or char) of an element's text in spans, keeping <br>. */
  function walkText(el, cls, perWord) {
    var out = [];
    (function rec(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i];
        if (k.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          var parts = k.nodeValue.split(/(\s+)/);
          for (var j = 0; j < parts.length; j++) {
            var p = parts[j];
            if (!p) continue;
            if (!p.trim()) { frag.appendChild(doc.createTextNode(p)); continue; }
            if (perWord) {
              var w = doc.createElement('span');
              w.className = cls;
              w.style.display = 'inline-block';
              w.textContent = p;
              frag.appendChild(w);
              out.push(w);
            } else {
              for (var c = 0; c < p.length; c++) {
                var s = doc.createElement('span');
                s.className = cls;
                s.style.display = 'inline-block';
                s.style.whiteSpace = 'pre';
                s.textContent = p[c];
                frag.appendChild(s);
                out.push(s);
              }
            }
          }
          node.replaceChild(frag, k);
        } else if (k.nodeType === 1 && k.tagName !== 'BR') {
          rec(k);
        }
      }
    })(el);
    return out;
  }

  /* ==================================================================== AUDIO
   * Port of marketing chunk module 11630 — C4..C5 plus sharps, three
   * oscillators per note, filter sweep, delay/lowpass send bus, 2.2s envelope.
   * There are no audio files anywhere on this site.
   * ======================================================================== */
  var Audio_ = (function () {
    var WHITE = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
    var BLACK = [277.18, 311.13, null, 369.99, 415.3, 466.16, null];
    var ctx = null, master = null, on = false, subs = [];

    function ac() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.55;
        var delay = ctx.createDelay(1); delay.delayTime.value = 0.23;
        var fb = ctx.createGain(); fb.gain.value = 0.28;
        var wet = ctx.createGain(); wet.gain.value = 0.22;
        var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
        master.connect(ctx.destination);
        master.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay);
        lp.connect(wet); wet.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function playNote(f, vel) {
      vel = vel == null ? 0.8 : vel;
      var c = ac(); if (!c || !master) return;
      var t = c.currentTime;
      var o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
      var o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 2.001 * f;
      var o3 = c.createOscillator(); o3.type = 'sine'; o3.frequency.value = 4.02 * f;
      var g2 = c.createGain(); g2.gain.value = 0.18;
      var g3 = c.createGain();
      g3.gain.setValueAtTime(0.12, t);
      g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      var flt = c.createBiquadFilter(); flt.type = 'lowpass';
      flt.frequency.setValueAtTime(5200, t);
      flt.frequency.exponentialRampToValueAtTime(900, t + 1.4);
      var env = c.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.32 * vel, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o1.connect(env);
      o2.connect(g2).connect(env);
      o3.connect(g3).connect(env);
      env.connect(flt).connect(master);
      o1.start(t); o2.start(t); o3.start(t);
      o1.stop(t + 2.3); o2.stop(t + 2.3); o3.stop(t + 2.3);
    }

    function setHoverSound(v) {
      on = v;
      if (v) { ac(); playNote(WHITE[0], 0.5); setTimeout(function () { playNote(WHITE[4], 0.5); }, 110); }
      subs.forEach(function (f) { f(v); });
    }
    function subscribe(f) { subs.push(f); return function () { subs = subs.filter(function (g) { return g !== f; }); }; }
    return { WHITE: WHITE, BLACK: BLACK, playNote: playNote, isHoverSound: function () { return on; }, setHoverSound: setHoverSound, subscribeHoverSound: subscribe };
  })();

  /* ================================================================ scroll
   * One rAF loop feeds every scroll-linked module.
   * ======================================================================== */
  var subscribers = [];
  function onScroll(fn) { subscribers.push(fn); return fn; }
  var lastY = 0, velocity = 0, lastT = 0;

  function tick(t) {
    var dt = lastT ? Math.min(t - lastT, 50) : 16;
    lastT = t;
    var y = window.pageYOffset || root.scrollTop;
    velocity = y - lastY;
    lastY = y;
    for (var i = 0; i < subscribers.length; i++) subscribers[i](dt, t);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* Smoothed scroll progress: p is the raw 0..1, c catches up with `lag` s. */
  function smoother(lag) {
    var cur = 0;
    return function (raw, dt) {
      if (lag <= 0 || RM) { cur = raw; return raw; }
      cur += (raw - cur) * (1 - Math.exp(-dt / (lag * 1000)));
      return cur;
    };
  }

  /* ---------------------------------------------------------------- pinning
   * Each `.v2-pin` wrapper is sized to (section height + pin distance) and its
   * `.v2-pinme` child is absolutely positioned inside it, then switched to
   * `position:fixed` for exactly the scroll range the original pinned over.
   * `position:sticky` is deliberately not used: the site's own Tailwind
   * preflight sets `body{overflow-x:hidden}`, which turns <body> into a scroll
   * container and silently kills sticky in Chromium.
   * ------------------------------------------------------------------------ */
  var PINS = [];
  function initPins() {
    $$('.v2-pin').forEach(function (wrap) {
      var sec = $('.v2-pinme', wrap);
      if (!sec) return;
      var frac = parseFloat(getComputedStyle(wrap).getPropertyValue('--pin')) || 0;
      var rec = { wrap: wrap, sec: sec, frac: frac, H: 0, P: 0, on: false, p: 0 };
      sec.classList.add('v2-pin-live');
      rec.measure = function () {
        sec.classList.remove('v2-pin-on');
        rec.H = sec.offsetHeight;
        rec.P = rec.frac * window.innerHeight;
        wrap.style.paddingBottom = '0px';
        wrap.style.height = (rec.H + rec.P) + 'px';
      };
      rec.measure();
      window.addEventListener('resize', rec.measure);
      PINS.push(rec);
    });
    onScroll(function () {
      var y = window.pageYOffset;
      for (var i = 0; i < PINS.length; i++) {
        var r = PINS[i];
        var top = r.wrap.getBoundingClientRect().top + y;
        r.p = r.P > 0 ? clamp((y - top) / r.P, 0, 1) : 0;
        var on = r.P > 0 && y > top && y < top + r.P;
        if (on !== r.on) { r.on = on; r.sec.classList.toggle('v2-pin-on', on); }
      }
    });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () {
      PINS.forEach(function (r) { r.measure(); });
    });
  }
  function pinRecord(el) {
    var wrap = el.closest ? el.closest('.v2-pin') : null;
    if (!wrap) return null;
    for (var i = 0; i < PINS.length; i++) if (PINS[i].wrap === wrap) return PINS[i];
    return null;
  }
  function pinProgress(pinEl) {
    var r = pinRecord(pinEl);
    return r ? r.p : 0;
  }

  /* Reveal-on-enter using IntersectionObserver (replaces ScrollTrigger.from) */
  function reveals(root_, sel, opts) {
    opts = opts || {};
    var els = $$(sel, root_);
    if (!els.length) return;
    if (RM) { els.forEach(function (e) { e.style.opacity = 1; e.style.transform = 'none'; }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var d = el.__d || 0;
        var from = { opacity: 0, transform: 'none' };
        if (opts.y) from.transform = 'translateY(' + opts.y + 'px)';
        if (opts.yPct) from.transform = 'translateY(' + opts.yPct + '%)';
        if (opts.scaleX != null) from.transform = 'scaleX(' + opts.scaleX + ')';
        el.animate([from, { opacity: 1, transform: 'none' }],
          { duration: (opts.duration || 1000), delay: d, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
    }, { rootMargin: opts.rootMargin || '0px 0px -8% 0px', threshold: opts.threshold || 0.05 });
    els.forEach(function (e, i) { e.__d = i * (opts.stagger || 0); io.observe(e); });
  }

  /* ============================================================ header/menu */
  function initNav() {
    var header = $('header');
    if (!header) return;
    var glass = $('.v2-nav-glass', header);
    var last = 0, hidden = false;

    var soundBtn = $('button[aria-label^="Turn sound"]', header);
    var eq = $('.v2-eq', header);
    var label = soundBtn && $('.v2-mono', soundBtn);
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        var next = !Audio_.isHoverSound();
        Audio_.setHoverSound(next);
        soundBtn.setAttribute('aria-pressed', String(next));
        soundBtn.setAttribute('aria-label', next ? 'Turn sound off' : 'Turn sound on');
        if (eq) eq.classList.toggle('is-on', next);
        if (label) label.textContent = next ? 'Sound on' : 'Sound off';
      });
      Audio_.subscribeHoverSound(function (v) {
        if (eq) eq.classList.toggle('is-on', v);
        if (label) label.textContent = v ? 'Sound on' : 'Sound off';
      });
    }

    var burger = header.querySelector('button[aria-label="Open menu"],button[aria-label="Close menu"]');
    var menu = $('.v2 > div.fixed.inset-0');
    function closeMenu() {
      if (!menu) return;
      menu.style.pointerEvents = 'none';
      menu.style.clipPath = 'inset(0 0 100% 0)';
      menu.setAttribute('aria-hidden', 'true');
      if (burger) { burger.setAttribute('aria-label', 'Open menu'); burger.setAttribute('aria-expanded', 'false'); }
      $$('a', menu).forEach(function (a) { a.tabIndex = -1; });
    }
    function openMenu() {
      if (!menu) return;
      menu.style.pointerEvents = 'auto';
      menu.style.clipPath = 'inset(0 0 0 0)';
      menu.setAttribute('aria-hidden', 'false');
      if (burger) { burger.setAttribute('aria-label', 'Close menu'); burger.setAttribute('aria-expanded', 'true'); }
      $$('a', menu).forEach(function (a, i) {
        a.tabIndex = 0;
        a.style.transitionDelay = (120 + 50 * i) + 'ms';
        a.style.transform = 'translateY(0)';
      });
    }
    if (burger && menu) {
      burger.addEventListener('click', function () {
        if (menu.getAttribute('aria-hidden') === 'true') openMenu(); else closeMenu();
      });
      menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
      closeMenu();
      var bars = $$('span > span', burger);
      function burgerState(open) {
        if (!bars.length) return;
        bars[0].style.top = open ? '50%' : '0';
        bars[0].style.transform = open ? 'rotate(45deg)' : '';
        bars[1].style.top = open ? '50%' : '100%';
        bars[1].style.transform = open ? 'rotate(-45deg)' : '';
      }
      new MutationObserver(function () {
        burgerState(menu.getAttribute('aria-hidden') === 'false');
      }).observe(menu, { attributes: true, attributeFilter: ['aria-hidden'] });
    }

    onScroll(function () {
      var y = window.pageYOffset;
      if (glass) glass.style.opacity = y > 8 ? '1' : '0';
      /* Latched, not instantaneous: GSAP kept the bar retracted for the whole
         downward run and only brought it back once the user actually scrolled
         up. Testing `velocity > 2` alone made it reappear the frame scrolling
         stopped. So `next` stays null while the wheel is still. */
      var next = null;
      if (y <= 160) next = false;
      else if (velocity > 2) next = true;
      else if (velocity < -1) next = false;
      if (next !== null && next !== hidden) {
        hidden = next;
        header.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
        header.style.transform = hidden ? 'translateY(-110%)' : 'translateY(0)';
      }
      last = y;
    });
  }

  /* smooth same-page anchors (Lenis did duration 1.6 / 1-(1-e)^4) */
  function initAnchors() {
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"], a[href*=".html#"]');
      if (!a) return;
      var href = a.getAttribute('href');
      var hash = href.indexOf('#');
      if (hash < 0) return;
      var id = href.slice(hash + 1);
      var el = id ? doc.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      var start = window.pageYOffset, end = el.getBoundingClientRect().top + window.pageYOffset - 40;
      var t0 = performance.now(), dur = 1600;
      (function step(now) {
        var k = clamp((now - t0) / dur, 0, 1);
        var e2 = 1 - Math.pow(1 - k, 4);
        window.scrollTo(0, lerp(start, end, e2));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* =================================================================== HERO */
  function initHero() {
    var sec = $('.v2-hero');
    if (!sec) return;
    var h1 = $('.v2-hero-title', sec);
    var fades = $$('.v2-hero-fade', sec);
    var ticker = $('.v2-hero-ticker', sec);
    var veil = $('.v2-hero-veil', sec);

    var chars = [];
    if (h1) {
      chars = walkText(h1, 'v2-char', false);
      h1.classList.remove('invisible');
      if (!RM) {
        chars.forEach(function (c, i) {
          c.animate(
            [{ transform: 'translateY(115%) rotate(6deg)' }, { transform: 'none' }],
            { duration: 1300, delay: 250 + i * 22, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        });
        fades.forEach(function (f, i) {
          f.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
            { duration: 1200, delay: 800 + i * 80, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        });
      } else { h1.style.visibility = 'visible'; fades.forEach(function (f) { f.style.opacity = 1; }); }
    }

    /* hover label + spotlight + drifting columns over the record wall */
    initWall(sec, ticker);

    var pin = sec.closest('.v2-pin');
    if (!pin) return;
    var sm = smoother(0);
    var n = chars.length;
    var tl = new TL();
    var CHAR_TOTAL = 0.45 + 0.008 * Math.max(0, n - 1);
    var tlLen = Math.max(CHAR_TOTAL, 1.0);
    onScroll(function () {
      if (RM) return;
      var p = pinProgress(pin);
      var cT = clamp(p * tlLen, 0, tlLen);
      for (var i = 0; i < n; i++) {
        var u = clamp((cT - i * 0.008) / 0.45, 0, 1);
        var y = -120 * E.power2in(u);
        chars[i].style.transform = y < -0.4 ? 'translateY(' + y.toFixed(2) + '%)' : '';
      }
      var fu = clamp(cT / 0.25, 0, 1);
      fades.forEach(function (f) { f.style.opacity = String(1 - fu); f.style.transform = 'translateY(' + (-30 * fu) + 'px)'; });
      if (ticker) ticker.style.opacity = String(1 - clamp(cT / 0.2, 0, 1));
      if (veil) veil.style.opacity = String(clamp((cT - 0.7) / 0.3, 0, 1));
    });
  }

  /* ================================================================= HERO WALL
     Port of the original's WebGL `CoverWall` (three.js, captured in the home
     chunk). Only two things in it are visible in the DOM, and both are here:
     the perpetual per-column marquee and the mouse-trailed spotlight.

         col.offset += (col.speed + .9*vel*sign(col.speed)) * dt * (1 + 1.5*p)
         col.speed   = (k % 2 ? -1 : 1) * (.16 + k % 3 * .035)   world units/s

     with `vel` the smoothed scrollState.velocity/22 the shader clamps to ±2.2,
     and the wrap `(baseY + offset) % colLen`. One world unit is
     `vh / (2 tan(16°) * 12)` px, which is what converts those speeds to the
     ~21 / 25.5 / 30 px/s the wall actually runs at on a 1440×900 hero.       */
  var WALL_TAN = Math.tan(32 * Math.PI / 360);   // tan(fov/2), fov = 32
  var WALL_VIEW_Z = 12;                           // camera z once the intro tween lands
  var WALL_SPOT = 0.24;    // uSpot = .24 * max(width, height)
  var WALL_CORE = 0.15;    // inner plateau of the glow's smoothstep

  function initWall(sec, ticker) {
    var stage = $('.v2-wall-stage', sec);
    var grid = $('.v2-wall', sec);
    if (!stage || !grid) return;
    var covers = $$('img[data-title]', grid).map(function (im) {
      return { src: im.getAttribute('src'), t: im.dataset.title, a: im.dataset.artist };
    });
    if (!covers.length) return;

    /* the canvas equivalent: two copies of the same columns, one revealed by
       the spotlight mask. `grid` is the site's own no-WebGL fallback and is
       only kept alive for the no-JS case. */
    var base = doc.createElement('div'); base.className = 'v2-wall-layer v2-wall-base';
    var lit = doc.createElement('div'); lit.className = 'v2-wall-layer v2-wall-lit';
    var hot = doc.createElement('div'); hot.className = 'v2-wall-hot';
    stage.insertBefore(base, grid); stage.insertBefore(lit, grid); stage.insertBefore(hot, grid);
    grid.parentNode.removeChild(grid);

    var pin = sec.closest('.v2-pin');
    var vw = 0, vh = 0, r = 0, colW = 0, pitch = 0, colLen = 0, depth = 0;
    var cols = [];
    var mx = 0, my = 0, sx = 0, sy = 0, pax = 0, pay = 0, ty = 0;
    var ppersp = 1000, pcosx = 1, psinx = 0, pcosy = 1, psiny = 0;
    var slots = 0;
    var hasMouse = false, clock = 0, vel = 0, progress = 0, live = true;
    var hk = -1, hamt = 0, hcov = null;

    function colX(k) { return (k - (r + 1) / 2) * pitch; }

    function build() {
      vw = sec.clientWidth; vh = sec.clientHeight;
      if (!vw || !vh) return;

      /* build() sizes the columns for the camera's *intro* framing
         (z = 12 + (1-intro)*3 = 15) but frame() renders at z = 12 once the
         2.4s intro tween lands, so the wall settles 15/12 = 1.25x larger
         than the plain `vw / (cols - 1.2)` — which is the 230.8px pitch,
         214.6px tile and 16.2px gutter the live wall measures at 1440x900. */
      r = vw < 700 ? 5 : vw < 1100 ? 7 : 9;
      pitch = 1.25 * vw / (r - 1.2);
      colW = 0.93 * pitch;                                    // this.tile
      depth = Math.ceil((r - 1.2) * vh / vw) + 4;             // this.colLen / a
      colLen = depth * pitch;
      var pxPerWorld = vh / (2 * WALL_TAN * WALL_VIEW_Z);
      slots = Math.ceil((vh + 140 + colLen - colW) / pitch) + 3;
      /* the parallax is the shader's group tilt: rotation.x += .05*parallax.y,
         rotation.y = .07*parallax.x, seen through a camera 12 world units
         back. Kept as a real 3D transform because it compresses the side the
         pointer is on rather than sliding the whole wall. */
      ppersp = 12 * pxPerWorld;

      lit.style.setProperty('--spot-r', (WALL_SPOT * Math.max(vw, vh)).toFixed(1) + 'px');
      lit.style.setProperty('--spot-c', (WALL_CORE * WALL_SPOT * Math.max(vw, vh)).toFixed(1) + 'px');
      lit.style.setProperty('--spot-x', (vw * 0.5).toFixed(1) + 'px');
      lit.style.setProperty('--spot-y', (vh * 0.5).toFixed(1) + 'px');

      /* one background layer per slot so a column is a single element whose
         raster is static and only its transform changes frame to frame; slots
         repeat every `depth` tiles, which is what makes translating by
         colLen seamless. */
      var pos = [], size = colW.toFixed(2) + 'px ' + colW.toFixed(2) + 'px';
      var hCss = ((slots - 3) * pitch + colW).toFixed(2) + 'px';
      for (var j = 0; j < slots; j++) pos.push('center ' + ((j - 2) * pitch).toFixed(2) + 'px');
      while (cols.length) { var old = cols.pop(); old.a.remove(); old.b.remove(); }
      for (var k = 0; k < r + 2; k++) {
        var ims = [];
        for (var j2 = 0; j2 < slots; j2++) ims.push('url("' + coverAt(j2, k).src + '")');
        var css = 'left:' + colX(k).toFixed(2) + 'px;top:0;width:' + colW.toFixed(2) + 'px;height:' +
          hCss + ';background-image:' + ims.join(',') + ';background-size:' + size +
          ';background-position:' + pos.join(',') + ';';
        var a = doc.createElement('div'), b = doc.createElement('div');
        a.className = b.className = 'v2-wall-col';
        a.style.cssText = css; b.style.cssText = css;
        base.appendChild(a); lit.appendChild(b);
        cols.push({
          a: a, b: b, y: 0,
          off: Math.random() * colLen,                        // the shader's random phase
          speed: (k % 2 ? -1 : 1) * (0.16 + (k % 3) * 0.035) * pxPerWorld
        });
      }
      hot.style.width = hot.style.height = colW.toFixed(2) + 'px';
      hk = -1; hcov = null; hamt = 0;
      hot.classList.remove('v2-wall-hot-on');
    }

    /* the shader's own slot -> cover mapping: covers[(11*col + 5*row +
       col*row) % len]. It repeats with period `depth`, so slot j and slot
       j + depth always carry the same cover. */
    function coverAt(slot, k) {
      var row = ((((slot - 2) % depth) + depth) % depth);
      return covers[((11 * k + 5 * row + k * row) % covers.length + covers.length) % covers.length];
    }

    /* ---- the raycast ----
       The shader raycasts against its tiles; here the browser already knows
       where the cursor is, so the tile is found by projecting every slot's
       centre through the stage's own transform (the same perspective +
       rotateX/rotateY CSS applies) and taking the nearest. That stays exact
       under the 3D parallax instead of assuming a flat plane. */
    function project(lx, ly) {
      var cx = vw / 2, cy = vh / 2;
      var X = lx - cx, Y = ly + ty - cy;
      var y1 = Y * pcosx, z1 = Y * psinx;
      var x2 = X * pcosy + z1 * psiny, z2 = -X * psiny + z1 * pcosy;
      var w = 1 - z2 / ppersp;
      return [cx + x2 / w, cy + y1 / w];
    }
    function hit() {
      if (!hasMouse || progress >= 0.15 || Math.abs(vel) >= 0.5 || !cols.length) return null;
      var best = null, bestD = Infinity;
      for (var k = 0; k < cols.length; k++) {
        var c = cols[k];
        var lx = colX(k) + colW / 2;
        for (var j = 0; j < slots; j++) {
          var s = project(lx, (j - 2) * pitch + c.y + colW / 2);
          var dx = s[0] - mx, dy = s[1] - my, d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = { k: k, j: j, sx: s[0], sy: s[1] }; }
        }
      }
      if (!best) return null;
      /* the slot's own square: a tile spans [n, n + .93) of the pitch */
      if (Math.abs(mx - best.sx) >= colW / 2 || Math.abs(my - best.sy) >= colW / 2) return null;
      return best;
    }

    function paint() {
      for (var k = 0; k < cols.length; k++) {
        var y = cols[k].off % colLen; if (y < 0) y += colLen;
        cols[k].y = -y;
        var t3 = 'translate3d(0,' + cols[k].y.toFixed(2) + 'px,0)';
        cols[k].a.style.transform = t3; cols[k].b.style.transform = t3;
      }
    }

    function setHot(h) {
      if (!h) {
        hot.classList.remove('v2-wall-hot-on');
        if (ticker && hcov) ticker.textContent = 'Hover a record';
        hk = -1; hcov = null;
        return;
      }
      hk = h.k;
      var c = coverAt(h.j, h.k);
      if (c !== hcov) {
        hcov = c;
        hot.style.backgroundImage = 'url("' + c.src + '")';
        if (ticker) ticker.innerHTML = '<span class="text-white"><span class="text-[var(--v2-red)]">▶</span> ' +
          c.t + ' — ' + c.a + '</span>';
      }
      hot.style.left = colX(h.k).toFixed(2) + 'px';
      hot.style.top = ((h.j - 2) * pitch + cols[h.k].y).toFixed(2) + 'px';
      hot.classList.add('v2-wall-hot-on');
    }

    /* ---- frame: the shader's own per-frame loop ---- */
    var last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!live || doc.hidden) { last = now; return; }
      var dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      clock += dt / 1000;
      vel += (clamp(velocity / 22, -2.2, 2.2) - vel) * 0.08;

      /* spotlight: trails the pointer, otherwise wanders the shader's
         Lissajous idle path (periods 2π/.33 ≈ 19s and 2π/.27 ≈ 23s). */
      var gx, gy, follow;
      if (hasMouse) { gx = mx; gy = my; follow = 0.14; }
      else {
        gx = vw * (0.5 + 0.3 * Math.sin(0.33 * clock));
        gy = vh * (0.5 + 0.24 * Math.cos(0.27 * clock));
        follow = 0.04;
      }
      sx += (gx - sx) * follow; sy += (gy - sy) * follow;
      lit.style.setProperty('--spot-x', sx.toFixed(1) + 'px');
      lit.style.setProperty('--spot-y', sy.toFixed(1) + 'px');

      /* the wall's parallax: the shader's group tilt, plus the scroll stand-in */
      pax += ((hasMouse ? mx / vw * 2 - 1 : 0) - pax) * 0.05;
      pay += ((hasMouse ? my / vh * 2 - 1 : 0) - pay) * 0.05;
      var rx = pay * 0.05, ry = pax * 0.07;
      pcosx = Math.cos(rx); psinx = Math.sin(rx);
      pcosy = Math.cos(ry); psiny = Math.sin(ry);
      ty = progress * -60 + clamp(velocity * 0.4, -40, 40);
      stage.style.transform = 'perspective(' + ppersp.toFixed(0) + 'px) rotateY(' +
        (ry * 57.29578).toFixed(3) + 'deg) rotateX(' + (rx * 57.29578).toFixed(3) +
        'deg) translate3d(0,' + ty.toFixed(1) + 'px,0)';

      /* columns: the perpetual marquee, faster while the hero is scrolled */
      var boost = 1 + 1.5 * progress;
      for (var k = 0; k < cols.length; k++) {
        var c = cols[k];
        if (c.off > 1e6 || c.off < -1e6) c.off = c.off % colLen;
        c.off += (c.speed + 0.9 * vel * (c.speed < 0 ? -1 : 1)) * (dt / 1000) * boost;
      }
      paint();

      var h = hit();
      hamt += ((h ? 1 : 0) - hamt) * 0.12;
      if (h) setHot(h);
      else if (hamt > 0.002 || hk >= 0) setHot(null);
      if (hk >= 0) {
        /* +8% scale, plus the 0.4u pop toward the camera (12 / 11.6) */
        hot.style.transform = 'scale(' + (1 + 0.117 * hamt).toFixed(4) + ')';
      }
    }

    function onMove(e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var r2 = sec.getBoundingClientRect();
      mx = e.clientX - r2.left; my = e.clientY - r2.top;
      hasMouse = true;
      if (RM) { var h = hit(); setHot(h); if (h) hot.style.transform = 'scale(1.117)'; }
    }
    function onLeave() {
      hasMouse = false;
      setHot(null);
    }
    sec.addEventListener('pointermove', onMove);
    sec.addEventListener('pointerleave', onLeave);

    onScroll(function () { progress = pin ? pinProgress(pin) : 0; });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (en) { live = en[0].isIntersecting; }, { threshold: 0 }).observe(sec);
    }
    if (window.ResizeObserver) new ResizeObserver(build).observe(sec);

    build();
    paint();
    if (!RM) requestAnimationFrame(frame);
  }

  /* ============================================================== MANIFESTO */
  function initManifesto() {
    var p = $('.v2-manifesto-text');
    if (!p || RM) return;
    var words = walkText(p, 'v2-word', true);
    var covers = $$('.v2-inline-cover', p);
    var n = words.length;
    var total = 0.5 + 0.1 * Math.max(0, n - 1);
    words.forEach(function (w) { w.style.opacity = '0.14'; });
    covers.forEach(function (c) { c.style.transformOrigin = '50% 50%'; });

    var sm = smoother(0.4), sm2 = smoother(0.6);
    onScroll(function (dt) {
      var r = p.getBoundingClientRect(), vh = window.innerHeight;
      var a = (vh * 0.78 - r.top), b = (r.bottom - vh * 0.42);
      var raw = clamp((a) / Math.max(1, a + b), 0, 1);
      var prog = sm(raw, dt), T = prog * total;
      for (var i = 0; i < n; i++) {
        var u = clamp((T - i * 0.1) / 0.5, 0, 1);
        words[i].style.opacity = String(lerp(0.14, 1, u));
      }
      var r2 = p.getBoundingClientRect();
      var a2 = (vh * 0.70 - r2.top), b2 = (r2.bottom - vh * 0.50);
      var raw2 = clamp(a2 / Math.max(1, a2 + b2), 0, 1);
      var T2 = sm2(raw2, dt) * (0.8 + 0.3 * Math.max(0, covers.length - 1));
      covers.forEach(function (c, i) {
        var u = clamp((T2 - i * 0.3) / 0.8, 0, 1);
        var e = E.backout22(u);
        c.style.transform = 'scale(' + e.toFixed(3) + ') rotate(' + (-12 * (1 - e)).toFixed(2) + 'deg)';
        c.style.opacity = String(clamp(u * 2, 0, 1));
      });
    });
  }

  /* ================================================================= LYRICS */
  var LYRIC_LINES = [
    { t: 'Every song you ever loved,', w: 1 },
    { t: 'every word, right on time.', w: 1 },
    { t: 'No ads between the verses,', w: 1 },
    { t: 'no paywall on the chorus.', w: 1 },
    { t: '', w: 0.8, gap: true },
    { t: 'Turn the vocals down —', w: 1 },
    { t: 'the next line’s yours.', w: 1 },
    { t: 'Press play.', w: 1.2 }
  ];
  function initLyrics() {
    var sec = $('.v2-lyrics');
    if (!sec) return;
    var pin = sec.closest('.v2-pin');
    var view = $('.v2-lyric-viewport', sec);
    var track = $('.v2-lyric-track', sec);
    var lines = $$('.v2-lyric-line', sec);
    var bar = $('.v2-lyric-bar', sec);
    var time = $('.v2-lyric-time', sec);
    var remain = $('.v2-lyric-remain', sec);
    var vfill = $('.v2-vocals-fill', sec);
    var vthumb = $('.v2-vocals-thumb', sec);
    var vval = $('.v2-vocals-value', sec);
    if (!pin || !track || lines.length !== LYRIC_LINES.length) return;

    function yFor(i) {
      var l = lines[i];
      return 0.42 * view.clientHeight - (l.offsetTop + l.offsetHeight / 2);
    }
    function setTrackY(i) { track.style.transform = 'translate3d(0,' + yFor(i).toFixed(2) + 'px,0)'; }
    function setLine(i, o, s, bl) {
      var l = lines[i];
      l.style.opacity = String(o);
      l.style.transform = 'scale(' + s.toFixed(4) + ')';
      l.style.filter = bl > 0.05 ? 'blur(' + bl.toFixed(2) + 'px)' : '';
    }

    lines.forEach(function (l, i) { setLine(i, 0.28, 1, 0); });
    setTrackY(0);
    if (RM) { lines.forEach(function (l, i) { setLine(i, i === 4 ? 1 : 0.6, 1, 0); }); return; }

    var tl = new TL();
    var h = 0;
    LYRIC_LINES.forEach(function (item, idx) {
      var line = lines[idx], at = h;
      tl.add(Math.max(0, at - 0.2), 0.35, E.power2inOut, function () { setTrackY(idx); });
      tl.add(Math.max(0, at - 0.15), 0.25, E.none, function (u) { setLine(idx, lerp(0.28, 1, u), lerp(0.97, 1, u), lerp(2, 0, u)); });
      if (idx > 0) tl.add(at, 0.3, E.none, function (u) { setLine(idx - 1, lerp(1, 0.22, u), lerp(1, 0.97, u), lerp(0, 2, u)); });
      if (item.gap) {
        var dots = $$('.v2-dot', line);
        dots.forEach(function (d, di) {
          tl.add(at + di * 0.25 * item.w, 0.25 * item.w, E.sineinOut,
            function (u) { d.style.transform = 'scale(' + lerp(0.4, 1, u).toFixed(3) + ')'; d.style.opacity = String(lerp(0.3, 1, u)); });
        });
      } else {
        var ws = $$('.v2-lw', line);
        var total = ws.reduce(function (a, e) { return a + e.textContent.length + 1; }, 0);
        var r = at;
        ws.forEach(function (wd) {
          var dur = (wd.textContent.length + 1) / total * item.w * 0.82;
          wd.style.setProperty('--p', '-12%');
          tl.add(r, dur, E.none, function (u) { wd.style.setProperty('--p', lerp(-12, 112, u).toFixed(2) + '%'); });
          r += dur;
        });
      }
      if (item.t.indexOf('Turn the vocals') === 0) {
        tl.add(at, item.w, E.power1inOut, function (u) {
          if (vthumb) vthumb.style.left = (lerp(100, 14, u)).toFixed(2) + '%';
          if (vfill) vfill.style.transform = 'scaleX(' + lerp(1, 0.14, u).toFixed(4) + ')';
          if (vval) vval.textContent = Math.round(lerp(100, 14, u)) + '%';
        });
      }
      h += item.w;
    });
    tl.add(h, 0.6, E.none, function () {});

    var sm = smoother(0.5);
    onScroll(function (dt) {
      var p = sm(pinProgress(pin), dt);
      tl.seek(p);
      var secs = 192 * p;
      if (time) time.textContent = mmss(secs);
      if (remain) remain.textContent = '-' + mmss(192 - secs);
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  /* ================================================================ PALETTE */
  var PALETTE = [
    { md5: '58f2b66205a31c42cd1d340b99735d7c', t: 'My Beautiful Dark Twisted Fantasy', a: 'Kanye West', bg: '#d42a3c', ink: '#fff4f1', deep: '#5c0c16', time: '4:13' },
    { md5: '519400e29d268f449cf00af879e71af6', t: 'channel ORANGE', a: 'Frank Ocean', bg: '#ec7212', ink: '#1f0c00', deep: '#7a3200', time: '3:58' },
    { md5: 'de9e79511cda59914de9add50946e43c', t: 'BRAT', a: 'Charli xcx', bg: '#8ace00', ink: '#0b1400', deep: '#3c5a00', time: '2:52' },
    { md5: 'b8cb3222d8668ed4ed2d3172fb341a3a', t: 'Nevermind', a: 'Nirvana', bg: '#1477ad', ink: '#f2fbff', deep: '#06304a', time: '5:01' },
    { md5: '041ab5ceb6fb6ebf9512966835be9e1b', t: 'IGOR', a: 'Tyler, The Creator', bg: '#f4b8c7', ink: '#2b0f18', deep: '#a3566b', time: '3:26' }
  ];
  function hex2rgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
  }
  function initPalette() {
    var sec = $('.v2-palette');
    if (!sec) return;
    var pin = sec.closest('.v2-pin');
    var stage = $('.v2-pal-stage', sec);
    var track = $('.v2-pal-track', sec);
    var items = $$('.v2-pal-item', sec);
    var count = $('.v2-pal-count', sec);
    var thumb = $('.v2-pal-thumb', sec), title = $('.v2-pal-title', sec);
    var artist = $('.v2-pal-artist', sec), time = $('.v2-pal-time', sec);
    var n = PALETTE.length;
    if (!pin || !stage || items.length !== n) return;

    function xFor(i) {
      return sec.clientWidth / 2 - (items[i].offsetLeft + items[i].offsetWidth / 2);
    }
    function paint(i, t) {
      var a = PALETTE[i], b = PALETTE[Math.min(n - 1, i + 1)];
      stage.style.setProperty('--bg', mix(a.bg, b.bg, t));
      stage.style.setProperty('--ink', mix(a.ink, b.ink, clamp((t - 0.4) / 0.2, 0, 1)));
      stage.style.setProperty('--deep', mix(a.deep, b.deep, t));
    }
    function card(i) {
      var r = PALETTE[i];
      /* 320 rather than 120: only 2 of the 27 downloaded covers exist at
         120x120, so the other four palette thumbs 404'd at runtime. */
      if (thumb) thumb.src = 'assets/cdn-images.dzcdn.net/images/cover/' + r.md5 + '/320x320-000000-80-0-0.jpg';
      if (title) title.textContent = r.t;
      if (artist) artist.textContent = r.a;
      if (time) time.textContent = r.time;
    }
    items.forEach(function (it, i) {
      it.style.transformOrigin = '50% 50%';
      it.style.transform = 'scale(' + (i === 0 ? 1 : 0.62) + ')';
      it.style.opacity = i === 0 ? '1' : '0.55';
    });
    track.style.transform = 'translate3d(' + xFor(0).toFixed(2) + 'px,0,0)';
    paint(0, 0);

    if (RM) return;
    /* The original timeline is `.to({},{duration:.3})` then, per step,
       `.to(track,{x,duration:1}) … .to({},{duration:.35})`. The trailing .35
       already sits *inside* each of the (n-1) steps, so the timeline's total
       duration is `.3 + (n-1)*1.35` — adding a further `+ .35` here made the
       whole carousel run 6.1% fast, leaving the cover a quarter-step ahead of
       the colour repaint at every scroll depth. */
    var HEAD = 0.3, STEP = 1.35;
    var TLEN = HEAD + (n - 1) * STEP;
    var sm = smoother(0.6);
    onScroll(function (dt) {
      var p = sm(pinProgress(pin), dt);
      var T = p * TLEN;
      var k = clamp((T - HEAD) / STEP, 0, n - 1);
      var idx = Math.min(n - 2, Math.floor(k));
      var f = k - idx;
      var fx = E.power3inOut(f), fv = E.power1inOut(f);
      track.style.transform = 'translate3d(' + lerp(xFor(idx), xFor(idx + 1), fx).toFixed(2) + 'px,0,0)';
      /* Outgoing cover shrinks 1 -> .62, incoming grows .62 -> 1. The original
         timeline tweens `l[t-1]` toward `.62` and `l[t]` toward `1` over the same
         second, i.e. they move in opposite directions; scaling both up by `fx`
         left every tile at .62 whenever the scrub sat at a step boundary. */
      items[idx].style.transform = 'scale(' + lerp(1, 0.62, fx).toFixed(4) + ')';
      items[idx].style.opacity = String(lerp(1, 0.55, fx));
      items[idx + 1].style.transform = 'scale(' + lerp(0.62, 1, fx).toFixed(4) + ')';
      items[idx + 1].style.opacity = String(lerp(0.55, 1, fx));
      paint(idx, fv);
      var cur = Math.min(n - 1, Math.round(p * (n - 1)));
      if (count) count.innerHTML = '03 — Colour<br/>' + pad2(cur + 1) + ' / ' + pad2(n);
      card(cur);
    });
  }

  /* ================================================================== SOUND */
  var TIERS = [
    { k: 'Data Saver', big: '128', unit: 'kbps', body: 'Thin signal, long commute. It still sounds like music.' },
    { k: 'High', big: '320', unit: 'kbps', body: 'Higher than any free tier anywhere else goes.' },
    { k: 'Lossless', big: 'FLAC', unit: 'lossless', body: 'Bit for bit what the studio sent out. Nothing thrown away.' },
    { k: 'Dolby Atmos', big: 'Atmos', unit: 'spatial', body: 'Where a song was mixed for it, the sound moves around you.' }
  ];
  function initSound() {
    var sec = $('#sound');
    if (!sec) return;
    var pin = sec.closest('.v2-pin');
    var cv = $('canvas', sec);
    var tiers = $$('.v2-tier', sec);
    var list = $$('ol.v2-mono > li', sec);
    var prog = 0, active = 0;
    if (!pin || !cv) return;

    /* ---- Canvas2D pulsar (PSR B1919+21) — verbatim port of the captured scene */
    var ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1, vis = false, mt = 0;
    function size() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    }
    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(cv);
    else window.addEventListener('resize', size);
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(cv);

    function nz(x, y) { var s = 43758.5453 * Math.sin(127.1 * x + 311.7 * y); return s - Math.floor(s); }
    function vnoise(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = nz(xi, yi), b = nz(xi + 1, yi), c = nz(xi, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + nz(xi + 1, yi + 1)) * u * v;
    }
    function fbm(x, y) { return 0.6 * vnoise(x, y) + 0.28 * vnoise(2.1 * x, 2.1 * y) + 0.12 * vnoise(4.3 * x, 4.3 * y); }
    function lp(a, b, t) { return a + (b - a) * t; }

    function draw(dt) {
      if (!vis || doc.hidden) return;
      mt += dt / 1000;
      var h = Math.min(3, 3.3 * prog), u = Math.floor(h);
      var s0 = clamp((h - u - 0.5) / 0.5, 0, 1);
      var x = Math.min(3, u + s0 * s0 * (3 - 2 * s0));
      function pick(arr) { var i = Math.min(2, Math.floor(x)); return lp(arr[i], arr[i + 1], x - i); }
      var mob = W < 700;
      var f = Math.round(pick(mob ? [16, 34, 90, 90] : [22, 52, 170, 170]));
      var w = Math.round(pick(mob ? [20, 28, 36, 36] : [26, 38, 52, 52]));
      var b = pick([11, 4.5, 0, 0]);
      var y = Math.max(0, x - 2);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var J = mob ? 0.9 * W : Math.min(0.46 * W, 760);
      var N = mob ? 0.46 * H : 0.72 * H;
      var K = mob ? W / 2 : 0.64 * W;
      var S = mob ? 0.2 * H : (H - N) / 2 + 0.08 * N;
      var T = 0.34 * N;
      ctx.lineJoin = 'round';
      for (var e = 0; e < w; e++) {
        var sn = w === 1 ? 1 : e / (w - 1);
        var r = S + lp(sn, Math.pow(sn, 1.7), y) * N;
        var aw = J * lp(1, 0.38 + 0.62 * sn, y);
        var x0 = K - aw / 2 + 18 * Math.sin(0.6 * mt + 2 * sn) * y * (1 - sn);
        var ph = 0.55 * mt;
        var pts = [];
        for (var t = 0; t <= f; t++) {
          var q = t / f;
          var py = r - (Math.exp(-Math.pow((q - 0.5) / 0.16, 2)) * (0.55 + 0.45 * vnoise(0.37 * e, 0.25 * mt)) + 0.025) *
            (1.9 * Math.pow(fbm(10 * q + 0.13 * e, 0.5 * e - ph), 2.4)) * T * lp(1, 1.25, y);
          if (b > 0.2) py = Math.round(py / b) * b;
          pts.push([x0 + q * aw, py]);
        }
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i2 = 1; i2 < pts.length; i2++) {
          if (b > 0.2) ctx.lineTo(pts[i2][0], pts[i2 - 1][1]);
          ctx.lineTo(pts[i2][0], pts[i2][1]);
        }
        ctx.lineTo(pts[pts.length - 1][0], r + 40);
        ctx.lineTo(pts[0][0], r + 40);
        ctx.closePath();
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i3 = 1; i3 < pts.length; i3++) {
          if (b > 0.2) ctx.lineTo(pts[i3][0], pts[i3 - 1][1]);
          ctx.lineTo(pts[i3][0], pts[i3][1]);
        }
        var al = lp(0.95, 0.35 + 0.65 * sn, y);
        ctx.strokeStyle = (e === w - 1 && y > 0.5) ? 'rgba(251,44,90,' + y + ')' : 'rgba(245,245,247,' + al + ')';
        ctx.lineWidth = lp(1.6, 1.15, Math.min(1, x / 2));
        ctx.stroke();
      }
    }

    /* ---- tier copy crossfade */
    /* `tierOp` mirrors each tier's current opacity so the right-hand list can
       pick its active row from the copy itself. Deriving it separately from
       `floor(3.3 * prog)` desynced the two — the list read "HIGH" while the
       copy was already on "LOSSLESS". */
    var tierOp = tiers.map(function () { return 0; });
    function el(i, op, ty) {
      var node = tiers[i];
      if (!node) return;
      tierOp[i] = op;
      node.style.opacity = String(op);
      node.style.visibility = op <= 0.001 ? 'hidden' : 'visible';
      node.style.transform = 'translateY(' + ty.toFixed(2) + 'px)';
    }
    var tl = new TL();
    if (RM) {
      tiers.forEach(function (node, i) { if (i !== 2) el(i, 0, 0); });
      prog = 0.7; active = 2;
    } else {
      tiers.forEach(function (node, i) { el(i, i ? 0 : 1, i ? 40 : 0); });
      for (var t2 = 1; t2 < tiers.length; t2++) {
        (function (prev, next) {
          tl.add(prev + 0.65, 0.3, E.none, function (u) { el(prev, 1 - u, -40 * u); });
          tl.add(next - 0.2, 0.3, E.none, function (u) { el(next, u, 40 * (1 - u)); });
        })(t2 - 1, t2);
      }
      tl.add(3.1, 0.6, E.none, function () {});
    }

    var sm = smoother(0.5);
    onScroll(function (dt) {
      prog = sm(pinProgress(pin), dt);
      if (!RM) tl.seek(prog);
      var a = 0;
      for (var ti = 1; ti < tierOp.length; ti++) if (tierOp[ti] > tierOp[a]) a = ti;
      if (a !== active) {
        active = a;
        list.forEach(function (li, i) {
          var isOn = i === a;
          li.style.color = isOn ? '#fff' : 'rgba(255,255,255,0.35)';
          var rule = li.lastElementChild;
          if (rule && rule.tagName === 'SPAN') { rule.style.width = isOn ? '36px' : '12px'; rule.style.background = isOn ? 'var(--v2-red)' : 'currentColor'; }
        });
      }
      draw(dt);
    });
  }

  /* ============================================================== TRACKLIST */
  var FEATURES = [
    { title: 'Lossless & Dolby Atmos', body: 'FLAC, bit for bit what the studio sent out. Atmos where the song was mixed for it.', src: 'assets/shots/web/album.webp', wide: true, aspect: '16/10' },
    { title: 'Lyrics, word by word', body: 'Karaoke-timed lyrics that follow the singer syllable by syllable. Tap a line to jump.', src: 'assets/shots/web/mobile-lyrics.webp', aspect: '9/19.5' },
    { title: 'Sing', body: 'Pull the vocals down with a slider and take the lead. Real instrumentals where we have them.', src: 'assets/shots/ios/sing.jpg', aspect: '9/19.5' },
    { title: 'AutoMix', body: 'Beat-matched transitions between songs, like someone decent is on the decks.', src: 'assets/cdn-images.dzcdn.net/images/cover/5718f7c81c27e0b2417e2a4c45224f8a/500x500-000000-80-0-0.jpg', aspect: 'square' },
    { title: 'Listening parties', body: 'Share a link and everyone hears the same second of the same song, wherever they are.', src: 'assets/cdn-images.dzcdn.net/images/cover/311bba0fc112d15f72c8b5a65f0456c1/500x500-000000-80-0-0.jpg', aspect: 'square' },
    { title: 'Podcasts', body: 'The Apple Podcasts catalogue, in the same player as your music. Same queue, same speed control.', src: 'assets/shots/ios/podcast.jpg', aspect: '9/19.5' },
    { title: 'Bring your playlists', body: 'Paste a Spotify export or a CSV and your library comes with you. Download it for the flight.', src: 'assets/shots/ios/library.jpg', aspect: '9/19.5' },
    { title: 'Wrapped, any day', body: 'Your top songs, artists and hours, whenever you want to look — not once a year.', src: 'assets/shots/web/home.webp', wide: true, aspect: '16/10' }
  ];
  function initTracklist() {
    var sec = $('#features');
    if (!sec) return;
    var h2 = $('h2', sec);
    if (h2 && !RM) {
      walkText(h2, 'v2-word', true);
      reveals(sec, 'h2 .v2-word', { yPct: 110, duration: 1100, stagger: 60, rootMargin: '0px 0px -18% 0px' });
    }
    reveals(sec, '.v2-track-row', { y: 50, duration: 1000, stagger: 0, rootMargin: '0px 0px -8% 0px' });
    reveals(sec, '.v2-track-rule', { scaleX: 0, duration: 1400, rootMargin: '0px 0px -8% 0px' });

    var card = $('.pointer-events-none.fixed.left-0.top-0', sec);
    var imgs = card ? $$('img', card) : [];
    var px = 0, py = 0, tx = 0, ty = 0, cur = -1, inside = false;

    function move(x, y) {
      tx = x + 28; ty = y - 120;
      px += (tx - px) * 0.18; py += (ty - py) * 0.18;
      if (card) { card.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)'; }
    }
    function show(i) {
      if (!card || i === cur) return;
      cur = i;
      if (i < 0) {
        card.style.transition = 'opacity .25s ease-in, transform .25s ease-in';
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        return;
      }
      var f = FEATURES[i];
      card.style.width = f.wide ? '380px' : '220px';
      card.style.transition = 'opacity .4s cubic-bezier(.16,1,.3,1), transform .4s cubic-bezier(.16,1,.3,1), width .3s';
      card.style.opacity = '1';
      imgs.forEach(function (im, k) {
        im.className = 'w-full object-cover transition-opacity duration-300 ' +
          (f.aspect === 'square' ? 'aspect-square' : f.aspect === '16/10' ? 'aspect-[16/10]' : 'aspect-[9/19.5] object-top') +
          (k === i ? ' relative opacity-100' : ' absolute inset-0 opacity-0');
      });
    }
    if (card) {
      card.style.opacity = '0';
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        if (!inside) return;
        move(e.clientX, e.clientY);
        var row = doc.elementFromPoint(e.clientX, e.clientY);
        row = row && row.closest ? row.closest('.v2-track-row') : null;
        var idx = (row && sec.contains(row)) ? Number(row.dataset.i) : -1;
        if (idx !== cur && idx >= 0 && Audio_.isHoverSound()) Audio_.playNote(Audio_.WHITE[idx], 0.55);
        show(idx);
      }, { passive: true });
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (en) { inside = en[0].isIntersecting; if (!inside) show(-1); }).observe(sec);
      }
    }
    $$('.v2-track-row', sec).forEach(function (row) {
      row.addEventListener('click', function () { Audio_.playNote(Audio_.WHITE[Number(row.dataset.i)], 0.7); });
    });
  }

  /* ================================================================ DEVICES */
  function initDevices() {
    var sec = $('.v2-devices-copy');
    if (!sec) return;
    var wrap = sec.closest('.v2-pin');
    var screen = $('.v2-screen', sec.closest('section'));
    if (!wrap || !screen || RM) return;
    var sm = smoother(0.6);
    var startScale = 1;
    function measure() {
      var s = screen.getBoundingClientRect(), p = screen.offsetParent.getBoundingClientRect();
      var cx = s.left + s.width / 2, cy = s.top + s.height / 2 - p.top;
      startScale = 1.01 * Math.max(2 * cx / screen.offsetWidth, 2 * (window.innerWidth - cx) / screen.offsetWidth,
        2 * cy / screen.offsetHeight, 2 * (window.innerHeight - cy) / screen.offsetHeight);
    }
    measure();
    window.addEventListener('resize', measure);
    var phone = $('.v2-phone', sec.closest('section'));
    var android = $('.v2-android', sec.closest('section'));
    var shade = $('.v2-screen-shade', sec.closest('section'));
    var copy = $$('.v2-devices-copy > *', sec.closest('section'));
    var TLEN = 1 + 0.3;
    onScroll(function (dt) {
      var p = sm(pinProgress(wrap), dt);
      var T = p * TLEN;
      var u = clamp(T, 0, 1), e = E.power2inOut(u);
      var sc = lerp(startScale, 1, e);
      screen.style.transform = 'scale(' + sc.toFixed(4) + ')';
      screen.style.borderRadius = (window.innerWidth >= 768 ? 18 : 12) * (1 - u) + 'px';
      if (shade) shade.style.opacity = String(lerp(0.55, 0, clamp(T / 0.8, 0, 1)));
      if (phone) {
        var pu = clamp((T - 0.45) / 0.8, 0, 1), pe = E.power2inOut(pu);
        phone.style.transform = 'translateY(' + lerp(70, 0, pe).toFixed(2) + '%) rotate(' + lerp(8, -4, pe).toFixed(2) + 'deg)';
        phone.style.opacity = String(pe);
      }
      if (android) {
        var au = clamp((T - 0.55) / 0.8, 0, 1), ae = E.power2inOut(au);
        android.style.transform = 'translateY(' + lerp(80, 0, ae).toFixed(2) + '%) rotate(' + lerp(-8, 3, ae).toFixed(2) + 'deg)';
        android.style.opacity = String(ae);
      }
      copy.forEach(function (c, i) {
        var cu = clamp((T - 0.7 - i * 0.08) / 0.5, 0, 1);
        c.style.opacity = String(cu);
        c.style.transform = 'translateY(' + lerp(40, 0, cu).toFixed(2) + 'px)';
      });
    });
  }

  /* =================================================================== JOIN */
  function initJoin() {
    var sec = $('#join');
    if (!sec) return;
    var getin = $('.v2-getin', sec);
    if (getin && !RM) {
      var sm = smoother(0.5);
      onScroll(function (dt) {
        var top = sec.getBoundingClientRect().top, vh = window.innerHeight;
        var raw = clamp((0.85 * vh - top) / (0.70 * vh), 0, 1);
        var w = lerp(75, 125, sm(raw, dt));
        getin.style.setProperty('--wdth', w.toFixed(1));
        getin.style.letterSpacing = (-0.02 - (w - 75) / 50 * 0.035).toFixed(4) + 'em';
      });
    }
    reveals(sec, '.v2-step', { y: 60, duration: 1100, stagger: 120, rootMargin: '0px 0px -15% 0px' });
  }

  /* ================================================================ FOOTER */
  function initFooter() {
    var footer = $('footer');
    if (!footer) return;
    var keys = $('.v2-keys', footer);
    var dragging = false;
    var LABEL = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];

    function strike(el, freq, vel) {
      if (!el) return;
      Audio_.playNote(freq, vel == null ? 0.85 : vel);
      el.style.transition = 'none';
      el.style.transform = 'translateY(6px)';
      setTimeout(function () { el.style.transition = 'transform .12s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; }, 60);
      var glow = $('.v2-key-glow', el);
      if (glow) glow.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1200, easing: 'cubic-bezier(.16,1,.3,1)' });
      var note = doc.createElement('span');
      note.className = 'v2-key-note';
      note.textContent = '♪';
      el.appendChild(note);
      note.animate([
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: 'translate(' + ((Math.random() - 0.5) * 60).toFixed(1) + 'px,' + (-160 - 80 * Math.random()).toFixed(0) + 'px)', opacity: 0 }
      ], { duration: 1600, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = function () { note.remove(); };
    }

    if (keys) {
      $$('[data-w]', keys).forEach(function (b) {
        var i = Number(b.getAttribute('data-w'));
        b.addEventListener('pointerdown', function (e) {
          dragging = true;
          try { b.releasePointerCapture(e.pointerId); } catch (err) {}
          strike(b, Audio_.WHITE[i]);
        });
        b.addEventListener('pointerenter', function () { if (dragging) strike(b, Audio_.WHITE[i]); });
      });
      $$('[data-b]', keys).forEach(function (b) {
        var i = Number(b.getAttribute('data-b'));
        var f = Audio_.BLACK[i];
        if (!f) return;
        b.addEventListener('pointerdown', function (e) {
          dragging = true;
          try { b.releasePointerCapture(e.pointerId); } catch (err) {}
          strike(b, f);
        });
        b.addEventListener('pointerenter', function () { if (dragging) strike(b, f); });
      });
      window.addEventListener('pointerup', function () { dragging = false; });

      var WKEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
      var BKEYS = ['w', 'e', null, 't', 'y', 'u', null];
      window.addEventListener('keydown', function (e) {
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
        var t = e.target;
        if (t && t.closest && t.closest('input, textarea, [contenteditable]')) return;
        var k = e.key.toLowerCase();
        var wi = WKEYS.indexOf(k), bi = BKEYS.indexOf(k);
        var r = keys.getBoundingClientRect();
        if (r.top > window.innerHeight || r.bottom < 0) return;
        if (wi >= 0) strike($('[data-w="' + wi + '"]', keys), Audio_.WHITE[wi]);
        else if (bi >= 0 && Audio_.BLACK[bi]) strike($('[data-b="' + bi + '"]', keys), Audio_.BLACK[bi]);
      });

      reveals(footer, '.v2-key', { yPct: -40, duration: 1200, stagger: 50, rootMargin: '0px 0px -15% 0px' });
    }

    var mark = $('.v2-wordmark', footer);
    if (mark && !RM) {
      var sm = smoother(0.5);
      onScroll(function (dt) {
        var r = mark.getBoundingClientRect(), vh = window.innerHeight;
        var raw = clamp((vh - r.top) / Math.max(1, (vh - r.top) + (r.bottom - vh)), 0, 1);
        var p = sm(raw, dt);
        mark.style.setProperty('--wdth', lerp(75, 125, p).toFixed(1));
        mark.style.transform = 'translateY(' + lerp(30, 0, p).toFixed(2) + '%)';
      });
    }
  }

  /* =============================================================== CLOCK */
  function initClock() {
    var clock = $('.v2-clock-glyph');
    if (!clock) return;
    var wrap = clock.closest('div');
    var tEl = wrap.children[1], bar = wrap.querySelector('.relative > span');
    var stop = 0, playing = false;
    onScroll(function (dt) {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? clamp(window.pageYOffset / max, 0, 1) : 0;
      if (tEl) tEl.textContent = hhmmss(273 * p);
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var moving = Math.abs(velocity) > 0.3;
      stop = moving ? 0 : stop + dt;
      var now = moving || stop < 250;
      if (now !== playing) { playing = now; clock.setAttribute('data-playing', String(now)); }
    });
  }

  /* =============================================================== ABOUT */
  function initAbout() {
    var h1 = $('.v2-display.invisible');
    if (h1 && sec0IsAbout()) {
      h1.classList.remove('invisible');
      if (!RM) {
        var chars = walkText(h1, 'v2-char', false);
        chars.forEach(function (c, i) {
          c.animate([{ transform: 'translateY(115%) rotate(6deg)' }, { transform: 'none' }],
            { duration: 1300, delay: 250 + i * 22, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        });
      }
    }
    var story = $('.v2-about-story');
    if (story && !RM) {
      var words = walkText(story, 'v2-word', true);
      var n = words.length, total = 0.5 + 0.1 * Math.max(0, n - 1);
      words.forEach(function (w) { w.style.opacity = '0.14'; });
      var sm = smoother(0.4);
      onScroll(function (dt) {
        var r = story.getBoundingClientRect(), vh = window.innerHeight;
        var a = vh * 0.78 - r.top, b = r.bottom - vh * 0.42;
        var T = sm(clamp(a / Math.max(1, a + b), 0, 1), dt) * total;
        for (var i = 0; i < n; i++) words[i].style.opacity = String(lerp(0.14, 1, clamp((T - i * 0.1) / 0.5, 0, 1)));
      });
    }
    var strip = $('.v2-about-strip');
    if (strip && !RM) {
      /* duplicate the row so the -50% translate loops seamlessly */
      strip.innerHTML += strip.innerHTML;
    }
    reveals($('main'), '.v2-about-reveal', { y: 40, duration: 1000, stagger: 80 });
  }
  function sec0IsAbout() {
    return !!$('.v2-about-strip');
  }

  /* ============================================================ DOWNLOAD */
  function initDownload() {
    var h1 = $('.v2-dl-hero .v2-display');
    if (h1) {
      h1.classList.remove('invisible');
      if (!RM) {
        var chars = walkText(h1, 'v2-char', false);
        chars.forEach(function (c, i) {
          c.animate([{ transform: 'translateY(115%) rotate(6deg)' }, { transform: 'none' }],
            { duration: 1300, delay: 250 + i * 22, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        });
      }
    }
    reveals($('main'), '.v2-dl-reveal', { y: 40, duration: 1000, stagger: 60 });
    reveals($('main'), '.v2-dl-phone', { y: 60, duration: 1200, stagger: 120 });
    if (!RM) $$('.v2-dl-fade').forEach(function (f, i) {
      f.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
        { duration: 1200, delay: 800 + i * 80, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });

    /* --- copy buttons: Source URL, APK SHA-256, signing certificate ----- */
    /* Each row is  <span><span>caption</span><span>VALUE</span></span><span>Copy</span>,
       so the payload is the second-to-last descendant span. Indexing from 0
       picks up the wrapper span first and copies the caption ("Source URL"). */
    $$('button.group.flex.w-full').forEach(function (b) {
      var spans = $$('span', b);
      if (spans.length < 2) return;
      var label = spans[spans.length - 1];
      var value = spans.length > 2 ? spans[spans.length - 2] : spans[0];
      var text = value.textContent.trim();
      if (!text) return;
      var reset;
      b.addEventListener('click', function () {
        copy(text).then(function () {
          label.textContent = 'Copied';
          b.classList.add('copy-flash');
          clearTimeout(reset);
          reset = setTimeout(function () { label.textContent = 'Copy'; b.classList.remove('copy-flash'); }, 1600);
        });
      });
    });
    /* --- about page: wallet address copy ------------------------------- */
    $$('button[aria-label="Copy address"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var row = b.previousElementSibling;
        if (!row) return;
        copy(row.textContent.trim()).then(function () {
          b.style.color = 'var(--accent)';
          setTimeout(function () { b.style.color = ''; }, 1400);
        });
      });
    });

    /* --- accordion: "All 9 sections" ----------------------------------- */
    /* The Android accordion and the iPhone changelog share the `.v2-dl-more`
       marker; only the timeline rows also carry `.v2-tl-item`. Scoping each
       control to its own set stops "All 9 sections" from also dumping all 43
       extra changelog releases. */
    var accRows = $$('.v2-dl-more:not(.v2-tl-item)');
    var tlRows = $$('.v2-dl-more.v2-tl-item');
    /* `reveals()` leaves each row at opacity 0 until its entrance animation
       runs, with `fill:'backwards'` and a delay of `index * stagger`. The 43
       timeline rows reach an index of ~50, i.e. a ~3s delay — so unhiding them
       showed nothing. Cancel the pending animation and let them sit at their
       natural (visible) state as soon as the reader asks for them. */
    function revealNow(rows) {
      rows.forEach(function (r) {
        if (r.getAnimations) r.getAnimations().forEach(function (a) { try { a.cancel(); } catch (e) {} });
        r.style.opacity = '';
        r.style.transform = '';
      });
    }
    var acc = $('[data-acc="android"]');
    if (acc) {
      acc.addEventListener('click', function () {
        var open = acc.getAttribute('aria-expanded') === 'true';
        accRows.forEach(function (r) { r.hidden = open; });
        if (!open) revealNow(accRows);
        acc.setAttribute('aria-expanded', String(!open));
        acc.textContent = open ? 'All 9 sections' : 'Hide 4 sections';
      });
    }
    /* --- "Show all 51" ------------------------------------------------- */
    var showAll = $('[data-showall]');
    if (showAll) {
      showAll.addEventListener('click', function () {
        var open = showAll.getAttribute('aria-expanded') === 'true';
        tlRows.forEach(function (r) { r.hidden = open; });
        if (!open) revealNow(tlRows);
        showAll.setAttribute('aria-expanded', String(!open));
        showAll.textContent = open ? 'Show all 51' : 'Show 8 only';
        var line = $('.v2-timeline-line');
        if (line) line.style.background = open ? '' : 'var(--v2-red)';
      });
    }
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    var ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    doc.body.appendChild(ta);
    ta.select();
    try { doc.execCommand('copy'); } catch (e) {}
    ta.remove();
    return text;
  }

  /* ================================================================== boot */
  function boot() {
    root.classList.add('is-ready');
    initPins();
    initNav();
    initAnchors();
    initHero();
    initManifesto();
    initLyrics();
    initPalette();
    initSound();
    initTracklist();
    initDevices();
    initJoin();
    initFooter();
    initClock();
    if (sec0IsAbout()) initAbout();
    if ($('.v2-dl-hero')) initDownload();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.dispatchEvent(new Event('resize')); });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
