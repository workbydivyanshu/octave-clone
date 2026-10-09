/* Small shared views: stats, wrapped, party, profile/collab/mix/playlist
   empty states, and the two account gates rendered as faithful non-functional UI. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc;

  var which = document.body.dataset.view;
  var ctx = OCT.init({ active: which === 'podcasts' ? 'podcasts' : '' });
  var view = ctx.view;

  if (which === 'stats') {
    view.innerHTML = OCT.emptyState('trend', 'Your stats are warming up',
      'Play some music and your top artists, songs and minutes will appear here.',
      'index.html', 'Start listening');
  } else if (which === 'wrapped') {
    view.innerHTML = OCT.emptyState('sparkle', 'Your Wrapped isn’t ready yet',
      'Play more music and come back — your personal Wrapped unlocks once you’ve built up some listening.',
      'stats.html', 'Back to stats');
  } else if (which === 'party') {
    view.innerHTML = '<div class="empty gated-ico" style="padding-top:120px">' +
      '<div class="empty-ico">' + I('party') + '</div>' +
      '<h3>Sign in to join</h3>' +
      '<p>Listening parties need a signed-in Octave account so we know who’s in the room. ' +
      'It’s just a saveable key — no email or password.</p>' +
      '<a class="btn btn-accent" style="margin-top:10px" href="settings.html">Go to Settings</a></div>';
  } else if (which === 'profile') {
    view.innerHTML = OCT.emptyState('user', 'Profile not found',
      'This profile is private or the username @cloakgpt doesn’t exist.',
      'index.html', 'Explore Octave');
  } else if (which === 'collab') {
    view.innerHTML = OCT.emptyState('listPlus', 'Can’t open this playlist',
      'Sign in to use collab playlists.', 'library.html', 'Back to library');
  } else if (which === 'mix') {
    view.innerHTML = OCT.emptyState('link', 'Share link not found',
      'This mix isn’t in our catalog — the link may have been mistyped, or the mix was cleared. ' +
      'Ask whoever sent it to share it again.', 'index.html', 'Back to home');
  } else if (which === 'playlist') {
    view.innerHTML = OCT.emptyState('queue', 'Playlist not found', '',
      'library.html', 'Back to library');
  }
})();