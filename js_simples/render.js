// ==========================
// CANVAS + LAYOUT
// ==========================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SPAWN_X = canvas.width - 40;
const LANE_Y = canvas.height / 2;

// compás un poco a la izquierda de la barra
const TIME_SIGNATURE_X = HIT_X - 250;

// ==========================
// DIBUJO ESTÁTICO
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

  // La barra sigue existiendo en HIT_X, pero puede ocultarse visualmente
  const showHitBar = typeof SHOW_HIT_BAR === 'undefined' ? true : SHOW_HIT_BAR;

  if (showHitBar) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(HIT_X, LANE_Y - 40);
    ctx.lineTo(HIT_X, LANE_Y + 40);
    ctx.stroke();
  }
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
  ctx.fillRect(x - w / 2, y - NOTE_SIZE * 0.23, w, h);
  ctx.restore();
}

function drawRestRedonda(x, y, hit) {
  const color = hit ? '#22c55e' : '#38bdf8';
  const w = NOTE_SIZE * 0.55;
  const h = NOTE_SIZE * 0.18;

  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y + NOTE_SIZE * 0.05, w, h);
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
  let symbol = '♩';
  if (type === 'doble') symbol = '♫';

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
