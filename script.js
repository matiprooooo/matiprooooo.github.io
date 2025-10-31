const inputSala = document.getElementById('inputSala');
const hudSala = document.getElementById('hudSala');


const firebaseConfig = {
  apiKey: "AIzaSyBsL05e0PrFEqNUE7XwytZgqOviIrFyYSY",
  authDomain: "impostorgame-5d7ee.firebaseapp.com",
  projectId: "impostorgame-5d7ee",
  storageBucket: "impostorgame-5d7ee.firebasestorage.app",
  messagingSenderId: "90706939619",
  appId: "1:90706939619:web:cc9024682ef966ad68ffd6",
  measurementId: "G-PYEP3HE6XW"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos del DOM
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
const gameTitle = document.getElementById('gameTitle');

// Estado del juego
const THEMES = {
  'Cosas': ['Lámpara','Teclado','Puerta','Cámara','Auriculares','Bicicleta','Cuchillo','Libro','Reloj','Silla','Ventana','Mesa','Botella','Llave','Plancha','Cargador','Pelota','Cepillo','Espejo','Martillo'],
  'Personas': ["EMI","Nachito(AYO)","SOLIS","EBERTZ","CABALLITO","SHOSHI","AGUSTINA","FRANCISCO","MARTIN","POLLO","BAHIANO","NICOLAU","NAHUE(EL MAMUEL)","JOACO DE PIEDRAS BLANCAS","LA COQUETA","BRANDON","LA ANA","FRASQUITO","AXEL(ÑAÑITO)","IBAI","EL MOMO","CRISTINA","CHIQUI TAPIA","DAVO","LA COBRA","GASTON EDUL","EL IVAN","LA YANI","LA SEÑO PAU(INGLES)","HEBER ZAPATA","BAULETTI","MERNUEL","BAULETTI","MATIAS BOTTERO","MILICA"],
  'Futbolistas': ['Lionel Messi','Cristiano Ronaldo','Neymar','Kylian Mbappé','Erling Haaland','Kevin De Bruyne','Luka Modrić','Ángel Di María','Julián Álvarez','Paulo Dybala','Sergio Agüero','Ronaldinho','Zinedine Zidane','Andrés Iniesta','Xavi','Diego Maradona','Pelé','Francesco Totti','Didier Drogba','Wayne Rooney'],
  'Cartas de Clash Royale': ['Gigante','Montapuercos','Mago','Horda de esbirros','Valquiria','P.E.K.K.A','Tronco','Bebé dragón','Megacaballero','Bruja','Globo','Minero','Princesa','Chispitas','Esqueleto gigante','Barril de duendes','Mosquetera','Arquero mágico','Rayo','Rage']
};

let chosenTheme = 'Cosas';
let playersCount = 4;
let currentPlayer = 1;
let salaID = '';


// Funciones de pantalla
function setScreen(screen) {
  [screenHome, screenGame, screenFinal].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function updatePreview() {
  previewThemeName.textContent = chosenTheme;
  const list = THEMES[chosenTheme];
  const sample = list.slice(0, 5);
  previewList.innerHTML = sample.map(item => `<li>${item}</li>`).join('');
}

// Crear sala en Firestore
async function crearSala(codigo, tema, cantidadJugadores) {
  const palabras = asignarPalabras(tema, cantidadJugadores);
  await db.collection("salas").doc(codigo).set({
    tema,
    jugadores: cantidadJugadores,
    palabras,
    turnoActual: 1,
    estado: "jugando"
  });
}

// Asignar palabras e impostores
function asignarPalabras(tema, cantidad) {
  const lista = THEMES[tema];
  const palabra = lista[Math.floor(Math.random() * lista.length)];
  const impostores = cantidad > 5 ? 2 : 1;
  const posiciones = [];

  while (posiciones.length < impostores) {
    const r = Math.floor(Math.random() * cantidad);
    if (!posiciones.includes(r)) posiciones.push(r);
  }

  const resultado = [];
  for (let i = 0; i < cantidad; i++) {
    resultado.push(posiciones.includes(i) ? "IMPOSTOR" : palabra);
  }

  return resultado;
}

// Mostrar palabra del jugador actual
async function mostrarPalabra() {
  const doc = await db.collection("salas").doc(salaID).get();
  if (doc.exists) {
    const datos = doc.data();
    const palabra = datos.palabras[currentPlayer - 1];
    wordDisplay.textContent = palabra === "IMPOSTOR" ? "—" : palabra;
    impostorBadge.style.display = palabra === "IMPOSTOR" ? "block" : "none";
    turnInfo.textContent = `Jugador ${currentPlayer} de ${playersCount}`;
    hudTheme.textContent = datos.tema;
  }
}

// Avanzar turno
async function avanzarTurno() {
  const ref = db.collection("salas").doc(salaID);
  const doc = await ref.get();
  if (doc.exists) {
    const datos = doc.data();
    const siguiente = datos.turnoActual + 1;
    await ref.update({ turnoActual: siguiente });
    currentPlayer = siguiente;

    if (siguiente > playersCount) {
      setScreen(screenFinal);
    } else {
      mostrarPalabra();
    }
  }
}

// Iniciar partida
async function startGame() {
  currentPlayer = 1;
  salaID = inputSala.value.trim().toUpperCase() || 'ABC123';
hudSala.textContent = salaID;
  await crearSala(salaID, chosenTheme, playersCount);
  setScreen(screenGame);
  mostrarPalabra();
}

// Terminar turno
function endTurn() {
  wordDisplay.textContent = '—';
  impostorBadge.style.display = 'none';
  overlayTransition.classList.add('active');
}

// Volver al menú
function resetToHome() {
  setScreen(screenHome);
}

// Eventos
btnPlay.addEventListener('click', startGame);
btnEndTurn.addEventListener('click', endTurn);
btnNextRound.addEventListener('click', () => {
  overlayTransition.classList.remove('active');
  avanzarTurno();
});
btnNewGame.addEventListener('click', resetToHome);
gameTitle.addEventListener('click', resetToHome);

btnTheme.addEventListener('click', () => modalTheme.classList.add('active'));
btnPlayers.addEventListener('click', () => modalPlayers.classList.add('active'));
closeTheme.addEventListener('click', () => modalTheme.classList.remove('active'));
closePlayers.addEventListener('click', () => modalPlayers.classList.remove('active'));

modalTheme.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn[data-theme]');
  if (!btn) return;
  chosenTheme = btn.getAttribute('data-theme');
  updatePreview();
  modalTheme.classList.remove('active');
});

modalPlayers.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn[data-count]');
  if (!btn) return;
  playersCount = Number(btn.getAttribute('data-count'));
  modalPlayers.classList.remove('active');
});

// Inicializar vista previa
updatePreview();

