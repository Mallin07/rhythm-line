# Proyecto ROL

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\audio.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\audio.js.Extension.TrimStart('.'))
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
// ðŸŽµ METRÃ“NOMO
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
// ðŸ”Š SONIDOS DE HIT / MISS
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


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 60;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\game.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\game.js.Extension.TrimStart('.'))
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const feedbackEl = document.getElementById('feedback');
const startBtn = document.getElementById('startBtn');

// ==========================
// BOTÃ“N VOLVER A INICIACIÃ“N
// ==========================
const backBtn = document.getElementById('backBtn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = '../Iniciacion.html';
  });
}

// ==========================
// ESTADO
// ==========================
let notes = [];
let running = false;
let startTime = null;
let score = 0;
let combo = 0;

// ==========================
// HELPERS UI
// ==========================
function setFeedback(text, type) {
  feedbackEl.textContent = text;
  feedbackEl.className = '';
  if (type) feedbackEl.classList.add(type);
}

// ==========================
// NOTAS (instancias del juego)
// ==========================
function createNotes() {
  return song.map((n, index) => {
    const tiedFromPrev = index > 0 && song[index - 1].tieToNext;
    const beamFromPrev = index > 0 && song[index - 1].beamToNext;

    const isRest = n.type.startsWith('rest_');

    return {
      hitTime: n.time,
      type: n.type,
      isRest,
      tieToNext: n.tieToNext || false,
      beamToNext: n.beamToNext || false,
      beamFromPrev,
      tiedFromPrev,
      judgementNote: !tiedFromPrev && !isRest, // silencios NO se juzgan al pasar
      hit: false,
      missed: false,
      currentX: null,
      visible: false,
      index
    };
  });
}

function resetGame() {
  score = 0;
  combo = 0;
  notes = createNotes();
  running = false;
  startTime = null;

  scoreEl.textContent = score;
  comboEl.textContent = combo;
  setFeedback('', null);

  clearCanvas();
  drawStaticLane();
  drawTimeSignature();

  stopMetronome();
}

function startRun() {
  running = true;
  startTime = performance.now();
  startMetronome();
  requestAnimationFrame(drawNotes);
}

// Estado del botÃ³n
startBtn.dataset.mode = 'start';

startBtn.addEventListener('click', () => {
  const mode = startBtn.dataset.mode;

  if (mode === 'restart') {
    resetGame();
    startBtn.textContent = 'Empezar';
    startBtn.dataset.mode = 'start';
  } else {
    resetGame();
    startRun();
    startBtn.textContent = 'Reiniciar';
    startBtn.dataset.mode = 'restart';
  }
});

// ==========================
// LOOP DE DIBUJO
// ==========================
function drawNotes(timestamp) {
  if (!running) return;

  const elapsed = timestamp - startTime;
  handleMetronome(elapsed);

  clearCanvas();
  drawStaticLane();
  drawTimeSignature();

  const distance = SPAWN_X - HIT_X;

  for (const note of notes) note.visible = false;

  // --------- NOTAS -----------
  for (const note of notes) {
    const timeToHit = note.hitTime - elapsed;

    if (timeToHit < -MISS_WINDOW && !note.hit && !note.missed && note.judgementNote) {
      note.missed = true;
      combo = 0;
      comboEl.textContent = combo;
      setFeedback('FALLO', 'miss');
      playMissSound();
    }

    if (timeToHit <= TRAVEL_TIME && timeToHit >= -VISIBLE_AFTER_MS) {
      const fraction = timeToHit / TRAVEL_TIME;
      const x = HIT_X + distance * fraction;

      note.currentX = x;
      note.visible = true;

      drawNoteFigure(x, LANE_Y, note.type, note.hit);
    }
  }

  // --------- BEAMS / BANDERINES ---------
  for (let i = 0; i < notes.length - 1; i++) {
    const n1 = notes[i];
    const n2 = notes[i + 1];

    if (!n1.beamToNext) continue;
    if (!n2.visible) continue;
    if (n1.currentX == null || n2.currentX == null) continue;

    const stem1 = getCorcheaStemTop(n1.currentX, LANE_Y);
    const stem2 = getCorcheaStemTop(n2.currentX, LANE_Y);
    const yBeam = Math.min(stem1.y, stem2.y) - 3;
    const hitBoth = n1.hit && n2.hit;

    drawCorcheaBeam(stem1.x, stem2.x, yBeam, hitBoth);
  }

  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (!n.visible) continue;
    if (n.type !== 'corchea') continue;
    if (n.beamFromPrev || n.beamToNext) continue;

    const stem = getCorcheaStemTop(n.currentX, LANE_Y);
    drawCorcheaFlag(stem.x, stem.y, n.hit);
  }

  // --------- LIGADURAS ---------
  const tieBaseY = LANE_Y + 22;
  for (let i = 0; i < notes.length - 1; i++) {
    const n1 = notes[i];
    const n2 = notes[i + 1];

    if (!n1.tieToNext) continue;
    if (!n2.visible) continue;
    if (n1.currentX == null || n2.currentX == null) continue;

    ctx.save();
    ctx.beginPath();
    ctx.rect(HIT_X, 0, canvas.width - HIT_X, canvas.height);
    ctx.clip();

    drawTie(n1.currentX, n2.currentX, tieBaseY);
    ctx.restore();
  }

  // --------- BARRAS DE COMPÃS ---------
  for (const barTime of bars) {
  const timeToBar = barTime - elapsed;

  if (timeToBar <= TRAVEL_TIME && timeToBar >= -VISIBLE_AFTER_MS) {
    const fraction = timeToBar / TRAVEL_TIME;
    let x = HIT_X + distance * fraction;

    x -= BAR_X_OFFSET_PX;

    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.moveTo(x, LANE_Y - 60);
    ctx.lineTo(x, LANE_Y + 60);
    ctx.stroke();

    ctx.restore();
  }
}


  // --------- FIN ---------
  const lastTime = song[song.length - 1].time;
  const allProcessed = notes.every(n => !n.judgementNote || n.hit || n.missed);

  if (allProcessed && elapsed > lastTime + 1500) {
    running = false;
    stopMetronome();

    const medal = getMedal(score);
    saveBestMedal(medal);

    if (medal === 'oro') setFeedback('ðŸ¥‡ Â¡Medalla de ORO! Â¡Excelente trabajo!', 'medal-oro');
    else if (medal === 'plata') setFeedback('ðŸ¥ˆ Medalla de PLATA. Â¡Muy bien!', 'medal-plata');
    else if (medal === 'bronce') setFeedback('ðŸ¥‰ Medalla de BRONCE. Â¡Sigue practicando!', 'medal-bronce');
    else setFeedback('Has terminado. Â¡Intenta conseguir una medalla!', null);

    return;
  }

  requestAnimationFrame(drawNotes);
}

// ==========================
// INPUT
// ==========================
function handleHit() {
  if (window.GAME_MODE === 'echo') return;
  if (!running || !startTime) return;

  const elapsed = performance.now() - startTime;

  let bestNote = null;
  let bestDelta = Infinity;

  // 1) Mejor NOTA jugable
  for (const note of notes) {
    if (!note.judgementNote) continue;
    if (note.hit || note.missed) continue;

    const delta = Math.abs(note.hitTime - elapsed);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestNote = note;
    }
  }

  // 2) Mejor SILENCIO cercano (evitando silencios ya pasados)
  let bestRest = null;
  let bestRestDelta = Infinity;

  for (const note of notes) {
    if (!note.isRest) continue;

    const deltaSigned = note.hitTime - elapsed;
    const delta = Math.abs(deltaSigned);

    if (deltaSigned < -GOOD_WINDOW) continue;

    if (delta < bestRestDelta) {
      bestRestDelta = delta;
      bestRest = note;
    }
  }

  const noteInWindow = bestNote && bestDelta <= GOOD_WINDOW;
  const restInWindow = bestRest && bestRestDelta <= GOOD_WINDOW;

  if (restInWindow && (!noteInWindow || bestRestDelta < bestDelta)) {
    combo = 0;
    comboEl.textContent = combo;
    setFeedback('SILENCIO (NO TOCAR)', 'miss');
    playMissSound();
    return;
  }

  if (!noteInWindow) {
    combo = 0;
    comboEl.textContent = combo;
    setFeedback('FALLO', 'miss');
    playMissSound();
    return;
  }

  bestNote.hit = true;

  if (bestDelta <= PERFECT_WINDOW) {
    score += 300;
    combo++;
    setFeedback('PERFECT', 'perfect');
    playHitSound(true);
  } else {
    score += 100;
    combo++;
    setFeedback('BIEN', 'good');
    playHitSound(false);
  }

  scoreEl.textContent = score;
  comboEl.textContent = combo;
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === 'j' || e.key === 'J') {
    e.preventDefault();
    handleHit();
  }
});

