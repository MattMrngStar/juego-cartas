document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');

  const correctOrder = [
    "CartasPFE-01.png","CartasPFE-02.png","CartasPFE-03.png",
    "CartasPFE-04.png","CartasPFE-05.png","CartasPFE-06.png","CartasPFE-07.png"
  ];

  // DOM
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

  if (!btnStart) console.error('btn-start NO encontrado en el DOM');
  else console.log('btn-start OK');

  let timer = null;
  let timeLeft = 300;
  let score = 0;

  // Drag state
  let draggingCard = null;
  let dragClone = null;
  let originSlot = null;
  let pointerOffset = {x:0,y:0};
  let currentPos = {x:0,y:0};
  let lastPos = {x:0,y:0};
  let dragging = false;
  let rafId = null;

  const shuffle = arr => arr.slice().sort(()=>Math.random()-0.5);

  function createCardElement(imgName){
    const img = document.createElement('img');
    img.className = 'card';
    img.draggable = false;
    img.src = `Cartas/${imgName}`;
    img.alt = imgName;
    img.dataset.image = imgName;
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
    console.log('cards placed (shuffled)', shuffled);
  }

  // DRAG with requestAnimationFrame
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

      // clone visual
      dragClone = draggingCard.cloneNode(true);
      dragClone.classList.add('dragging-clone');
      dragClone.style.width = rect.width + 'px';
      dragClone.style.height = rect.height + 'px';
      document.body.appendChild(dragClone);

      draggingCard.style.visibility = 'hidden';

      dragging = true;
      document.addEventListener('pointermove', onPointerMove, {passive:false});
      document.addEventListener('pointerup', onPointerUp, {once:true});

      rafId = requestAnimationFrame(updateDragClone);
      console.log('drag started');
    } catch (err) {
      console.error('onPointerDown error', err);
    }
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
    // center under pointer using translate(-50%,-50%)
    dragClone.style.transform = `translate3d(${currentPos.x}px, ${currentPos.y}px, 0) translate(-50%,-50%) scale(1.06) rotate(${rot}deg)`;

    const elem = document.elementFromPoint(currentPos.x, currentPos.y);
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
      document.removeEventListener('pointermove', onPointerMove);

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
      console.log('drag ended');
    } catch(err){
      console.error('onPointerUp error', err);
    }
  }

  // GAME
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
    console.log('startGame called');
    placeShuffledCards();
    score = 0; if (scoreEl) scoreEl.textContent = score;
    if (startScreen) startScreen.classList.add('hidden');
    if (gameArea) gameArea.classList.remove('hidden');
    if (endScreen) endScreen.classList.add('hidden');
    startTimer();
    const music = document.getElementById('bg-music');
    if(music){ music.volume = 0.28; music.play().catch(()=>{}); }
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
    const music = document.getElementById('bg-music');
    if (music) { music.pause(); music.currentTime = 0; }
  }

  // listeners
  if (btnStart) btnStart.addEventListener('click', () => { console.log('btnStart click'); startGame(); });
  if (btnCheck) btnCheck.addEventListener('click', checkOrder);
  if (btnRestart) btnRestart.addEventListener('click', restartGame);
  if (btnPlayAgain) btnPlayAgain.addEventListener('click', () => {
    if (startScreen) startScreen.classList.remove('hidden');
    if (endScreen) endScreen.classList.add('hidden');
  });

  // Inicial
  placeShuffledCards();
  if (gameArea) gameArea.classList.add('hidden');
  if (endScreen) endScreen.classList.add('hidden');
  if (startScreen) startScreen.classList.remove('hidden');
  if (timerEl) timerEl.textContent = timeLeft;

  console.log('init done');
});
