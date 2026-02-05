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

  // Shop definitions (used for rendering + affordability UI)
  const upgrades = [
    {
      id: 'auto1',
      type: 'auto1',
      emoji: '💧',
      name: 'Auto Drip I',
      desc: '+1 / sec',
      cost: 50,
      currency: 'drops'
    },
    {
      id: 'click1',
      type: 'click1',
      emoji: '👆',
      name: 'Strong Click I',
      desc: '+1 / click',
      cost: 75,
      currency: 'drops'
    },
    {
      id: 'auto5',
      type: 'auto5',
      emoji: '💧',
      name: 'Auto Drip II',
      desc: '+5 / sec',
      cost: 2,
      currency: 'lakes'
    },
    {
      id: 'click5',
      type: 'click5',
      emoji: '👆',
      name: 'Strong Click II',
      desc: '+5 / click',
      cost: 3,
      currency: 'lakes'
    }
  ];

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
    updateShopButtons();
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
    shopItemsEl.innerHTML = upgrades.map(u => {
      const currencyLabel = u.currency === 'lakes' ? 'Lakes' : 'Drops';
      return `
        <button
          id="${u.id}"
          class="shop-btn"
          type="button"
          data-upgrade="${u.type}"
          data-cost="${u.cost}"
          data-currency="${u.currency}"
        >
          <div class="shop-btn-top">
            <div class="shop-emoji" aria-hidden="true">${u.emoji}</div>
            <div class="shop-title">
              <div class="shop-name">${u.name}</div>
              <div class="shop-desc">${u.desc}</div>
            </div>
          </div>
          <div class="shop-cost" aria-label="Cost">
            <span class="shop-cost-label">Cost</span>
            <span class="shop-cost-value">${u.cost}</span>
            <span class="shop-cost-currency">${currencyLabel}</span>
          </div>
        </button>

        const shopToggleBtn = document.getElementById('shop-toggle');
const shopDropdown = document.getElementById('shop-items');

shopToggleBtn?.addEventListener('click', () => {
  if (!shopDropdown) return;
  const isShown = shopDropdown.classList.toggle('show');
  shopDropdown.setAttribute('aria-hidden', !isShown);
});

      `;
    }).join('');

    updateShopButtons();
  }

  function canAffordUpgrade(btn){
    const cost = Number(btn.dataset.cost || '0');
    const currency = btn.dataset.currency || 'drops';
    if(currency === 'lakes') return state.lakes >= cost;
    return state.life >= cost;
  }

  function updateShopButtons(){
    if(!shopItemsEl) return;
    const buttons = shopItemsEl.querySelectorAll('button[data-upgrade]');
    buttons.forEach(btn => {
      const affordable = canAffordUpgrade(btn);
      btn.disabled = !affordable;
      btn.classList.toggle('is-affordable', affordable);
      btn.classList.toggle('is-locked', !affordable);

      const cost = btn.dataset.cost;
      const currency = btn.dataset.currency === 'lakes' ? 'Lakes' : 'Drops';
      btn.title = affordable ? 'Click to buy' : `Need ${cost} ${currency}`;
    });
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

        const shopToggleBtn = document.getElementById('shop-toggle');
        const shopDropdown = document.getElementById('shop-items');

        shopToggleBtn?.addEventListener('click', () => {
          if (!shopDropdown) return;
          const isShown = shopDropdown.classList.toggle('show');
          shopDropdown.setAttribute('aria-hidden', !isShown);
});
 
      }
    });

    // Open settings
settingsBtn?.addEventListener('click', () => {
  settingsModal.setAttribute('aria-hidden', 'false');
  settingsBtn.setAttribute('aria-expanded', 'true');
});

// Close settings (using the X button)
settingsClose?.addEventListener('click', () => {
  settingsModal.setAttribute('aria-hidden', 'true');
  settingsBtn.setAttribute('aria-expanded', 'false');
});