// mÃ³vil
const hitBtn = document.getElementById('hitBtn');
if (hitBtn) {
  hitBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleHit();
  });
  hitBtn.addEventListener('click', () => handleHit());
}

// primer dibujo en reposo
resetGame();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\render.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\render.js.Extension.TrimStart('.'))
// ==========================
// CANVAS + LAYOUT
// ==========================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SPAWN_X = canvas.width - 40;
const LANE_Y = canvas.height / 2;

// compÃ¡s un poco a la izquierda de la barra
const TIME_SIGNATURE_X = HIT_X - 250;

// ==========================
// DIBUJO ESTÃTICO
// ==========================
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawStaticLane() {
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, LANE_Y);
  ctx.lineTo(canvas.width - 40, LANE_Y);
  ctx.stroke();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(HIT_X, LANE_Y - 40);
  ctx.lineTo(HIT_X, LANE_Y + 40);
  ctx.stroke();
}

function drawTimeSignature() {
  ctx.save();
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('4', TIME_SIGNATURE_X, LANE_Y - 16);
  ctx.fillText('4', TIME_SIGNATURE_X, LANE_Y + 16);
  ctx.restore();
}

// ==========================
// FIGURAS MUSICALES
// ==========================
function drawNegra(x, y, hit) {                      //........................................Negra
  const color = hit ? '#22c55e' : '#38bdf8';
  const yCenter = y + NOTE_OFFSET_Y;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, yCenter, NOTE_HEAD_RX, NOTE_HEAD_RY, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  const xStem = x + NOTE_HEAD_RX - 2;
  const yBottom = yCenter;
  const yTop = yBottom - STEM_HEIGHT;

  ctx.beginPath();
  ctx.moveTo(xStem, yBottom);
  ctx.lineTo(xStem, yTop);
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function drawBlanca(x, y, hit) {                //........................................Blanca
  const color = hit ? '#22c55e' : '#38bdf8';
  const yCenter = y + NOTE_OFFSET_Y;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, yCenter, NOTE_HEAD_RX, NOTE_HEAD_RY, -0.4, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();

  const xStem = x + NOTE_HEAD_RX - 1;
  const yBottom = yCenter;
  const yTop = yBottom - STEM_HEIGHT;

  ctx.beginPath();
  ctx.moveTo(xStem, yBottom);
  ctx.lineTo(xStem, yTop);
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function drawRedonda(x, y, hit) {                                //........................................Redonda
  const color = hit ? '#22c55e' : '#38bdf8';
  const yCenter = y + NOTE_OFFSET_Y;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, yCenter, NOTE_HEAD_RX, NOTE_HEAD_RY, -0, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function drawCorcheaBase(x, y, hit) {                                //........................................corchea
  const color = hit ? '#22c55e' : '#38bdf8';
  const yCenter = y + NOTE_OFFSET_Y;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, yCenter, NOTE_HEAD_RX, NOTE_HEAD_RY, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  const xStem = x + NOTE_HEAD_RX - 2;
  const yBottom = yCenter;
  const yTop = yBottom - STEM_HEIGHT;

  ctx.beginPath();
  ctx.moveTo(xStem, yBottom);
  ctx.lineTo(xStem, yTop);
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function getCorcheaStemTop(x, y) {
  const yCenter = y + NOTE_OFFSET_Y;
  const xStem = x + NOTE_HEAD_RX - 2;
  const yTop = yCenter - STEM_HEIGHT;
  return { x: xStem, y: yTop };
}

function drawCorcheaFlag(xStem, yTop, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const flagWidth = NOTE_SIZE * 0.25;
  const flagHeight = NOTE_SIZE * 0.35;

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = NOTE_SIZE * 0.05;

  ctx.moveTo(xStem, yTop);
  ctx.quadraticCurveTo(
    xStem + flagWidth,
    yTop + flagHeight * 0.2,
    xStem + flagWidth * 0.3,
    yTop + flagHeight
  );

  ctx.stroke();
  ctx.restore();
}

function drawCorcheaBeam(x1Stem, x2Stem, yTop, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.moveTo(x1Stem, yTop);
  ctx.lineTo(x2Stem, yTop);
  ctx.stroke();
  ctx.restore();
}

// ==========================
// SILENCIOS (vectoriales)
// ==========================
function drawRestNegra(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const s = NOTE_SIZE;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.10;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.45);
  ctx.lineTo(x + s * 0.18, y - s * 0.10);
  ctx.lineTo(x - s * 0.18, y + s * 0.15);
  ctx.lineTo(x + s * 0.12, y + s * 0.45);
  ctx.stroke();

  ctx.restore();
}

function drawRestBlanca(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const w = NOTE_SIZE * 0.55;
  const h = NOTE_SIZE * 0.18;

  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y + NOTE_SIZE * 0.05, w, h);
  ctx.restore();
}

function drawRestRedonda(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const w = NOTE_SIZE * 0.55;
  const h = NOTE_SIZE * 0.18;

  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y - NOTE_SIZE * 0.23, w, h);
  ctx.restore();
}

// Router
function drawNoteFigure(x, y, type, hit) {
  if (type === 'rest_negra')   { drawRestNegra(x, y, hit); return; }
  if (type === 'rest_blanca')  { drawRestBlanca(x, y, hit); return; }
  if (type === 'rest_redonda') { drawRestRedonda(x, y, hit); return; }

  if (type === 'corchea') { drawCorcheaBase(x, y, hit); return; }
  if (type === 'negra')   { drawNegra(x, y, hit); return; }
  if (type === 'blanca')  { drawBlanca(x, y, hit); return; }
  if (type === 'redonda') { drawRedonda(x, y, hit); return; }

  // fallback
  let symbol = 'â™©';
  if (type === 'doble') symbol = 'â™«';

  ctx.font = `${NOTE_SIZE}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = hit ? '#22c55e' : '#38bdf8';
  ctx.fillText(symbol, x, y + NOTE_OFFSET_Y);
}

// Ligaduras
function drawTie(x1, x2, baseY) {
  const midX = (x1 + x2) / 2;
  const h = 10;

  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(x1, baseY);
  ctx.quadraticCurveTo(midX, baseY + h, x2, baseY);
  ctx.stroke();

  ctx.restore();
}


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\simples.css

`$(C:\Users\PC\Desktop\web\Rhythm_Line\js_simples\simples.css.Extension.TrimStart('.'))
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  background: #050816;
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  min-height: 100vh;
}

h1 {
  margin-bottom: 8px;
  font-size: 1.8rem;
  text-align: center;
}

.subtitle {
  margin-bottom: 20px;
  color: #aaa;
  font-size: 0.95rem;
  text-align: center;
}

#game-container {
  background: #0b1020;
  border-radius: 16px;
  padding: 20px 24px 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

canvas {
  display: block;
  background: #050816;
  border-radius: 12px;
  border: 2px solid #20264a;
}

#hud {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 0.95rem;
}

