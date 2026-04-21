// App glue: input, overlays, clock/time HUD, tweaks, fallback.
(function () {
  const canvas = document.getElementById('scene');
  const tooltip = document.getElementById('tooltip');
  const overlay = document.getElementById('overlay');
  const scrim = document.getElementById('overlay-scrim');
  const ovContent = document.getElementById('ov-content');
  const hud = document.querySelector('.hud.bl .hint');
  const timeChip = document.getElementById('timeChip');
  const dayChip = document.getElementById('dayChip');
  const loader = document.getElementById('loader');

  // ---- accent color lookup ----
  const ACCENTS = {
    red:    { hex: '#c0392b', css: 'oklch(0.58 0.16 25)' },
    blue:   { hex: '#2e6aa8', css: 'oklch(0.55 0.12 240)' },
    green:  { hex: '#2e7a50', css: 'oklch(0.52 0.12 155)' },
    yellow: { hex: '#a88818', css: 'oklch(0.62 0.14 85)' },
  };

  // ---- time of day detection ----
  function computeTimeMode() {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) return 'morning';
    if (h >= 10 && h < 17) return 'afternoon';
    if (h >= 17 && h < 20) return 'dusk';
    return 'night';
  }
  function updateTimeHud(mode) {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    timeChip.textContent = `${hh}:${mm}`;
    dayChip.textContent = mode;
  }

  // ---- read tweak defaults / stored ----
  const defaults = window.TWEAK_DEFAULTS || {};
  const state = {
    accent: defaults.accent || 'red',
    timeOfDay: defaults.timeOfDay || 'auto',
    sensitivity: defaults.sensitivity || 0.8,
    sway: defaults.sway || 0.35,
    dust: defaults.dust || 'on',
  };

  function effectiveTimeMode() {
    return state.timeOfDay === 'auto' ? computeTimeMode() : state.timeOfDay;
  }

  // ---- intro countdown ----
  const INTRO_SECS = 5;
  let sceneBuilt = false;
  let countdownDone = false;
  let introInterval = null;

  const introBarFill = document.getElementById('introBarFill');
  const introTimer = document.getElementById('introTimer');
  const enterBtn = document.getElementById('enterBtn');
  const textCvBtn = document.getElementById('textCvBtn');

  function dismissIntro() {
    if (introInterval) { clearInterval(introInterval); introInterval = null; }
    loader.classList.add('hidden');
  }

  function startCountdown() {
    const t0 = Date.now();
    introInterval = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      const pct = Math.min(elapsed / INTRO_SECS, 1);
      if (introBarFill) introBarFill.style.width = (pct * 100) + '%';
      const rem = Math.max(0, Math.ceil(INTRO_SECS - elapsed));
      if (introTimer) introTimer.textContent = rem > 0 ? `Entering classroom in ${rem}s…` : 'Entering classroom…';
      if (elapsed >= INTRO_SECS) {
        clearInterval(introInterval); introInterval = null;
        countdownDone = true;
        if (sceneBuilt) dismissIntro();
      }
    }, 100);
  }
  startCountdown();

  if (enterBtn) enterBtn.addEventListener('click', () => { dismissIntro(); });
  if (textCvBtn) textCvBtn.addEventListener('click', () => { dismissIntro(); enterFallback(); });

  // ---- init three ----
  let three;
  function initScene() {
    three = window.Classroom.init(canvas, {
      accentHex: ACCENTS[state.accent].hex,
      sensitivity: state.sensitivity,
      sway: state.sway,
      dust: state.dust,
    });
    window.Classroom.updateWindow(three, effectiveTimeMode());
    updateTimeHud(effectiveTimeMode());
    sceneBuilt = true;
    if (countdownDone) dismissIntro();
  }

  // Reduced motion
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initScene();

  // ---- input: mouse + touch + keyboard ----
  const MAX_YAW = Math.PI / 3;   // ±60°
  const MAX_PITCH = Math.PI / 7; // ±25°

  let dragging = false;
  let lastX = 0, lastY = 0;
  let usingDrag = false;

  function setTargetFromPointer(nx, ny) {
    // nx, ny in -1..1 of viewport. Full mouse-follow look-around.
    three.targetYaw = THREE.MathUtils.clamp(-nx * MAX_YAW * state.sensitivity, -MAX_YAW, MAX_YAW);
    three.targetPitch = THREE.MathUtils.clamp(-ny * MAX_PITCH * state.sensitivity, -MAX_PITCH, MAX_PITCH);
  }

  canvas.addEventListener('mousemove', (e) => {
    if (reducedMotion && !dragging) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    if (!dragging && !usingDrag) {
      setTargetFromPointer(nx, ny);
    }
    handleHover(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousedown', (e) => {
    dragging = true; usingDrag = true; lastX = e.clientX; lastY = e.clientY;
    canvas.classList.add('looking');
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    usingDrag = false;
    canvas.classList.remove('looking');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    three.targetYaw = THREE.MathUtils.clamp(three.targetYaw - dx * 0.004, -MAX_YAW, MAX_YAW);
    three.targetPitch = THREE.MathUtils.clamp(three.targetPitch - dy * 0.004, -MAX_PITCH, MAX_PITCH);
  });

  // touch
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      dragging = true; usingDrag = true;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - lastX, dy = t.clientY - lastY;
    lastX = t.clientX; lastY = t.clientY;
    three.targetYaw = THREE.MathUtils.clamp(three.targetYaw - dx * 0.005, -MAX_YAW, MAX_YAW);
    three.targetPitch = THREE.MathUtils.clamp(three.targetPitch - dy * 0.005, -MAX_PITCH, MAX_PITCH);
  }, { passive: true });
  canvas.addEventListener('touchend', () => { dragging = false; usingDrag = false; });

  // raycaster
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let currentHover = null;

  function handleHover(px, py) {
    pointer.x = (px / window.innerWidth) * 2 - 1;
    pointer.y = -(py / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, three.camera);
    const hits = raycaster.intersectObjects(three.interactive, false);
    if (hits.length) {
      const obj = hits[0].object;
      if (obj !== currentHover) {
        currentHover = obj;
        three.setHover(obj);
        canvas.classList.add('hovering');
      }
      tooltip.textContent = obj.userData.label || '';
      tooltip.style.left = px + 'px';
      tooltip.style.top = py + 'px';
      tooltip.classList.add('show');
    } else {
      if (currentHover) {
        currentHover = null;
        three.setHover(null);
        canvas.classList.remove('hovering');
      }
      tooltip.classList.remove('show');
    }
  }

  canvas.addEventListener('click', (e) => {
    handleHover(e.clientX, e.clientY);
    if (currentHover) {
      openOverlay(currentHover.userData.hit, currentHover.userData);
    }
  });

  // ---- overlay ----
  function openOverlay(key, extra) {
    ovContent.innerHTML = renderOverlay(key, extra);
    overlay.classList.add('open');
    scrim.classList.add('open');
    overlay.scrollTop = 0;
    // if a specific project was clicked, scroll to it inside the overlay
    if (key === 'whiteboard' && extra && typeof extra.projectIndex === 'number') {
      requestAnimationFrame(() => {
        const el = ovContent.querySelector(`.proj[data-idx="${extra.projectIndex}"]`);
        if (el) {
          const top = el.offsetTop - 24;
          overlay.scrollTo({ top, behavior: 'smooth' });
        }
      });
    }
    // hide the hint once user has clicked
    if (hud) hud.style.opacity = '0';
  }
  function closeOverlay() {
    overlay.classList.remove('open');
    scrim.classList.remove('open');
    tooltip.classList.remove('show');
  }
  scrim.addEventListener('click', closeOverlay);
  overlay.querySelector('.ov-close').addEventListener('click', closeOverlay);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOverlay();
    if (e.key === 'r' || e.key === 'R') {
      three.targetYaw = 0; three.targetPitch = 0;
    }
  });

  document.getElementById('recenterBtn').addEventListener('click', () => {
    three.targetYaw = 0; three.targetPitch = 0;
  });

  // sound toggle — just a visual toggle, no real audio
  const soundBtn = document.getElementById('soundBtn');
  let soundOn = false;
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.innerHTML = soundOn ? '🔊 ambient' : '🔇 ambient';
  });

  // ---- overlay content rendering ----
  const C = window.CONTENT;

  function overlayHeader(kicker, title, sub) {
    return `
      <div class="ov-kicker">${kicker}</div>
      <h2 class="ov-title" id="ov-title">${title}</h2>
      <p class="ov-sub">${sub}</p>
    `;
  }

  function renderOverlay(key, extra) {
    switch (key) {
      case 'whiteboard': {
        const w = C.whiteboard;
        const activeIdx = (extra && typeof extra.projectIndex === 'number') ? extra.projectIndex : -1;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="ov-body">
            ${w.items.map((p, i) => `
              <div class="proj${i === activeIdx ? ' proj-active' : ''}" data-idx="${i}">
                <div class="proj-num">${p.num}</div>
                <div>
                  <div class="proj-title">${p.title}</div>
                  <div class="proj-meta">${p.meta}</div>
                  <div class="proj-desc">${p.desc}</div>
                </div>
                <a class="proj-link" href="#">${p.link}</a>
              </div>
            `).join('')}
          </div>`;
      }
      case 'leftboard': {
        const w = C.leftboard;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="ov-body">${w.body.map(p => `<p>${p}</p>`).join('')}</div>`;
      }
      case 'rightboard': {
        const w = C.rightboard;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="cgrid">
            ${w.contacts.map(c => `<a class="cbtn" href="${c.href}">
              <div class="clabel">${c.label}</div>
              <div class="cval">${c.val}</div>
            </a>`).join('')}
          </div>
          <p class="ov-sub" style="margin-top:32px;margin-bottom:0">${w.now}</p>`;
      }
      case 'notebook': {
        const w = C.notebook;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div>${w.entries.map(e => `
            <div class="entry">
              <div class="entry-date">${e.date}</div>
              <div class="entry-title">${e.title}</div>
              <div class="entry-excerpt">${e.excerpt}</div>
            </div>`).join('')}</div>`;
      }
      case 'textbook': {
        const w = C.textbook;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div>${w.pubs.map(p => `
            <div class="proj">
              <div class="proj-num">${p.date}</div>
              <div>
                <div class="proj-title">${p.title}</div>
                <div class="proj-meta">${p.venue}</div>
              </div>
              <a class="proj-link" href="#">${p.link}</a>
            </div>`).join('')}</div>`;
      }
      case 'laptop': {
        const w = C.laptop;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="demo-frame">(live embed — your reading tool renders here)</div>
          <div class="demo-caption">${w.demoCaption}</div>`;
      }
      case 'pencil': {
        const w = C.pencil;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="ov-body">${w.body.map(p => `<p>${p}</p>`).join('')}</div>`;
      }
      case 'mug': {
        const w = C.mug;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="ov-body">${w.body.map(p => `<p>${p}</p>`).join('')}</div>`;
      }
      case 'eraser': {
        const w = C.eraser;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="ov-body">${w.body.map(p => `<p>${p}</p>`).join('')}</div>`;
      }
      case 'assignment': {
        const w = C.assignment;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="assignment">${w.body.join('<br><br>')}</div>`;
      }
      case 'bulletin': {
        const w = C.bulletin;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="bgrid">
            ${w.items.map(i => `<div class="pin">
              <div class="pin-kind">${i.kind}</div>
              <div class="pin-title">${i.title}</div>
              <div class="pin-meta">${i.meta}</div>
            </div>`).join('')}
          </div>`;
      }
      case 'window': {
        const w = C.window;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="ov-body">${w.body.map(p => `<p>${p}</p>`).join('')}</div>`;
      }
      case 'clock': {
        const w = C.clock;
        return overlayHeader(w.kicker, w.title, w.sub) + `
          <div class="ov-body">${w.body.map(p => `<p>${p}</p>`).join('')}</div>`;
      }
      default:
        return `<p>Nothing here yet.</p>`;
    }
  }

  // ---- fallback ----
  function enterFallback() {
    document.body.classList.add('fallback-view');
    renderFallback();
    window.scrollTo(0, 0);
  }
  window.exitFallback = function () {
    document.body.classList.remove('fallback-view');
  };
  function renderFallback() {
    // name + lede pulled from profile
    const fbName = document.getElementById('fb-name');
    if (fbName) fbName.textContent = C.profile.name;
    const fbLede = document.getElementById('fb-lede');
    if (fbLede) fbLede.textContent = `${C.profile.role}. ${C.profile.now}`;

    const fbAbout = document.getElementById('fb-about');
    if (fbAbout) {
      fbAbout.innerHTML = C.leftboard.body.map(p => `<p>${p}</p>`).join('');
    }

    const fp = document.getElementById('fb-projects');
    fp.innerHTML = C.whiteboard.items.map(p => `
      <div style="margin-bottom:20px">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(0,0,0,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">${p.meta}</div>
        <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:500">${p.title}</div>
        <p style="margin-top:6px;font-size:15px">${p.desc} <a href="#">${p.link}</a></p>
      </div>`).join('');
    document.getElementById('fb-writing').innerHTML = C.notebook.entries.map(e => `
      <p><strong style="font-family:'Fraunces',serif">${e.title}</strong> — ${e.excerpt} <em style="color:rgba(0,0,0,0.5)">(${e.date})</em></p>
    `).join('');
    document.getElementById('fb-pubs').innerHTML = C.textbook.pubs.map(p => `
      <p>${p.date} — <strong>${p.title}</strong>, ${p.venue}. <a href="#">${p.link}</a></p>
    `).join('');
    document.getElementById('fb-contact').innerHTML = C.rightboard.contacts.map(c => `
      <p><strong>${c.label}:</strong> <a href="${c.href}">${c.val}</a></p>
    `).join('');

    const fbBulletin = document.getElementById('fb-bulletin');
    if (fbBulletin && C.bulletin && C.bulletin.items) {
      fbBulletin.innerHTML = C.bulletin.items.map(b => `
        <p><strong style="font-family:'Fraunces',serif">${b.title}</strong> — <em style="color:rgba(0,0,0,0.5)">${b.meta}</em> <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--marker);text-transform:uppercase;letter-spacing:0.08em">${b.kind}</span></p>
      `).join('');
    }
  }
  document.getElementById('skipBtn').addEventListener('click', (e) => {
    e.preventDefault();
    enterFallback();
  });

  // ---- tab-cycle accessibility: arrow-key cycles focus through interactive objects ----
  let focusIndex = -1;
  window.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('fallback-view')) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const dir = e.shiftKey ? -1 : 1;
      focusIndex = (focusIndex + dir + three.interactive.length) % three.interactive.length;
      const obj = three.interactive[focusIndex];
      three.setHover(obj);
      // aim camera at it
      const wp = new THREE.Vector3();
      obj.getWorldPosition(wp);
      const dx = wp.x - three.camera.position.x;
      const dy = wp.y - three.camera.position.y;
      const dz = wp.z - three.camera.position.z;
      three.targetYaw = THREE.MathUtils.clamp(Math.atan2(-dx, -dz), -MAX_YAW, MAX_YAW);
      three.targetPitch = THREE.MathUtils.clamp(Math.atan2(dy, Math.sqrt(dx*dx + dz*dz)), -MAX_PITCH, MAX_PITCH);
      tooltip.textContent = obj.userData.label || '';
      const sc = wp.clone().project(three.camera);
      tooltip.style.left = ((sc.x + 1) / 2 * window.innerWidth) + 'px';
      tooltip.style.top = ((-sc.y + 1) / 2 * window.innerHeight) + 'px';
      tooltip.classList.add('show');
    }
    if ((e.key === 'Enter' || e.key === ' ') && focusIndex >= 0 && !overlay.classList.contains('open')) {
      e.preventDefault();
      openOverlay(three.interactive[focusIndex].userData.hit, three.interactive[focusIndex].userData);
    }
  });

  // ---- HUD clock tick ----
  setInterval(() => updateTimeHud(effectiveTimeMode()), 1000 * 15);

  // ---- TWEAKS ----
  const tweakPanel = document.getElementById('tweaks');
  const twTime = document.getElementById('tw-time');
  const twAccent = document.getElementById('tw-accent');
  const twSens = document.getElementById('tw-sens');
  const twSway = document.getElementById('tw-sway');
  const twDust = document.getElementById('tw-dust');

  twTime.value = state.timeOfDay;
  twAccent.value = state.accent;
  twSens.value = state.sensitivity;
  twSway.value = state.sway;
  twDust.value = state.dust;
  document.getElementById('tw-sens-val').textContent = (+state.sensitivity).toFixed(2);
  document.getElementById('tw-sway-val').textContent = (+state.sway).toFixed(2);

  function persistEdits(edits) {
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*'); } catch (e) {}
  }

  twTime.addEventListener('change', () => {
    state.timeOfDay = twTime.value;
    window.Classroom.updateWindow(three, effectiveTimeMode());
    updateTimeHud(effectiveTimeMode());
    persistEdits({ timeOfDay: state.timeOfDay });
  });
  twAccent.addEventListener('change', () => {
    state.accent = twAccent.value;
    document.documentElement.style.setProperty('--marker', ACCENTS[state.accent].css);
    window.Classroom.updateAccent(three, ACCENTS[state.accent].hex);
    persistEdits({ accent: state.accent });
  });
  twSens.addEventListener('input', () => {
    state.sensitivity = +twSens.value;
    three.sensitivity = state.sensitivity;
    document.getElementById('tw-sens-val').textContent = state.sensitivity.toFixed(2);
    persistEdits({ sensitivity: state.sensitivity });
  });
  twSway.addEventListener('input', () => {
    state.sway = +twSway.value;
    three.swayAmp = state.sway;
    document.getElementById('tw-sway-val').textContent = state.sway.toFixed(2);
    persistEdits({ sway: state.sway });
  });
  twDust.addEventListener('change', () => {
    state.dust = twDust.value;
    three.dust = (state.dust !== 'off');
    persistEdits({ dust: state.dust });
  });

  // Edit-mode protocol
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') tweakPanel.classList.add('show');
    if (d.type === '__deactivate_edit_mode') tweakPanel.classList.remove('show');
  });
  window.parent.postMessage({ type: '__edit_mode_available' }, '*');

  // Apply accent CSS on init
  document.documentElement.style.setProperty('--marker', ACCENTS[state.accent].css);

  // Reduced motion — snap instead of damp, disable sway
  if (reducedMotion) {
    three.damping = 1.0;
    three.swayAmp = 0;
  }

  // Fallback: hide loader after max wait (covers errors)
  setTimeout(() => { if (!loader.classList.contains('hidden')) dismissIntro(); }, 8000);
})();
