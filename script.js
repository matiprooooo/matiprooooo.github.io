/* IMPOSTOR — Neon Game Logic
   - Pure JS, single-page flow
   - Clean functions and comments
*/

/* -----------------------------
   Elements
----------------------------- */
const screenHome = document.getElementById('screenHome');
const screenGame = document.getElementById('screenGame');
const screenFinal = document.getElementById('screenFinal');

const btnPlay = document.getElementById('btnPlay');
const btnTheme = document.getElementById('btnTheme');
const btnPlayers = document.getElementById('btnPlayers');
const btnEndTurn = document.getElementById('btnEndTurn');
const btnNewGame = document.getElementById('btnNewGame');

const previewThemeName = document.getElementById('previewThemeName');
const previewList = document.getElementById('previewList');

const hudTheme = document.getElementById('hudTheme');
const turnInfo = document.getElementById('turnInfo');
const wordDisplay = document.getElementById('wordDisplay');
const impostorBadge = document.getElementById('impostorBadge');

const overlayTransition = document.getElementById('overlayTransition');
const btnNextRound = document.getElementById('btnNextRound');

const modalTheme = document.getElementById('modalTheme');
const modalPlayers = document.getElementById('modalPlayers');
const closeTheme = document.getElementById('closeTheme');
const closePlayers = document.getElementById('closePlayers');

const ambientAudio = document.getElementById('ambientAudio');
const impostorSfx = document.getElementById('impostorSfx');
const btnAudio = document.getElementById('btnAudio');
const audioStatus = document.getElementById('audioStatus');

/* -----------------------------
   Game State
----------------------------- */
const THEMES = {
  'Cosas': [
    'Lámpara','Teclado','Puerta','Cámara','Auriculares','Bicicleta','Cuchillo','Libro','Reloj','Silla',
    'Ventana','Mesa','Botella','Llave','Plancha','Cargador','Pelota','Cepillo','Espejo','Martillo'
  ],
  'Personas': [
    "EMI","Nachito(AYO)","SOLIS","EBERTZ","CABALLITO","SHOSHI","AGUSTINA","FRANCISCO","MARTIN","POLLO",
    "BAHIANO","NICOLAU","NAHUE(EL MAMUEL)","JOACO DE PIEDRAS BLANCAS","LA COQUETA","BRANDON","LA ANA",
    "FRASQUITO","AXEL(ÑAÑITO)","IBAI","EL MOMO","CRISTINA","CHIQUI TAPIA","DAVO","LA COBRA","GASTON EDUL",
    "EL IVAN","LA YANI","LA SEÑO PAO(INGLES)","HEBER ZAPATA","BAULETTI","MERNUEL","BAULETTI",
    "MATIAS BOTTERO","MILICA","XOCAS","COSCU","JULY3P","NICKI NICOLE","PELAOKEH","PEQUEÑO J","BANANIROU","BANANERO",
    "CATALDO","WANDA NARA","MARTINCITO","JULIO","ROBLEIS","PEDRITOVM","ELDEMENTE","BOFFEGP","MILEI","ALONSO","LALOCOMOTORA",
    "TOMAS MAZZA","RICARDO FORT","NORDELTUS","ELOPODCAST","ADAM SANDLER","HUGUITO ZAPATA","COLAPINTO","WILL(FUTBOLITOS)","DUKI",
    "ZEKO","TRUENO","WOS","LA CHABONA","COFLA","MIRTHA LEGRAND","COCKER","LOS DISCIPLENTES","PACHECO CARAFLOJA","MIKECRACK","FEDE VIGEVIANI",
     "FERNANFLOO","GERMAN GARMENDIA","VEGETTA777","WILLYREX","MARIANO CLOOS","CAMNAIR","LUZU","OLGA","MOCHA","FALUCHO","SHONGUI(VERSION MALVADA DEL SHOSHI)","YAO CABRERA","TOMAS HOLDER"
  ],
  'Futbolistas': [
    'Lionel Messi','Cristiano Ronaldo','Neymar','Kylian Mbappé','Erling Haaland','Kevin De Bruyne','Luka Modrić','Ángel Di María','Julián Álvarez','Paulo Dybala',
    'Sergio Agüero','Ronaldinho','Zinedine Zidane','Andrés Iniesta','Xavi','Diego Maradona','Pelé','Francesco Totti','Didier Drogba','Wayne Rooney'
  ],
[
  'Gigante','Montapuercos','Mago','Horda de esbirros','Valquiria','P.E.K.K.A','Tronco','Bebé dragón','Megacaballero','Bruja',
  'Globo','Minero','Princesa','Chispitas','Esqueleto gigante','Barril de duendes','Mosquetera','Arquero mágico','Rayo','Furia',
  'Reina arquera','Cazador','Barbaros','Barril de esqueletos','Mini P.E.K.K.A','Dragón infernal','Ejército de esqueletos','Lanzarrocas','Cementerio','Duendes',
  'Duendes con lanza','Choza de duendes','Cañón','Torre bombardera','Torre infernal','Bola de fuego','Tornado','Zap','Furia','Espíritu de hielo',
  'Espíritu de fuego','Espíritu eléctrico','Hielo','Curación','Clon','lapida','Torre inferno','Mortero','Tesla','Caballero oscuro',
  'Sabueso de lava','Gran minero','Ballesta','Puercos reales','Recolector de elixir','Pocion veneno','Reclutas reales','Cohete','Lanzafuegos'
]
   
};



