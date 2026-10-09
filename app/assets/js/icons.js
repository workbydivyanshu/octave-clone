/* Octave demo clone — inline SVG icons (lucide-style geometry, authored locally). */
(function (root) {
  'use strict';

  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h3.5v-6h5v6H18a1 1 0 0 0 1-1V9.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    radio: '<circle cx="12" cy="12" r="2.5"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4"/><path d="M16.2 16.2a6 6 0 0 0 0-8.4"/><path d="M4.9 4.9a10 10 0 0 0 0 14.2"/><path d="M19.1 19.1a10 10 0 0 0 0-14.2"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    library: '<path d="M4 4v16"/><path d="M9 4v16"/><path d="m15 5 4 15"/>',
    music: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    heart: '<path d="M12 20.3 4.2 12.6a5 5 0 0 1 7.1-7l.7.7.7-.7a5 5 0 0 1 7.1 7z"/>',
    heartFill: '<path d="M12 20.3 4.2 12.6a5 5 0 0 1 7.1-7l.7.7.7-.7a5 5 0 0 1 7.1 7z" fill="currentColor"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    panelLeft: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9.5 4v16"/>',
    chevL: '<path d="m14.5 5-7 7 7 7"/>',
    chevR: '<path d="m9.5 5 7 7-7 7"/>',
    chevD: '<path d="m6 9.5 6 6 6-6"/>',
    chevU: '<path d="m6 14.5 6-6 6 6"/>',
    play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke-linejoin="round"/>',
    pause: '<rect x="6.5" y="4.5" width="4" height="15" rx="1.2" fill="currentColor"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.2" fill="currentColor"/>',
    next: '<path d="M6 5.5v13l9-6.5z" fill="currentColor"/><path d="M18 5.5v13"/>',
    prev: '<path d="M18 5.5v13l-9-6.5z" fill="currentColor"/><path d="M6 5.5v13"/>',
    shuffle: '<path d="M17 4.5 20.5 8 17 11.5"/><path d="M17 12.5 20.5 16 17 19.5"/><path d="M3.5 8h4l9 8h4"/><path d="M3.5 16h4l3-2.7"/><path d="M14 6.7l-2.5-2.2"/><path d="M14 8h3"/>',
    repeat: '<path d="M17 2.5 20 5.5l-3 3"/><path d="M3.5 12v-3a3 3 0 0 1 3-3H20"/><path d="M7 21.5 4 18.5l3-3"/><path d="M20.5 12v3a3 3 0 0 1-3 3H4"/>',
    volume: '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18.5 7a7 7 0 0 1 0 10"/>',
    volumeX: '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="m16 10 5 4"/><path d="m21 10-5 4"/>',
    queue: '<path d="M4 7h11"/><path d="M4 12h11"/><path d="M4 17h7"/><circle cx="17.5" cy="16.5" r="2.8"/><path d="M20.3 16.5V9l3-1"/>',
    listPlus: '<path d="M4 7h11"/><path d="M4 12h11"/><path d="M4 17h7"/><path d="M18 12v8"/><path d="M14 16h8"/>',
    lyrics: '<path d="M4.5 5.5h15"/><path d="M4.5 10h15"/><path d="M4.5 14.5h9"/><path d="M4.5 19h9"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.3"/><path d="m8.2 13.2 7.6 4.3"/>',
    download: '<path d="M12 3.5v11"/><path d="m7.5 10 4.5 4.5 4.5-4.5"/><path d="M4 18.5v1a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-1"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.6v.1"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    filter: '<path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/>',
    sliders: '<path d="M5 20v-6"/><path d="M5 10V4"/><path d="M12 20v-9"/><path d="M12 7V4"/><path d="M19 20v-4"/><path d="M19 12V4"/><path d="M2.5 14h5"/><path d="M9.5 7h5"/><path d="M16.5 16h5"/>',
    columns: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="M15 4v16"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    speaker: '<path d="M4 9.5h3L11 6v12L7 14.5H4z"/><path d="M14.5 9.5a3.5 3.5 0 0 1 0 5"/>',
    wifi: '<path d="M2.5 8.5a15 15 0 0 1 19 0"/><path d="M6 12.2a10 10 0 0 1 12 0"/><path d="M9.3 16a5 5 0 0 1 5.4 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>',
    key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9"/><path d="M18 12v3.5"/><path d="M15 12v2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
    fire: '<path d="M12 2.5s5.5 4.2 5.5 9.2A5.5 5.5 0 0 1 12 21a5.5 5.5 0 0 1-5.5-9.3c0-2 1-3.6 1-3.6s.6 1.4 1.7 1.9c0-3.3 2.8-5.5 2.8-5.5z"/>',
    trend: '<path d="M3 16.5 9 10l4 4 8-8.5"/><path d="M15.5 5.5H21V11"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 19a6.5 6.5 0 0 1 13 0"/><path d="M16 5.3a3.2 3.2 0 0 1 0 5.4"/><path d="M17.5 13.2A6.5 6.5 0 0 1 21.5 19"/>',
    star: '<path d="m12 3.5 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9z"/>',
    sparkle: '<path d="M12 3.5 13.4 8 18 9.5 13.4 11 12 15.5 10.6 11 6 9.5 10.6 8z"/><path d="M18.5 15.5 19.2 17.6 21.3 18.3 19.2 19 18.5 21.1 17.8 19 15.7 18.3 17.8 17.6z"/>',
    magic: '<path d="M4 20 15 9"/><path d="m17.5 3.5 1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/><path d="m13 3 .7 2.1L16 6l-2.3.9L13 9l-.7-2.1L10 6l2.3-.9z"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    arrowUp: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    arrowDown: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    link: '<path d="M10 13a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4L11.2 5.4"/><path d="M14 11a4.5 4.5 0 0 0-6.4 0L5 13.6a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4"/>',
    external: '<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10"/>',
    bookmark: '<path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1z"/>',
    video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 11 6-3.5v9L15.5 13z"/>',
    caption: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M9.5 11.5a2.5 2.5 0 1 0 0 3"/><path d="M16.5 11.5a2.5 2.5 0 1 0 0 3"/>',
    hash: '<path d="M5 9h14"/><path d="M5 15h14"/><path d="M10 4 8 20"/><path d="M16 4l-2 16"/>',
    external2: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
    party: '<path d="m3 21 6-2 10-10a2.8 2.8 0 0 0-4-4L5 15z"/><path d="m14 6 4 4"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5.2-5.2 2 2-5.2z"/>',
    dots: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
    grip: '<circle cx="9" cy="6" r="1.3" fill="currentColor"/><circle cx="15" cy="6" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="18" r="1.3" fill="currentColor"/><circle cx="15" cy="18" r="1.3" fill="currentColor"/>',
    library2: '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 10.2a4.2 4.2 0 0 1-.6 8.3z"/>',
    camera: '<path d="M3 8.5h3.5L8 6h8l1.5 2.5H21a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    hand: '<path d="M8 12.5V5.8a1.6 1.6 0 0 1 3.2 0v5.4"/><path d="M11.2 11V4.8a1.6 1.6 0 0 1 3.2 0V11"/><path d="M14.4 11.4V6.6a1.6 1.6 0 0 1 3.2 0v7.9a6 6 0 0 1-6 6h-.6a5 5 0 0 1-3.7-1.7L4 14.6a1.7 1.7 0 0 1 2.4-2.4L8 13.8"/>'
  };

  function svg(name, cls) {
    var d = P[name] || P.music;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (cls ? ' class="' + cls + '"' : '') + '>' + d + '</svg>';
  }
  svg.has = function (n) { return !!P[n]; };
  svg.names = Object.keys(P);

  root.OCT_ICON = svg;
})(window);