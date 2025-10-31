
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
const screenLobby = document.getElementById('screenLobby');
const screenGame = document.getElementById('screenGame');
const screenFinal = document.getElementById('screenFinal');
const inputNombre = document.getElementById('inputNombre');
const inputSala = document.getElementById('inputSala');
const btnUnirse = document.getElementById('btnUnirse');
const btnIniciar = document.getElementById('btnIniciar');
const btnTerminar = document.getElementById('btnTerminar');
const btnVolver = document.getElementById('btnVolver');
const lobbySalaID = document.getElementById('lobbySalaID');
const listaJugadores = document.getElementById('listaJugadores');
const wordDisplay = document.getElementById('wordDisplay');
const hudSala = document.getElementById('hudSala');
const hudJugador = document.getElementById('hudJugador');

// Estado del juego
const THEMES = {
  'Cosas': ['Lámpara','Teclado','Puerta','Cámara','Auriculares','Bicicleta','Cuchillo','Libro','Reloj','Silla','Ventana','Mesa','Botella','Llave','Plancha','Cargador','Pelota','Cepillo','Espejo','Martillo']
};

let nombreJugador = '';
let salaID = '';
let esCreador = false;
let palabraMostrada = false;

// Funciones de pantalla
function setScreen(screen) {
  [screenHome, screenLobby, screenGame, screenFinal].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// Unirse a sala
async function unirseASala() {
  nombreJugador = inputNombre.value.trim();
  salaID = inputSala.value.trim().toUpperCase();

  if (!nombreJugador || !salaID) return;

  const salaRef = db.collection("salas").doc(salaID);
  const doc = await salaRef.get();

  if (!doc.exists) {
    esCreador = true;
    await salaRef.set({
      creador: nombreJugador,
      jugadores: [nombreJugador],
      estado: "esperando"
    });
  } else {
    const datos = doc.data();
    const jugadores = datos.jugadores || [];
    if (!jugadores.includes(nombreJugador)) {
      jugadores.push(nombreJugador);
      await salaRef.update({ jugadores });
    }
    esCreador = datos.creador === nombreJugador;
  }

  lobbySalaID.textContent = salaID;
  hudSala.textContent = salaID;
  hudJugador.textContent = nombreJugador;
  setScreen(screenLobby);
  escucharJugadores();
  btnIniciar.style.display = esCreador ? 'inline-block' : 'none';
}

// Escuchar jugadores conectados
function escucharJugadores() {
  db.collection("salas").doc(salaID).onSnapshot((doc) => {
    const datos = doc.data();
    const jugadores = datos.jugadores || [];
    listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join('');
  });
}

// Iniciar partida (solo creador)
async function iniciarPartida() {
  const salaRef = db.collection("salas").doc(salaID);
  const doc = await salaRef.get();
  if (!doc.exists) return;

  const datos = doc.data();
  const jugadores = datos.jugadores || [];
  const palabras = asignarPalabras(jugadores.length);

  await salaRef.update({
    estado: "jugando",
    palabras
  });

  mostrarPalabra(jugadores);
}

// Asignar palabras e impostores
function asignarPalabras(cantidad) {
  const lista = THEMES['Cosas'];
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
async function mostrarPalabra(jugadores) {
  if (palabraMostrada) return;

  const index = jugadores.indexOf(nombreJugador);
  const doc = await db.collection("salas").doc(salaID).get();
  const datos = doc.data();
  const palabra = datos.palabras[index];

  wordDisplay.textContent = palabra === "IMPOSTOR" ? "—" : palabra;
  palabraMostrada = true;
  setScreen(screenGame);
}

// Terminar juego
function terminarJuego() {
  setScreen(screenFinal);
}

// Volver al inicio
function volverInicio() {
  setScreen(screenHome);
  palabraMostrada = false;
}

// Eventos
btnUnirse.addEventListener('click', unirseASala);
btnIniciar.addEventListener('click', iniciarPartida);
btnTerminar.addEventListener('click', terminarJuego);
btnVolver.addEventListener('click', volverInicio);