#hud strong {
  color: #ffdd57;
}

#feedback {
  margin-top: 10px;
  height: 24px;
  text-align: center;
  font-weight: bold;
}

#feedback.perfect { color: #4ade80; }
#feedback.good { color: #38bdf8; }
#feedback.miss { color: #fb7185; }

#controls {
  margin-top: 14px;
  text-align: center;
  font-size: 0.9rem;
}

button {
  margin-top: 10px;
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

#feedback.medal-oro {
  color: #facc15; /* dorado */
}

#feedback.medal-plata {
  color: #e5e7eb; /* gris clarito */
}

#feedback.medal-bronce {
  color: #f97316; /* naranja/bronce */
}

`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\10silencioblanca\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\10silencioblanca\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 65;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 8;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\10silencioblanca\silencioblanca.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\10silencioblanca\silencioblanca.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Silencio de Blanca</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\10silencioblanca\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\10silencioblanca\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'blanca' },
  { type: 'rest_blanca' },

  // CompÃ¡s 2
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'rest_blanca' },
  { type: 'negra' },
  // CompÃ¡s 3
  { type: 'rest_blanca' },
  { type: 'negra' },
  { type: 'negra' },
  // CompÃ¡s 4
  { type: 'rest_blanca' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  // CompÃ¡s 5
  { type: 'rest_blanca' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'negra' }
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_silencioblanca_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\11silencionegra\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\11silencionegra\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 70;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 8;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\11silencionegra\silencionegra.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\11silencionegra\silencionegra.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Silecnio de Negra</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\11silencionegra\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\11silencionegra\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'negra' },
  { type: 'rest_negra' },
  { type: 'blanca' },

  // CompÃ¡s 2
  { type: 'rest_negra' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'negra' },
  { type: 'rest_negra' },

  // CompÃ¡s 3
  { type: 'rest_negra' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'rest_negra' },
  { type: 'negra' },

  // CompÃ¡s 4
  { type: 'blanca' },
  { type: 'rest_negra' },
  { type: 'rest_negra' },

  // CompÃ¡s 5
  { type: 'negra' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'rest_negra' },
  { type: 'rest_negra' },
  { type: 'corchea', beamToNext: true }
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_silencionegra_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\12examenprincipiante1\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\12examenprincipiante1\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 75;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 8;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\12examenprincipiante1\examenprincipiante1.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\12examenprincipiante1\examenprincipiante1.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Examen nivel principiante</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\12examenprincipiante1\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\12examenprincipiante1\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'negra' },
  { type: 'rest_negra' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'negra' },

  // CompÃ¡s 2
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'rest_blanca' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },

  // CompÃ¡s 3
  { type: 'redonda' },

  // CompÃ¡s 4
  { type: 'rest_negra' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'negra' },

  // CompÃ¡s 5
  { type: 'negra' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'blanca' },

  // CompÃ¡s 6
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'rest_blanca' },
  { type: 'negra' },

  // CompÃ¡s 3
  { type: 'rest_redonda' },

  // CompÃ¡s 7
  { type: 'negra' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'blanca' },  

];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_examenprincipiante1_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\1redondas\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\1redondas\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 75;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\1redondas\Redondas.css

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\1redondas\Redondas.css.Extension.TrimStart('.'))
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  background: #050816;
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  min-height: 100vh;
}

h1 {
  margin-bottom: 8px;
  font-size: 1.8rem;
  text-align: center;
}

.subtitle {
  margin-bottom: 20px;
  color: #aaa;
  font-size: 0.95rem;
  text-align: center;
}

#game-container {
  background: #0b1020;
  border-radius: 16px;
  padding: 20px 24px 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

canvas {
  display: block;
  background: #050816;
  border-radius: 12px;
  border: 2px solid #20264a;
}

#hud {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 0.95rem;
}

#hud strong {
  color: #ffdd57;
}

#feedback {
  margin-top: 10px;
  height: 24px;
  text-align: center;
  font-weight: bold;
}

#feedback.perfect { color: #4ade80; }
#feedback.good { color: #38bdf8; }
#feedback.miss { color: #fb7185; }

#controls {
  margin-top: 14px;
  text-align: center;
  font-size: 0.9rem;
}

button {
  margin-top: 10px;
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

#feedback.medal-oro {
  color: #facc15; /* dorado */
}

#feedback.medal-plata {
  color: #e5e7eb; /* gris clarito */
}

#feedback.medal-bronce {
  color: #f97316; /* naranja/bronce */
}

`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\1redondas\Redondas.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\1redondas\Redondas.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Mini Guitar Hero â€“ Figuras musicales</title>
  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
   <button id="backBtn" class="btn-back">â† Volver</button>
  <h1>Redondas</h1>
  <p class="subtitle">
    Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
  </p>

  <div id="game-container">
    <canvas id="game" width="800" height="220"></canvas>

    <div id="hud">
      <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
      <span>Combo: <strong id="combo">0</strong></span>
      <span>Estado: <strong id="state">Parado</strong></span>
    </div>

    <div id="feedback"></div>

    <div id="controls">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
    </div>
  </div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>

</body>
</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\1redondas\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\1redondas\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'redonda' },
  // CompÃ¡s 2
  { type: 'redonda' },
  // CompÃ¡s 3
  { type: 'redonda' },
  // CompÃ¡s 4
  { type: 'redonda' }
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_Redondas_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\2blancas\blancas.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\2blancas\blancas.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Mini Guitar Hero â€“ Figuras musicales</title>
  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
   <button id="backBtn" class="btn-back">â† Volver</button>
  <h1>Blancas</h1>
  <p class="subtitle">
    Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
  </p>

  <div id="game-container">
    <canvas id="game" width="800" height="220"></canvas>

    <div id="hud">
      <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
      <span>Combo: <strong id="combo">0</strong></span>
      <span>Estado: <strong id="state">Parado</strong></span>
    </div>

    <div id="feedback"></div>

    <div id="controls">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
    </div>
  </div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>


