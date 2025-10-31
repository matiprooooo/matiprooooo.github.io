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

// 🎯 Elementos del DOM
const screenHome = document.getElementById('screenHome');
const screenLobby = document.getElementById('screenLobby');
const screenGame = document.getElementById('screenGame');
const screenVotacion = document.getElementById('screenVotacion');
const screenFinal = document.getElementById('screenFinal');
const inputNombre = document.getElementById('inputNombre');
const inputSala = document.getElementById('inputSala');
const btnUnirse = document.getElementById('btnUnirse');
const btnIniciar = document.getElementById('btnIniciar');
const btnTerminar = document.getElementById('btnTerminar');
const btnVolver = document.getElementById('btnVolver');
const btnEnviarVoto = document.getElementById('btnEnviarVoto');
const lobbySalaID = document.getElementById('lobbySalaID');
const listaJugadores = document.getElementById('listaJugadores');
const listaVotacion = document.getElementById('listaVotacion');
const wordDisplay = document.getElementById('wordDisplay');
const hudSala = document.getElementById('hudSala');
const hudJugador = document.getElementById('hudJugador');

const THEMES = {
  'Cosas': ['Lámpara','Teclado','Puerta','Cámara','Auriculares','Bicicleta','Cuchillo','Libro','Reloj','Silla','Ventana','Mesa','Botella','Llave','Plancha','Cargador','Pelota','Cepillo','Espejo','Martillo']
};

let nombreJugador = '';
let salaID = '';
let esCreador = false;
let palabraMostrada = false;
let votoSeleccionado = '';
let rondaActual = 1;

// 🧠 Pantallas
function setScreen(screen) {
  [screenHome, screenLobby, screenGame, screenVotacion, screenFinal].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// 🚪 Unirse a sala
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
      estado: "esperando",
      ronda: 1,
      eliminados: [],
      votos: {}
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
  escucharSala();
  btnIniciar.style.display = esCreador ? 'inline-block' : 'none';
}

// 👂 Escuchar cambios en la sala
function escucharSala() {
  db.collection("salas").doc(salaID).onSnapshot((doc) => {
    const datos = doc.data();
    const jugadores = datos.jugadores || [];
    listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join('');

    if (datos.estado === "jugando" && datos.palabras && !palabraMostrada) {
      const index = jugadores.indexOf(nombreJugador);
      if (index === -1) return;
      const palabra = datos.palabras[index];
      wordDisplay.textContent = palabra;
      palabraMostrada = true;
      setScreen(screenGame);
    }

    if (datos.estado === "votando" && !datos.eliminados.includes(nombreJugador)) {
      cargarOpcionesDeVoto(jugadores);
      setScreen(screenVotacion);
    }
  });
}

// 🧩 Iniciar partida
async function iniciarPartida() {
  const salaRef = db.collection("salas").doc(salaID);
  const doc = await salaRef.get();
  const datos = doc.data();
  const jugadores = datos.jugadores || [];
  const cantidad = jugadores.length;
  const impostores = cantidad > 5 ? 2 : 1;
  const posiciones = [];

  while (posiciones.length < impostores) {
    const r = Math.floor(Math.random() * cantidad);
    if (!posiciones.includes(r)) posiciones.push(r);
  }

  const palabras = jugadores.map((_, i) => posiciones.includes(i) ? "IMPOSTOR" : THEMES['Cosas'][Math.floor(Math.random() * THEMES['Cosas'].length)]);
  const impostoresNombres = posiciones.map(i => jugadores[i]);

  await salaRef.update({
    estado: "jugando",
    palabras,
    impostores: impostoresNombres
  });
}

// 🗳️ Votación
function cargarOpcionesDeVoto(jugadores) {
  listaVotacion.innerHTML = '';
  jugadores.forEach(j => {
    if (j === nombreJugador) return;
    const li = document.createElement('li');
    li.textContent = j;
    li.addEventListener('click', () => {
      votoSeleccionado = j;
      document.querySelectorAll('#listaVotacion li').forEach(el => el.classList.remove('selected'));
      li.classList.add('selected');
    });
    listaVotacion.appendChild(li);
  });
}

btnEnviarVoto.addEventListener('click', async () => {
  if (!votoSeleccionado) return;

  const salaRef = db.collection("salas").doc(salaID);
  const doc = await salaRef.get();
  const datos = doc.data();
  const votos = datos.votos || {};
  votos[nombreJugador] = votoSeleccionado;

  await salaRef.update({ votos });
  verificarFinDeVotacion();
});

// 📊 Verificar votos
async function verificarFinDeVotacion() {
  const salaRef = db.collection("salas").doc(salaID);
  const doc = await salaRef.get();
  const datos = doc.data();
  const jugadores = datos.jugadores.filter(j => !datos.eliminados.includes(j));
  const votos = datos.votos || {};

  if (Object.keys(votos).length >= jugadores.length - 1) {
    const conteo = {};
    Object.values(votos).forEach(v => {
      conteo[v] = (conteo[v] || 0) + 1;
    });

    let masVotado = null;
    let maxVotos = 0;
    for (const jugador in conteo) {
      if (conteo[jugador] > maxVotos) {
        masVotado = jugador;
        maxVotos = conteo[jugador];
      }
    }

    const eliminados = datos.eliminados || [];
    eliminados.push(masVotado);
    const impostores = datos.impostores || [];
    const impostoresRestantes = impostores.filter(i => !eliminados.includes(i));
    const vivos = datos.jugadores.filter(j => !eliminados.includes(j));

    let mensaje = `${masVotado} fue eliminado.\n`;
    mensaje += impostores.includes(masVotado) ? "¡Era un impostor!" : "No era un impostor.";

    alert(mensaje);

    if (impostoresRestantes.length === 0) {
      alert("¡Ganaron los jugadores!");
      setScreen(screenFinal);
    } else if ((datos.jugadores.length <= 5 && vivos.length <= 2) || (datos.jugadores.length > 5 && vivos.length <= 3 && impostoresRestantes.length > 0)) {
      alert("¡Ganaron los impostores!");
      setScreen(screenFinal);
    } else {
      await salaRef.update({
        votos: {},
        eliminados,
        ronda: datos.ronda + 1,
        estado: "votando"
      });
    }
  }
}

// 🔚 Terminar juego → inicia votación
function terminarJuego() {
  db.collection("salas").doc(salaID).update({ estado: "votando" });
}

// 🔁 Volver al inicio
function volverInicio() {
  setScreen(screenHome);
  palabraMostrada = false;
  votoSeleccionado = '';
  rondaActual = 1;
}

// 🧷 Eventos
btnUnirse.addEventListener('click', unirseASala);
btnIniciar.addEventListener('click', iniciarPartida
