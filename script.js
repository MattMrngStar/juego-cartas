document.addEventListener('DOMContentLoaded', () => {

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
  const timerEl = document.getElementById('timer');
  const scoreEl = document.getElementById('score');
  const btnCheck = document.getElementById('btn-check');
  const btnRestart = document.getElementById('btn-restart');
  const endScreen = document.getElementById('end-screen');
  const resultTitle = document.getElementById('result-title');
  const finalScoreEl = document.getElementById('final-score');
  const btnPlayAgain = document.getElementById('btn-play-again');

  /* Guía DOM */
  const solutionOverlay = document.getElementById("solution-overlay");
  const btnOpenSolution = document.getElementById("btn-open-solution");
  const btnCloseSolution = document.getElementById("btn-close-solution");
  const btnEndGuide = document.getElementById("btn-end-guide");
  const solutionImage = document.getElementById("solution-image");

  /* estado global */
  let slots = [];               // se llenará dinámicamente
  let timer = null;
  let timeLeft = 300;
  let score = 0;

  /* variables guía/ayuda */
  let failedAttempts = 0;
  let hasPlayedOneMinute = false;

  /* drag state (pointer-based, original) */
  let draggingCard = null;
  let dragClone = null;
  let originSlot = null;
  let currentX = 0, currentY = 0;
  let prevX = 0, prevY = 0;
  let dragging = false;
  let rafId = null;

  /* util */
  const shuffle = arr => arr.slice().sort(()=>Math.random()-0.5);

  function getSlots(){
    slots = Array.from(document.querySelectorAll('.slot'));
    return slots;
  }

  function createCardElement(imgName){
    const img = document.createElement('img');
    img.className = 'card';
    // crucial: evitar drag nativo (previene el ghost icon)
    img.draggable = false;
    img.src = `Cartas/${imgName}`;
    img.alt = imgName;
    img.dataset.image = imgName;
    img.style.willChange = 'transform';
    // pointer events (un solo handler para mouse/touch/stylus)
    img.addEventListener('pointerdown', onPointerDown, {passive:false});
    return img;
  }

  function placeShuffledCards(){
    getSlots();
    const shuffled = shuffle(correctOrder);
    slots.forEach((slot, i) => {
      slot.innerHTML = '';
      const card = createCardElement(shuffled[i]);
      slot.appendChild(card);
    });
  }

  /* --- drag handlers (pointer clone technique) --- */
  function onPointerDown(e){
    // solo botón principal o touch (si tiene button y no 0, ignore)
    if (e.button && e.button !== 0) return;

    // prevenir comportamiento nativo (especialmente en móviles)
    e.preventDefault();

    draggingCard = e.currentTarget;
    originSlot = draggingCard.parentElement;

    // coordenadas iniciales
    currentX = e.clientX;
    currentY = e.clientY;
    prevX = currentX;
    prevY = currentY;

    // crear clon visual que seguirá al cursor (centrado con translate(-50%,-50%))
    const rect = draggingCard.getBoundingClientRect();
    dragClone = draggingCard.cloneNode(true);
    dragClone.className = 'dragging-clone';
    dragClone.style.width = rect.width + 'px';
    dragClone.style.height = rect.height + 'px';
    // asegurar que no capture eventos
    dragClone.style.pointerEvents = 'none';
    document.body.appendChild(dragClone);

    // ocultar original mediante visibility (no display), así conserva flujo y evita "saltos"
    draggingCard.style.visibility = 'hidden';

    dragging = true;
    // escuchar movimiento y soltar
    document.addEventListener('pointermove', onPointerMove, {passive:false});
    document.addEventListener('pointerup', onPointerUp, {once:true});

    // arrancar loop visual
    rafId = requestAnimationFrame(updateDragClone);
  }

  function onPointerMove(e){
    if(!dragging) return;
    // prevenir scroll/gestos
    e.preventDefault();
    currentX = e.clientX;
    currentY = e.clientY;
  }

  function updateDragClone(){
    if(!dragClone) return;

    const dx = currentX - prevX;
    const rot = Math.max(-14, Math.min(14, dx * 0.6));

    // colocamos la copia centrada en el puntero con translate(-50%,-50%)
    dragClone.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%,-50%) scale(1.06) rotate(${rot}deg)`;

    // resaltar slot bajo el puntero
    const elem = document.elementFromPoint(currentX, currentY);
    const slotUnder = elem ? elem.closest('.slot') : null;
    getSlots().forEach(s => s.classList.toggle('over', s === slotUnder));

    prevX = currentX;
    prevY = currentY;

    if(dragging) rafId = requestAnimationFrame(updateDragClone);
  }

  function nearestSlotToPoint(x,y){
    getSlots();
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
    // detener loop y listeners
    dragging = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener('pointermove', onPointerMove);

    // decidir slot objetivo por la posición actual
    const elem = document.elementFromPoint(currentX, currentY);
    let targetSlot = elem ? elem.closest('.slot') : null;
    if(!targetSlot) targetSlot = nearestSlotToPoint(currentX, currentY);
    if(!targetSlot) targetSlot = originSlot;

    // swap / mover: si hay carta en target, intercambiamos; si no, movemos
    if(targetSlot === originSlot){
      originSlot.appendChild(draggingCard);
    } else {
      const existing = targetSlot.querySelector('.card');
      if(existing) originSlot.appendChild(existing);
      targetSlot.appendChild(draggingCard);
    }

    // limpiar visuals
    getSlots().forEach(s => s.classList.remove('over'));

    // remover clon y restaurar original
    if(dragClone && dragClone.parentNode) dragClone.parentNode.removeChild(dragClone);
    dragClone = null;

    if(draggingCard) draggingCard.style.visibility = 'visible';
    draggingCard = null;
    originSlot = null;
  }

  /* --- game logic --- */
  function startTimer(){
    clearInterval(timer);
    timeLeft = 300;
    if (timerEl) timerEl.textContent = timeLeft;
    timer = setInterval(()=>{
      timeLeft--;
      if (timerEl) timerEl.textContent = timeLeft;

      // comprobación para mostrar guía al superar 1 minuto jugado
      if (!hasPlayedOneMinute && (300 - timeLeft) >= 60) {
        hasPlayedOneMinute = true;
        showSolutionButtonIfNeeded();
      }

      if(timeLeft <= 0){
        clearInterval(timer);
        showEnd(false);
      }
    },1000);
  }

  function startGame(){
    placeShuffledCards();
    score = 0; if(scoreEl) scoreEl.textContent = score;
    if(startScreen) startScreen.classList.add('hidden');
    if(gameArea) gameArea.classList.remove('hidden');
    if(endScreen) endScreen.classList.add('hidden');
    startTimer();

    failedAttempts = 0;
    hasPlayedOneMinute = false;
    // ocultar boton guía en inicio
    if(btnOpenSolution) btnOpenSolution.classList.add('hidden');

    const music = document.getElementById('bg-music');
    if(music){
      music.volume = 0.28;
      music.play().catch(()=>{/* autoplay puede fallar sin interacción */});
    }
  }

  function checkOrder(){
    getSlots();
    const current = slots.map(s => s.querySelector('.card')?.dataset.image || null);
    if(current.includes(null)){ alert('Faltan cartas en algunos slots.'); return; }
    if(JSON.stringify(current) === JSON.stringify(correctOrder)){
      const bonus = Math.max(0, timeLeft) * 10;
      score = 1000 + bonus;
      if(scoreEl) scoreEl.textContent = score;
      clearInterval(timer);
      showEnd(true, score);
      // mostrar guía al resolver
      showSolutionButton();
    } else {
      failedAttempts++;
      showSolutionButtonIfNeeded();
      alert('El orden no es correcto, sigue intentando.');
    }
  }

  function restartGame(){
    placeShuffledCards();
    score = 0; if(scoreEl) scoreEl.textContent = score;
    clearInterval(timer);
    timeLeft = 300; if(timerEl) timerEl.textContent = timeLeft;
    startTimer();
    if(endScreen) endScreen.classList.add('hidden');
    if(gameArea) gameArea.classList.remove('hidden');

    // reset guía
    failedAttempts = 0;
    hasPlayedOneMinute = false;
    if(btnOpenSolution) btnOpenSolution.classList.add('hidden');
    if(btnEndGuide) btnEndGuide.classList.add('hidden');
  }

  function showEnd(success, points=0){
    if(resultTitle) resultTitle.textContent = success ? '¡Correcto! 🎉' : 'Tiempo agotado ⏳';
    if(finalScoreEl) finalScoreEl.textContent = points;
    if(endScreen) endScreen.classList.remove('hidden');
    if(gameArea) gameArea.classList.add('hidden');

    const music = document.getElementById('bg-music');
    if(music){ music.pause(); music.currentTime = 0; }

    // Mostrar botón de guía en pantalla final
    if(btnEndGuide) btnEndGuide.classList.remove('hidden');
  }

  /* --- GUIA handlers --- */
  function showSolutionOverlay(){
    if(solutionOverlay) solutionOverlay.classList.remove('hidden');
    if(btnOpenSolution) btnOpenSolution.setAttribute('aria-hidden','false');
  }
  function hideSolutionOverlay(){
    if(solutionOverlay) solutionOverlay.classList.add('hidden');
    if(btnOpenSolution) btnOpenSolution.setAttribute('aria-hidden','true');
  }
  function showSolutionButton(){
    if(btnOpenSolution) btnOpenSolution.classList.remove('hidden');
    if(btnOpenSolution) btnOpenSolution.setAttribute('aria-hidden','false');
  }
  function showSolutionButtonIfNeeded(){
    if(failedAttempts >= 2 || hasPlayedOneMinute) showSolutionButton();
  }

  if(btnOpenSolution) btnOpenSolution.addEventListener('click', showSolutionOverlay);
  if(btnCloseSolution) btnCloseSolution.addEventListener('click', hideSolutionOverlay);
  if(btnEndGuide) btnEndGuide.addEventListener('click', showSolutionOverlay);

  /* listeners botones */
  if(btnStart) btnStart.addEventListener('click', startGame);
  if(btnCheck) btnCheck.addEventListener('click', checkOrder);
  if(btnRestart) btnRestart.addEventListener('click', restartGame);
  if(btnPlayAgain) btnPlayAgain.addEventListener('click', ()=>{
    if(startScreen) startScreen.classList.remove('hidden');
    if(endScreen) endScreen.classList.add('hidden');
  });

  /* inicial */
  placeShuffledCards();
  if(gameArea) gameArea.classList.add('hidden');
  if(timerEl) timerEl.textContent = timeLeft;

}); // DOMContentLoaded

