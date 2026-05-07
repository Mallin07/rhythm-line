// ==========================
// 🎼 PATRÓN
// ==========================
const pattern = [
  // Compás 1
  { type: 'blanca' },
  { type: 'negra' },
  { type: 'negra' },

  // Compás 2
  { type: 'blanca' },
  { type: 'blanca' },

  // Compás 3
  { type: 'redonda' },

  // Compás 4
  { type: 'negra' },
  { type: 'negra' },
  { type: 'blanca' },

];

// La primera nota llega a la barra en el BEAT 4
const FIRST_NOTE_BEAT = 4;

// Generamos la canción: array de { time, type, tieToNext, beamToNext }
const song = (() => {
  let currentTime = FIRST_NOTE_BEAT * BEAT_MS;
  const result = [];

  for (const p of pattern) {
    const { type, tieToNext, beamToNext } = typeof p === 'string'
      ? { type: p, tieToNext: false, beamToNext: false }
      : p;

    // ⏱️ Mapeo de duración (notas y silencios)
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
// 🏅 MEDALLAS
// ==========================
// Solo cuentan las figuras jugables (no silencios)
const MAX_SCORE = pattern.filter(p => {
  const t = (typeof p === 'string') ? p : p.type;
  return !t.startsWith('rest_');
}).length * 300;

const MEDAL_STORAGE_KEY = 'rhythmline_iniciacion_afianzando1_medal';

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
// 🎚 COMPASES / BARRAS
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
