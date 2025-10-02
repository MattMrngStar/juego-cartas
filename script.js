// Pantalla de inicio
document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-board").style.display = "block";
});

// Arrastrar y soltar
const cards = document.querySelectorAll(".card");
const dropZones = document.querySelectorAll(".drop-zone");

cards.forEach(card => {
  card.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", e.target.src);
    setTimeout(() => card.classList.add("dragging"), 0);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });
});

dropZones.forEach(zone => {
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.style.background = "#d3ffd3"; // marca verde clara al pasar
  });

  zone.addEventListener("dragleave", () => {
    zone.style.background = "transparent";
  });

  zone.addEventListener("drop", e => {
    e.preventDefault();
    const cardSrc = e.dataTransfer.getData("text/plain");
    zone.innerHTML = `<img src="${cardSrc}" class="card" draggable="false" />`;
    zone.style.background = "transparent";
  });
});
