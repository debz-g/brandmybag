const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

let DATA = null;
let uploadedLogoUrl = null;
const sideState = { side: "right" };

async function loadData() {
  const res = await fetch("data/spots.json");
  return res.json();
}

function pct(px, total) {
  return (px / total) * 100;
}

function viewFor(viewId) {
  return DATA.views.find((v) => v.id === viewId);
}

function makePin(spot, view) {
  const globalIndex = DATA.spots.indexOf(spot);
  const pin = document.createElement("div");
  pin.className = "spot-pin" + (spot.currentHolder ? " claimed" : "");
  pin.style.left = pct(spot.rect.x, view.image.width) + "%";
  pin.style.top = pct(spot.rect.y, view.image.height) + "%";
  pin.style.width = pct(spot.rect.w, view.image.width) + "%";
  pin.style.height = pct(spot.rect.h, view.image.height) + "%";
  pin.dataset.spotId = spot.id;

  const badge = document.createElement("span");
  badge.className = "spot-pin-badge";
  if (spot.mirror) badge.style.transform = "scaleX(-1)";
  badge.textContent = globalIndex + 1;
  pin.appendChild(badge);

  pin.addEventListener("click", () => openModal(spot));
  return pin;
}

function renderFrontView(view, container) {
  const wrap = document.createElement("div");
  wrap.className = "spot-map-wrap";

  const label = document.createElement("p");
  label.className = "spot-map-label";
  label.textContent = view.label;
  wrap.appendChild(label);

  const map = document.createElement("div");
  map.className = "spot-map";

  const inner = document.createElement("div");
  inner.className = "spot-map-inner";

  const img = document.createElement("img");
  img.src = view.image.src;
  img.alt = view.label + " view of the backpack with numbered ad spots";
  inner.appendChild(img);

  DATA.spots
    .filter((s) => s.viewId === view.id)
    .forEach((spot) => inner.appendChild(makePin(spot, view)));

  map.appendChild(inner);
  wrap.appendChild(map);
  container.appendChild(wrap);
}

function renderSideView(view, container) {
  const wrap = document.createElement("div");
  wrap.className = "spot-map-wrap";

  const label = document.createElement("p");
  label.className = "spot-map-label";
  label.textContent = view.label;
  wrap.appendChild(label);

  const toggle = document.createElement("div");
  toggle.className = "side-toggle";
  const leftBtn = document.createElement("button");
  leftBtn.textContent = "L";
  leftBtn.dataset.side = "left";
  const rightBtn = document.createElement("button");
  rightBtn.textContent = "R";
  rightBtn.dataset.side = "right";
  toggle.appendChild(leftBtn);
  toggle.appendChild(rightBtn);
  wrap.appendChild(toggle);

  const map = document.createElement("div");
  map.className = "spot-map";

  const inner = document.createElement("div");
  inner.className = "spot-map-inner";
  inner.id = "spot-map-inner-side";

  const img = document.createElement("img");
  img.src = view.image.src;
  img.alt = view.label + " view of the backpack";
  inner.appendChild(img);

  map.appendChild(inner);
  wrap.appendChild(map);
  container.appendChild(wrap);

  function renderActiveSide() {
    [leftBtn, rightBtn].forEach((b) =>
      b.classList.toggle("active", b.dataset.side === sideState.side)
    );
    inner.classList.toggle("mirrored", sideState.side === "left");
    inner.querySelectorAll(".spot-pin").forEach((p) => p.remove());
    const spot = DATA.spots.find(
      (s) => s.viewId === "side" && s.side === sideState.side
    );
    if (spot) inner.appendChild(makePin(spot, view));
  }

  leftBtn.addEventListener("click", () => {
    sideState.side = "left";
    renderActiveSide();
  });
  rightBtn.addEventListener("click", () => {
    sideState.side = "right";
    renderActiveSide();
  });

  renderActiveSide();
}

function renderSpotMaps(data) {
  const container = document.getElementById("spot-maps");
  data.views.forEach((view) => {
    if (view.id === "side") {
      renderSideView(view, container);
    } else {
      renderFrontView(view, container);
    }
  });
}

function renderSpotList(data) {
  const list = document.getElementById("spot-list");
  data.spots.forEach((spot, i) => {
    const item = document.createElement("div");
    item.className = "spot-list-item" + (spot.currentHolder ? " claimed" : "");
    item.dataset.spotId = spot.id;
    item.innerHTML = `
      <span class="spot-list-num">${i + 1}</span>
      <div class="spot-list-info">
        <h4>${spot.name}</h4>
        <span>${spot.tier} · ${spot.size}</span>
      </div>
      <span class="spot-list-price">${inr(spot.currentBidInr)}</span>
    `;
    item.addEventListener("click", () => openModal(spot));
    list.appendChild(item);
  });
}