let chosenTheme = 'Cosas';
let playersCount = 4;
let currentPlayer = 1;
let impostorPlayer = null;
let usedWordIndex = null;
let gameActive = false;

/* -----------------------------
   Utility
----------------------------- */
function setScreen(screen) {
  // Hide all
  [screenHome, screenGame, screenFinal].forEach(s => s.classList.remove('active'));
  // Show chosen
  screen.classList.add('active');
}

function updatePreview() {
  previewThemeName.textContent = chosenTheme;
  const list = THEMES[chosenTheme];
  const sample = list.slice(0, 5);
  previewList.innerHTML = sample.map(item => `<li>${item}</li>`).join('');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomWordIndex() {
  const list = THEMES[chosenTheme];
  return randomInt(0, list.length - 1);
}

/* -----------------------------
   Game Flow
----------------------------- */
function startGame() {
  gameActive = true;
  currentPlayer = 1;
  hudTheme.textContent = chosenTheme;
  turnInfo.textContent = `Jugador ${currentPlayer} de ${playersCount}`;
  usedWordIndex = pickRandomWordIndex();
  impostorPlayer = randomInt(1, playersCount);
  setScreen(screenGame);
  showTurnWord();
}

function showTurnWord() {
  const isImpostor = currentPlayer === impostorPlayer;
  wordDisplay.textContent = isImpostor ? '—' : THEMES[chosenTheme][usedWordIndex];
  impostorBadge.style.display = isImpostor ? 'block' : 'none';

  // Play short SFX when impostor sees it (optional)
  if (isImpostor && impostorSfx && impostorSfx.src) {
    try { impostorSfx.currentTime = 0; impostorSfx.play(); } catch (e) {}
  }
}

function endTurn() {
  // Ocultar palabra antes de pasar el dispositivo
  wordDisplay.textContent = '—';
  impostorBadge.style.display = 'none';

  // Mostrar overlay
  overlayTransition.classList.add('active');
}


function nextRound() {
  overlayTransition.classList.remove('active');
  currentPlayer++;
  if (currentPlayer > playersCount) {
    // Everyone has seen their word
    gameActive = false;
    setScreen(screenFinal);
  } else {
    // Next player sees the word or impostor badge
    turnInfo.textContent = `Jugador ${currentPlayer} de ${playersCount}`;
    showTurnWord();
  }
}

function resetToHome() {
  // Reset state
  gameActive = false;
  currentPlayer = 1;
  impostorPlayer = null;
  usedWordIndex = null;
  setScreen(screenHome);
}

/* -----------------------------
   Audio Controls
----------------------------- */
let audioEnabled = false;

function toggleAudio() {
  audioEnabled = !audioEnabled;
  audioStatus.textContent = audioEnabled ? 'Activo' : 'Silencio';
  btnAudio.textContent = audioEnabled ? '🔊' : '🔇';
  if (audioEnabled) {
    try { ambientAudio.volume = 0.3; ambientAudio.play(); } catch (e) {}
  } else {
    ambientAudio.pause();
  }
}

/* -----------------------------
   Modals
----------------------------- */
function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }

