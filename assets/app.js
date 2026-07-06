const carriages = [
  { order: 1, serial: "489048", image: "assets/carriages/01_489048.jpg", width: 14960, height: 1150, graffiti: 0, defects: [] },
  {
    order: 2,
    serial: "488048",
    image: "assets/carriages/02_488048.jpg",
    width: 14960,
    height: 1150,
    graffiti: 0,
    defects: [
      { id: "488048-scratch-1", type: "scratch", label: "manual scratch mark", box: [11134, 715, 11197, 852] },
    ],
  },
  {
    order: 3,
    serial: "487048",
    image: "assets/carriages/03_487048.jpg",
    width: 14961,
    height: 1150,
    graffiti: 0,
    defects: [
      { id: "487048-scratch-1", type: "scratch", label: "manual scratch mark", box: [14232, 446, 14326, 540] },
    ],
  },
  { order: 4, serial: "486048", image: "assets/carriages/04_486048.jpg", width: 14960, height: 1150, graffiti: 0, defects: [] },
  {
    order: 5,
    serial: "485048",
    image: "assets/carriages/05_485048.jpg",
    width: 14960,
    height: 1150,
    graffiti: 0,
    defects: [
      { id: "485048-dirt-1", type: "dirt", label: "manual dirt mark", box: [4288, 237, 4345, 421] },
      { id: "485048-dirt-2", type: "dirt", label: "manual dirt mark", box: [11479, 243, 11552, 303] },
    ],
  },
  {
    order: 6,
    serial: "484048",
    image: "assets/carriages/06_484048.jpg",
    width: 14960,
    height: 1150,
    graffiti: 0,
    defects: [
      { id: "484048-dirt-1", type: "dirt", label: "manual dirt mark", box: [0, 223, 636, 996] },
      { id: "484048-dirt-2", type: "dirt", label: "manual dirt mark", box: [11525, 32, 11894, 813] },
    ],
  },
  { order: 7, serial: "483048", image: "assets/carriages/07_483048.jpg", width: 14960, height: 1150, graffiti: 0, defects: [] },
  { order: 8, serial: "482048", image: "assets/carriages/08_482048.jpg", width: 14961, height: 1150, graffiti: 0, defects: [] },
  { order: 9, serial: "481048", image: "assets/carriages/09_481048.jpg", width: 14960, height: 1150, graffiti: 0, defects: [] },
  { order: 10, serial: "480048", image: "assets/carriages/10_480048.jpg", width: 14960, height: 1150, graffiti: 0, defects: [] },
];

const visualCarriages = [...carriages].reverse();

const state = {
  index: 0,
};

const viewport = document.querySelector("[data-carriage-viewport]");
const track = document.querySelector("[data-carriage-track]");
const tableBody = document.querySelector("[data-condition-table]");
const magnifier = document.createElement("div");
magnifier.className = "magnifier";
magnifier.setAttribute("aria-hidden", "true");
document.body.appendChild(magnifier);

function defectsOf(carriage, type) {
  return carriage.defects.filter((defect) => defect.type === type);
}

function tableIndexBySerial(serial) {
  return carriages.findIndex((carriage) => carriage.serial === serial);
}

function visualIndexBySerial(serial) {
  return visualCarriages.findIndex((carriage) => carriage.serial === serial);
}

function boxStyle(defect, carriage) {
  const [x0, y0, x1, y1] = defect.box;
  return [
    `left:${(x0 / carriage.width) * 100}%`,
    `top:${(y0 / carriage.height) * 100}%`,
    `width:${((x1 - x0) / carriage.width) * 100}%`,
    `height:${((y1 - y0) / carriage.height) * 100}%`,
  ].join(";");
}

function hideMagnifier() {
  magnifier.classList.remove("is-visible");
}

function updateMagnifier(event, img) {
  if (event.pointerType === "touch") {
    hideMagnifier();
    return;
  }

  const rect = img.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    hideMagnifier();
    return;
  }

  const naturalWidth = img.naturalWidth || rect.width;
  const naturalHeight = img.naturalHeight || rect.height;
  const sourceX = ((event.clientX - rect.left) / rect.width) * naturalWidth;
  const sourceY = ((event.clientY - rect.top) / rect.height) * naturalHeight;

  magnifier.classList.add("is-visible");
  const lensWidth = magnifier.offsetWidth || Math.min(620, window.innerWidth - 24);
  const lensHeight = magnifier.offsetHeight || Math.min(380, window.innerHeight - 24);
  let left = event.clientX + 24;
  let top = event.clientY + 24;
  if (left + lensWidth + 12 > window.innerWidth) left = event.clientX - lensWidth - 24;
  if (top + lensHeight + 12 > window.innerHeight) top = event.clientY - lensHeight - 24;

  magnifier.style.left = `${Math.max(12, left)}px`;
  magnifier.style.top = `${Math.max(12, top)}px`;
  magnifier.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  magnifier.style.backgroundSize = `${naturalWidth}px ${naturalHeight}px`;
  magnifier.style.backgroundPosition = `${lensWidth / 2 - sourceX}px ${lensHeight / 2 - sourceY}px`;
}