</body>
</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\2blancas\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\2blancas\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 68;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\2blancas\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\2blancas\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'blanca' },
  { type: 'blanca' },
  // CompÃ¡s 2
  { type: 'blanca' },
  { type: 'blanca' },
  // CompÃ¡s 3
  { type: 'blanca' },
  { type: 'blanca' },
  // CompÃ¡s 4
  { type: 'blanca' },
  { type: 'blanca' }
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_blancas_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\3redondasyblancas\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\3redondasyblancas\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 75;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\3redondasyblancas\redondasyblancas.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\3redondasyblancas\redondasyblancas.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Redondas y Blancas</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\3redondasyblancas\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\3redondasyblancas\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'blanca' },
  { type: 'blanca' },
  // CompÃ¡s 2
  { type: 'redonda' },
  // CompÃ¡s 3
  { type: 'redonda' },
  // CompÃ¡s 4
  { type: 'blanca' },
  { type: 'blanca' }
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_redondasyblancas_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\4negras\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\4negras\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 60;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\4negras\negras.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\4negras\negras.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Negras</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\4negras\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\4negras\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'negra' },
  { type: 'negra' },
  { type: 'negra' },
  { type: 'negra' },
  // CompÃ¡s 2
  { type: 'negra' },
  { type: 'negra' },
  { type: 'negra' },
  { type: 'negra' },
  // CompÃ¡s 3
  { type: 'negra' },
  { type: 'negra' },
  { type: 'negra' },
  { type: 'negra' }
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_negras_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\5redondasblancasynegras\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\5redondasblancasynegras\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 62;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\5redondasblancasynegras\redondasblancasynegras.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\5redondasblancasynegras\redondasblancasynegras.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Redondas, Blancas y Negras</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\5redondasblancasynegras\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\5redondasblancasynegras\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'blanca' },
  { type: 'negra' },
  { type: 'negra' },
  // CompÃ¡s 2
  { type: 'negra' },
  { type: 'blanca' },
  { type: 'negra' },
  // CompÃ¡s 3
  { type: 'redonda' },
  // CompÃ¡s 4
  { type: 'blanca' },
  { type: 'blanca' },
  // CompÃ¡s 5
  { type: 'negra' },
  { type: 'negra' },
  { type: 'blanca' }
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_redondasblancasynegras_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\6corcheas\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\6corcheas\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 55;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\6corcheas\corcheas.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\6corcheas\corcheas.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Redondas, Blancas y Negras</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\6corcheas\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\6corcheas\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  // CompÃ¡s 2
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  // CompÃ¡s 3
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_corcheas_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\7todaslasfiguras1\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\7todaslasfiguras1\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 57;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\7todaslasfiguras1\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\7todaslasfiguras1\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'blanca' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'negra' },
  // CompÃ¡s 2
  { type: 'negra' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'blanca' },
  // CompÃ¡s 3
  { type: 'redonda' },
  // CompÃ¡s 4
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'negra' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'negra' },
  // CompÃ¡s 5
  { type: 'blanca' },
  { type: 'negra' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_todas1_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\7todaslasfiguras1\todaslasfiguras1.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\7todaslasfiguras1\todaslasfiguras1.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Redondas, Blancas, Negras y Corcheas</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\8todaslasfiguras2\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\8todaslasfiguras2\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 70;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 8;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\8todaslasfiguras2\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\8todaslasfiguras2\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'negra' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'negra' },
  { type: 'negra' },
  // CompÃ¡s 2
  { type: 'blanca' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  // CompÃ¡s 3
  { type: 'negra' },
  { type: 'negra' },
  { type: 'blanca' },
  // CompÃ¡s 4
  { type: 'redonda' },
  // CompÃ¡s 5
  { type: 'negra' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'blanca' },
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_todas2_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\8todaslasfiguras2\todaslasfiguras2.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\8todaslasfiguras2\todaslasfiguras2.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Redondas, Blancas y Negras</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\9silencioredonda\config.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\9silencioredonda\config.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 70;
const BEAT_MS = 60000 / BPM;

// DuraciÃ³n base (figuras â€œmusicalesâ€)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// ConfiguraciÃ³n del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// CompÃ¡s / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compÃ¡s de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 8;

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;

// ParÃ¡metros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\9silencioredonda\silencioredonda.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\9silencioredonda\silencioredonda.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>

   <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="../../../js_simples/simples.css" />
</head>

<body>
  <div id="app-scale">
    <button id="backBtn" class="btn-back">â† Volver</button>

    <h1 class="h1"> Silencio de Redonda</h1>

    <p class="subtitle">
      Pulsa <strong>ESPACIO</strong> cuando la figura musical pase por la barra blanca.
    </p>

    <div id="game-container">
      <div id="hud">
        <span>PuntuaciÃ³n: <strong id="score">0</strong></span>
        <span>Combo: <strong id="combo">0</strong></span>
      </div>

      <canvas id="game" width="800" height="220"></canvas>

     <div id="controls" class="controls-row">
      <button id="startBtn">â–¶ Empezar / Reiniciar</button>
      <button id="hitBtn" class="mobile-only">Â¡Toca para golpear!</button>
    </div>

    <div id="feedback"></div>
  </div> 
</div>

<script src="config.js"></script>
<script src="song.js"></script>

<script src="../../../js_simples/audio.js"></script>
<script src="../../../js_simples/render.js"></script>
<script src="../../../js_simples/game.js"></script>
</body>

</html>


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\9silencioredonda\song.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\9silencioredonda\song.js.Extension.TrimStart('.'))
// ==========================
// ðŸŽ¼ PATRÃ“N
// ==========================
const pattern = [
  // CompÃ¡s 1
  { type: 'negra' },
  { type: 'negra' },
  { type: 'blanca' },

  // CompÃ¡s 2
  { type: 'rest_redonda' },

  // CompÃ¡s 3
  { type: 'negra' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'blanca' },
  // CompÃ¡s 4
  { type: 'rest_redonda' },
  // CompÃ¡s 5
  { type: 'blanca' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'negra' }
];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();

// ==========================
// ðŸ… MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_silencioredonda_medal';

const MEDAL_RANK = { bronce: 1, plata: 2, oro: 3 };

function getMedal(score) {
  const ratio = score / MAX_SCORE;
  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }
  return result;
})();


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\iniciacion.css

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\iniciacion.css.Extension.TrimStart('.'))
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  background: radial-gradient(circle at top, #1d2548, #050816 60%);
  color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* PANTALLAS */

.screen {
  width: 100%;
  max-width: 960px;
}

.hidden {
  display: none;
}

.app-title {
  text-align: center;
  font-size: 2.6rem;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  background-clip: text;
  color: transparent;
  margin-bottom: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-title.small {
  font-size: 1.8rem;
}

.app-subtitle {
  text-align: center;
  color: #cbd5f5;
  margin-bottom: 24px;
}

/* MENÃš INICIAL & INICIACIÃ“N */

.menu-card {
  background: rgba(11, 16, 32, 0.96);
  border-radius: 18px;
  padding: 24px 28px 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.difficulty-section h2 {
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 14px;
}

.difficulty-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.btn-difficulty {
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #4f46e5, #ec4899);
  color: #f9fafb;
  font-weight: 600;
  cursor: pointer;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.65);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    filter 0.15s ease;
}

.btn-difficulty:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.8);
  filter: brightness(1.05);
}

.btn-difficulty:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);
}

.menu-hint {
  margin-top: 18px;
  text-align: center;
  font-size: 0.9rem;
  color: #9ca3af;
}

/* BOTÃ“N VOLVER */

.btn-back {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 0.9rem;
  margin-bottom: 8px;
  cursor: pointer;
  padding: 4px 0;
}

.btn-back:hover {
  color: #e5e7eb;
}

/* PANTALLA INICIACIÃ“N */

.init-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.section-card {
  background: rgba(15, 23, 42, 0.96);
  border-radius: 14px;
  padding: 16px 14px 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.section-title {
  font-size: 1rem;
  margin-bottom: 10px;
  color: #e5e7eb;
  text-align: center;
}

.level-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-level {
  padding: 7px 10px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #0f172a, #1f2937);
  color: #e5e7eb;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    filter 0.15s ease;
}

.btn-level:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.8);
  filter: brightness(1.05);
}

.btn-level:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.7);
}

.btn-level {
  padding: 7px 10px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #0f172a, #1f2937);
  color: #e5e7eb;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;                /* ðŸ‘ˆ para alinear texto + medalla */
  justify-content: space-between;
  align-items: center;
}

.btn-level .medal-icon {
  margin-left: 8px;
  font-size: 1.1rem;
}


@media (max-width: 768px) {
  canvas {
    width: 100%;
    height: auto;
  }

  #hud {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .difficulty-buttons {
    grid-template-columns: 1fr;
  }

  .init-grid {
    grid-template-columns: 1fr;
  }
}

