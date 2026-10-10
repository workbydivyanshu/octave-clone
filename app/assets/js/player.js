// Aubade player: real media playback behind the original OCT_PLAYER contract.
// State machine, queue ops, events and API names are preserved 1:1 from the
// demo clone — views and shell keep working untouched. The synthesized-tone
// engine is gone: local tracks play from File blob URLs, YTM tracks from the
// worker-resolved googlevideo URL, both through one <audio> element routed
// into the existing master/analyser Web Audio graph.
(function (root) {
  'use strict';

  var listeners = {};
  var state = {
    track: null,
    playing: false,
    position: 0,
    duration: 0,
    volume: 0.7,
    muted: false,
    shuffle: false,
    repeat: false,
    queue: [],
    queueIndex: -1,
    liked: {},
    saved: {},
    lyricsOpen: false,
    lineEmphasis: 'animated'
  };

  var audioEl = new Audio();
  audioEl.preload = 'auto';
  var mediaSourceNode = null;
  var ctx = null;
  var master = null;
  var analyser = null;
  var levelBuf = null;
  var currentObjectUrl = null;
  var rafId = 0;

  function audio() {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      levelBuf = new Uint8Array(analyser.fftSize);
      master.connect(analyser);
      analyser.connect(ctx.destination);
      try {
        mediaSourceNode = ctx.createMediaElementSource(audioEl);
        mediaSourceNode.connect(master);
      } catch (e) { /* element already wired */ }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function level() {
    if (!ctx || !analyser || !state.playing) return 0;
    analyser.getByteTimeDomainData(levelBuf);
    var sum = 0;
    for (var i = 0; i < levelBuf.length; i++) {
      var v = (levelBuf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / levelBuf.length);
  }

  function emit(evt, payload) {
    (listeners[evt] || []).forEach(function (fn) { fn(payload); });
  }
  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return function () {
      listeners[evt] = listeners[evt].filter(function (f) { return f !== fn; });
    };
  }

  function applyVolume() {
    audioEl.volume = state.muted ? 0 : state.volume;
    audioEl.muted = state.muted;
  }

  function trackUrl(track) {
    if (track.source === 'ytm' && root.AUB_YTM && root.AUB_YTM.available()) {
      return root.AUB_YTM.playerUrl(track.id);
    }
    if (track.source === 'local') {
      if (track.file instanceof Blob || track.file instanceof File) {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = URL.createObjectURL(track.file);
        return Promise.resolve(currentObjectUrl);
      }
      if (root.AUB_LIBRARY && root.AUB_LIBRARY.resolveFile) {
        return root.AUB_LIBRARY.resolveFile(track).then(function (file) {
          if (!file) throw new Error('file-unavailable');
          if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
          currentObjectUrl = URL.createObjectURL(file);
          return currentObjectUrl;
        });
      }
    }
    return Promise.reject(new Error('no-source'));
  }

  function loadAndPlay(track) {
    return trackUrl(track).then(function (url) {
      audioEl.crossOrigin = track.source === 'ytm' ? 'anonymous' : null;
      audioEl.src = url;
      audioEl.volume = state.muted ? 0 : state.volume;
      audioEl.muted = state.muted;
      return audioEl.play();
    }).then(function () {
      audio();
    });
  }

  function setMediaSession(track) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || '',
      artist: track.artist || '',
      album: track.album || '',
      artwork: track.thumb ? [{ src: track.thumb, sizes: '256x256', type: 'image/webp' }] : [],
    });
    navigator.mediaSession.setActionHandler('play', function () { api.toggle(); });
    navigator.mediaSession.setActionHandler('pause', function () { api.toggle(); });
    navigator.mediaSession.setActionHandler('nexttrack', function () { api.next(); });
    navigator.mediaSession.setActionHandler('previoustrack', function () { api.prev(); });
  }

  function startRaf() {
    stopRaf();
    rafId = root.requestAnimationFrame(function frame() {
      if (state.playing) {
        state.position = audioEl.currentTime || 0;
        if (isFinite(audioEl.duration) && audioEl.duration > 0) state.duration = audioEl.duration;
        emit('tick');
        rafId = root.requestAnimationFrame(frame);
      }
    });
  }
  function stopRaf() {
    if (rafId) root.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  audioEl.addEventListener('timeupdate', function () {
    state.position = audioEl.currentTime || 0;
    emit('tick');
  });
  audioEl.addEventListener('durationchange', function () {
    if (isFinite(audioEl.duration) && audioEl.duration > 0) {
      state.duration = audioEl.duration;
      emit('change', state);
    }
  });
  audioEl.addEventListener('ended', function () {
    if (state.repeat === 'one') {
      audioEl.currentTime = 0;
      audioEl.play().catch(function () {});
      return;
    }
    if (state.queueIndex + 1 < state.queue.length) {
      api.playIndex(state.queueIndex + 1);
    } else if (state.repeat === 'all' && state.queue.length) {
      api.playIndex(0);
    } else {
      state.playing = false;
      state.position = state.duration;
      stopRaf();
      emit('change', state);
      emit('tick');
    }
  });
  audioEl.addEventListener('error', function () {
    state.playing = false;
    stopRaf();
    emit('error', { track: state.track, code: audioEl.error && audioEl.error.code });
    emit('change', state);
  });

  var api = {
    state: state,
    on: on,
    emit: emit,

    play: function (track, queue) {
      if (!track) return;
      if (queue) {
        state.queue = queue.slice();
        state.queueIndex = state.queue.indexOf(track);
      }
      if (state.track && state.track.id === track.id) { api.toggle(); return; }
      state.track = track;
      state.duration = track.dur || 0;
      state.position = 0;
      state.playing = true;
      loadAndPlay(track).then(function () {
        setMediaSession(track);
        startRaf();
        emit('change', state);
        emit('tick');
      }).catch(function (err) {
        state.playing = false;
        if (err && err.message === 'no-source' && root.OCT && root.OCT.toast) {
          root.OCT.toast('Demo catalog track — import your music or connect streaming in Settings.');
        }
        emit('error', { track: track, message: err && err.message });
        emit('change', state);
      });
    },

    playIndex: function (i) {
      if (i < 0 || i >= state.queue.length) return;
      api.play(state.queue[i]);
      state.queueIndex = i;
      emit('queue', state.queue);
    },

    toggle: function () {
      if (!state.track) return;
      if (state.playing) {
        audioEl.pause();
        state.playing = false;
        stopRaf();
      } else {
        audio();
        if (!audioEl.src && state.track) { api.play(state.track); return; }
        audioEl.play().then(function () { startRaf(); }).catch(function () {});
        state.playing = true;
      }
      applyVolume();
      emit('change', state);
    },

    stop: function () {
      audioEl.pause();
      if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
      state.playing = false;
      state.position = 0;
      stopRaf();
      emit('change', state);
      emit('tick');
    },

    next: function () {
      if (state.repeat === 'one' && state.track) {
        audioEl.currentTime = 0;
        audioEl.play().catch(function () {});
        return;
      }
      if (state.queue.length) {
        var i = state.queueIndex + 1;
        if (i >= state.queue.length) i = state.repeat === 'all' ? 0 : state.queue.length - 1;
        api.playIndex(i);
      } else { api.stop(); }
    },

    prev: function () {
      if (state.position > 3) { api.seek(0); return; }
      if (state.queue.length) {
        var i = state.queueIndex - 1;
        if (i < 0) i = state.repeat === 'all' ? state.queue.length - 1 : 0;
        api.playIndex(i);
      } else { api.seek(0); }
    },

    seek: function (sec) {
      var d = state.duration || (state.track && state.track.dur) || 0;
      var target = Math.max(0, Math.min(d, sec));
      audioEl.currentTime = target;
      state.position = target;
      emit('tick');
    },

    skip: function (delta) { api.seek((audioEl.currentTime || 0) + delta); },

    setVolume: function (v) {
      state.volume = Math.max(0, Math.min(1, v));
      state.muted = state.volume === 0 ? state.muted : false;
      applyVolume();
      emit('change', state);
    },
    nudgeVolume: function (d) { api.setVolume(state.muted ? 0 : state.volume + d); },
    toggleMute: function () {
      state.muted = !state.muted;
      applyVolume();
      emit('change', state);
    },

    level: level,
    audioState: function () {
      return {
        state: ctx ? ctx.state : 'uninitialized',
        sampleRate: ctx ? ctx.sampleRate : 0,
        readyState: audioEl.readyState,
        currentSrc: !!(audioEl && audioEl.src),
        masterGain: master ? master.gain.value : 0,
        currentTime: audioEl.currentTime
      };
    },

    enqueue: function (track, next) {
      if (next) {
        state.queue.splice(state.queueIndex + 1, 0, track);
        if (state.queueIndex === -1) state.queueIndex = 0;
      } else {
        state.queue.push(track);
      }
      emit('queue', state.queue);
    },
    removeAt: function (i) {
      if (i < 0 || i >= state.queue.length) return;
      state.queue.splice(i, 1);
      if (state.queueIndex > i) state.queueIndex--;
      else if (state.queueIndex === i) state.queueIndex = Math.min(state.queueIndex, state.queue.length - 1);
      emit('queue', state.queue);
      emit('change', state);
    },
    move: function (from, to) {
      if (from === to) return;
      var item = state.queue.splice(from, 1)[0];
      state.queue.splice(to, 0, item);
      state.queueIndex = to;
      emit('queue', state.queue);
      emit('change', state);
    },
    clearQueue: function () {
      state.queue = [];
      state.queueIndex = -1;
      emit('queue', state.queue);
      emit('change', state);
    },
    setQueue: function (list, idx) {
      state.queue = list.slice();
      state.queueIndex = idx == null ? list.indexOf(state.track) : idx;
      emit('queue', state.queue);
    },

    toggleLike: function (id) {
      state.liked[id] = !state.liked[id];
      emit('like', state.liked);
    },
    toggleSave: function (id) {
      state.saved[id] = !state.saved[id];
      emit('save', state.saved);
    },
  };

  root.OCT_PLAYER = api;
})(window);
