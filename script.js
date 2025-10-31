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

// 🎯 DOM elements
const screenHome = document.getElementById('screenHome');
const screenLobby = document.getElementById('screenLobby');
const screenGame = document.getElementById('screenGame');
const inputNombre = document.getElementById('inputNombre');
const inputSala = document.getElementById('inputSala');
const btnUnirse = document.getElementById('btnUnirse');
const btnIniciar = document.getElementById('btnIniciar');
const btnVolver = document.getElementById('btnVolver');
const btnTerminar = document.getElementById('btnTerminar');
const lobbySalaID = document.getElementById('lobbySalaID');
const listaJugadores = document.getElementById('listaJugadores');
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

// 🧠 Pantallas
function setScreen(screen) {
  [screenHome, screenLobby, screenGame].forEach(s => s.classList.remove('active'));
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

  // Presencia
  const presenciaRef = salaRef.collection("presencia").doc(nombreJugador);
  await presenciaRef.set({ activo: true });
  window.addEventListener("beforeunload", () => {
    presenciaRef.delete();
  });

  lobbySalaID.textContent = salaID;
  hudSala.textContent = salaID;
  hudJugador.textContent = nombreJugador;
  setScreen(screenLobby);
  escucharSala();
  escucharPresencia();
  btnIniciar.style.display = esCreador ? 'inline-block' : 'none';
}

// 👂 Escuchar sala
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
      wordDisplay.classList.toggle("impostor", palabra === "IMPOSTOR");
      palabraMostrada = true;
      setScreen(screenGame);
    }
  });
}

// 👥 Escuchar presencia
function escucharPresencia() {
  const salaRef = db.collection("salas").doc(salaID);
  salaRef.collection("presencia").onSnapshot(async (snapshot) => {
    const activos = snapshot.docs.map(doc => doc.id);
    if (activos.length === 0) {
      await salaRef.delete();
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

  const palabraComun = THEMES['Cosas'][Math.floor(Math.random() * THEMES['Cosas'].length)];
  const palabras = jugadores.map((_, i) =>
    posiciones.includes(i) ? "IMPOSTOR" : palabraComun
  );

  await salaRef.update({
    estado: "jugando",
    palabras
  });
}

// 🔁 Volver al inicio
btnVolver.addEventListener('click', async () => {
  if (esCreador && salaID) {
    await db.collection("salas").doc(salaID).delete();
  }
  setScreen(screenHome);
  palabraMostrada = false;
});

// 🧷 Eventos
btnUnirse.addEventListener('click', unirseASala);
btnIniciar.addEventListener('click', iniciarPartida);
btnTerminar.addEventListener('click', () => {
  setScreen(screenHome);
  palabraMostrada = false;
});
