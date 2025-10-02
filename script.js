/* ---------------------------
   script.js optimizado
   --------------------------- */

/* Orden correcto */
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
let pointerOffset = {x:0,y:0};
let currentPos = {x:0,y:0};
let lastPos = {x:0,y:0};
let dragging = false;
let rafId = null;

/* --- Utilidades --- */
function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }

function createCardElement(imgName){
  const img = document.createElement('img');
  img.className = 'card';
  img.draggable = false;
  img.src = `Cartas/${imgName}`;
  img.alt = imgName;
  img.dataset.image = imgName;
  img.style.willChange = "transform"; // optimiza GPU
  img.addEventListener('pointerdown', onPointerDown);
  return img;
}

function placeShuffledCards(){
  const shuffled = shuffle(correctOrder);
  slots.forEach((slot,i)=>{
    slot.innerHTML = '';
    const card = createCardElement(shuffled[i]);
    slot.appendChild(card);
  });
}

/* --- Drag con requestAnimationFrame --- */
function onPointerDown(e){
  if (e.button && e.button !== 0) return;

  draggingCard = e.currentTarget;
  originSlot = draggingCard.parentElement;

  const rect = draggingCard.getBoundingClientRect();
  pointerOffset.x = e.clientX - rect.left;
  pointerOffset.y = e.clientY - rect.top;

  currentPos.x = e.clientX - pointerOffset.x;
  currentPos.y = e.clientY - pointerOffset.y;
  lastPos.x = e.clientX;
  lastPos.y = e.clientY;

  // clon
  dragClone = draggingCard.cloneNode(true);
  dragClone.classList.add('dragging-clone');
  dragClone.style.width = rect.width + 'px';
  dragClone.style.height = rect.height + 'px';
  document.body.appendChild(dragClone);

  draggingCard.style.visibility = 'hidden';

  dragging = true;
  document.addEventListener('pointermove', onPointerMove, {passive:false});
  document.addEventListener('pointerup', onPointerUp, {once:true});

  // Inicia animación
  rafId = requestAnimationFrame(updateDragClone);
}

function onPointerMove(e){
  if(!dragging) return;
  e.preventDefault();
  currentPos.x = e.clientX - pointerOffset.x;
  currentPos.y = e.clientY - pointerOffset.y;
  lastPos.x = e.clientX;
  lastPos.y = e.clientY;
}

function updateDragClone(){
  if(!dragClone) return;

  const dx = currentPos.x - lastPos.x;
  const rot = Math.max(-14, Math.min(14, dx * 0.6));

  dragClone.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px) scale(1.06) rotate(${rot}deg)`;

  // highlight slot bajo el puntero
  const elem = document.elementFromPoint(lastPos.x, lastPos.y);
  const slotUnder = elem ? elem.closest('.slot') : null;
  slots.forEach(s => s.classList.toggle('over', s === slotUnder));

  if(dragging) rafId = requestAnimationFrame(updateDragClone);
}

function nearestSlotToPoint(x,y){
  let best = null, bestD = Infinity;
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
  dragging = false;
  cancelAnimationFrame(rafId);

  const elem = document.elementFromPoint(e.clientX, e.clientY);
  let targetSlot = elem ? elem.closest('.slot') : null;
  if(!targetSlot) targetSlot = nearestSlotToPoint(e.clientX, e.clientY);
  if(!targetSlot) targetSlot = originSlot;

  if(targetSlot === originSlot){
    originSlot.appendChild(draggingCard);
  } else {
    const existing = targetSlot.querySelector('.card');
    if(existing) originSlot.appendChild(existing);
    targetSlot.appendChild(draggingCard);
  }

  slots.forEach(s => s.classList.remove('over'));

  dragClone.remove();
  dragClone = null;

  draggingCard.style.visibility = 'visible';
  draggingCard = null;
  originSlot = null;
}

/* --- Juego --- */
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
  score = 0; 
  scoreEl.textContent = score;

  // mostrar zona de juego
  startScreen.classList.add('hidden');
  gameArea.classList.remove('hidden');
  endScreen.classList.add('hidden');

  // iniciar timer
  startTimer();

  // reproducir música
  const music = document.getElementById('bg-music');
  music.volume = 0.3; // volumen suave
  music.play().catch(err => console.log("No se pudo reproducir automáticamente:", err));
}


function checkOrder(){
  const current = slots.map(s => s.querySelector('.card')?.dataset.image || null);
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
  resultTitle.textContent = success ? '¡Correcto! 🎉' : 'Tiempo agotado ⏳';
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

/* Inicial */
placeShuffledCards();
gameArea.classList.add('hidden');

