/* ---------------------------
   script.js - reemplaza entero
   --------------------------- */

/* Rutas/orden correcto (usa tu carpeta Cartas/) */
const correctOrder = [
  "CartasPFE-01.png",
  "CartasPFE-02.png",
  "CartasPFE-03.png",
  "CartasPFE-04.png",
  "CartasPFE-05.png",
  "CartasPFE-06.png",
  "CartasPFE-07.png"
];

/* DOM */
const startScreen = document.getElementById('start-screen');
const btnStart = document.getElementById('btn-start');
const gameArea = document.getElementById('game-area');
const board = document.getElementById('board');
const slots = Array.from(document.querySelectorAll('.slot'));
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const btnCheck = document.getElementById('btn-check');
const btnRestart = document.getElementById('btn-restart');
const endScreen = document.getElementById('end-screen');
const resultTitle = document.getElementById('result-title');
const finalScoreEl = document.getElementById('final-score');
const btnPlayAgain = document.getElementById('btn-play-again');

let timer = null;
let timeLeft = 300;
let score = 0;

/* Drag state */
let draggingCard = null;
let dragClone = null;
let originSlot = null;
let pointerId = null;
let pointerOffset = {x:0,y:0};
let lastPos = {x:0,y:0};

/* UTIL: barajar */
function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }

/* Crear un elemento <img> carta (jugable) */
function createCardElement(imgName){
  const img = document.createElement('img');
  img.className = 'card';
  img.draggable = false; // evitar drag nativo
  img.src = `Cartas/${imgName}`;
  img.alt = imgName;
  img.dataset.image = imgName;
  addPointerHandlers(img);
  return img;
}

/* Colocar cartas mezcladas dentro de los slots (slots fijos) */
function placeShuffledCards(){
  const shuffled = shuffle(correctOrder);
  slots.forEach((slot,i)=>{
    slot.innerHTML = '';
    const card = createCardElement(shuffled[i]);
    slot.appendChild(card);
  });
}

/* POINTER DRAG (clone follows pointer) */
function addPointerHandlers(card){
  card.addEventListener('pointerdown', onPointerDown);
  card.addEventListener('dragstart', e => e.preventDefault());
}

function onPointerDown(e){
  // solo botón primario / toque
  if (e.button && e.button !== 0) return;

  draggingCard = e.currentTarget;
  originSlot = draggingCard.parentElement;
  pointerId = e.pointerId;
  draggingCard.setPointerCapture(pointerId);

  const rect = draggingCard.getBoundingClientRect();
  pointerOffset.x = e.clientX - rect.left;
  pointerOffset.y = e.clientY - rect.top;
  lastPos.x = e.clientX; lastPos.y = e.clientY;

  // crear clon que seguirá al cursor
  dragClone = draggingCard.cloneNode(true);
  dragClone.classList.add('dragging-clone');
  dragClone.style.width = rect.width + 'px';
  dragClone.style.height = rect.height + 'px';
  dragClone.style.left = (e.clientX - pointerOffset.x) + 'px';
  dragClone.style.top  = (e.clientY - pointerOffset.y) + 'px';
  document.body.appendChild(dragClone);

  // ocultar el original (pero no quitarlo del DOM)
  draggingCard.style.visibility = 'hidden';

  document.addEventListener('pointermove', onPointerMove, {passive:false});
  document.addEventListener('pointerup', onPointerUp, {once:true});
}

function onPointerMove(e){
  if(!dragClone) return;
  e.preventDefault();

  const x = e.clientX - pointerOffset.x;
  const y = e.clientY - pointerOffset.y;

  const dx = e.clientX - lastPos.x;
  // rotación pequeña según dx
  const rot = Math.max(-14, Math.min(14, dx * 0.6));

  dragClone.style.left = x + 'px';
  dragClone.style.top  = y + 'px';
  dragClone.style.transform = `scale(1.06) rotate(${rot}deg)`;

  // highlight nearest slot under pointer
  const elem = document.elementFromPoint(e.clientX, e.clientY);
  const slotUnder = elem ? elem.closest('.slot') : null;
  slots.forEach(s => s.classList.toggle('over', s === slotUnder));
  lastPos.x = e.clientX; lastPos.y = e.clientY;
}

