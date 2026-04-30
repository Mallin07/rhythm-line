// ==========================
// AUDIO GLOBAL
// ==========================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// ----------------------
// 🎵 METRÓNOMO
// ----------------------
const FIRST_BEAT_TIME = 0;
let nextBeatTime = null;

function startMetronome() {
  initAudio();
  nextBeatTime = FIRST_BEAT_TIME;
}

function stopMetronome() {
  nextBeatTime = null;
}

function handleMetronome(elapsed) {
  if (!audioCtx || nextBeatTime === null) return;

  while (elapsed + METRONOME_LEAD_MS >= nextBeatTime) {
    playClick();
    nextBeatTime += BEAT_MS;
  }
}

// ----------------------
// 🔊 SONIDOS DE HIT / MISS
// ----------------------
function playHitSound(isPerfect) {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = isPerfect ? 880 : 660;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

function playMissSound() {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.value = 220;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

function playClick() {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square';
  osc.frequency.value = 1000;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.60, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}
