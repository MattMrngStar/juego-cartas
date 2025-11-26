/* ================================
   CONFIGURACIÓN DEL JUEGO
================================ */

const correctOrder = [0,1,2,3,4,5,6]; // Orden verdadero según los slots
const totalCards = 7;

// Rutas de las cartas (AQUÍ SE AJUSTA A LO QUE USAS)
const cardImages = [
  "Cartas/CartasPFE-01.png",
  "Cartas/CartasPFE-02.png",
  "Cartas/CartasPFE-03.png",
  "Cartas/CartasPFE-04.png",
  "Cartas/CartasPFE-05.png",
  "Cartas/CartasPFE-06.png",
  "Cartas/CartasPFE-07.png"
];

/* ================================
   VARIABLES
================================ */
let draggedCard = null;
let boardSlots = [];
let score = 0;
let timeLeft = 300;
let timerInterval;

/* ================================
   ELEMENTOS DEL DOM
================================ */
const startScreen = document.getElementById("start-screen");
const gameArea = document.getElementById("game-area");
const endScreen = document.getElementById("end-screen");

const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const finalScoreEl = document.getElementById("final-score");

const btnStart = document.getElementById("btn-start");
const btnCheck = document.getElementById("btn-check");
const btnRestart = document.getElementById("btn-restart");
const btnPlayAgain = document.getElementById("btn-play-again");

const bgMusic = document.getElementById("bg-music");

/* Guía */
const btnOpenGuide = document.getElementById("btn-open-solution");
const btnCloseGuide = document.getElementById("btn-close-solution");
const solutionOverlay = document.getElementById("solution-overlay");

/* ================================
   INICIO DEL JUEGO
================================ */
btnStart.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  gameArea.classList.remove("hidden");
  startGame();
});

/* ================================
   INICIALIZAR JUEGO
================================ */
function startGame() {

  // Música
  bgMusic.volume = 0.4;
  bgMusic.play().catch(() => {});

  score = 0;
  timeLeft = 300;
  scoreEl.textContent = score;
  timerEl.textContent = timeLeft;

  loadCards();
  startTimer();
}

/* ================================
   CARGAR CARTAS ALEATORIAS
================================ */
function loadCards() {
  boardSlots = Array.from(document.querySelectorAll(".slot"));

  // Limpiar slots
  boardSlots.forEach(slot => slot.innerHTML = "");

  const shuffled = cardImages
    .map((img, index) => ({ img, index }))
    .sort(() => Math.random() - 0.5);

  shuffled.forEach(obj => {
    const card = document.createElement("img");
    card.src = obj.img;
    card.classList.add("card");
    card.draggable = true;
    card.dataset.value = obj.index;

    // eventos
    card.addEventListener("dragstart", dragStart);
    card.addEventListener("touchstart", dragStartTouch);

    card.addEventListener("dragend", dragEnd);
    card.addEventListener("touchend", dragEndTouch);

    // meter al DOM
    const container = document.createElement("div");
    container.classList.add("card-container");
    container.appendChild(card);

    document.getElementById("board").appendChild(container);
  });

  boardSlots.forEach(slot => {
    slot.addEventListener("dragover", dragOver);
    slot.addEventListener("drop", dropCard);

    slot.addEventListener("touchmove", dragOverTouch);
    slot.addEventListener("touchend", dropCardTouch);
  });
}

/* ================================
   DRAG & DROP – DESKTOP
================================ */
function dragStart(e) {
  draggedCard = e.target;
  setTimeout(() => draggedCard.classList.add("hidden"), 0);
}

function dragEnd() {
  draggedCard.classList.remove("hidden");
  draggedCard = null;
}

function dragOver(e) {
  e.preventDefault();
}

function dropCard(e) {
  if (!draggedCard) return;
  e.target.innerHTML = "";
  e.target.appendChild(draggedCard);
}

/* ================================
   DRAG & DROP – TOUCH
================================ */
function dragStartTouch(e) {
  draggedCard = e.target;
  draggedCard.classList.add("dragging-touch");
}

function dragEndTouch() {
  if (draggedCard) draggedCard.classList.remove("dragging-touch");
  draggedCard = null;
}

function dragOverTouch(e) {
  e.preventDefault();
}

function dropCardTouch(e) {
  const touch = e.changedTouches[0];
  const elem = document.elementFromPoint(touch.clientX, touch.clientY);

  const slot = elem.closest(".slot");
  if (slot && draggedCard) {
    slot.innerHTML = "";
    slot.appendChild(draggedCard);
  }
}

/* ================================
   VALIDAR ORDEN
================================ */
btnCheck.addEventListener("click", () => {
  let correct = 0;

  boardSlots.forEach((slot, i) => {
    const card = slot.querySelector(".card");
    if (card && Number(card.dataset.value) === correctOrder[i]) {
      correct++;
    }
  });

  score = correct * 10;
  scoreEl.textContent = score;

  if (correct === totalCards) {
    endGame(true);
  } else {
    alert("Algunos pasos no están en orden. Intenta nuevamente.");
  }
});

/* ================================
   REINICIAR
================================ */
btnRestart.addEventListener("click", () => {
  loadCards();
});

/* ================================
   FINAL DEL JUEGO
================================ */
function endGame(completed) {
  clearInterval(timerInterval);

  finalScoreEl.textContent = score;

  gameArea.classList.add("hidden");
  endScreen.classList.remove("hidden");

  if (completed) {
    btnOpenGuide.classList.remove("hidden");
  }
}

btnPlayAgain.addEventListener("click", () => {
  endScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

/* ================================
   GUÍA
================================ */
btnOpenGuide.addEventListener("click", () => {
  solutionOverlay.classList.remove("hidden");
});

btnCloseGuide.addEventListener("click", () => {
  solutionOverlay.classList.add("hidden");
});

/* ================================
   TIMER
================================ */
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame(false);
    }
  }, 1000);
}