function buildSpotCard(spot, index) {
  const card = document.createElement("div");
  card.className = "spot-card";
  card.innerHTML = `
    <span class="spot-tier">${spot.tier}</span>
    <h3>${index + 1}. ${spot.name}</h3>
    <span class="spot-size">${spot.size}</span>
    <p class="spot-note">${spot.note}</p>
    <div class="spot-bid">
      <div>
        <span class="spot-bid-value">${inr(spot.currentBidInr)}</span><br>
        <span class="spot-bid-label">${spot.currentHolder ? "current holder: " + spot.currentHolder : "no bids yet"}</span>
      </div>
    </div>
  `;
  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = spot.currentHolder ? "Outbid this spot" : "Claim this spot";
  btn.addEventListener("click", () => openModal(spot));
  card.appendChild(btn);
  return card;
}

function setActiveSpot(spotId) {
  document.querySelectorAll(".spot-pin").forEach((p) =>
    p.classList.toggle("active", p.dataset.spotId === spotId)
  );
  document.querySelectorAll(".spot-list-item").forEach((p) =>
    p.classList.toggle("active", p.dataset.spotId === spotId)
  );
}

function renderFullPreview(spot) {
  const view = viewFor(spot.viewId);
  const previewFull = document.getElementById("preview-full");
  const bg = document.getElementById("preview-bg");
  bg.src = view.image.src;
  previewFull.classList.toggle("mirrored", !!spot.mirror);

  const overlay = document.getElementById("preview-overlay");
  overlay.style.left = pct(spot.rect.x, view.image.width) + "%";
  overlay.style.top = pct(spot.rect.y, view.image.height) + "%";
  overlay.style.width = pct(spot.rect.w, view.image.width) + "%";
  overlay.style.height = pct(spot.rect.h, view.image.height) + "%";

  overlay.innerHTML = uploadedLogoUrl
    ? `<img src="${uploadedLogoUrl}" alt="your logo preview" style="${spot.mirror ? "transform:scaleX(-1)" : ""}" />`
    : `<span id="preview-placeholder" style="${spot.mirror ? "transform:scaleX(-1)" : ""}">your logo here</span>`;
}

function openModal(spot) {
  if (spot.viewId === "side") {
    sideState.side = spot.side;
    document
      .querySelectorAll(".side-toggle button")
      .forEach((b) => b.classList.toggle("active", b.dataset.side === spot.side));
    const inner = document.getElementById("spot-map-inner-side");
    if (inner) {
      inner.classList.toggle("mirrored", spot.side === "left");
      inner.querySelectorAll(".spot-pin").forEach((p) => p.remove());
      inner.appendChild(makePin(spot, viewFor("side")));
    }
  }

  setActiveSpot(spot.id);
  uploadedLogoUrl = null;

  const backdrop = document.getElementById("modal-backdrop");
  document.getElementById("modal-title").textContent = spot.name + " — " + spot.tier;
  document.getElementById("modal-body").textContent =
    spot.paymentLink
      ? `Pay ${inr(spot.currentBidInr)} to claim this spot. You'll be contacted to arrange your logo/sticker.`
      : `Payment link isn't live yet for this spot. DM @debz_exe on X to claim it manually for now.`;

  const payBtn = document.getElementById("modal-pay-btn");
  if (spot.paymentLink) {
    payBtn.href = spot.paymentLink;
    payBtn.textContent = "Pay " + inr(spot.currentBidInr) + " to claim";
  } else {
    payBtn.href = "https://x.com/debz_exe";
    payBtn.textContent = "DM to claim";
  }

  backdrop.classList.add("open");
  renderFullPreview(spot);

  const upload = document.getElementById("logo-upload");
  upload.value = "";
  upload.onchange = () => {
    const file = upload.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadedLogoUrl = reader.result;
      renderFullPreview(spot);
    };
    reader.readAsDataURL(file);
  };
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
  setActiveSpot(null);
}

async function init() {
  DATA = await loadData();

  renderSpotMaps(DATA);
  renderSpotList(DATA);

  const spotsGrid = document.getElementById("spots-grid");
  DATA.spots.forEach((spot, i) => spotsGrid.appendChild(buildSpotCard(spot, i)));

  const raised = DATA.spots.reduce(
    (sum, s) => sum + (s.currentHolder ? s.currentBidInr : 0),
    0
  );
  const claimed = DATA.spots.filter((s) => s.currentHolder).length;
  document.getElementById("stat-raised").textContent = inr(raised);
  document.getElementById("stat-goal").textContent = "of " + inr(DATA.goal.targetInr);
  document.getElementById("stat-spots").textContent = `${claimed} / ${DATA.spots.length}`;

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });
}

init();
