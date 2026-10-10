// Aubade lrc: .lrc lyric parser. Input: raw .lrc text. Output: [[seconds, line]]
// in playback order, matching the clone's lyrics timeline shape.
(function (root) {
  'use strict';

  var TIME = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  root.AUB_LRC = {
    parse: function (text) {
      var lines = String(text || '').split(/\r?\n/);
      var out = [];
      lines.forEach(function (line) {
        var times = [];
        var m;
        TIME.lastIndex = 0;
        while ((m = TIME.exec(line))) {
          var sec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + (m[3] ? parseFloat('0.' + m[3]) : 0);
          times.push(sec);
        }
        var lyric = line.replace(TIME, '').trim();
        if (!times.length || !lyric) return;
        times.forEach(function (sec) { out.push([sec, lyric]); });
      });
      out.sort(function (a, b) { return a[0] - b[0]; });
      return out;
    },
  };
})(window);