#feedback.medal-oro    { color: #facc15; }
#feedback.medal-plata  { color: #e5e7eb; }
#feedback.medal-bronce { color: #f97316; }


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\Iniciacion.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\Iniciacion.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line â€“ IniciaciÃ³n</title>
  <link rel="stylesheet" href="iniciacion.css" />
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>

  <!-- PANTALLA DE INICIACIÃ“N -->
  <!-- ðŸ‘‡ Quitamos "hidden" porque esta pÃ¡gina es la propia pantalla -->
  <div id="init-screen" class="screen">
    <div class="menu-card">
      <button id="back-to-menu" class="btn-back">â† Volver</button>

      <h1 class="app-title small">IniciaciÃ³n</h1>
      <p class="app-subtitle">
        Elige un apartado para practicar las figuras y silencios bÃ¡sicos.
      </p>

      <div class="init-grid">
        <!-- Apartado 1 -->
        <div class="section-card">
          <h2 class="section-title">Apartado 1: Figuras</h2>
          <div class="level-buttons">
            <button class="btn-level" data-level="redondas">Redondas</button>
            <button class="btn-level" data-level="blancas">Blancas</button>
            <button class="btn-level" data-level="redondasyblancas">Redondas y Blancas</button>
            <button class="btn-level" data-level="negras">Negras</button>
            <button class="btn-level" data-level="red-blan-negras">Redondas, Blancas y Negras</button>
            <button class="btn-level" data-level="corcheas">Corcheas</button>
            <button class="btn-level" data-level="todas">Todas las figuras</button>
          </div>
        </div>

        <!-- Apartado 2 -->
        <div class="section-card">
          <h2 class="section-title">Apartado 2: Silencios y examen</h2>
          <div class="level-buttons">
            <button class="btn-level" data-level="sil-redonda">Silencio de Redonda</button>
            <button class="btn-level" data-level="sil-blanca">Silencio de Blanca</button>
            <button class="btn-level" data-level="sil-negra">Silencio de Negra</button>
            <button class="btn-level" data-level="examen-principiante">Examen de Principiante</button>
          </div>
        </div>
      </div>
    </div>
  </div>

<script src="iniciacion.js"></script>

</body>
</html>




`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\iniciacion.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\Niveles\Iniciacion\iniciacion.js.Extension.TrimStart('.'))
// ==========================
// BOTÃ“N VOLVER AL MENÃš
// ==========================
document.getElementById('back-to-menu').addEventListener('click', () => {
  window.location.href = '../../index.html';
});

// ==========================
// ðŸ… MEDALLAS (emoji)
// ==========================
const MEDAL_EMOJI = {
  oro: 'ðŸ¥‡',
  plata: 'ðŸ¥ˆ',
  bronce: 'ðŸ¥‰'
};

// ==========================
// ðŸ“ RUTAS DE LOS NIVELES
// ==========================
const LEVEL_PATHS = {
  redondas: 'Redondas/Redondas.html',
  // cuando crees mÃ¡s carpetas:
  blancas: 'blancas/blancas.html',
  redondasyblancas: 'redondasyblancas/redondasyblancas.html',
  // negras: 'Negras/Negras.html',
  // corcheas: 'Corcheas/Corcheas.html'
};

// ==========================
// BOTONES DE NIVELES
// ==========================
document.querySelectorAll('.btn-level').forEach(btn => {
  const level = btn.dataset.level; // redondas, blancas...

  // ---------- Mostrar medalla ----------
  const storageKey = `rhythmline_iniciacion_${level}_medal`;
  const medal = localStorage.getItem(storageKey);

  if (medal && MEDAL_EMOJI[medal]) {
    const span = document.createElement('span');
    span.className = 'medal-icon';
    span.textContent = MEDAL_EMOJI[medal];
    btn.appendChild(span);
  }

  // ---------- NavegaciÃ³n ----------
  btn.addEventListener('click', () => {
    const path = LEVEL_PATHS[level];
    if (path) {
      window.location.href = path;
    } else {
      alert('Este nivel todavÃ­a no estÃ¡ disponible ðŸ™‚');
    }
  });
});


`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\index.html

`$(C:\Users\PC\Desktop\web\Rhythm_Line\index.html.Extension.TrimStart('.'))
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Rhythm Line</title>
  <link rel="stylesheet" href="style.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#050816">
</head>
<body>
  <!-- PANTALLA DE MENÃš -->
  <div id="menu-screen" class="screen active">
    <div class="menu-card">
      <h1 class="app-title">Rhythm Line</h1>
      <p class="app-subtitle">
        Entrena tu lectura rÃ­tmica al ritmo del metrÃ³nomo.
      </p>

      <div class="difficulty-section">
        <h2>Selecciona nivel</h2>
        <div class="difficulty-buttons">
          <!-- ðŸ‘‡ Ruta a tu carpeta Niveles/Iniciacion/Iniciacion.html -->
          <button class="btn-difficulty"
                  onclick="location.href='Niveles/Iniciacion/Iniciacion.html'">
            IniciaciÃ³n
          </button>

          <!-- Estos de momento pueden ir a pÃ¡ginas vacÃ­as o en construcciÃ³n -->
          <button class="btn-difficulty"
                  onclick="location.href='Niveles/Novel/Novel.html'">
            Novel
          </button>
          <button class="btn-difficulty"
                  onclick="location.href='Niveles/Avanzado/Avanzado.html'">
            Avanzado
          </button>
          <button class="btn-difficulty"
                  onclick="location.href='Niveles/Profesional/Profesional.html'">
            Profesional
          </button>
        </div>
      </div>
    </div>
  </div>

  <div id="rotateMsg">Gira tu dispositivo para jugar en horizontal ðŸ“±</div>

  <script src="script.js"></script>

</body>
</html>




`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\prueva.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\prueva.js.Extension.TrimStart('.'))
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const feedbackEl = document.getElementById('feedback');
const startBtn = document.getElementById('startBtn');

// ==========================
// BOTÃ“N VOLVER A INICIACIÃ“N
// ==========================
const backBtn = document.getElementById('backBtn');

if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = '../Iniciacion.html';
  });
}

// ==========================
// ðŸŽµ TEMPO / RITMO
// ==========================
const BPM = 60;                       // ----------------------------------------------------------------------------------------------tempo del juego
const BEAT_MS = 60000 / BPM;          // duraciÃ³n de un pulso en ms (1000ms a 60BPM)

// DuraciÃ³n de cada figura en milisegundos
const DURATION = {
  redonda: 4 * BEAT_MS,     // 4 pulsos
  blanca:  2 * BEAT_MS,     // 2 pulsos
  negra:   BEAT_MS,         // 1 pulso
  corchea: BEAT_MS / 2      // 0.5 pulso
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;      // 5 pulsos a 60BPM

// ConfiguraciÃ³n del juego
const HIT_X = 300; //----------------------------------------------------------------------------------------------Distancia barra del tiempo--------------//
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45; // ...................................................................................Ajuste metronomo........................//

const VISIBLE_AFTER_MS = 2 * BEAT_MS;  // la nota sigue visible 2 tiempos despuÃ©s de la barra

const SPAWN_X = canvas.width - 40;
const LANE_Y = canvas.height / 2;

// dejamos el compÃ¡s un poco a la izquierda de la barra
const TIME_SIGNATURE_X = HIT_X - 250;   // -----------------------------------------------------------------------Distancia signo compÃ¡s-----------------------------//

const BAR_X_OFFSET_PX = 18; // desplazamiento visual de la abrra de compÃ¡s

// TamaÃ±o base de las figuras
const NOTE_SIZE = 50;          // pruÃ©balo; si lo quieres mÃ¡s grande, sube a 48

// ParÃ¡metros de dibujo de corcheas basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;  //.....Anchura
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;  //......Altura
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17; // levanta un poco la nota sobre la lÃ­nea


// ==========================
// ðŸŽ¼ PATRÃ“N 
// ==========================
// Ahora ademÃ¡s puedes usar beamToNext: true para unir corcheas con barra
const pattern = [
  // CompÃ¡s 1
  { type: 'corchea'}, 
  { type: 'corchea' },                 
  { type: 'negra', tieToNext: true },   // ligadura de negras
  { type: 'negra' },
  { type: 'rest_negra' },
  // CompÃ¡s 2
  { type: 'corchea', beamToNext: true }, // corcheas unidas
  { type: 'corchea' },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea', beamToNext: true },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'corchea' },
  { type: 'rest_blanca' },
  { type: 'blanca' },
  { type: 'rest_redonda' }

];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;  //-----------------------------------------------------------------------------------Notas antes del primer tiempo................//

// Generamos la canciÃ³n: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // â±ï¸ Mapeo de duraciÃ³n (notas y silencios)
    const durKey =
      type === 'rest_negra'   ? 'negra'   :
      type === 'rest_blanca'  ? 'blanca'  :
      type === 'rest_redonda' ? 'redonda' :
      type;

    result.push({
      time: currentTime,
      type,
      tieToNext: !!tieToNext,
      beamToNext: !!beamToNext
    });

    currentTime += DURATION[durKey];
  }

  return result;
})();


