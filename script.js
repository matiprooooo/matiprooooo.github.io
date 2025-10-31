// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsL05e0PrFEqNUE7XwytZgqOviIrFyYSY",
  authDomain: "impostorgame-5d7ee.firebaseapp.com",
  projectId: "impostorgame-5d7ee",
  storageBucket: "impostorgame-5d7ee.firebasestorage.app",
  messagingSenderId: "90706939619",
  appId: "1:90706939619:web:cc9024682ef966ad68ffd6",
  measurementId: "G-PYEP3HE6XW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

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
const ambientAudio = document.getElementById('ambientAudio');
const impostorSfx = document.getElementById('impostorSfx');
const btnAudio = document.getElementById('btnAudio');
const audioStatus = document.getElementById('audioStatus');
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
let salaID = 'ABC123'; // Podés generar uno dinámico si querés
let audioEnabled = false;

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

    if (palabra === "IMPOSTOR" && impostorSfx && impostorSfx.src) {
      try { impostorSfx.currentTime = 0; impostorSfx.play(); } catch (e) {}
    }

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

// Audio
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

// Modales
function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }

modalTheme.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn[data-theme]');
  if (!btn) return;
  chosenTheme = btn.getAttribute('data-theme');
  updatePreview();
  closeModal(modalTheme);
});
closeTheme.addEventListener('click', () => closeModal(modalTheme));

modalPlayers.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn[data-count]');
  if (!btn) return;
  playersCount = Number(btn.getAttribute('data-count'));
  closeModal(modalPlayers);
});
closePlayers.addEventListener('click', () => closeModal(modalPlayers));

// Eventos
btnTheme.addEventListener('click', () => openModal(modalTheme));
btnPlayers.add
