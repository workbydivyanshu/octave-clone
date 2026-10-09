/* Account gates — the members-only overlay and the onboarding warm-up
   dialog, reproduced verbatim as faithful NON-FUNCTIONAL UI. No Discord
   OAuth, no Turnstile, no account creation, no challenge is attempted. */
(function () {
  'use strict';
  var OCT = window.OCT;
  var I = window.OCT_ICON, $ = OCT.$, esc = OCT.esc;
  var which = document.body.dataset.view;

  /* The gate pages are intentionally bare — no app shell, matching the
     recon captures where the overlay covers the whole viewport. */
  document.body.style.overflow = 'hidden';

  function turnstile(w) {
    return '<div class="turnstile" style="' + (w ? 'width:' + w : '') + '">' +
      '<span class="turnstile-box"></span>' +
      '<span class="turnstile-txt">Verify you are human</span>' +
      '<span class="turnstile-logo"><b>CLOUDFLARE</b><u>Privacy</u> · <u>Help</u></span></div>';
  }

  function demoStrip(label) {
    return '<div style="position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10000;' +
      'display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;' +
      'background:rgba(255,255,255,.08);border:1px solid var(--glass-border);font-size:12px;' +
      'color:#ffffffb3;backdrop-filter:blur(12px)">' + I('info') +
      '<span>' + esc(label) + '</span>' +
      '<a href="index.html" style="color:#fff;text-decoration:underline">Back to the demo</a></div>';
  }

  if (which === 'members') {
    document.body.innerHTML =
      '<div class="gate-membersonly" role="dialog" aria-label="Link Discord to unlock Octave">' +
      '<div class="gate-card">' +
      '<div class="gate-left">' +
      '<a class="brand" href="index.html" style="gap:11px;font-size:19px">' +
      '<img class="brand-mark" src="assets/brand/white_logo.png" alt="" width="26" height="26">' +
      '<span>Octave</span></a>' +
      '<h1 class="gate-h">Octave is<br>members-only<br>now</h1>' +
      '<p class="gate-p">Octave is free, lossless, and carries no ads. To keep it that way — and to ' +
      'stop it being scraped and abused — access is now for our community. It’s free to join, ' +
      'and it’s how Octave stays alive.</p>' +
      '<ol class="gate-steps">' +
      '<li><b>1</b>Join the Octave Discord.</li>' +
      '<li><b>2</b>Come back and pass the quick human check.</li>' +
      '<li><b>3</b>Link your Discord — access is granted instantly.</li>' +
      '</ol>' +
      '<p class="gate-built">Built &amp; funded by <u>CloakGPT</u>. Your saved library stays exactly where it is.</p>' +
      '</div>' +
      '<div class="gate-right">' +
      '<div class="gate-rh">Unlock Octave</div>' +
      '<div class="gate-rs">Two quick steps and you’re back in.</div>' +
      '<button class="gate-discord" type="button" disabled aria-disabled="true">' +
      'Join the Octave Discord ↗</button>' +
      '<div style="display:flex;justify-content:center">' + turnstile() + '</div>' +
      '<button class="gate-link" type="button" disabled aria-disabled="true" style="margin-top:20px">' +
      'Link Discord to unlock</button>' +
      '<div class="gate-haskey">' + I('key') +
      '<span>Have an Octave account key? <u style="text-underline-offset:2px">Restore your library</u></span></div>' +
      '</div></div></div>' +
      demoStrip('Gate UI reproduced from recon. No Discord OAuth or Turnstile is wired up — no challenge is attempted.');
  } else {
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;overflow:hidden">' +
      '<div style="position:absolute;inset:0;filter:blur(6px) saturate(1.1) brightness(.62)">' +
      '<div style="padding:32px 40px;opacity:.5">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">' +
      '<img src="assets/brand/white_logo.png" alt="" width="22" height="22">' +
      '<b>Octave</b></div>' +
      '<h1 style="font-size:36px">Good morning</h1>' +
      '<h2 style="margin-top:28px">Top Picks for You</h2>' +
      '<div style="display:flex;gap:16px;margin-top:16px">' +
      ['al-habibti', 'pl-liked', 'ps-lightbox', 'pl-wrapped'].map(function (id, i) {
        return '<div style="width:180px;height:180px;border-radius:10px;overflow:hidden">' +
          window.OCT_ART.tile(id, ['Solar Eclipse', 'Liked Songs', 'Podcasts', 'Wrapped'][i]) + '</div>';
      }).join('') + '</div></div></div>' +

      '<div class="gate-onboarding" role="dialog" aria-label="Welcome to Octave">' +
      '<div class="onb-card">' +
      '<button class="onb-close" type="button" aria-label="Close" disabled>' + I('x') + '</button>' +
      '<div class="onb-inner">' +
      '<div class="onb-ico">' + I('sparkle') + '</div>' +
      '<h1 class="onb-h">Welcome to Octave</h1>' +
      '<p class="onb-p">Warm up your recommendations before the first play — so day-one shuffle ' +
      'already sounds like you.</p>' +
      '<div class="onb-choices">' +
      '<button class="onb-choice" type="button" disabled aria-disabled="true">' +
      '<span class="onb-ch"><span class="onb-badge">fm</span>Use my Last.fm</span>' +
      '<span class="onb-cp">Recommendations from your whole scrobble history — across every ' +
      'service you’ve ever used.</span></button>' +
      '<button class="onb-choice" type="button" disabled aria-disabled="true">' +
      '<span class="onb-ch"><span class="onb-badge magic">' + I('magic') + '</span>Pick artists</span>' +
      '<span class="onb-cp">Tap 3+ names you love. Perfect if you don’t use Last.fm.</span></button>' +
      '</div>' +
      '<div class="onb-benefits">' +
      '<div class="onb-b">' + I('magic') + '<span>A smarter Autoplay + Smart Shuffle from day one</span></div>' +
      '<div class="onb-b">' + I('sparkle') + '<span>Home shelves that mean something, not a global chart</span></div>' +
      '</div>' +
      '<p class="onb-foot">Both routes are additive — you can come back to either from Settings later.</p>' +
      '<div style="display:flex;justify-content:flex-end;margin-top:10px">' +
      '<button class="btn" type="button" disabled aria-disabled="true">Skip</button></div>' +
      '</div></div></div>' +
      demoStrip('Gate UI reproduced from recon. Both choices are inert — no Last.fm login, no account, no challenge.');
  }
})();