let timeLeft = 300;
let timerId;
let score = 0;

// ELEMENTOS
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

const board = document.getElementById("board");
const slots = document.querySelectorAll(".slot");

// ASIGNAR NÚMEROS A LOS SLOTS
slots.forEach((slot, i) => {
  slot.setAttribute("data-label", i + 1);
});

// DEMO: CREAR CARTAS
const cardImages = [
  "Cartas/CartasPFE-01.png",
  "Cartas/CartasPFE-02.png",
  "Cartas/CartasPFE-03.png",
  "Cartas/CartasPFE-04.png",
  "Cartas/CartasPFE-05.png",
  "Cartas/CartasPFE-06.png",
  "Cartas/CartasPFE-07.png",
];

function createCards() {
  cardImages.forEach((src, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.index = i;
    card.innerHTML = `<img src="${src}" draggable="false">`;
    card.style.top = `${Math.random() * 200 + 200}px`;
    card.style.left = `${Math.random() * 300 + 50}px`;
    gameArea.appendChild(card);
    enableDrag(card);
  });
}

// DRAGGING
function enableDrag(card) {
  let offsetX, offsetY, currentSlot = null;

  function onDown(e) {
    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const rect = card.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    card.style.zIndex = 999;
    document.addEventListener(isTouch ? "touchmove" : "mousemove", onMove);
    document.addEventListener(isTouch ? "touchend" : "mouseup", onUp);
  }

  function onMove(e) {
    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    card.style.left = clientX - offsetX + "px";
    card.style.top = clientY - offsetY + "px";
  }

  function onUp(e) {
    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
    const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;

    let placed = false;
    slots.forEach((slot) => {
      const rect = slot.getBoundingClientRect();
      if (
        clientX > rect.left &&
        clientX < rect.right &&
        clientY > rect.top &&
        clientY < rect.bottom
      ) {
        card.style.left = rect.left + window.scrollX + "px";
        card.style.top = rect.top + window.scrollY + "px";
        placed = true;
        currentSlot = slot;
      }
    });

    if (!placed) {
      card.style.zIndex = 10;
    }

    document.removeEventListener(isTouch ? "touchmove" : "mousemove", onMove);
    document.removeEventListener(isTouch ? "touchend" : "mouseup", onUp);
  }

  card.addEventListener("mousedown", onDown);
  card.addEventListener("touchstart", onDown);
}

// TIMER
function startTimer() {
  timerId = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function startGame() {
  startScreen.classList.add("hidden");
  gameArea.classList.remove("hidden");
  timeLeft = 300;
  score = 0;
  timerEl.textContent = timeLeft;
  scoreEl.textContent = score;
  createCards();
  startTimer();
}

function endGame() {
  clearInterval(timerId);
  gameArea.classList.add("hidden");
  endScreen.classList.remove("hidden");
  finalScoreEl.textContent = score;
}

// BOTONES
btnStart.addEventListener("click", startGame);
btnRestart.addEventListener("click", () => location.reload());
btnPlayAgain.addEventListener("click", () => location.reload());


