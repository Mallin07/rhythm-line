const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const feedbackEl = document.getElementById('feedback');
const startBtn = document.getElementById('startBtn');

// ==========================
// BOTÓN VOLVER A INICIACIÓN
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

// Estado del botón
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

  // --------- BARRAS DE COMPÁS ---------
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

    if (medal === 'oro') setFeedback('🥇 ¡Medalla de ORO! ¡Excelente trabajo!', 'medal-oro');
    else if (medal === 'plata') setFeedback('🥈 Medalla de PLATA. ¡Muy bien!', 'medal-plata');
    else if (medal === 'bronce') setFeedback('🥉 Medalla de BRONCE. ¡Sigue practicando!', 'medal-bronce');
    else setFeedback('Has terminado. ¡Intenta conseguir una medalla!', null);

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

// móvil
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
