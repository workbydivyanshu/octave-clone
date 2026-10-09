/* Episode — art, date/season/episode, title, show link, play-duration chip,
   share/⋯, full description, Episode Webpage link, Chapters table,
   Automatically created chapters note, Information table. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc;

  var ctx = OCT.init({ active: 'podcasts' });
  var view = ctx.view;

  var info = [
    ['Show', 'Beyond All Repair: The Clancy Trial'],
    ['Creator', 'WBUR'],
    ['Frequency', 'Series'],
    ['Published', 'September 4, 2026 at 4:34 PM'],
    ['Length', '32 min'],
    ['Rating', 'Clean']
  ];

  view.innerHTML =
    '<div style="display:flex;gap:32px;align-items:flex-start;flex-wrap:wrap;margin-top:8px">' +
    '<div style="width:224px;height:224px;border-radius:12px;overflow:hidden;flex:none">' +
    A.tile('ps-clancy', 'CLANCY') + '</div>' +
    '<div style="flex:1;min-width:280px">' +
    '<div class="faint t-sm">September 4 · S3, E1</div>' +
    '<h1 style="font-size:34px;line-height:38px;margin:8px 0 12px">The Clancy Trial | Ep. 1: The Case</h1>' +
    '<div style="display:flex;align-items:center;gap:10px">' +
    '<span class="list-art sm" style="width:28px;height:28px;border-radius:6px">' +
    A.tile('ps-clancy', 'C', { small: true }) + '</span>' +
    '<a href="podcast-show.html" style="color:var(--accent);font-size:15px">' +
    'Beyond All Repair: The Clancy Trial ›</a></div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-top:20px">' +
    '<button class="btn btn-lg btn-accent" id="epPlay">' + I('play') + '32m</button>' +
    '<div style="flex:1"></div>' +
    '<button class="icon-btn" id="epShare" aria-label="Share">' + I('share') + '</button>' +
    '<button class="icon-btn" id="epMore" aria-label="More">' + I('more') + '</button>' +
    '</div></div></div>' +

    '<div style="margin-top:36px;max-width:900px">' +
    D.clancyDescription.map(function (p) {
      return '<p style="line-height:25px;margin-bottom:14px">' + esc(p) + '</p>';
    }).join('') +
    '<a href="#" id="webpage" style="color:var(--accent);display:inline-block;margin-top:8px">' +
    'Episode Webpage <span style="display:inline-block;vertical-align:-1px">' +
    I('external').replace('<svg', '<svg width="14" height="14"') + '</span></a>' +
    '</div>' +

    '<section class="shelf" style="max-width:900px"><div class="shelf-head">' +
    '<div class="shelf-title">' + I('listPlus') + '<h2>Chapters</h2></div></div>' +
    '<div class="panel"><table class="tbl"><tbody>' +
    D.clancyChapters.map(function (c) {
      return '<tr><td style="width:110px;color:var(--color-faint)">' + esc(c[0]) + '</td>' +
        '<td>' + esc(c[1]) + '</td>' +
        '<td style="text-align:right;width:80px;color:var(--color-faint)">' + esc(c[2]) + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div class="faint t-sm" style="margin-top:10px">Automatically created chapters</div></section>' +

    '<section class="shelf" style="max-width:900px"><div class="shelf-head">' +
    '<div class="shelf-title"><h2>Information</h2></div></div>' +
    '<div class="panel">' + info.map(function (r) {
      return '<div class="list-row"><div class="grow"><div class="faint t-sm">' + esc(r[0]) +
        '</div><div class="list-title">' + esc(r[1]) + '</div></div>' +
        (r[0] === 'Apple Podcasts' ? '' : '') + '</div>';
    }).join('') +
    '<div class="list-row"><div class="grow"><div class="faint t-sm">Apple Podcasts</div>' +
    '<div class="list-title" style="color:var(--accent)">View</div></div></div>' +
    '</div></section>';

  $('#epPlay').addEventListener('click', function () {
    var seeds = OCT.data.tracks.filter(function (t) { return !t.albumId; }).slice(0, 8);
    OCT.playCollection(seeds, 0);
    OCT.toast('Playing episode — demo tone, no podcast audio');
  });
  $('#epShare').addEventListener('click', function () { OCT.toast('Share link copied (demo)'); });
  $('#epMore').addEventListener('click', function (e) {
    e.stopPropagation();
    OCT.menu([
      { label: 'Play episode', icon: 'play', on: function () { $('#epPlay').click(); } },
      { label: 'Add to queue', icon: 'queue', on: function () { OCT.toast('Added to queue'); } },
      { label: 'Add to playlist', icon: 'listPlus', on: function () { OCT.toast('Account-gated'); } }
    ], 0, 0, this);
  });
  $('#webpage').addEventListener('click', function (e) {
    e.preventDefault(); OCT.toast('Episode webpage opens externally — demo stub');
  });
})();