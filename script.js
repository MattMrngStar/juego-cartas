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

  /* === Guía === */
  const guideOverlay = document.getElementById("guide-overlay");
  const btnOpenGuide = document.getElementById("btn-open-guide");
  const btnCloseGuide = document.getElementById("close-guide");
  const btnEndGuide = document.getElementById("btn-end-guide");

  let attempts = 0;
  let hasPlayed1Min = false;

  /* estado global */
  let slots = [];
  let timer = null;
  let timeLeft = 300;
  let score = 0;

  /* ========================================== */
  /*             MOSTRAR GUÍA                   */
  /* ========================================== */

  function showGuide(){
    guideOverlay.classList.remove("hidden");
  }

  function hideGuide(){
    guideOverlay.classList.add("hidden");
  }

  btnOpenGuide.addEventListener("click", showGuide);
  btnCloseGuide.addEventListener("click", hideGuide);
  btnEndGuide.addEventListener("click", showGuide);

  function checkGuideConditions(){
    if (attempts >= 2 || hasPlayed1Min){
      btnOpenGuide.classList.remove("hidden");
    }
  }

  /* ========================================== */

  function getSlots(){
    slots = Array.from(document.querySelectorAll('.slot'));
    return slots;
  }

  const shuffle = arr => arr.slice().sort(()=>Math.random()-0.5);

  function createCardElement(imgName){
    const img = document.createElement('img');
    img.className = 'card';
    img.draggable = false;
    img.src = `Cartas/${imgName}`;
    img.dataset.image = imgName;
    img.addEventListener('pointerdown', onPointerDown);
    return img;
  }

  function placeShuffledCards(){
    getSlots();
    const shuffled = shuffle(correctOrder);
    slots.forEach((slot, i)=>{
      slot.innerHTML = "";
      slot.appendChild(createCardElement(shuffled[i]));
    });
  }

  /* Drag system (idéntico al tuyo) */
  let draggingCard=null, dragClone=null, originSlot=null;
  let currentX=0, currentY=0, prevX=0, prevY=0;
  let dragging=false, rafId=null;

  function onPointerDown(e){
    if(e.button && e.button!==0) return;

    draggingCard = e.currentTarget;
    originSlot = draggingCard.parentElement;

    currentX = prevX = e.clientX;
    currentY = prevY = e.clientY;

    const rect = draggingCard.getBoundingClientRect();
    dragClone = draggingCard.cloneNode(true);
    dragClone.className = "dragging-clone";
    dragClone.style.width = rect.width+"px";
    dragClone.style.height = rect.height+"px";
    document.body.appendChild(dragClone);

    draggingCard.style.visibility="hidden";
    dragging = true;

    document.addEventListener('pointermove', onPointerMove, {passive:false});
    document.addEventListener('pointerup', onPointerUp, {once:true});

    rafId = requestAnimationFrame(updateDragClone);
  }

  function onPointerMove(e){
    if(!dragging) return;
    e.preventDefault();
    currentX = e.clientX;
    currentY = e.clientY;
  }

  function updateDragClone(){
    if(!dragClone) return;

    const dx = currentX-prevX;
    const rot = Math.max(-14, Math.min(14, dx*0.6));

    dragClone.style.transform =
      `translate3d(${currentX}px,${currentY}px,0) translate(-50%,-50%) scale(1.06) rotate(${rot}deg)`;

    const elem = document.elementFromPoint(currentX,currentY);
    const slotUnder = elem ? elem.closest(".slot") : null;
    getSlots().forEach(s=>s.classList.toggle("over", s===slotUnder));

    prevX=currentX; prevY=currentY;
    if(dragging) rafId=requestAnimationFrame(updateDragClone);
  }

  function nearestSlot(x,y){
    getSlots();
    let best=null, bestD=Infinity;
    slots.forEach(s=>{
      const r=s.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      const d=Math.hypot(cx-x, cy-y);
      if(d<bestD){bestD=d; best=s;}
    });
    return best;
  }

  function onPointerUp(){
    dragging=false;
    cancelAnimationFrame(rafId);
    document.removeEventListener("pointermove", onPointerMove);

    const elem = document.elementFromPoint(currentX,currentY);
    let targetSlot = elem ? elem.closest(".slot") : null;
    if(!targetSlot) targetSlot = nearestSlot(currentX,currentY);

    if(targetSlot===originSlot){
      originSlot.appendChild(draggingCard);
    } else {
      const existing = targetSlot.querySelector(".card");
      if(existing) originSlot.appendChild(existing);
      targetSlot.appendChild(draggingCard);
    }

    slots.forEach(s=>s.classList.remove("over"));

    dragClone.remove();
    draggingCard.style.visibility="visible";
    draggingCard=null;
  }

  /* ---------------------------------- */

  function startTimer(){
    clearInterval(timer);
    timeLeft = 300;
    timerEl.textContent = timeLeft;

    timer = setInterval(()=>{
      timeLeft--;
      timerEl.textContent = timeLeft;

      if(timeLeft <= 239){  // PASÓ 1 MINUTO
        hasPlayed1Min = true;
        checkGuideConditions();
      }

      if(timeLeft <= 0){
        clearInterval(timer);
        showEnd(false);
      }
    },1000);
  }

  function startGame(){
    attempts = 0;
    hasPlayed1Min = false;
    btnOpenGuide.classList.add("hidden");

    placeShuffledCards();
    score=0; scoreEl.textContent=score;

    startScreen.classList.add("hidden");
    gameArea.classList.remove("hidden");
    endScreen.classList.add("hidden");
    
    startTimer();

    const music=document.getElementById("bg-music");
    if(music){
      music.volume=0.28;
      music.play().catch(()=>{});
    }
  }

  function checkOrder(){
    getSlots();
    const current = slots.map(s => s.querySelector(".card")?.dataset.image || null);

    if(current.includes(null)){ alert("Faltan cartas por ubicar."); return; }

    if(JSON.stringify(current)===JSON.stringify(correctOrder)){
      const bonus = timeLeft * 10;
      score = 1000 + bonus;
      scoreEl.textContent = score;
      clearInterval(timer);
      showEnd(true, score);
    } else {
      attempts++;
      checkGuideConditions();
      alert("El orden no es correcto.");
    }
  }

  function restartGame(){
    attempts = 0;
    hasPlayed1Min = false;
    btnOpenGuide.classList.add("hidden");

    placeShuffledCards();
    score=0;
    scoreEl.textContent=score;

    clearInterval(timer);
    startTimer();

    endScreen.classList.add("hidden");
    gameArea.classList.remove("hidden");
  }

  function showEnd(success, points=0){
    resultTitle.textContent = success ? "¡Correcto! 🎉":"Tiempo agotado ⏳";
    finalScoreEl.textContent = points;

    endScreen.classList.remove("hidden");
    gameArea.classList.add("hidden");

    const music=document.getElementById("bg-music");
    if(music){ music.pause(); music.currentTime=0; }

    // Mostrar botón de guía en pantalla final
    btnEndGuide.classList.remove("hidden");
  }

  /* listeners */
  btnStart.addEventListener("click", startGame);
  btnCheck.addEventListener("click", checkOrder);
  btnRestart.addEventListener("click", restartGame);
  btnPlayAgain.addEventListener("click", ()=>{
    startScreen.classList.remove("hidden");
    endScreen.classList.add("hidden");
  });

  /* inicial */
  placeShuffledCards();
  gameArea.classList.add("hidden");
  timerEl.textContent = timeLeft;

});
