// ==========================
// 🎵 TEMPO / RITMO
// ==========================
const BPM = 62;
const BEAT_MS = 60000 / BPM;

// Duración base (figuras “musicales”)
const DURATION = {
  redonda: 4 * BEAT_MS,
  blanca:  2 * BEAT_MS,
  negra:   BEAT_MS,
  corchea: BEAT_MS / 2
};

// Tiempo que tarda la nota en viajar hasta la barra
const TRAVEL_TIME = 5 * BEAT_MS;

// Configuración del juego
const HIT_X = 300;
const MISS_WINDOW = 250;
const PERFECT_WINDOW = 80;
const GOOD_WINDOW = 150;

const METRONOME_LEAD_MS = 45;
const VISIBLE_AFTER_MS = 2 * BEAT_MS;

// Compás / barras
const BEATS_PER_BAR = 4;
const BAR_LEAD_MS = 150;

// Visual: separa la barra de compás de la primera figura sin tocar tiempos
const BAR_X_OFFSET_PX = 18;

// Tamaño base de las figuras
const NOTE_SIZE = 50;

// Parámetros de dibujo basados en NOTE_SIZE
const NOTE_HEAD_RX = NOTE_SIZE * 0.20;
const NOTE_HEAD_RY = NOTE_SIZE * 0.15;
const STEM_HEIGHT  = NOTE_SIZE * 0.80;
const NOTE_OFFSET_Y = -NOTE_SIZE * 0.17;