/* Encuentra el slot más cercano al punto (fallback) */
function nearestSlotToPoint(x,y){
  let best = null; let bestD = Infinity;
  slots.forEach(s=>{
    const r = s.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    const d = Math.hypot(cx - x, cy - y);
    if (d < bestD) { bestD = d; best = s; }
  });
  return best;
}

function onPointerUp(e){
  if(!dragClone || !draggingCard) return;

  document.removeEventListener('pointermove', onPointerMove);

  const elem = document.elementFromPoint(e.clientX, e.clientY);
  let targetSlot = elem ? elem.closest('.slot') : null;
  if(!targetSlot) targetSlot = nearestSlotToPoint(e.clientX, e.clientY);
  if(!targetSlot) targetSlot = originSlot;

  // Si mismo slot → devolver
  if(targetSlot === originSlot){
    originSlot.appendChild(draggingCard);
  } else {
    // swap si hay carta ya
    const existing = targetSlot.querySelector('.card');
    if(existing){
      originSlot.appendChild(existing);
    }
    targetSlot.appendChild(draggingCard);
  }

  // limpiar visuales
  slots.forEach(s => s.classList.remove('over'));

  // destruir clon y mostrar original
  dragClone.remove();
  dragClone = null;

  draggingCard.style.visibility = 'visible';
  try { draggingCard.releasePointerCapture(pointerId); } catch(e){ /* ignore */ }
  draggingCard = null;
  originSlot = null;
  pointerId = null;
}

/* --- Juego: timer, start, check, restart --- */
function startTimer(){
  clearInterval(timer);
  timeLeft = 300;
  timerEl.textContent = timeLeft;
  timer = setInterval(()=>{
    timeLeft--;
    timerEl.textContent = timeLeft;
    if(timeLeft <= 0){
      clearInterval(timer);
      showEnd(false);
    }
  },1000);
}

function startGame(){
  placeShuffledCards();
  score = 0; scoreEl.textContent = score;
  // show area
  startScreen.classList.add('hidden');
  gameArea.classList.remove('hidden');
  endScreen.classList.add('hidden');
  startTimer();
}

function checkOrder(){
  const current = slots.map(s => s.querySelector('.card')?.dataset.image || null);
  // si hay algún slot vacío => no válido
  if(current.includes(null)){ alert('Faltan cartas en algunos slots.'); return; }

  if(JSON.stringify(current) === JSON.stringify(correctOrder)){
    const bonus = Math.max(0, timeLeft) * 10;
    score = 1000 + bonus;
    scoreEl.textContent = score;
    clearInterval(timer);
    showEnd(true, score);
  } else {
    alert('El orden no es correcto, sigue intentando.');
  }
}

function restartGame(){
  placeShuffledCards();
  score = 0; scoreEl.textContent = score;
  clearInterval(timer);
  timeLeft = 300; timerEl.textContent = timeLeft;
  startTimer();
  endScreen.classList.add('hidden');
  gameArea.classList.remove('hidden');
}

function showEnd(success, points=0){
  if(success){
    resultTitle.textContent = '¡Correcto! 🎉';
  } else {
    resultTitle.textContent = 'Tiempo agotado ⏳';
  }
  finalScoreEl.textContent = points;
  endScreen.classList.remove('hidden');
  gameArea.classList.add('hidden');
}

/* Botones */
btnStart.addEventListener('click', startGame);
btnCheck.addEventListener('click', checkOrder);
btnRestart.addEventListener('click', restartGame);
btnPlayAgain.addEventListener('click', ()=> {
  startScreen.classList.remove('hidden');
  endScreen.classList.add('hidden');
});

/* Inicial (muestra tablero vacío hasta iniciar) */
placeShuffledCards(); // coloca cartas iniciales (si quieres que aparezca el tablero desde el inicio)
gameArea.classList.add('hidden');
