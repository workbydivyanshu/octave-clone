/* Octave demo clone — player state + WebAudio demo tone engine.
   No audio files are shipped or fetched: each track renders a short
   synthesized tone whose pitch envelope is derived from the track id, so
   every track is audibly distinct and obviously a demo. A virtual clock
   drives progress/seek/lyrics independently of the audio graph. */
(function (root) {
  'use strict';

  var D = root.OCTAVE_DATA;

  var listeners = {};
  var state = {
    track: null,
    playing: false,
    position: 0,        // seconds into the track
    duration: 0,
    volume: 0.7,
    muted: false,
    shuffle: false,
    repeat: false,       // false | 'all' | 'one'
    queue: [],
    queueIndex: -1,
    liked: {},
    saved: {},
    lyricsOpen: false,
    lineEmphasis: 'animated'
  };

  /* ---- Audio graph ---------------------------------------------------- */
  var ctx = null;
  var master = null;
  var analyser = null;
  var levelBuf = null;
  var osc = null;
  var osc2 = null;
  var env = null;
  var lfo = null;
  var lfoGain = null;
  var timer = null;

  function audio() {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      levelBuf = new Uint8Array(analyser.fftSize);
      master.connect(analyser);
      analyser.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* RMS of the live output, 0..1 — drives the playing equaliser bars and
     makes the demo tone measurable. Returns 0 when nothing is playing. */
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

  /* Deterministic per-track musical identity from the id. */
  function profile(track) {
    var h = OCT_ART.hash(track.id + '|' + track.title);
    var scales = [
      [0, 2, 3, 5, 7, 8, 10],       // major
      [0, 2, 3, 5, 7, 8, 11],      // dorian
      [0, 1, 3, 5, 7, 8, 10],      // phrygian
      [0, 2, 4, 5, 7, 9, 11]       // lydian
    ];
    var roots = [196.00, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13];
    var scale = scales[h % scales.length];
    var root0 = roots[(h >>> 4) % roots.length];
    return {
      root0: root0,
      scale: scale,
      steps: [(h >>> 6) % scale.length, (h >>> 9) % scale.length, (h >>> 12) % scale.length,
              (h >>> 15) % scale.length, (h >>> 18) % scale.length, (h >>> 21) % scale.length],
      waveform: ['triangle', 'sawtooth', 'sine', 'square'][(h >>> 7) % 4],
      detune: ((h >>> 11) % 12) - 6,
      attack: 0.08 + ((h >>> 13) % 30) / 100,
      decay: 0.35 + ((h >>> 17) % 50) / 100,
      sustain: 0.18 + ((h >>> 19) % 40) / 100,
      release: 0.5 + ((h >>> 23) % 70) / 100,
      shimmer: 0.06 + ((h >>> 5) % 20) / 100
    };
  }

  function noteFreq(p, step) {
    var semi = step + p.scale[step % p.scale.length] + 12 * Math.floor(step / p.scale.length);
    return p.root0 * Math.pow(2, semi / 12);
  }

  /* Schedule the whole track's envelope up-front on the WebAudio clock. */
  function buildGraph(track) {
    var a = audio();
    if (!a) return;
    stopGraph();
    var p = profile(track);
    var now = a.currentTime;
    var beat = 0.42;
    var notes = [];
    var n = Math.max(8, Math.min(96, Math.round(track.dur / beat)));
    for (var i = 0; i < n; i++) {
      var at = now + i * beat;
      // Pitch envelope: slow rise over the first third, decay in the middle,
      // a lift near the end — varies per track so no two sound alike.
      var prog = i / n;
      var shape = 1 + 0.55 * Math.sin(Math.PI * Math.min(1, prog * 1.35)) +
                  0.22 * Math.sin(prog * Math.PI * 3.2);
      var step = p.steps[i % p.steps.length] + (prog > 0.72 ? 2 : 0);
      notes.push({
        at: at,
        f: noteFreq(p, step) * (0.86 + shape * 0.2),
        dur: beat * (0.55 + 0.35 * ((i % 3) / 2))
      });
    }

    // Lead voice with per-note ADSR.
    osc = a.createOscillator();
    osc.type = p.waveform;
    osc2 = a.createOscillator();
    osc2.type = 'sine';
    env = a.createGain();
    env.gain.value = 0;
    osc.connect(env);
    osc2.connect(env);
    env.connect(master);

    notes.forEach(function (nt, idx) {
      var isBass = idx % 4 === 0;
      osc.frequency.setValueAtTime(nt.f, nt.at);
      osc2.frequency.setValueAtTime(nt.f * (isBass ? 0.5 : 2.002), nt.at);
      var peak = (isBass ? 0.5 : 0.26) * (0.65 + 0.35 * ((idx % 5) / 4));
      env.gain.setValueAtTime(0, nt.at);
      env.gain.linearRampToValueAtTime(peak, nt.at + p.attack);
      env.gain.exponentialRampToValueAtTime(Math.max(0.0008, peak * p.sustain),
        nt.at + p.attack + p.decay);
      env.gain.exponentialRampToValueAtTime(0.0008, nt.at + nt.dur + p.release);
    });

    // Slow shimmer LFO on a low-pass so the tone breathes.
    lfo = a.createOscillator();
    lfo.frequency.value = 0.11 + (OCT_ART.hash(track.id) % 7) / 40;
    lfoGain = a.createGain();
    lfoGain.gain.value = 320 + (OCT_ART.hash(track.id + 'z') % 600);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(now);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + track.dur + 1);
    osc2.stop(now + track.dur + 1);
    lfo.stop(now + track.dur + 1);

    applyVolume();
  }

  function stopGraph() {
    if (!ctx) return;
    try {
      if (osc) { osc.stop(); osc.disconnect(); osc = null; }
      if (osc2) { osc2.stop(); osc2.disconnect(); osc2 = null; }
      if (lfo) { lfo.stop(); lfo.disconnect(); lfo = null; }
      if (lfoGain) { lfoGain.disconnect(); lfoGain = null; }
      if (env) { env.disconnect(); env = null; }
    } catch (e) { /* already stopped */ }
  }

  function applyVolume() {
    if (!master || !ctx) return;
    var v = state.muted ? 0 : state.volume;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(v * 0.5, ctx.currentTime);
  }

  /* ---- Virtual clock -------------------------------------------------- */
  var last = 0;
  function tick() {
    if (state.playing && state.track) {
      var now = performance.now();
      if (!last) last = now;
      var dt = (now - last) / 1000;
      last = now;
      state.position += dt;
      if (state.position >= state.duration) {
        if (state.repeat === 'one') {
          state.position = 0;
          buildGraph(state.track);
        } else if (state.queueIndex + 1 < state.queue.length) {
          playIndex(state.queueIndex + 1);
          return;
        } else if (state.repeat === 'all' && state.queue.length) {
          playIndex(0);
          return;
        } else {
          state.position = state.duration;
          state.playing = false;
          stopGraph();
          applyVolume();
        }
      }
      emit('tick');
    } else {
      last = 0;
    }
    timer = setTimeout(tick, 120);
  }
  setTimeout(tick, 120);

  /* ---- Public API ----------------------------------------------------- */
  function emit(evt, payload) {
    (listeners[evt] || []).forEach(function (fn) { fn(payload); });
  }
  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return function () {
      listeners[evt] = listeners[evt].filter(function (f) { return f !== fn; });
    };
  }

  function play(track, queue) {
    if (!track) return;
    if (queue) { state.queue = queue.slice(); state.queueIndex = state.queue.indexOf(track); }
    if (state.track && state.track.id === track.id) return toggle();
    stopGraph();
    state.track = track;
    state.duration = track.dur;
    state.position = 0;
    state.playing = true;
    buildGraph(track);
    emit('change', state);
    emit('tick');
  }

  function playIndex(i) {
    if (i < 0 || i >= state.queue.length) return;
    var t = state.queue[i];
    stopGraph();
    state.queueIndex = i;
    state.track = t;
    state.duration = t.dur;
    state.position = 0;
    state.playing = true;
    buildGraph(t);
    emit('change', state);
    emit('tick');
  }

  function toggle() {
    if (!state.track) return;
    state.playing = !state.playing;
    if (state.playing) { audio(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
    else { stopGraph(); }
    applyVolume();
    emit('change', state);
  }

  function stop() {
    state.playing = false;
    state.position = 0;
    stopGraph();
    emit('change', state);
    emit('tick');
  }

  function next() {
    if (state.repeat === 'one' && state.track) { state.position = 0; return toggle(); }
    if (state.queue.length) {
      var i = state.queueIndex + 1;
      if (i >= state.queue.length) { i = state.repeat === 'all' ? 0 : state.queue.length - 1; }
      playIndex(i);
    } else { stop(); }
  }

  function prev() {
    if (state.position > 3) { state.position = 0; emit('tick'); return; }
    if (state.queue.length) {
      var i = state.queueIndex - 1;
      if (i < 0) i = state.repeat === 'all' ? state.queue.length - 1 : 0;
      playIndex(i);
    } else { state.position = 0; emit('tick'); }
  }

  function seek(sec) {
    state.position = Math.max(0, Math.min(state.duration, sec));
    if (state.playing && state.track) buildGraph(state.track);
    emit('tick');
  }

  function skip(delta) { seek(state.position + delta); }

  function setVolume(v) {
    state.volume = Math.max(0, Math.min(1, v));
    state.muted = state.volume === 0 ? state.muted : false;
    applyVolume();
    emit('change', state);
  }
  function nudgeVolume(d) { setVolume(state.muted ? 0 : state.volume + d); }
  function toggleMute() {
    state.muted = !state.muted;
    applyVolume();
    emit('change', state);
  }

  /* ---- Queue (in-memory) ---------------------------------------------- */
  function enqueue(track, next) {
    if (next) {
      state.queue.splice(state.queueIndex + 1, 0, track);
      if (state.queueIndex === -1) state.queueIndex = 0;
    } else {
      state.queue.push(track);
    }
    emit('queue', state.queue);
  }
  function removeAt(i) {
    if (i < 0 || i >= state.queue.length) return;
    state.queue.splice(i, 1);
    if (state.queueIndex > i) state.queueIndex--;
    else if (state.queueIndex === i) state.queueIndex = Math.min(state.queueIndex, state.queue.length - 1);
    emit('queue', state.queue);
    emit('change', state);
  }
  function move(from, to) {
    if (from === to) return;
    var item = state.queue.splice(from, 1)[0];
    state.queue.splice(to, 0, item);
    state.queueIndex = to;
    emit('queue', state.queue);
    emit('change', state);
  }
  function clearQueue() {
    state.queue = [];
    state.queueIndex = -1;
    emit('queue', state.queue);
    emit('change', state);
  }
  function setQueue(list, idx) {
    state.queue = list.slice();
    state.queueIndex = idx == null ? list.indexOf(state.track) : idx;
    emit('queue', state.queue);
  }

  function toggleLike(id) {
    state.liked[id] = !state.liked[id];
    emit('like', state.liked);
  }
  function toggleSave(id) {
    state.saved[id] = !state.saved[id];
    emit('save', state.saved);
  }

  root.OCT_PLAYER = {
    state: state,
    on: on,
    emit: emit,
    play: play,
    playIndex: playIndex,
    toggle: toggle,
    stop: stop,
    next: next,
    prev: prev,
    seek: seek,
    skip: skip,
    setVolume: setVolume,
    nudgeVolume: nudgeVolume,
    toggleMute: toggleMute,
    level: level,
    audioState: function () {
      return ctx ? {
        state: ctx.state,
        sampleRate: ctx.sampleRate,
        oscillators: [osc, osc2].filter(Boolean).length,
        masterGain: master ? master.gain.value : 0,
        currentTime: ctx.currentTime
      } : null;
    },
    enqueue: enqueue,
    removeAt: removeAt,
    move: move,
    clearQueue: clearQueue,
    setQueue: setQueue,
    toggleLike: toggleLike,
    toggleSave: toggleSave
  };
})(window);