function bindMagnifier(stage, img) {
  stage.addEventListener("pointermove", (event) => updateMagnifier(event, img));
  stage.addEventListener("pointerleave", hideMagnifier);
  stage.addEventListener("pointercancel", hideMagnifier);
}

function renderCarriages() {
  visualCarriages.forEach((carriage) => {
    const panel = document.createElement("article");
    panel.className = "carriage-panel";
    panel.dataset.carriagePanel = "";
    panel.dataset.serial = carriage.serial;

    const stage = document.createElement("div");
    stage.className = "image-stage";

    const img = document.createElement("img");
    img.className = "carriage-image";
    img.src = carriage.image;
    img.alt = `Exterior panorama for carriage ${carriage.serial}`;
    img.loading = carriage.order <= 2 ? "eager" : "lazy";
    stage.appendChild(img);
    bindMagnifier(stage, img);

    carriage.defects.forEach((defect) => {
      const box = document.createElement("button");
      box.type = "button";
      box.className = `defect-box defect-${defect.type}`;
      box.dataset.defectType = defect.type;
      box.dataset.defectId = defect.id;
      box.style.cssText = boxStyle(defect, carriage);
      box.setAttribute("aria-label", `${carriage.serial} ${defect.type}`);
      stage.appendChild(box);
    });

    const caption = document.createElement("div");
    caption.className = "carriage-caption";
    caption.textContent = `${carriage.order}. ${carriage.serial}`;

    panel.appendChild(stage);
    panel.appendChild(caption);
    track.appendChild(panel);
  });
}

function countButton(carriage, index, type) {
  const count = type === "graffiti" ? carriage.graffiti : defectsOf(carriage, type).length;
  const disabled = count ? "" : "disabled";
  return `<button class="count-button count-${type}" type="button" data-jump-index="${index}" data-highlight-type="${type}" ${disabled}>${count}</button>`;
}

function renderTable() {
  carriages.forEach((carriage, index) => {
    const row = document.createElement("tr");
    row.dataset.carriageRow = "";
    row.dataset.serial = carriage.serial;
    row.innerHTML = `
      <td>${carriage.order}</td>
      <td><button class="serial-button" type="button" data-jump-index="${index}">${carriage.serial}</button></td>
      <td>${countButton(carriage, index, "dirt")}</td>
      <td>${countButton(carriage, index, "scratch")}</td>
      <td>${countButton(carriage, index, "graffiti")}</td>
    `;
    tableBody.appendChild(row);
  });
}

function setActive(index) {
  state.index = Math.max(0, Math.min(carriages.length - 1, index));
  const active = carriages[state.index];

  document.querySelectorAll("[data-carriage-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.serial === active.serial);
  });
  document.querySelectorAll("[data-carriage-row]").forEach((row) => {
    row.classList.toggle("is-active", row.dataset.serial === active.serial);
  });

}

function scrollToCarriage(index, behavior = "smooth") {
  setActive(index);
  const serial = carriages[state.index].serial;
  const visualIndex = visualIndexBySerial(serial);
  viewport.scrollTo({
    left: viewport.clientWidth * visualIndex,
    behavior,
  });
}

function flashDefects(index, type) {
  scrollToCarriage(index);
  const serial = carriages[index].serial;
  const panel = document.querySelector(`[data-carriage-panel][data-serial="${serial}"]`);
  if (!panel) return;

  panel.querySelectorAll(".defect-box").forEach((box) => {
    box.classList.remove("is-flashing");
  });

  panel.querySelectorAll(`[data-defect-type="${type}"]`).forEach((box) => {
    window.setTimeout(() => box.classList.add("is-flashing"), 120);
    window.setTimeout(() => box.classList.remove("is-flashing"), 2800);
  });
}

function bindControls() {
  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-jump-index]");
    if (!button) return;
    const index = Number(button.dataset.jumpIndex);
    if (button.dataset.highlightType) {
      flashDefects(index, button.dataset.highlightType);
      return;
    }
    scrollToCarriage(index);
  });

  viewport.addEventListener("scroll", () => {
    const visualIndex = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth));
    const visualCarriage = visualCarriages[visualIndex];
    if (!visualCarriage) return;
    const tableIndex = tableIndexBySerial(visualCarriage.serial);
    if (tableIndex !== state.index) {
      setActive(tableIndex);
    }
  }, { passive: true });
}

renderCarriages();
renderTable();
bindControls();
scrollToCarriage(0, "auto");
