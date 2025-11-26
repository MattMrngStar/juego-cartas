// ===========
// Elementos
// ===========
const startOverlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");
const gameArea = document.getElementById("game-area");
const board = document.getElementById("board");
const triesTxt = document.getElementById("tries");
const checkBtn = document.getElementById("check-btn");
const resetBtn = document.getElementById("reset-btn");

// Guía
const guideOverlay = document.getElementById("guide-overlay");
const openGuide = document.getElementById("open-guide");
const closeGuide = document.getElementById("close-guide");

// ===========
// Configuración
// ===========
const correctOrder = ["1", "2", "3"];
let tries = 0;

// ===========
// Iniciar juego
// ===========
startBtn.addEventListener("click", () => {
  startOverlay.classList.add("hidden");
  gameArea.classList.remove("hidden");
  loadCards();
});

// ===========
// Cargar cartas
// ===========
function loadCards() {
  board.innerHTML = "";

  correctOrder.forEach((num, index) => {
    const cont = document.createElement("div");
    cont.className = "slot-container";

    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = index;

    const img = document.createElement("img");
    img.src = `Cartas/${num}.png`;
    img.className = "card";
    img.draggable = true;
    img.dataset.value = num;

    cont.appendChild(slot);
    cont.appendChild(img);
    board.appendChild(cont);

    dragEvents(img);
  });
}

// ===========
// Arrastrar
// ===========
function dragEvents(card) {

  card.addEventListener("dragstart", () => {
    setTimeout(() => card.classList.add("hidden"), 0);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("hidden");
  });

  document.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());

    slot.addEventListener("drop", () => {
      slot.innerHTML = "";
      slot.appendChild(card);
    });
  });

}

// ===========
// Comprobar
// ===========
checkBtn.addEventListener("click", () => {
  tries++;
  triesTxt.textContent = tries;

  const placed = [...document.querySelectorAll(".slot")].map(slot => {
    const c = slot.querySelector("img");
    return c ? c.dataset.value : null;
  });

  if (JSON.stringify(placed) === JSON.stringify(correctOrder)) {
    alert("¡Correcto!");
  } else {
    alert("Aún no es correcto. Revisa el orden.");
  }
});

// ===========
// Reiniciar
// ===========
resetBtn.addEventListener("click", loadCards);

// ===========
// GUÍA
// ===========
openGuide.addEventListener("click", () => {
  guideOverlay.classList.remove("hidden");
});

closeGuide.addEventListener("click", () => {
  guideOverlay.classList.add("hidden");
});