// ==========================
// ðŸ… MEDALLAS
// ==========================
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_redondasyblancas_medal';

const MEDAL_RANK = {
  bronce: 1,
  plata: 2,
  oro: 3
};

function getMedal(score) {
  const ratio = score / MAX_SCORE; // 0â€“1

  if (ratio >= 0.9) return 'oro';
  if (ratio >= 0.6) return 'plata';
  if (ratio >= 0.3) return 'bronce';
  return null;
}

function saveBestMedal(newMedal) {
  if (!newMedal) return;

  const current = localStorage.getItem(MEDAL_STORAGE_KEY);
  if (!current) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
    return;
  }

  if (MEDAL_RANK[newMedal] > MEDAL_RANK[current]) {
    localStorage.setItem(MEDAL_STORAGE_KEY, newMedal);
  }
}

// ==========================
// ðŸŽš COMPASES / BARRAS
// ==========================
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

const bars = (() => {
  const result = [];
  const lastTime = song[song.length - 1].time;
  const barDuration = BEATS_PER_BAR * BEAT_MS;

  const firstNoteTime = song[0].time;
  const firstBarTime = Math.max(0, firstNoteTime - BAR_LEAD_MS);

  for (let t = firstBarTime; t <= lastTime + 2 * barDuration; t += barDuration) {
    result.push(t);
  }

  return result;
})();

let notes = [];
let running = false;
let startTime = null;
let score = 0;
let combo = 0;

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

// ==========================
// FIGURAS MUSICALES EN CANVAS
// ==========================

