/* Settings — all 19 sections with working in-memory toggles, segmented
   controls, sliders, the 10-band equalizer, keyboard section, and the
   account-gated Turnstile panel rendered as faithful non-functional UI. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc;

  var ctx = OCT.init({ active: '' });
  var view = ctx.view;

  var prefs = {
    quality: 'Lossless', dataSaver: false, soundCheck: true, transitions: 'Off',
    autoplay: true, smartShuffle: false, gapless: true, skipStall: '10s',
    explicit: true, logVolume: false, statsNerds: true,
    feedSource: 'Apple Music', language: 'English',
    lrcLyrics: false, addFavorite: false, saveLikes: 'Liked Songs',
    bulkDownload: false, deliverAs: 'Separate files', floatingPanel: true,
    animatedArt: 'On', animatedBg: true, heroVideo: true,
    adaptive: true, reduceMotion: false, hires: true, glass: 'Auto',
    openLyrics: false, karaoke: true, shareLine: true, emphasis: 'Animated', timing: 'In Sync',
    swipeGestures: true, swipeActions: true, swipeRight: 'Like', swipeLeft: 'Add to queue',
    searchSuggest: true, sleep: 'Off', tips: 'USDC (Solana) · FC537RUMhV6qAUnr8jVHeiRi5pTRzs766xbteuvazKdJ'
  };

  function toggle(key, disabled) {
    return '<button class="switch" role="switch" data-toggle="' + key + '"' +
      ' aria-checked="' + (!!prefs[key]) + '"' +
      (disabled ? ' data-disabled="true"' : '') +
      ' aria-label="Toggle"></button>';
  }
  function seg(key, options) {
    return '<div class="seg" data-seg="' + key + '">' + options.map(function (o) {
      return '<button data-val="' + esc(o) + '"' +
        (prefs[key] === o ? ' class="on"' : '') + '>' + esc(o) + '</button>';
    }).join('') + '</div>';
  }
  function setRow(label, help, control) {
    return '<div class="setting"><div class="grow"><div class="setting-label">' + esc(label) + '</div>' +
      (help ? '<div class="setting-help">' + esc(help) + '</div>' : '') + '</div>' + control + '</div>';
  }
  function sliderRow(label, help, key, val) {
    return '<div class="setting"><div class="grow"><div class="setting-label">' + esc(label) + '</div>' +
      (help ? '<div class="setting-help">' + esc(help) + '</div>' : '') +
      '<div class="slider-row" style="margin-top:10px">' +
      '<input class="slider" type="range" min="0" max="100" value="' + val + '" data-slider="' + key + '">' +
      '<span class="slider-val" data-sliderlabel="' + key + '">' + val + '%</span></div></div></div>';
  }
  function panel(id, icon, title, body) {
    return '<section class="panel" id="' + id + '"><div class="panel-head">' + I(icon) +
      '<span>' + esc(title) + '</span></div><div class="panel-body" style="padding:0">' + body + '</div></section>';
  }

  var EQ_BANDS = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];
  var eqValues = new Array(10).fill(0);
  var preamp = 0;

  var html =
    '<div class="settings-grid">' +
    '<nav class="settings-nav" aria-label="Settings sections">' +
    D.settingsSections.map(function (s, i) {
      return '<a href="#' + slug(s) + '" class="' + (i === 0 ? 'on' : '') + '">' + esc(s) + '</a>';
    }).join('') +
    '<a href="#" class="jump">Home</a>' +
    '<a href="#" class="jump">About</a>' +
    '</nav>' +
    '<div>' +

    '<h1>Settings</h1>' +
    '<div class="searchbox" style="margin-top:18px">' + I('search') +
    '<input id="sset" type="search" placeholder="Search Settings" aria-label="Search Settings">' +
    '<span class="sb-actions">' + I('mic') + '</span></div>' +

    '<section class="panel" style="margin-top:20px"><div class="panel-body">' +
    '<div style="display:flex;align-items:center;gap:16px;position:relative">' +
    '<div class="avatar" style="width:52px;height:52px">' + I('user') + '</div>' +
    '<span style="position:absolute;left:34px;top:36px;width:22px;height:22px;border-radius:50%;' +
    'background:#2a2a30;border:2px solid #000;display:grid;place-items:center">' +
    I('camera') + '</span>' +
    '<div><div style="font-size:19px;font-weight:650">Listener</div>' +
    '<div class="faint t-sm">Free account · saved on this device</div></div></div></div></section>' +

    panel('account-sync', 'cloud', 'Account & sync',
      '<div class="setting"><div class="grow"><div class="setting-label">Sync your account</div>' +
      '<div class="setting-help">Sync your likes, playlists and settings across devices. No email or ' +
      'password — you get a private <b style="color:var(--color-text)">account key</b> to save (like a ' +
      'recovery phrase).</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-top:16px">' +
      '<div class="turnstile"><span class="turnstile-box"></span>' +
      '<span class="turnstile-txt">Verify you are human</span>' +
      '<span class="turnstile-logo"><b>CLOUDFLARE</b><u>Privacy</u> · <u>Help</u></span></div>' +
      '<div style="flex:1;min-width:240px">' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
      '<button class="btn btn-accent" disabled aria-disabled="true">' + I('sparkle') + 'Create account</button>' +
      '<button class="btn btn-glass" disabled aria-disabled="true">' + I('key') + 'I have a key</button>' +
      '</div>' +
      '<div class="faint t-xs" style="margin-top:14px">Inactive accounts are removed after 90 days. ' +
      'Your on-device library always stays.</div></div></div></div></div>') +

    panel('notifications', 'bell', 'Notifications',
      setRow('New-music alerts', 'We watch the artists you follow and drop a note in your inbox (the bell, top-right) when they release something.', '') +
      setRow('Push to this device', 'Create an account above to turn this on.', toggle('push', true))) +

    panel('library', 'file', 'Library',
      setRow('Transfer Music from Other Services', 'Bring your music from Spotify, Apple Music, YouTube Music & more', '<button class="btn btn-glass">Import</button>') +
      setRow('Add Favorite Songs', 'Off, the ♥ on an album just saves it to your Library. On, every track also lands in Liked Songs.', toggle('addFavorite')) +
      setRow('Save Likes To', 'Where the ♥ button adds songs. Liked Songs still powers Last.fm love, offline downloads & cross-device sync.', seg('saveLikes', ['Liked Songs'])) +
      setRow('Export Library', 'Save playlists, likes, follows, stats & settings to a file.', '<button class="btn btn-glass">Export</button>') +
      setRow('Restore from Backup', 'Bring your library to a new device or browser — no account needed.', '<button class="btn btn-glass">Import</button>') +
      setRow('Reset Media Library', 'Removes playlists, likes and history on this device.', '<button class="btn btn-glass">Reset</button>')) +

    panel('audio', 'speaker', 'Audio',
      setRow('Audio Quality', 'Full-length streaming · higher quality uses more data.', seg('quality', ['Low', 'High', 'Lossless'])) +
      '<div class="setting" style="padding-top:0"><div class="faint t-sm">' +
      'MP3 · 320 kbps · streamed from Octave</div></div>' +
      setRow('Data Saver', 'Lightest audio quality + lower-resolution artwork. Web-only — the app has Cellular Streaming instead.', toggle('dataSaver')) +
      setRow('Sound Check', 'Real-time loudness matching so every track plays at a consistent level.', toggle('soundCheck')) +
      setRow('Song Transitions', 'No crossfade between songs (gapless still removes silence).', seg('transitions', ['Off', 'Crossfade', 'AutoMix']))) +

    panel('equalizer', 'sliders', 'Equalizer',
      '<p class="muted t-sm" style="padding:16px 20px 0">Apple Music’s ten-band equalizer — pick a ' +
      'preset or move the sliders. Preamp trims the whole signal before the bands.</p>' +
      '<div class="setting" style="padding-top:12px"><div class="grow">' +
      '<div class="setting-label">Preset</div>' +
      '<div class="setting-help">Acoustic through Vocal Booster, in Apple’s order; any slider you move turns it to Manual.</div></div></div>' +
      '<div style="padding:0 20px 14px"><div class="chips" id="eqPresets">' +
      ['Acoustic', 'Bass Booster', 'Bass Reducer', 'Classical', 'Dance', 'Deep', 'Electronic',
       'Flat', 'Hip-Hop', 'Jazz', 'Latin', 'Loudness', 'Lounge', 'Piano', 'Pop', 'R&B', 'Rock',
       'Small Speakers', 'Spoken Word', 'Treble Booster', 'Treble Reducer', 'Vocal Booster', 'Manual']
        .map(function (p) {
          return '<button class="chip' + (p === 'Flat' ? ' on' : '') + '" data-preset="' + esc(p) + '">' +
            esc(p) + '</button>';
        }).join('') + '</div></div>' +
      '<div class="preamp"><span class="faint t-xs">+12 dB</span>' +
      '<input class="slider" type="range" min="-12" max="12" step="0.5" value="0" id="preamp" aria-label="Preamp">' +
      '<span class="faint t-xs">−12 dB</span><span class="slider-val" id="preampVal">0 dB</span></div>' +
      '<div class="eq-wrap" id="eqWrap">' + EQ_BANDS.map(function (b, i) {
        return '<div class="eq-band"><label>' + b + '</label>' +
          '<input type="range" min="-12" max="12" step="0.5" value="0" data-band="' + i + '" aria-label="' + b + ' Hz">' +
          '<span class="faint" data-bandval="' + i + '">0</span></div>';
      }).join('') + '</div>' +
      '<div class="eq-foot"><span>Drag a slider · ↑ ↓ 0.5 dB · Page ↑ ↓ 3 dB · double-click resets one band</span>' +
      '<span>Flat</span></div>') +

    panel('playback', 'play', 'Playback',
      setRow('Autoplay', 'Keep playing similar songs when your queue runs out.', toggle('autoplay')) +
      setRow('Smart Shuffle', 'Add a third shuffle mode that weaves recommendations tuned to your taste (and your Last.fm) into your own songs.', toggle('smartShuffle')) +
      setRow('Gapless Playback', 'No silence between tracks.', toggle('gapless')) +
      setRow('Skip Songs That Won’t Play', 'If a song hasn’t started after 10s, move on to the next one. Songs that stall partway through get one retry first.',
        seg('skipStall', ['Off', '3s', '5s', '7s', '9s', '10s', '15s'])) +
      setRow('Allow Explicit Content', 'Off hides explicit songs from search results.', toggle('explicit')) +
      setRow('Logarithmic Volume', 'Perceptual volume curve — finer control at low levels.', toggle('logVolume')) +
      setRow('Stats for Nerds', 'Show codec, bitrate and source on the player.', toggle('statsNerds'))) +

    panel('keyboard', 'file', 'Keyboard',
      setRow('Keyboard Shortcuts', 'Music’s shortcuts: ⌘→ / ⌘← skip, ⌘↑ / ⌘↓ volume, ⌘B Column Browser, ⇧⌘F Full Screen Player · press ? for the full list and to customise',
        '<button class="btn btn-glass" id="openKs">' + I('listPlus') + 'Show all</button>')) +

    panel('recommendations', 'compass', 'Recommendations',
      setRow('Feed Source', 'Worldwide charts and editorial.', seg('feedSource', ['Apple Music', 'Deezer'])) +
      setRow('Only Shuffle in My Language', 'Autoplay, Smart Shuffle and radio pull in songs to match. Turn off to hear the whole catalog.', seg('language',
        ['English', 'Spanish', 'Portuguese', 'French', 'German', 'Italian', 'Hindi', 'Japanese', 'Korean', 'Arabic', 'More'])) +
      '<div class="setting"><div class="faint t-sm">Instrumentals and titles Octave can’t ' +
      'confidently classify still play — the filter only drops tracks it clearly hears as another language.</div></div>' +
      setRow('Tune Your Taste', 'Add more artists to seed your recommendations — never removes what’s already there.',
        '<button class="btn btn-glass">Add artists</button>')) +

    panel('downloads', 'download', 'Downloads',
      setRow('Downloaded Music', 'Play offline with no data — tap to manage', '<div style="text-align:right"><div>0 songs</div><button class="btn btn-glass" style="margin-top:8px">Manage</button></div>') +
      setRow('Download Lyrics', 'Save a synced .lrc lyrics file next to each song you download.', toggle('lrcLyrics')) +
      setRow('Bulk Download Mode', 'Adds a select toggle in the top bar. Turn it on to pick multiple songs, then download them together.', toggle('bulkDownload')) +
      setRow('Deliver As', 'Separate files, saved one at a time.', seg('deliverAs', ['Separate files', 'Single ZIP'])) +
      setRow('Floating Panel', 'Show a mini progress panel in the corner while songs download.', toggle('floatingPanel'))) +

    panel('storage', 'library', 'Storage',
      setRow('Storage Used', 'Offline audio + cached artwork on this device.', '<div style="text-align:right">10 MB</div>') +
      setRow('Remove All Downloads', 'Frees space; songs re-download on demand.', '<button class="btn btn-glass">Remove</button>') +
      setRow('Clear Cached Data', 'Clear saved artwork & catalog pages (not your library).', '<button class="btn btn-glass">Clear</button>')) +

    panel('lyrics', 'lyrics', 'Lyrics',
      setRow('Open Straight to Lyrics', 'Now Playing opens on the lyrics instead of the artwork (tap the artwork to switch back).', toggle('openLyrics')) +
      setRow('Karaoke Lyrics', 'Fill words on the current line as they’re sung, when a song has word-by-word timing.', toggle('karaoke')) +
      setRow('Share Button on Each Line', 'Adds a share icon to the current line. It reserves space on the right, so turning it off lets long lines use the full width.', toggle('shareLine')) +
      setRow('Line Emphasis', 'The current line grows, and word-by-word lyrics pop each word as it’s sung.', seg('emphasis', ['Animated', 'Static'])) +
      setRow('Lyrics Timing', 'Nudge synced lyrics earlier or later if they land off the beat.', seg('timing', ['−2s', 'In Sync', '+2s']))) +

    panel('animated-art', 'sparkle', 'Animated Art',
      setRow('Animated Art', 'Playlist, album and artist pages, album art in Now Playing, and other animated cover art will automatically play.', seg('animatedArt', ['On', 'Wi-Fi Only', 'Off'])) +
      setRow('Animated Background', 'Fill the Now Playing background with the animated cover.', toggle('animatedBg')) +
      setRow('Artist Hero Video', 'Play the artist’s cinematic loop at the top of their page, when there is one.', toggle('heroVideo'))) +

    panel('appearance', 'eye', 'Appearance',
      setRow('Adaptive Theming', 'Tint the player with the current album’s colors.', toggle('adaptive')) +
      sliderRow('Background Blur', 'Soften the Now Playing artwork · 100%', 'bgBlur', 100) +
      setRow('Reduce Motion', 'Minimize animations across the app.', toggle('reduceMotion')) +
      setRow('Hi-Res Artwork', 'Use the sharpest available cover art, with an automatic fallback.', toggle('hires')) +
      setRow('Liquid Glass', 'Frosted, refracting chrome. Auto keeps it off on devices that can’t afford the blur. Web-only.', seg('glass', ['Auto', 'Always', 'Off'])) +
      sliderRow('Visualizer Energy', 'How expressive the sound-wave bars are · 100%', 'vizEnergy', 100) +
      setRow('Customize & Themes', 'Themes are set in the iOS app and follow your account. The web app uses the Octave theme.', seg('theme', ['Octave']))) +

    panel('gestures', 'hand', 'Gestures',
      setRow('Swipe Gestures', 'Swipe the mini player or artwork to change songs.', toggle('swipeGestures')) +
      setRow('Swipe Actions', 'On phones, swipe a song to trigger an action. On desktop, use the row buttons.', toggle('swipeActions')) +
      setRow('Swipe Right', 'What a right swipe does on a song.', seg('swipeRight', ['Nothing', 'Like', 'Add to queue', 'Play next', 'Download'])) +
      setRow('Swipe Left', 'What a left swipe does on a song.', seg('swipeLeft', ['Nothing', 'Like', 'Add to queue', 'Play next', 'Download']))) +

    panel('search', 'search', 'Search',
      setRow('Search Suggestions', 'Show the as-you-type suggestions dropdown under the search box.', toggle('searchSuggest')) +
      setRow('Clear Recent Searches', 'Clear', '<button class="btn btn-glass">Clear</button>')) +

    panel('sleep-timer', 'clock', 'Sleep Timer',
      '<div class="setting"><div class="grow"><div class="setting-label">Sleep Timer</div></div></div>' +
      '<div style="padding:0 20px 18px"><div class="chips">' +
      ['Off', '15 min', '30 min', '45 min', '60 min', 'End of track'].map(function (o) {
        return '<button class="chip' + (o === 'Off' ? ' on' : '') + '">' + esc(o) + '</button>';
      }).join('') + '</div></div>') +

    panel('listening-history', 'trend', 'Listening History',
      setRow('Octave Wrapped', 'Your listening, wrapped into a story', '<a class="btn btn-glass" href="wrapped.html">Open</a>') +
      setRow('Listening Stats', 'Your top artists, songs and minutes', '<a class="btn btn-glass" href="stats.html">Open</a>')) +

    panel('connections', 'link', 'Connections',
      '<div class="setting"><div class="grow"><div style="display:flex;align-items:center;gap:12px">' +
      '<span style="width:38px;height:38px;border-radius:10px;background:#eb3b2f;color:#fff;display:grid;' +
      'place-items:center;font-weight:800;font-size:14px">fm</span>' +
      '<div><div class="setting-label">Last.fm</div>' +
      '<div class="setting-help">Personalize recommendations, import your Loved tracks, and scrobble your plays.</div></div></div></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<button class="btn btn-glass">' + I('key') + 'Log in with Last.fm</button>' +
      '<button class="btn btn-glass">' + I('user') + 'Connect by username</button></div></div>' +
      '<div class="setting" style="flex-direction:column;align-items:flex-start;gap:12px">' +
      '<div><div class="setting-label">Support Octave</div>' +
      '<div class="setting-help">Octave is free forever — no ads, no paywalls, no tracking. If it’s made ' +
      'your day, a small crypto tip keeps the lights on. Handled through the sibling CloakGPT treasury.</div></div>' +
      '<div class="faint t-xs" style="word-break:break-all">' + esc(prefs.tips) + '</div></div>') +

    panel('about', 'info', 'About',
      setRow('Backend', 'api.octavestreaming.com', '<span class="faint">— demo clone, no calls</span>') +
      setRow('Audio', 'Octave Streaming', '<span class="faint">WebAudio demo tone</span>') +
      setRow('Version', 'v7.3.2', '<span class="faint">demo build</span>') +
      setRow('Full-Length Streaming', 'Up to lossless FLAC from a global catalog; geo-locked tracks fall back to a 30-second preview.', '') +
      '<div class="setting"><div class="faint t-sm">Catalog region: Canada</div></div>') +

    '</div></div>';

  view.innerHTML = html;

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  /* --- wiring --- */
  OCT.$$('[data-toggle]').forEach(function (b) {
    if (b.getAttribute('data-disabled') === 'true') return;
    b.addEventListener('click', function () {
      var k = b.dataset.toggle;
      prefs[k] = !prefs[k];
      b.setAttribute('aria-checked', String(prefs[k]));
    });
  });
  OCT.$$('[data-seg]').forEach(function (g) {
    OCT.$$('button', g).forEach(function (b) {
      b.addEventListener('click', function () {
        prefs[g.dataset.seg] = b.dataset.val;
        OCT.$$('button', g).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
    });
  });
  OCT.$$('[data-slider]').forEach(function (s) {
    s.addEventListener('input', function () {
      var lbl = OCT.$('[data-sliderlabel="' + s.dataset.slider + '"]');
      if (lbl) lbl.textContent = s.value + '%';
    });
  });
  OCT.$$('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      OCT.$$('[data-preset]').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var seed = A.hash(b.dataset.preset);
      eqValues = eqValues.map(function (_, i) { return ((seed >> (i % 8)) % 9) - 4; });
      paintEq();
    });
  });
  OCT.$$('[data-band]').forEach(function (s) {
    s.addEventListener('input', function () {
      eqValues[+s.dataset.band] = parseFloat(s.value);
      paintEq();
    });
    s.addEventListener('dblclick', function () { s.value = 0; eqValues[+s.dataset.band] = 0; paintEq(); });
  });
  $('#preamp').addEventListener('input', function () {
    preamp = parseFloat(this.value);
    $('#preampVal').textContent = (preamp > 0 ? '+' : '') + preamp + ' dB';
  });
  function paintEq() {
    OCT.$$('[data-band]').forEach(function (s, i) {
      s.value = eqValues[i];
      var lbl = OCT.$('[data-bandval="' + i + '"]');
      if (lbl) lbl.textContent = eqValues[i] > 0 ? '+' + eqValues[i] : eqValues[i];
    });
  }
  $('#openKs').addEventListener('click', function () { OCT.shortcutsDialog(); });

  $('#sset').addEventListener('input', function () {
    var v = this.value.trim().toLowerCase();
    OCT.$$('.settings-nav a').forEach(function (a) {
      if (a.classList.contains('jump')) return;
      a.hidden = !!v && a.textContent.toLowerCase().indexOf(v) < 0;
    });
    OCT.$$('.settings-grid .panel').forEach(function (p) {
      var sec = p.querySelector('.panel-head span');
      var body = p.textContent.toLowerCase();
      p.hidden = !!v && (body.indexOf(v) < 0);
    });
  });

  /* nav active state on scroll (only after the user actually scrolls, so the
   first section stays highlighted on load like the real app) */
  var links = OCT.$$('.settings-nav a:not(.jump)');
  var scrolled = false;
  OCT.$('#view').addEventListener('scroll', function () { scrolled = true; });
  var obs = new IntersectionObserver(function (entries) {
    if (!scrolled) return;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (l) { l.classList.remove('on'); });
      var m = links.filter(function (l) { return l.getAttribute('href') === '#' + e.target.id; })[0];
      if (m) m.classList.add('on');
    });
  }, { root: OCT.$('#view'), rootMargin: '-10% 0px -70% 0px' });
  OCT.$$('.settings-grid .panel').forEach(function (p) { obs.observe(p); });
})();