// ====================
//       VARIABLES
// ====================
const board = document.getElementById("board");
const triesSpan = document.getElementById("tries");
let tries = 0;

const correctOrder = [1,2,3,4,5,6,7,8];

let draggedCard = null;

// ====================
//   CREAR TABLERO
// ====================
function createBoard(){
  board.innerHTML = "";
  const numbers = [...correctOrder];

  numbers.sort(() => Math.random() - 0.5);

  numbers.forEach(n => {
    const cont = document.createElement("div");
    cont.className = "slot-container";

    const slot = document.createElement("div");
    slot.className = "slot";

    const img = document.createElement("img");
    img.src = `cartas/${n}.png`;   // ❤️ Tu lógica ORIGINAL
    img.className = "card";
    img.draggable = true;
    img.dataset.num = n;

    slot.appendChild(img);
    cont.appendChild(slot);
    board.appendChild(cont);
  });

  enableDrag();
}

// ====================
//       DRAG + DROP
// ====================
function enableDrag(){
  const cards = document.querySelectorAll(".card");
  const slots = document.querySelectorAll(".slot");

  cards.forEach(card=>{
    card.addEventListener("dragstart", e=>{
      draggedCard = e.target;
      setTimeout(()=> card.style.opacity="0.2", 0);
    });

    card.addEventListener("touchstart", e=>{
      draggedCard = e.target;
    });

    card.addEventListener("dragend", e=>{
      card.style.opacity="1";
    });
  });

  slots.forEach(slot=>{
    slot.addEventListener("dragover", e=> e.preventDefault());

    slot.addEventListener("drop", e=>{
      if(draggedCard){
        if(slot.children.length > 0){
          const temp = slot.children[0];
          const origin = draggedCard.parentElement;
          slot.appendChild(draggedCard);
          origin.appendChild(temp);
        } else {
          slot.appendChild(draggedCard);
        }
      }
    });
  });
}

// ====================
//       VERIFICAR
// ====================
document.getElementById("check-btn").onclick = ()=>{
  tries++;
  triesSpan.textContent = tries;

  const placed = [...document.querySelectorAll(".slot img")].map(x=>+x.dataset.num);

  if(JSON.stringify(placed) === JSON.stringify(correctOrder)){
    alert("¡Correcto! 🎉");
  } else {
    alert("Aún no es la solución.");
  }
};

// ====================
//      REINICIAR
// ====================
document.getElementById("reset-btn").onclick = ()=>{
  tries = 0;
  triesSpan.textContent = 0;
  createBoard();
};

// ====================
//      GUIA
// ====================
const guideBtn = document.getElementById("open-guide");
const guideOverlay = document.getElementById("guide-overlay");
const closeGuide = document.getElementById("close-guide");

guideBtn.onclick = ()=> guideOverlay.classList.remove("hidden");
closeGuide.onclick = ()=> guideOverlay.classList.add("hidden");

// ====================
//      INICIO
// ====================
document.getElementById("start-btn").onclick = ()=>{
  document.getElementById("start-overlay").classList.add("hidden");
  guideBtn.classList.remove("hidden");
  createBoard();
};