// Close settings if clicking the background (the backdrop)
settingsModal?.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.setAttribute('aria-hidden', 'true');
    settingsBtn.setAttribute('aria-expanded', 'false');
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

  function initDecorations() {
  if (!starsContainer) return;

  const starCount = 150; // Adjust for density
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    
    // Randomize position
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Randomize size (0.5px to 2.5px)
    const size = Math.random() * 2 + 0.5;
    
    // Randomize twinkle timing so they don't all blink at once
    const delay = Math.random() * 3;
    const duration = 2 + Math.random() * 3;

    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.animationDelay = `${delay}s`;
    star.style.animationDuration = `${duration}s`;

    fragment.appendChild(star);
  }

  starsContainer.appendChild(fragment);
}

  // ----------------------
  // Ocean waves (bottom)
  // ----------------------
  /**
   * Generate a filled SVG path with sophisticated wave patterns
   * Combines multiple sine waves for more natural, varied ocean waves
   */
  function generateWavePath({
    width,
    height,
    amplitude,
    wavelength,
    phase,
    baseline
  }){
    const points = 60; // More points for smoother curves
    const step = width / points;

    let d = `M 0 ${baseline}`;

    for(let i = 0; i <= points; i++){
      const x = i * step;
      // Combine multiple wave frequencies for more natural variation
      const theta1 = (x / wavelength) * Math.PI * 2 + phase;
      const theta2 = (x / (wavelength * 0.7)) * Math.PI * 2 + phase * 1.3;
      const theta3 = (x / (wavelength * 1.5)) * Math.PI * 2 + phase * 0.7;
      
      // Weighted combination for natural wave shape
      const wave1 = Math.sin(theta1) * amplitude;
      const wave2 = Math.sin(theta2) * amplitude * 0.3;
      const wave3 = Math.sin(theta3) * amplitude * 0.15;
      
      const y = baseline + wave1 + wave2 + wave3;
      d += ` L ${x} ${y}`;
    }

    // close the shape down to the bottom of the SVG so it can be filled
    d += ` L ${width} ${height} L 0 ${height} Z`;
    return d;
  }

  /**
   * Foam path: enhanced top ridge with variation for realistic foam
   */
  function generateFoamPath({
    width,
    amplitude,
    wavelength,
    phase,
    baseline
  }){
    const points = 80; // More detail for foam
    const step = width / points;

    let d = `M 0 ${baseline}`;
    for(let i = 0; i <= points; i++){
      const x = i * step;
      // Multiple frequencies for varied foam pattern
      const theta1 = (x / wavelength) * Math.PI * 2 + phase;
      const theta2 = (x / (wavelength * 0.6)) * Math.PI * 2 + phase * 1.4;
      
      const wave1 = Math.sin(theta1) * amplitude;
      const wave2 = Math.sin(theta2) * amplitude * 0.25;
      // Add small random-like variation for foam texture
      const foamVariation = Math.sin(theta1 * 3) * amplitude * 0.08;
      
      const y = baseline + wave1 + wave2 + foamVariation;
      d += ` L ${x} ${y}`;
    }
    return d;
  }

  /**
   * Generate highlight path for wave crests (shimmer effect)
   */
  function generateHighlightPath({
    width,
    amplitude,
    wavelength,
    phase,
    baseline
  }){
    const points = 60;
    const step = width / points;

    let d = `M 0 ${baseline}`;
    for(let i = 0; i <= points; i++){
      const x = i * step;
      const theta1 = (x / wavelength) * Math.PI * 2 + phase;
      const theta2 = (x / (wavelength * 0.8)) * Math.PI * 2 + phase * 1.2;
      
      const wave1 = Math.sin(theta1) * amplitude;
      const wave2 = Math.sin(theta2) * amplitude * 0.2;
      const y = baseline + wave1 + wave2 - 8; // Slightly above the wave
      d += ` L ${x} ${y}`;
    }
    // Close to create a filled highlight area
    d += ` L ${width} ${baseline - 15} L 0 ${baseline - 15} Z`;
    return d;
  }

  function initOcean(){
    if(!oceanSvg) return;

    const backPath = oceanSvg.querySelector('.wave-back-path');
    const midPath = oceanSvg.querySelector('.wave-mid-path');
    const frontPath = oceanSvg.querySelector('.wave-front-path');
    const foamPath = oceanSvg.querySelector('.wave-foam');
    const midHighlight = oceanSvg.querySelector('.wave-mid-highlight');
    const frontHighlight = oceanSvg.querySelector('.wave-front-highlight');

    if(!backPath || !midPath || !frontPath || !foamPath) return;

    // Match the SVG viewBox in index.html
    const width = 1600;
    const height = 300;

    let startTime = null;

    function frame(timestamp){
      if(startTime === null) startTime = timestamp;
      const t = (timestamp - startTime) / 1000; // seconds

      // Slowly drifting phase values for parallax movement
      const backPhase = t * 0.3;
      const midPhase = t * 0.6;
      const frontPhase = t * 1.0;

      // Back layer: deeper, slower, lower amplitude (shorter waves)
      backPath.setAttribute('d', generateWavePath({
        width,
        height,
        amplitude: 24,
        wavelength: 520,
        phase: backPhase,
        baseline: 200
      }));

      // Mid layer: medium amplitude & speed (shorter than before)
      midPath.setAttribute('d', generateWavePath({
        width,
        height,
        amplitude: 32,
        wavelength: 420,
        phase: midPhase,
        baseline: 210
      }));

      // Mid layer highlight
      if(midHighlight){
        midHighlight.setAttribute('d', generateHighlightPath({
          width,
          amplitude: 32,
          wavelength: 420,
          phase: midPhase,
          baseline: 210
        }));
      }

      // Front layer: closest to camera, most energy (shorter)
      const frontBaseline = 220;
      const frontAmplitude = 42;

      frontPath.setAttribute('d', generateWavePath({
        width,
        height,
        amplitude: frontAmplitude,
        wavelength: 360,
        phase: frontPhase,
        baseline: frontBaseline
      }));

      // Front layer highlight
      if(frontHighlight){
        frontHighlight.setAttribute('d', generateHighlightPath({
          width,
          amplitude: frontAmplitude,
          wavelength: 360,
          phase: frontPhase,
          baseline: frontBaseline
        }));
      }

      // Enhanced foam riding on the front wave crest
      foamPath.setAttribute('d', generateFoamPath({
        width,
        amplitude: frontAmplitude * 0.55,
        wavelength: 360,
        phase: frontPhase + Math.PI / 6,
        baseline: frontBaseline - 6
      }));

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // ----------------------
  // Start
  // ----------------------
  init();
})();