/* Theme selection buttons */
modalTheme.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn[data-theme]');
  if (!btn) return;
  chosenTheme = btn.getAttribute('data-theme');
  updatePreview();
  closeModal(modalTheme);
});
closeTheme.addEventListener('click', () => closeModal(modalTheme));

/* Players selection buttons */
modalPlayers.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn[data-count]');
  if (!btn) return;
  playersCount = Number(btn.getAttribute('data-count'));
  closeModal(modalPlayers);
});
closePlayers.addEventListener('click', () => closeModal(modalPlayers));

/* -----------------------------
   Events
----------------------------- */
btnTheme.addEventListener('click', () => openModal(modalTheme));
btnPlayers.addEventListener('click', () => openModal(modalPlayers));
btnPlay.addEventListener('click', () => startGame());
btnEndTurn.addEventListener('click', () => endTurn());
btnNextRound.addEventListener('click', () => nextRound());
btnNewGame.addEventListener('click', () => resetToHome());
btnAudio.addEventListener('click', () => toggleAudio());

/* Initial preview */
updatePreview();

/* -----------------------------
   Particles Background + Cursor Glow
----------------------------- */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d', { alpha: true });
let width = 0, height = 0, particles = [];
const PARTICLE_COUNT = 120;
const COLORS = ['#8a2be2', '#1e90ff', '#ff2d55'];

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createParticles() {
  particles = new Array(PARTICLE_COUNT).fill(0).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: Math.random() * 2 + 1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  }));
}
createParticles();

let mouseX = width / 2;
let mouseY = height / 2;
const glow = document.getElementById('cursorGlow');

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  glow.style.left = `${mouseX}px`;
  glow.style.top = `${mouseY}px`;
});

function animate() {
  ctx.clearRect(0, 0, width, height);

  // Draw soft gradient background shimmer
  const grad = ctx.createRadialGradient(mouseX, mouseY, 60, mouseX, mouseY, 400);
  grad.addColorStop(0, 'rgba(138,43,226,0.06)');
  grad.addColorStop(1, 'rgba(30,144,255,0.02)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Move & draw particles
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;

    // gentle wrap
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;

    // slight mouse attraction
    const dx = mouseX - p.x;
    const dy = mouseY - p.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const force = Math.min(1 / dist, 0.02);
    p.vx += (dx * force) * 0.002;
    p.vy += (dy * force) * 0.002;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.8;
    ctx.fill();

    // neon glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });

  // connect near particles with faint lines
  ctx.lineWidth = 0.6;
  particles.forEach((p, i) => {
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < 140*140) {
        const a = 1 - (Math.sqrt(d2) / 140);
        ctx.strokeStyle = `rgba(142, 202, 255, ${a * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(animate);
}
animate();

/* -----------------------------
   Accessibility / Keyboard
----------------------------- */
document.addEventListener('keydown', (e) => {
  if (!gameActive) return;
  // Enter or Space can end turn
  if ((e.key === 'Enter' || e.key === ' ') && !overlayTransition.classList.contains('active')) {
    endTurn();
  } else if ((e.key === 'Enter' || e.key === ' ') && overlayTransition.classList.contains('active')) {
    nextRound();
  }
});

/* -----------------------------
   Dev note: To enable sounds
----------------------------- */
/*
- Ambient music: set ambientAudio.src to a local loop file (soft synth pad).
- Impostor SFX: set impostorSfx.src to a short pulse/beep file.
  Example:
    ambientAudio.src = 'ambient-loop.mp3';
    impostorSfx.src = 'impostor-pulse.mp3';
  Then the in-app 🔊 toggle will play/pause ambient music.
*/




