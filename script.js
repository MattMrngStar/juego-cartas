/* ---------------------------
   script.js (robusto, DOM ready)
   --------------------------- */

document.addEventListener('DOMContentLoaded', () => {

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

  /* DOM (se obtienen después de DOMContentLoaded) */
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

  // Validaciones básicas
  if (!btnStart) { console.error("Elemento #btn-start no encontrado"); return; }
  if (!timerEl)  { console.error("Elemento #timer no encontrado"); /* continúa igual */ }

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
    try {
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

      // clon: no fijamos left/top (usamos transform)
      dragClone = draggingCard.cloneNode(true);
      dragClone.classList.add('dragging-clone');
      dragClone.style.width = rect.width + 'px';
      dragClone.style.height = rect.height + 'px';
      // append primero para evitar reflow/paint raro en algunos browsers
      document.body.appendChild(dragClone);

      // ocultar el original (pero mantener en DOM)
      draggingCard.style.visibility = 'hidden';

      dragging = true;
      document.addEventListener('pointermove', onPointerMove, {passive:false});
      document.addEventListener('pointerup', onPointerUp, {once:true});

      rafId = requestAnimationFrame(updateDragClone);
    } catch (err) {
      console.error("Error en onPointerDown:", err);
    }
  }

  function onPointerMove(e){
    if(!dragging) return;
    e.preventDefault();
    // actualizamos currentPos (transform se aplica en updateDragClone)
    currentPos.x = e.clientX - pointerOffset.x;
    currentPos.y = e.clientY - pointerOffset.y;
    lastPos.x = e.clientX;
    lastPos.y = e.clientY;
  }

  function updateDragClone(){
    if(!dragClone) return;

    const dx = currentPos.x - lastPos.x;
    const rot = Math.max(-14, Math.min(14, dx * 0.6));

    // mover con transform (posición relativa al viewport)
    dragClone.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px) scale(1.06) rotate(${rot}deg)`;

    // highlight slot bajo el puntero (optimizado: solo toggle)
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
    try {
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

      if (dragClone && dragClone.parentNode) dragClone.parentNode.removeChild(dragClone);
      dragClone = null;

      if (draggingCard) draggingCard.style.visibility = 'visible';
      draggingCard = null;
      originSlot = null;
    } catch (err) {
      console.error("Error en onPointerUp:", err);
    }
  }

  /* --- Juego --- */
  function startTimer(){
    clearInterval(timer);
    timeLeft = 300;
    if (timerEl) timerEl.textContent = timeLeft;
    timer = setInterval(()=>{
      timeLeft--;
      if (timerEl) timerEl.textContent = timeLeft;
      if(timeLeft <= 0){
        clearInterval(timer);
        showEnd(false);
      }
    },1000);
  }

  function startGame(){
    try {
      placeShuffledCards();
      score = 0; if (scoreEl) scoreEl.textContent = score;

      if (startScreen) startScreen.classList.add('hidden');
      if (gameArea) gameArea.classList.remove('hidden');
      if (endScreen) endScreen.classList.add('hidden');

      startTimer();

      const music = document.getElementById('bg-music');
      if(music){
        music.volume = 0.3;
        music.play().catch(err => console.log("No se pudo reproducir automáticamente:", err));
      }
    } catch (err) {
      console.error("Error en startGame:", err);
    }
  }

  function checkOrder(){
    const current = slots.map(s => s.querySelector('.card')?.dataset.image || null);
    if(current.includes(null)){ alert('Faltan cartas en algunos slots.'); return; }

    if(JSON.stringify(current) === JSON.stringify(correctOrder)){
      const bonus = Math.max(0, timeLeft) * 10;
      score = 1000 + bonus;
      if (scoreEl) scoreEl.textContent = score;
      clearInterval(timer);
      showEnd(true, score);
    } else {
      alert('El orden no es correcto, sigue intentando.');
    }
  }

  function restartGame(){
    placeShuffledCards();
    score = 0; if (scoreEl) scoreEl.textContent = score;
    clearInterval(timer);
    timeLeft = 300; if (timerEl) timerEl.textContent = timeLeft;
    startTimer();
    if (endScreen) endScreen.classList.add('hidden');
    if (gameArea) gameArea.classList.remove('hidden');
  }

  function showEnd(success, points=0){
    if (resultTitle) resultTitle.textContent = success ? '¡Correcto! 🎉' : 'Tiempo agotado ⏳';
    if (finalScoreEl) finalScoreEl.textContent = points;
    if (endScreen) endScreen.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');

    // detener música si hay
    const music = document.getElementById('bg-music');
    if (music) {
      music.pause();
      music.currentTime = 0;
    }
  }

  /* Botones (agregar listeners) */
  btnStart.addEventListener('click', startGame);
  if (btnCheck) btnCheck.addEventListener('click', checkOrder);
  if (btnRestart) btnRestart.addEventListener('click', restartGame);
  if (btnPlayAgain) btnPlayAgain.addEventListener('click', ()=> {
    if (startScreen) startScreen.classList.remove('hidden');
    if (endScreen) endScreen.classList.add('hidden');
  });

  /* Inicial */
  placeShuffledCards();
  if (gameArea) gameArea.classList.add('hidden');

  // Asegúrate de que el timer muestre el valor correcto al cargar
  if (timerEl) timerEl.textContent = timeLeft;

}); // DOMContentLoaded

