// ==========================
// BOTÓN VOLVER AL MENÚ
// ==========================
document.getElementById('back-to-menu').addEventListener('click', () => {
  window.location.href = '../../index.html';
});

// ==========================
// MEDALLAS
// ==========================
const MEDAL_EMOJI = {
  oro: '🥇',
  plata: '🥈',
  bronce: '🥉'
};

// ==========================
// RUTAS + LOCALSTORAGE
// ==========================
const LEVELS = {
  redondas: {
    path: '1redondas/Redondas.html',
    medalKey: 'rhythmline_iniciacion_Redondas_medal'
  },
  blancas: {
    path: '2blancas/blancas.html',
    medalKey: 'rhythmline_iniciacion_blancas_medal'
  },
  redondasyblancas: {
    path: '3redondasyblancas/redondasyblancas.html',
    medalKey: 'rhythmline_iniciacion_redondasyblancas_medal'
  },
  negras: {
    path: '4negras/negras.html',
    medalKey: 'rhythmline_iniciacion_negras_medal'
  },
  'red-blan-negras': {
    path: '5redondasblancasynegras/redondasblancasynegras.html',
    medalKey: 'rhythmline_iniciacion_redondasblancasynegras_medal'
  },
  corcheas: {
    path: '6corcheas/corcheas.html',
    medalKey: 'rhythmline_iniciacion_corcheas_medal'
  },
  todas: {
    path: '7todaslasfiguras1/todaslasfiguras1.html',
    medalKey: 'rhythmline_iniciacion_todas1_medal'
  },
  todas2: {
    path: '8todaslasfiguras2/todaslasfiguras2.html',
    medalKey: 'rhythmline_iniciacion_todas2_medal'
  },
  'sil-redonda': {
    path: '9silencioredonda/silencioredonda.html',
    medalKey: 'rhythmline_iniciacion_silencioredonda_medal'
  },
  'sil-blanca': {
    path: '10silencioblanca/silencioblanca.html',
    medalKey: 'rhythmline_iniciacion_silencioblanca_medal'
  },
  'sil-negra': {
    path: '11silencionegra/silencionegra.html',
    medalKey: 'rhythmline_iniciacion_silencionegra_medal'
  },
  'examen-principiante': {
    path: '12examenprincipiante1/examenprincipiante1.html',
    medalKey: 'rhythmline_iniciacion_examenprincipiante1_medal'
  }
};

// ==========================
// BOTONES DE NIVELES
// ==========================
document.querySelectorAll('.btn-level').forEach(btn => {
  const levelId = btn.dataset.level;
  const level = LEVELS[levelId];

  if (!level) return;

  const medal = localStorage.getItem(level.medalKey);

  if (medal && MEDAL_EMOJI[medal]) {
    const span = document.createElement('span');
    span.className = 'medal-icon';
    span.textContent = MEDAL_EMOJI[medal];
    btn.appendChild(span);
  }

  btn.addEventListener('click', () => {
    window.location.href = level.path;
  });
});