// Negra = cabeza rellena + plica
function drawNegra(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const yCenter = y + NOTE_OFFSET_Y;

  ctx.save();

  // Cabeza rellena
  ctx.beginPath();
  ctx.ellipse(
    x,
    yCenter,
    NOTE_HEAD_RX,
    NOTE_HEAD_RY,
    -0.4,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = color;
  ctx.fill();

  // Plica hacia arriba
  const xStem = x + NOTE_HEAD_RX - 2;
  const yBottom = yCenter;
  const yTop = yBottom - STEM_HEIGHT;

  ctx.beginPath();
  ctx.moveTo(xStem, yBottom);
  ctx.lineTo(xStem, yTop);
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.restore();
}

// Blanca = cabeza vacÃ­a + plica
function drawBlanca(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const yCenter = y + NOTE_OFFSET_Y;

  ctx.save();

  // Cabeza vacÃ­a
  ctx.beginPath();
  ctx.ellipse(
    x,
    yCenter,
    NOTE_HEAD_RX,
    NOTE_HEAD_RY,
    -0.4,
    0,
    Math.PI * 2
  );
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();

  // Plica hacia arriba
  const xStem = x + NOTE_HEAD_RX - 2;
  const yBottom = yCenter;
  const yTop = yBottom - STEM_HEIGHT;

  ctx.beginPath();
  ctx.moveTo(xStem, yBottom);
  ctx.lineTo(xStem, yTop);
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.restore();
}

// Redonda = cabeza vacÃ­a sin plica
function drawRedonda(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const yCenter = y + NOTE_OFFSET_Y;

  ctx.save();

  ctx.beginPath();
  ctx.ellipse(
    x,
    yCenter,
    NOTE_HEAD_RX,
    NOTE_HEAD_RY,
    -0.4,
    0,
    Math.PI * 2
  );
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.restore();
}

// ---- Corcheas (cabeza + plica) ----
function drawCorcheaBase(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const yCenter = y + NOTE_OFFSET_Y;

  ctx.save();

  // Cabeza
  ctx.beginPath();
  ctx.ellipse(x, yCenter, NOTE_HEAD_RX, NOTE_HEAD_RY, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Plica hacia arriba
  const xStem = x + NOTE_HEAD_RX - 2;
  const yBottom = yCenter;
  const yTop = yBottom - STEM_HEIGHT;

  ctx.beginPath();
  ctx.moveTo(xStem, yBottom);
  ctx.lineTo(xStem, yTop);
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.restore();
}

// Punta de la plica (para beams / banderines)
function getCorcheaStemTop(x, y) {
  const yCenter = y + NOTE_OFFSET_Y;
  const xStem = x + NOTE_HEAD_RX - 2;
  const yTop = yCenter - STEM_HEIGHT;
  return { x: xStem, y: yTop };
}

function drawCorcheaFlag(xStem, yTop, hit) {  //........Cola de las corcheas
  const color = hit ? '#22c55e' : '#38bdf8';

  // Escala basada en el tamaÃ±o de la nota
  const flagWidth = NOTE_SIZE * 0.25;   // largo horizontal
  const flagHeight = NOTE_SIZE * 0.35;  // caÃ­da vertical

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = NOTE_SIZE * 0.05;  // grosor proporcional

  ctx.moveTo(xStem, yTop);
  ctx.quadraticCurveTo(
    xStem + flagWidth, 
    yTop + flagHeight * 0.2, 
    xStem + flagWidth * 0.3, 
    yTop + flagHeight
  );

  ctx.stroke();
  ctx.restore();
}


function drawCorcheaBeam(x1Stem, x2Stem, yTop, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.moveTo(x1Stem, yTop);
  ctx.lineTo(x2Stem, yTop);
  ctx.stroke();
  ctx.restore();
}

function drawRestNegra(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const s = NOTE_SIZE;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.10;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.45);
  ctx.lineTo(x + s * 0.18, y - s * 0.10);
  ctx.lineTo(x - s * 0.18, y + s * 0.15);
  ctx.lineTo(x + s * 0.12, y + s * 0.45);
  ctx.stroke();

  ctx.restore();
}

function drawRestBlanca(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const w = NOTE_SIZE * 0.55;
  const h = NOTE_SIZE * 0.18;

  ctx.save();
  ctx.fillStyle = color;

  ctx.fillRect(
    x - w / 2,
    y + NOTE_SIZE * 0.05,
    w,
    h
  );

  ctx.restore();
}


function drawRestRedonda(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const w = NOTE_SIZE * 0.55;
  const h = NOTE_SIZE * 0.18;

  ctx.save();
  ctx.fillStyle = color;

  ctx.fillRect(
    x - w / 2,
    y - NOTE_SIZE * 0.23,
    w,
    h
  );

  ctx.restore();
}


// ---- Figuras genÃ©ricas (router por tipo) ----
function drawNoteFigure(x, y, type, hit) {

  // ðŸ¤« Silencios (vectoriales, misma escala)
  if (type === 'rest_negra')   { drawRestNegra(x, y, hit); return; }
  if (type === 'rest_blanca')  { drawRestBlanca(x, y, hit); return; }
  if (type === 'rest_redonda') { drawRestRedonda(x, y, hit); return; }

  // ðŸŽµ Notas
  if (type === 'corchea') { drawCorcheaBase(x, y, hit); return; }
  if (type === 'negra')   { drawNegra(x, y, hit); return; }
  if (type === 'blanca')  { drawBlanca(x, y, hit); return; }
  if (type === 'redonda') { drawRedonda(x, y, hit); return; }

  // Cualquier otro tipo raro (doble, etc.) -> fallback con sÃ­mbolo
  let symbol = 'â™©';
  if (type === 'doble') symbol = 'â™«';

  ctx.font = `${NOTE_SIZE}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = hit ? '#22c55e' : '#38bdf8';
  ctx.fillText(symbol, x, y + NOTE_OFFSET_Y);
}

// Ligaduras
function drawTie(x1, x2, baseY) {
  const midX = (x1 + x2) / 2;
  const h = 10;

  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(x1, baseY);
  ctx.quadraticCurveTo(midX, baseY + h, x2, baseY);
  ctx.stroke();

  ctx.restore();
}

// ----------------------
// ðŸŽµ METRÃ“NOMO 60 BPM
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

  // adelantamos un poco el disparo del click
  while (elapsed + METRONOME_LEAD_MS >= nextBeatTime) {
    playClick();
    nextBeatTime += BEAT_MS;
  }
}

// ----------------------
// ðŸ”Š SONIDOS DE HIT / MISS
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
  gain.gain.setValueAtTime(0.60, now);  //------------------------------------------------------------------------ volumen metronomo--------------------------// 
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

// ==========================
// DIBUJO ESTÃTICO: LÃNEA Y COMPÃS
// ==========================
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawStaticLane() {
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, LANE_Y);
  ctx.lineTo(canvas.width - 40, LANE_Y);
  ctx.stroke();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(HIT_X, LANE_Y - 40);
  ctx.lineTo(HIT_X, LANE_Y + 40);
  ctx.stroke();
}

function drawTimeSignature() {
  ctx.save();

  ctx.fillStyle = '#e5e7eb';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText('4', TIME_SIGNATURE_X, LANE_Y - 16);
  ctx.fillText('4', TIME_SIGNATURE_X, LANE_Y + 16);

  ctx.restore();
}

// ==========================
// LÃ“GICA DEL JUEGO
// ==========================
function createNotes() {
  return song.map((n, index) => {
    const tiedFromPrev  = index > 0 && song[index - 1].tieToNext;
    const beamFromPrev  = index > 0 && song[index - 1].beamToNext;

    const isRest = n.type.startsWith('rest_'); // ðŸ‘ˆ NUEVO

    return {
      hitTime: n.time,
      type: n.type,
      isRest,                               // ðŸ‘ˆ NUEVO
      tieToNext: n.tieToNext || false,
      beamToNext: n.beamToNext || false,
      beamFromPrev,
      tiedFromPrev,
      judgementNote: !tiedFromPrev && !isRest, // ðŸ‘ˆ CAMBIO CLAVE
      hit: false,
      missed: false,
      currentX: null,
      visible: false,
      index
    };
  });
}


function resetGame() {
  score = 0;
  combo = 0;
  notes = createNotes();
  running = false;
  startTime = null;
  scoreEl.textContent = score;
  comboEl.textContent = combo;
  setFeedback('', null);
  clearCanvas();
  drawStaticLane();
  drawTimeSignature();
  stopMetronome();
}

function setFeedback(text, type) {
  feedbackEl.textContent = text;
  feedbackEl.className = '';
  if (type) feedbackEl.classList.add(type);
}

function drawNotes(timestamp) {
  if (!running) return;

  const elapsed = timestamp - startTime;

  handleMetronome(elapsed);

  clearCanvas();
  drawStaticLane();
  drawTimeSignature();

  const distance = SPAWN_X - HIT_X;

  // limpiar flags de visibilidad
  for (const note of notes) {
    note.visible = false;
    // currentX se conserva
  }

// --------- NOTAS -----------
for (const note of notes) {
  const timeToHit = note.hitTime - elapsed;

  if (
    timeToHit < -MISS_WINDOW &&
    !note.hit &&
    !note.missed &&
    note.judgementNote
  ) {
    note.missed = true;
    combo = 0;
    comboEl.textContent = combo;
    setFeedback('FALLO', 'miss');
    playMissSound();
  }

  if (timeToHit <= TRAVEL_TIME && timeToHit >= -VISIBLE_AFTER_MS) {
    const fraction = timeToHit / TRAVEL_TIME;
    const x = HIT_X + distance * fraction;

    note.currentX = x;
    note.visible = true;
    drawNoteFigure(x, LANE_Y, note.type, note.hit);
  }
}

  // --------- BARRAS / BANDERINES DE CORCHEAS ---------

// 1 Beams manuales con beamToNext
for (let i = 0; i < notes.length - 1; i++) {
  const n1 = notes[i];
  const n2 = notes[i + 1];

  if (!n1.beamToNext) continue;
  if (!n2.visible) continue;
  if (n1.currentX == null || n2.currentX == null) continue;

  const stem1 = getCorcheaStemTop(n1.currentX, LANE_Y);
  const stem2 = getCorcheaStemTop(n2.currentX, LANE_Y);
  const yBeam = Math.min(stem1.y, stem2.y) - 3;
  const hitBoth = n1.hit && n2.hit;

  // ðŸ‘‰ SIN CLIP: la barra une siempre las dos plicas
  drawCorcheaBeam(stem1.x, stem2.x, yBeam, hitBoth);
}


  // 2) BANDERINES para corcheas que no pertenecen a ningÃºn beam
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (!n.visible) continue;
    if (n.type !== 'corchea') continue;

    // si estÃ¡ en un grupo de barra (con anterior o siguiente), no lleva banderÃ­n
    if (n.beamFromPrev || n.beamToNext) continue;

    const stem = getCorcheaStemTop(n.currentX, LANE_Y);
    drawCorcheaFlag(stem.x, stem.y, n.hit);
  }

  // --------- LIGADURAS ENTRE NOTAS CON tieToNext ---------
  const tieBaseY = LANE_Y + 22; // un poco por debajo de la lÃ­nea

  for (let i = 0; i < notes.length - 1; i++) {
    const n1 = notes[i];
    const n2 = notes[i + 1];

    if (!n1.tieToNext) continue;
    if (!n2.visible) continue;
    if (n1.currentX == null || n2.currentX == null) continue;

    ctx.save();
    ctx.beginPath();
    ctx.rect(HIT_X, 0, canvas.width - HIT_X, canvas.height);
    ctx.clip();

    drawTie(n1.currentX, n2.currentX, tieBaseY);

    ctx.restore();
  }

  // --------- BARRAS DE COMPÃS -----------
for (const barTime of bars) {
  const timeToBar = barTime - elapsed;

  if (timeToBar <= TRAVEL_TIME && timeToBar >= -MISS_WINDOW) {
    const fraction = timeToBar / TRAVEL_TIME;
    let x = HIT_X + distance * fraction;

    // ðŸ‘‡ desplazar la barra "por detrÃ¡s" visualmente
    x -= BAR_X_OFFSET_PX;

    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.moveTo(x, LANE_Y - 60);
    ctx.lineTo(x, LANE_Y + 60);
    ctx.stroke();

    ctx.restore();
  }
}

  const lastTime = song[song.length - 1].time;
  const allProcessed = notes.every(n => !n.judgementNote || n.hit || n.missed);

  if (allProcessed && elapsed > lastTime + 1500) {
    running = false;
    stopMetronome();

    const medal = getMedal(score);
    saveBestMedal(medal);

    if (medal === 'oro') {
      setFeedback('ðŸ¥‡ Â¡Medalla de ORO! Â¡Excelente trabajo!', 'medal-oro');
    } else if (medal === 'plata') {
      setFeedback('ðŸ¥ˆ Medalla de PLATA. Â¡Muy bien!', 'medal-plata');
    } else if (medal === 'bronce') {
      setFeedback('ðŸ¥‰ Medalla de BRONCE. Â¡Sigue practicando!', 'medal-bronce');
    } else {
      setFeedback('Has terminado. Â¡Intenta conseguir una medalla!', null);
    }

    return;
  }

  requestAnimationFrame(drawNotes);
}

// Estado del botÃ³n: 'start' (Empezar) o 'restart' (Reiniciar)
startBtn.dataset.mode = 'start';  // estado inicial

function startRun() {
  running = true;
  startTime = performance.now();
  startMetronome();
  requestAnimationFrame(drawNotes);
}

startBtn.addEventListener('click', () => {
  const mode = startBtn.dataset.mode;

  if (mode === 'restart') {
    resetGame();
    startBtn.textContent = 'Empezar';
    startBtn.dataset.mode = 'start';
  } else {
    resetGame();
    startRun();
    startBtn.textContent = 'Reiniciar';
    startBtn.dataset.mode = 'restart';
  }
});

function handleHit() {
  if (!running || !startTime) return;

  const now = performance.now();
  const elapsed = now - startTime;

  let bestNote = null;
  let bestDelta = Infinity;

  // 1) Buscar mejor NOTA jugable
  for (const note of notes) {
    if (!note.judgementNote) continue;   // incluye: NO silencios
    if (note.hit || note.missed) continue;

    const delta = Math.abs(note.hitTime - elapsed);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestNote = note;
    }
  }

  // 2) Buscar mejor SILENCIO cercano (para penalizar si pulsas)
let bestRest = null;
let bestRestDelta = Infinity;

for (const note of notes) {
  if (!note.isRest) continue;

  const deltaSigned = note.hitTime - elapsed; // con signo
  const delta = Math.abs(deltaSigned);

  // Si el silencio ya pasÃ³ mÃ¡s allÃ¡ de la ventana, no lo uses para penalizar
  if (deltaSigned < -GOOD_WINDOW) continue;

  if (delta < bestRestDelta) {
    bestRestDelta = delta;
    bestRest = note;
  }
}

  const noteInWindow = bestNote && bestDelta <= GOOD_WINDOW;
  const restInWindow = bestRest && bestRestDelta <= GOOD_WINDOW;

  // Si estÃ¡s mÃ¡s cerca (o dentro) de un silencio que de una nota: FALLO
  if (restInWindow && (!noteInWindow || bestRestDelta < bestDelta)) {
    combo = 0;
    comboEl.textContent = combo;
    setFeedback('SILENCIO (NO TOCAR)', 'miss');
    playMissSound();
    return;
  }

  // Si no hay nota vÃ¡lida: fallo normal
  if (!noteInWindow) {
    combo = 0;
    comboEl.textContent = combo;
    setFeedback('FALLO', 'miss');
    playMissSound();
    return;
  }

  // Hit normal
  bestNote.hit = true;

  if (bestDelta <= PERFECT_WINDOW) {
    score += 300;
    combo++;
    setFeedback('PERFECT', 'perfect');
    playHitSound(true);
  } else {
    score += 100;
    combo++;
    setFeedback('BIEN', 'good');
    playHitSound(false);
  }

  scoreEl.textContent = score;
  comboEl.textContent = combo;
}


// ==========================
// EVENTOS
// ==========================

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === 'j' || e.key === 'J') {
    e.preventDefault();
    handleHit();
  }
});

// --- soporte mÃ³vil ---
const hitBtn = document.getElementById('hitBtn');

if (hitBtn) {
  hitBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleHit();
  });

  hitBtn.addEventListener('click', () => {
    handleHit();
  });
}

// primer dibujo en reposo
resetGame();



`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\script.js

`$(C:\Users\PC\Desktop\web\Rhythm_Line\script.js.Extension.TrimStart('.'))
  async function lockLandscape() {
    if (screen.orientation && screen.orientation.lock) {
      try {
        await screen.orientation.lock("landscape");
      } catch (e) {
        // Safari / iOS no permite forzar
        console.warn("No se pudo bloquear la orientaciÃ³n");
      }
    }
  }

  lockLandscape();

`

## Archivo: C:\Users\PC\Desktop\web\Rhythm_Line\style.css

`$(C:\Users\PC\Desktop\web\Rhythm_Line\style.css.Extension.TrimStart('.'))
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  background: radial-gradient(circle at top, #1d2548, #050816 60%);
  color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* PANTALLA (CONTENEDOR) */
.screen {
  width: 100%;
  max-width: 960px;
}

/* TÃTULO Y SUBTÃTULO DE LA APP */
.app-title {
  text-align: center;
  font-size: 2.6rem;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  background-clip: text;
  color: transparent;
  margin-bottom: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-subtitle {
  text-align: center;
  color: #cbd5f5;
  margin-bottom: 24px;
}

/* TARJETA DEL MENÃš INICIAL */
.menu-card {
  background: rgba(11, 16, 32, 0.96);
  border-radius: 18px;
  padding: 24px 28px 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

/* SECCIÃ“N DE DIFICULTAD */
.difficulty-section h2 {
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 14px;
}

.difficulty-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

/* BOTONES DE DIFICULTAD */
.btn-difficulty {
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #4f46e5, #ec4899);
  color: #f9fafb;
  font-weight: 600;
  cursor: pointer;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.65);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    filter 0.15s ease;
}

.btn-difficulty:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.8);
  filter: brightness(1.05);
}

.btn-difficulty:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);
}

/* Mensaje de "gira el dispositivo" oculto por defecto */
#rotateMsg {
  display: none;
  position: fixed;
  inset: 0;
  background: #050816;
  color: #f5f5f5;
  font-size: 1.6rem;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 9999;
  padding: 20px;
}

/* En mÃ³viles/tablets en VERTICAL: oculto el menÃº y muestro el mensaje */
@media (hover: none) and (pointer: coarse) and (orientation: portrait) {
  #menu-screen {
    display: none;
  }

  #rotateMsg {
    display: flex;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  background: radial-gradient(circle at top, #1d2548, #050816 60%);
  color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* PANTALLA (CONTENEDOR) */
.screen {
  width: 100%;
  max-width: 960px;
}

/* TÃTULO Y SUBTÃTULO DE LA APP */
.app-title {
  text-align: center;
  font-size: 2.6rem;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  background-clip: text;
  color: transparent;
  margin-bottom: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-subtitle {
  text-align: center;
  color: #cbd5f5;
  margin-bottom: 24px;
}

/* TARJETA DEL MENÃš INICIAL */
.menu-card {
  background: rgba(11, 16, 32, 0.96);
  border-radius: 18px;
  padding: 24px 28px 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

/* SECCIÃ“N DE DIFICULTAD */
.difficulty-section h2 {
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 14px;
}

.difficulty-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

/* BOTONES DE DIFICULTAD */
.btn-difficulty {
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #4f46e5, #ec4899);
  color: #f9fafb;
  font-weight: 600;
  cursor: pointer;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.65);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    filter 0.15s ease;
}

.btn-difficulty:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.8);
  filter: brightness(1.05);
}

.btn-difficulty:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);
}

/* RESPONSIVO */
@media (max-width: 768px) {
  .difficulty-buttons {
    grid-template-columns: 1fr;
  }
}

/* Mensaje de "gira el dispositivo" oculto por defecto */
#rotateMsg {
  display: none;
  position: fixed;
  inset: 0;
  background: #050816;
  color: #f5f5f5;
  font-size: 1.6rem;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 9999;
  padding: 20px;
}

/* En mÃ³viles/tablets en VERTICAL: oculto el menÃº y muestro el mensaje */
@media (hover: none) and (pointer: coarse) and (orientation: portrait) {
  #menu-screen {
    display: none;
  }

  #rotateMsg {
    display: flex;
  }
}

/* ====== PANTALLA COMPLETA REAL EN MÃ“VIL ====== */
@media (max-width: 768px) {
  body {
    padding: 0;
  }

  .screen {
    max-width: 100%;
    width: 100%;
    height: 100vh;
  }

  .menu-card {
    width: 100%;
    height: 100vh;

    border-radius: 0;      /* sin tarjeta */
    padding: 24px 20px;
    margin: 0;

    display: flex;
    flex-direction: column;
    justify-content: center;  /* centra el contenido verticalmente */
  }

  .difficulty-buttons {
    grid-template-columns: 1fr;
  }
}



`

