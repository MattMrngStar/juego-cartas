const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const checkBtn = document.getElementById("check-btn");

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");

const gameBoard = document.getElementById("game-board");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const finalScoreEl = document.getElementById("final-score");
const resultMsg = document.getElementById("result-msg");

let timeLeft = 60;
let score = 0;
let timer;
let dragged;

const correctOrder = [
  "CartasPFE-01.png",
  "CartasPFE-02.png",
  "CartasPFE-03.png",
  "CartasPFE-04.png",
  "CartasPFE-05.png",
  "CartasPFE-06.png",
  "CartasPFE-07.png"
];

function startGame() {
  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  timeLeft = 60;
  score = 0;
  timerEl.textContent = timeLeft;
  scoreEl.textContent = score;

  // Mezclar las cartas
  let shuffled = [...correctOrder].sort(() => Math.random() - 0.5);

  gameBoard.innerHTML = "";
  shuffled.forEach(imgName => {
    let card = document.createElement("div");
    card.classList.add("card");
    card.setAttribute("draggable", "true");
    card.dataset.image = imgName;

    let img = document.createElement("img");
    img.src = "Cartas/" + imgName; // ✅ Ajuste de ruta

    card.appendChild(img);
    gameBoard.appendChild(card);
  });

  enableDragDrop();
  startTimer();
}

function enableDragDrop() {
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    card.addEventListener("dragstart", e => {
      dragged = card;
    });

    card.addEventListener("dragover", e => {
      e.preventDefault();
    });

    card.addEventListener("drop", e => {
      e.preventDefault();
      if (dragged !== card) {
        let temp = dragged.innerHTML;
        let tempData = dragged.dataset.image;

        dragged.innerHTML = card.innerHTML;
        dragged.dataset.image = card.dataset.image;

        card.innerHTML = temp;
        card.dataset.image = tempData;
      }
    });
  });
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame(false);
    }
  }, 1000);
}

function checkOrder() {
  const currentOrder = Array.from(document.querySelectorAll(".card")).map(c => c.dataset.image);

  if (JSON.stringify(currentOrder) === JSON.stringify(correctOrder)) {
    let bonus = timeLeft * 10; 
    score = 1000 + bonus;
    scoreEl.textContent = score;
    endGame(true);
  } else {
    alert("El orden no es correcto, sigue intentando.");
  }
}

function endGame(success) {
  clearInterval(timer);
  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");

  if (success) {
    resultMsg.textContent = "¡Correcto! 🎉";
  } else {
    resultMsg.textContent = "Se acabó el tiempo ⏳";
  }

  finalScoreEl.textContent = score;
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
checkBtn.addEventListener("click", checkOrder);
