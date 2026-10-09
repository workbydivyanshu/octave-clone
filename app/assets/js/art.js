/* Octave demo clone — deterministic generated cover art.
   No third-party artwork is bundled or hotlinked: every tile is drawn from
   CSS gradients + typography seeded by a stable hash of the item id/title. */
(function (root) {
  'use strict';

  function hash(str) {
    var h = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Bold, saturated duot/tritone ramps. Each album picks one, so covers
  // read as distinct sleeves while staying inside the app's palette.
  var PALETTES = [
    ['#ff2d55', '#ff8a3d', '#3d0a16'],
    ['#7b5cff', '#c86bff', '#1c0b3a'],
    ['#2c6bfb', '#39d0d8', '#04183d'],
    ['#ff7a6b', '#ffd166', '#3f0a1c'],
    ['#00d6a4', '#2c6bfb', '#03261f'],
    ['#ffb020', '#ff2d55', '#3a1502'],
    ['#8bd450', '#00d6a4', '#12300a'],
    ['#ff4d8d', '#ffb020', '#400a26'],
    ['#5b8cff', '#b06bff', '#0a1436'],
    ['#c86bff', '#ff7a6b', '#2c0b3f'],
    ['#ff6f4d', '#ffd166', '#3d1206'],
    ['#39d0d8', '#7b5cff', '#04262c'],
    ['#e0b3ff', '#ff4d8d', '#2a0f3d'],
    ['#ffd166', '#ff7a6b', '#3d2602'],
    ['#6ec1ff', '#00d6a4', '#06233d'],
    ['#ff9de2', '#7b5cff', '#3a0c2b']
  ];

  function initials(str) {
    var clean = String(str || '?')
      .replace(/[‘’]/g, "'")
      .replace(/\(.*?\)/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ');
    var words = clean.split(/[\s\-–—·&,.]+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  /* Returns an HTML string for a generated art tile. */
  function tile(seed, label, opts) {
    opts = opts || {};
    var h = hash(seed);
    var p = PALETTES[h % PALETTES.length];
    var p2 = PALETTES[(h >>> 5) % PALETTES.length];
    var ang = h % 360;
    var ax = 18 + (h % 64);
    var ay = 14 + ((h >>> 3) % 60);
    var mode = (h >>> 7) % 4;
    var text = initials(label);
    var long = text.length > 2;
    var pct = opts.small ? (long ? 26 : 34) : (long ? 17 : 24);

    var layers =
      // soft highlight
      'radial-gradient(58% 58% at ' + ax + '% ' + ay + '%, ' + hexA(p[0], .95) + ' 0%, ' +
        hexA(p[0], .35) + ' 42%, transparent 72%),' +
      // counter-light
      'radial-gradient(46% 46% at ' + (100 - ax) + '% ' + (100 - ay) + '%, ' + hexA(p2[0], .8) + ' 0%, transparent 70%),' +
      // structure
      structure(mode, h, p, p2) +
      // base wash
      'linear-gradient(' + ang + 'deg, ' + p[1] + ' 0%, ' + hexA(p[0], .9) + ' 52%, ' + p[2] + ' 100%)';

    var inner = opts.bare === true ? '' :
      '<span style="font-size:' + pct + 'cqw;letter-spacing:' + (long ? '-.03em' : '-.05em') + '">' +
      esc(text) + '</span>';

    return '<div class="ph" style="background-image:' + layers + ';" role="img" aria-label="' +
      esc(label || 'Artwork') + '">' + inner + '</div>';
  }

  function structure(mode, h, p, p2) {
    var a = h % 360;
    if (mode === 0) {
      return 'repeating-linear-gradient(' + a + 'deg, ' + hexA('#ffffff', .07) + ' 0 3%, transparent 3% 9%),';
    }
    if (mode === 1) {
      return 'repeating-linear-gradient(' + a + 'deg, transparent 0 11%, ' + hexA('#000000', .16) + ' 11% 22%),';
    }
    if (mode === 2) {
      return 'conic-gradient(from ' + a + 'deg at 50% 62%, ' + hexA('#ffffff', .13) + ' 0deg 40deg, transparent 40deg 180deg, ' +
        hexA('#000000', .2) + ' 180deg 260deg, transparent 260deg 360deg),';
    }
    return 'radial-gradient(circle at 50% 118%, ' + hexA(p2[0], .55) + ' 0 34%, transparent 34.5%),' +
      'radial-gradient(circle at 50% -18%, ' + hexA('#ffffff', .16) + ' 0 26%, transparent 26.5%),';
  }

  /* Blurred-colour wash used behind album / now-playing headers. */
  function backdrop(seed, label) {
    var h = hash(seed);
    var p = PALETTES[h % PALETTES.length];
    var p2 = PALETTES[(h >>> 5) % PALETTES.length];
    var ang = h % 360;
    return 'background-image:' +
      'radial-gradient(52% 68% at 26% 22%, ' + hexA(p[0], .78) + ', transparent 70%),' +
      'radial-gradient(60% 74% at 78% 74%, ' + hexA(p2[0], .68) + ', transparent 72%),' +
      'linear-gradient(' + ang + 'deg, #0a0a12 0%, #05050a 60%, #050508 100%);';
  }

  function ramp(seed) {
    var h = hash(seed);
    return {
      c1: PALETTES[h % PALETTES.length][0],
      c2: PALETTES[(h >>> 4) % PALETTES.length][0],
      c3: PALETTES[(h >>> 8) % PALETTES.length][0],
      c4: PALETTES[(h >>> 12) % PALETTES.length][0]
    };
  }

  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  root.OCT_ART = { tile: tile, backdrop: backdrop, ramp: ramp, hash: hash, initials: initials };
})(window);