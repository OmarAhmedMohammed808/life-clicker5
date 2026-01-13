// Life Clicker — main logic and micro-animations (V1.0)

(() => {
  // DOM
  const lifeCountEl = document.getElementById('life-count');
  const perClickEl = document.getElementById('per-click');
  const perSecondEl = document.getElementById('per-second');
  const clickBtn = document.getElementById('click-btn');
  const effects = document.getElementById('effects');
  const shopItemsEl = document.getElementById('shop-items');

  const lakesEl = document.getElementById('lakes-count');
  const seasEl = document.getElementById('seas-count');
  const oceansEl = document.getElementById('oceans-count');

  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsClose = document.getElementById('settings-close');
  const soundToggle = document.getElementById('sound-toggle');
  const autosaveSelect = document.getElementById('autosave-select');
  const resetBtn = document.getElementById('reset-progress');

  const oceanSvg = document.querySelector('.ocean-svg');
  const starsContainer = document.getElementById('stars');
  const moonEl = document.getElementById('moon');

  // Default state
  const defaultState = {
    life: 0,
    perClick: 1,
    perSecond: 0,
    sound: false,
    autosaveInterval: 45000,
    lakes: 0,
    seas: 0,
    oceans: 0
  };

  let state = loadState();
  let autosaveTimerId = null;
  let audioCtx = null;

  // ----------------------
  // Init
  // ----------------------
  function init(){
    consolidateResources();
    renderShop();
    updateUI();
    attachEvents();
    startAutoTick();
    initDecorations();
    initOcean();
    startAutosaveTimer();
  }

  // ----------------------
  // Persistence
  // ----------------------
  function loadState(){
    try {
      const raw = localStorage.getItem('life-clicker-v1');
      if(raw) return Object.assign({}, defaultState, JSON.parse(raw));
    } catch {}
    return Object.assign({}, defaultState);
  }

  function saveState(){
    localStorage.setItem('life-clicker-v1', JSON.stringify(state));
  }

  function clearSavedState(){
    localStorage.removeItem('life-clicker-v1');
  }

  function startAutosaveTimer(){
    if(autosaveTimerId) clearInterval(autosaveTimerId);
    autosaveTimerId = setInterval(() => {
      consolidateResources();
      saveState();
    }, state.autosaveInterval);
  }

  // ----------------------
  // Consolidation
  // ----------------------
  function consolidateResources(){
    const lakesFromDrops = Math.floor(state.life / 200);
    if(lakesFromDrops > 0){
      state.life -= lakesFromDrops * 200;
      state.lakes += lakesFromDrops;
    }

    const seasFromLakes = Math.floor(state.lakes / 15);
    if(seasFromLakes > 0){
      state.lakes -= seasFromLakes * 15;
      state.seas += seasFromLakes;
    }

    if(state.oceans < 7){
      const oceansFromSeas = Math.min(
        Math.floor(state.seas / 15),
        7 - state.oceans
      );
      if(oceansFromSeas > 0){
        state.seas -= oceansFromSeas * 15;
        state.oceans += oceansFromSeas;
      }
    }

    if(state.oceans > 7) state.oceans = 7;
  }

  // ----------------------
  // UI
  // ----------------------
  function updateUI(){
    lifeCountEl.textContent = formatNumber(state.life);
    perClickEl.textContent = formatNumber(state.perClick);
    perSecondEl.textContent = formatNumber(state.perSecond);

    lakesEl.textContent = formatNumber(state.lakes);
    seasEl.textContent = formatNumber(state.seas);
    oceansEl.textContent = formatNumber(state.oceans);

    if(soundToggle) soundToggle.checked = state.sound;
    if(autosaveSelect) autosaveSelect.value = state.autosaveInterval;

    saveState();
  }

  function formatNumber(n){
    if(n >= 1e9) return (n/1e9).toFixed(2)+'B';
    if(n >= 1e6) return (n/1e6).toFixed(2)+'M';
    if(n >= 1000) return (n/1000).toFixed(1)+'k';
    return n.toString();
  }

  // ----------------------
  // Click
  // ----------------------
  function onClick(e){
    state.life += state.perClick;
    consolidateResources();
    spawnFloat(state.perClick, e);
    updateUI();
  }

  // ----------------------
  // Auto tick
  // ----------------------
  function startAutoTick(){
    setInterval(() => {
      if(state.perSecond > 0){
        state.life += state.perSecond;
        consolidateResources();
        spawnFloat(state.perSecond, null);
        updateUI();
      }
    }, 1000);
  }

  // ----------------------
  // Upgrades
  // ----------------------
  function buyUpgrade(type){
  // +1 per second (water)
  if(type === "auto1" && state.life >= 50){
    state.life -= 50;
    state.perSecond += 1;
  }

  // +1 per click (water)
  if(type === "click1" && state.life >= 75){
    state.life -= 75;
    state.perClick += 1;
  }

  // +5 per second (LAKES)
  if(type === "auto5" && state.lakes >= 2){
    state.lakes -= 2;
    state.perSecond += 5;
  }

  // +5 per click (LAKES)
  if(type === "click5" && state.lakes >= 3){
    state.lakes -= 3;
    state.perClick += 5;
  }

  consolidateResources();
  updateUI();
}


  function renderShop(){
    shopItemsEl.innerHTML = `
      <button id="auto1">💧 +1 / sec (50)</button>
      <button id="click1">👆 +1 / click (75)</button>
      <button id="auto5">💧 +5 / sec (2 Lakes)</button>
      <button id="click5">👆 +5 / click (3 Lakes)</button>
    `;
  }

  // ----------------------
  // Events
  // ----------------------
  function attachEvents(){
    clickBtn.addEventListener('click', onClick);

    document.getElementById("auto1")?.addEventListener('click', () => buyUpgrade("auto1"));
    document.getElementById("click1")?.addEventListener('click', () => buyUpgrade("click1"));
    document.getElementById("auto5")?.addEventListener('click', () => buyUpgrade("auto5"));
    document.getElementById("click5")?.addEventListener('click', () => buyUpgrade("click5"));

    soundToggle?.addEventListener('change', () => {
      state.sound = soundToggle.checked;
      saveState();
    });

    autosaveSelect?.addEventListener('change', () => {
      state.autosaveInterval = Number(autosaveSelect.value);
      startAutosaveTimer();
    });

    resetBtn?.addEventListener('click', () => {
      if(confirm("Reset all progress?")){
        clearSavedState();
        state = Object.assign({}, defaultState);
        updateUI();
      }
    });
  }

  // ----------------------
  // Visual effects (minimal)
  // ----------------------
  function spawnFloat(amount, e){
    const el = document.createElement('div');
    el.className = 'float-num';
    el.textContent = `+${amount}`;
    effects.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  function initDecorations(){}
  function initOcean(){}

  // ----------------------
  // Start
  // ----------------------
  init();
})();
