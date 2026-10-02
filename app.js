// App glue: first-page chooser, look controls, hotspots, section dock, overlays, tweaks.
(async function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  const tooltip = $('tooltip');
  const overlay = $('overlay');
  const scrim = $('overlay-scrim');
  const ovContent = $('ov-content');
  const ovNav = $('ov-nav');
  const hint = $('hint');
  const timeChip = $('timeChip');
  const dayChip = $('dayChip');
  const loader = $('loader');
  const enterBtn = $('enterBtn');
  const dock = $('dock');
  const hotspotLayer = $('hotspots');
  const C = window.CONTENT;
  const clamp = THREE.MathUtils.clamp;

  // The sections of the CV, in reading order. These are the dock buttons and the
  // previous/next order inside the panel. `key` is a block in content.js.
  const SECTIONS = [
    { key: 'leftboard',  label: 'About' },
    { key: 'whiteboard', label: 'Research' },
    { key: 'textbook',   label: 'Publications' },
    { key: 'assignment', label: 'Thesis' },
    { key: 'maker',      label: 'Side projects' },
    { key: 'bulletin',   label: 'Experience' },
    { key: 'rightboard', label: 'Contact' },
  ];

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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) hint.textContent = 'Tap anything to walk over to it · tap again for more';

  // ---- first page: the visitor picks the classroom or the standard CV ----
  let three = null;
  let entered = false;
  let wantEnter = location.hash === '#room';   // deep link straight into the room
  function enterRoom() {
    if (entered) return;
    if (!three) { wantEnter = true; return; }  // scene still building — enter as soon as it is
    entered = true;
    loader.classList.add('hidden');
    document.body.classList.add('in-room');
    canvas.classList.add('live');
    if (three.playIntro && !reducedMotion) three.playIntro();
    setTimeout(() => hint.classList.add('faded'), 16000);
  }
  enterBtn.addEventListener('click', enterRoom);

  // ---- init three ----
  // The boards are painted with the web fonts, so wait for them (briefly) before building.
  if (document.fonts && document.fonts.load) {
    const faces = ['50px "Patrick Hand"', '40px "Caveat"', '600 40px "Caveat"', '60px "Fraunces"', '24px "JetBrains Mono"'];
    await Promise.race([
      Promise.all(faces.map(f => document.fonts.load(f))).catch(() => {}),
      new Promise(r => setTimeout(r, 2500)),
    ]);
  }
  try {
    three = window.Classroom.init(canvas, {
      accentHex: ACCENTS[state.accent].hex,
      sensitivity: state.sensitivity,
      sway: state.sway,
      dust: state.dust,
    });
  } catch (err) {
    console.error(err);
  }
  if (!three) {
    // no WebGL: the classroom can't run, so point at the standard CV instead
    enterBtn.disabled = true;
    $('enterCta').textContent = '3D is not available in this browser';
    return;
  }
  window.Classroom.updateWindow(three, effectiveTimeMode());
  updateTimeHud(effectiveTimeMode());

  // ---- looking around ----
  // Drag (or two-finger scroll, or the arrow keys / edge buttons) turns your head.
  // The mouse only adds a few degrees of parallax, so targets hold still while you aim at them.
  // You can turn all the way around (the door is behind you), so yaw is unbounded.
  const TAU = Math.PI * 2;
  const PITCH_UP = 0.7, PITCH_DOWN = -1.25;   // wide enough to look down at a desk you are standing over
  const HOME = { yaw: 0, pitch: -0.06 };
  const PARALLAX = { yaw: 0.05, pitch: 0.03 };
  const look = { yaw: HOME.yaw, pitch: HOME.pitch, parYaw: 0, parPitch: 0 };

  function applyLook() {
    three.targetYaw = look.yaw + look.parYaw;
    three.targetPitch = clamp(look.pitch + look.parPitch, PITCH_DOWN, PITCH_UP);
  }
  function lookTo(yaw, pitch) {
    look.yaw = yaw;
    look.pitch = clamp(pitch, PITCH_DOWN, PITCH_UP);
    applyLook();
  }
  // turn to an absolute heading by the shortest way round from where you are facing now
  function faceTo(yaw, pitch) {
    let d = (yaw - look.yaw) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    lookTo(look.yaw + d, pitch);
  }
  function lookBy(dYaw, dPitch) { lookTo(look.yaw + dYaw, look.pitch + dPitch); }
  function radPerPx() { return THREE.MathUtils.degToRad(three.camera.fov) / window.innerHeight; }
  function dismissHint() { hint.classList.add('faded'); }
  applyLook();

  let pointerX = null, pointerY = null;      // last mouse position over the canvas (null = not over it)
  let drag = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      pointerX = e.clientX; pointerY = e.clientY;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      three.pointerEnv.pointerNX = nx; three.pointerEnv.pointerNY = -ny;   // +1 = up, for the robot's eyes
      if (!reducedMotion) {
        look.parYaw = -nx * PARALLAX.yaw;
        look.parPitch = -ny * PARALLAX.pitch;
      }
    }
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) {
        drag.moved = true;
        canvas.classList.add('looking');
        clearHover();
        dismissHint();
        tracking = false;                     // you took over the view
      }
      // grab-the-room: the point under your finger follows it
      if (drag.moved) { const k = radPerPx(); look.yaw += dx * k; look.pitch += dy * k; }
    }
    lookTo(look.yaw, look.pitch);
  });
  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const wasClick = !drag.moved && !cancelled;
    drag = null;
    canvas.classList.remove('looking');
    if (wasClick) {
      const obj = pick(e.clientX, e.clientY);
      if (obj) activate(obj);
    }
  }
  canvas.addEventListener('pointerup', (e) => endDrag(e, false));
  canvas.addEventListener('pointercancel', (e) => endDrag(e, true));
  canvas.addEventListener('pointerleave', () => { pointerX = pointerY = null; });

  // two-finger scroll on a trackpad (or a mouse wheel) also turns your head
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey) return;                    // pinch gesture — ignore
    const unit = e.deltaMode === 1 ? 30 : 1;
    const k = radPerPx() * 0.7 * unit;
    tracking = false;
    lookBy(-e.deltaX * k, -e.deltaY * k);
    dismissHint();
  }, { passive: false });

  $('lookLeft').addEventListener('click', () => { tracking = false; lookBy(0.6, 0); dismissHint(); });
  $('lookRight').addEventListener('click', () => { tracking = false; lookBy(-0.6, 0); dismissHint(); });
  // recenter: face the thing you walked up to, or the front of the room from your seat
  $('recenterBtn').addEventListener('click', () => { if (focus) tracking = true; else faceTo(HOME.yaw, HOME.pitch); });
  $('seatBtn').addEventListener('click', () => backToSeat());

  // ---- picking + hover ----
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let currentHover = null;

  function pick(px, py) {
    pointer.x = (px / window.innerWidth) * 2 - 1;
    pointer.y = -(py / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, three.camera);
    const hits = raycaster.intersectObjects(three.interactive, false);
    return hits.length ? hits[0].object : null;
  }
  function showTip(text, px, py) {
    tooltip.textContent = text || '';
    tooltip.style.left = px + 'px';
    tooltip.style.top = py + 'px';
    tooltip.classList.add('show');
  }
  function setHoverObj(obj) {
    if (obj === currentHover) return;
    currentHover = obj;
    three.setHover(obj);
    canvas.classList.toggle('hovering', !!obj);
  }
  function clearHover() {
    setHoverObj(null);
    tooltip.classList.remove('show');
  }
  function handleHover(px, py) {
    const obj = pick(px, py);
    setHoverObj(obj);
    if (obj) showTip(isFocused(obj) ? 'Click again for more' : obj.userData.label, px, py);
    else tooltip.classList.remove('show');
  }

  // ---- walking over to things ----
  // First click on anything: you glide over to it and a small caption appears.
  // Click it again (or the caption's button) and the full panel opens. Esc walks you back to your seat.
  // How close to stand, per kind of thing. `wall` = it hangs on a wall facing that way (stand square to it);
  // `lift` = how far above it to hover (things lying on a desk); `eye` = a fixed eye height.
  const VIEWS = {
    whiteboard: { dist: 2.5, wall: [0, 0, 1] },
    leftboard:  { dist: 1.9, wall: [0, 0, 1] },
    rightboard: { dist: 2.0, wall: [0, 0, 1] },
    clock:      { dist: 1.7, wall: [0, 0, 1], eye: 2.3 },
    window:     { dist: 1.9, wall: [1, 0, 0] },
    bookshelf:  { dist: 1.8, wall: [-1, 0, 0] },
    globe:      { dist: 0.95, eye: 1.95 },
    assignment: { dist: 0.6, lift: 0.6 },
    notebook:   { dist: 0.5, lift: 0.5 },
    textbook:   { dist: 0.5, lift: 0.5 },
    laptop:     { dist: 0.62, lift: 0.22 },
    pencil:     { dist: 0.36, lift: 0.36 },
    eraser:     { dist: 0.36, lift: 0.34 },
    mug:        { dist: 0.42, lift: 0.3 },
    maker:      { dist: 0.85, lift: 0.3 },
  };
  // Each kind of thing gets its own caption look, and its own word for "tell me more".
  const PEEK_STYLE = {
    whiteboard: 'chalk', leftboard: 'chalk', rightboard: 'chalk',
    assignment: 'paper', notebook: 'paper', textbook: 'tag', bookshelf: 'tag',
    laptop: 'screen', pencil: 'sticky', eraser: 'sticky', mug: 'sticky',
    globe: 'tag', window: 'tag', clock: 'tag', maker: 'bubble',
  };
  const PEEK_CTA = {
    whiteboard: 'See the list', leftboard: 'Read more', rightboard: 'Get in touch',
    assignment: 'Pick it up', notebook: 'Open the diary', textbook: 'Open the book', bookshelf: 'Browse the shelf',
    laptop: 'See the demos', pencil: 'Read it', eraser: 'Read it', mug: 'Take a look',
    globe: 'Spin it', window: 'Look outside', clock: 'Check the time', maker: 'More about it',
  };
  const GROUPED = new Set(['rightboard']);   // several meshes that count as one thing
  const seat = three.camHome.clone();
  const camGoal = seat.clone();
  let focus = null;        // the thing you have walked up to: { obj, key, extra, target, cfg }
  let tracking = false;    // while gliding, keep that thing centered; stops when you arrive or take over
  let lastTick = performance.now();
  const peek = $('peek');
  const _w = new THREE.Vector3();
  const _pv = new THREE.Vector3();

  // the big board joins the clickable things: first click walks up to it, second opens the list
  if (three.anchors && three.anchors.whiteboard) {
    const wb = three.anchors.whiteboard;
    wb.userData.hit = 'whiteboard';
    wb.userData.label = 'Research';
    if (!three.interactive.includes(wb)) three.interactive.push(wb);
  }

  // ---- hotspots: a pulsing dot on each small clickable object, so nothing has to be hunted for ----
  const NO_SPOT = new Set(['whiteboard', 'leftboard', 'rightboard']);   // the boards and ribbons speak for themselves
  const spots = [];
  let spotHover = null;
  let rpsFloatObj = null;          // the robot's pick mesh while the floating game is open (see below)
  {
    const seen = new Set();
    three.interactive.forEach((obj) => {
      const u = obj.userData;
      if (NO_SPOT.has(u.hit)) return;
      const id = u.hit + ':' + (u.focus || '');
      if (seen.has(id)) return;
      seen.add(id);
      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      const center = obj.geometry.boundingBox.getCenter(new THREE.Vector3());
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'hotspot';
      el.tabIndex = -1;                       // keyboard users get every section from the dock
      el.dataset.spot = id;
      const spot = { el, obj, center, x: 0, y: 0 };
      el.addEventListener('click', () => activate(obj));
      el.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        spotHover = spot;
        setHoverObj(obj);
        showTip(u.label, spot.x, spot.y - 6);
      });
      el.addEventListener('pointerleave', () => { if (spotHover === spot) { spotHover = null; clearHover(); } });
      hotspotLayer.appendChild(el);
      spots.push(spot);
    });
  }
  const _v = new THREE.Vector3();
  function updateSpots() {
    const show = entered && !three.introActive;
    for (const s of spots) {
      let on = false;
      if (show) {
        _v.copy(s.center).applyMatrix4(s.obj.matrixWorld).project(three.camera);
        if (_v.z < 1 && Math.abs(_v.x) < 0.97 && Math.abs(_v.y) < 0.94) {
          s.x = (_v.x + 1) / 2 * window.innerWidth;
          s.y = (-_v.y + 1) / 2 * window.innerHeight;
          s.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
          on = true;
        }
      }
      s.el.classList.toggle('on', on && !isFocused(s.obj));
    }
  }

  // The camera eases toward its target, so the world under the cursor keeps drifting —
  // re-run hover and re-place the hotspots every frame.
  (function uiTick() {
    tickCamera();
    updateSpots();
    updateRpsFloat();
    updatePeek();
    if (spotHover) showTip(spotHover.obj.userData.label, spotHover.x, spotHover.y - 6);
    else if (pointerX !== null && !(drag && drag.moved) && !overlay.classList.contains('open')) handleHover(pointerX, pointerY);
    requestAnimationFrame(uiTick);
  })();

  // ---- dock ----
  SECTIONS.forEach((sec) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dock-btn';
    b.dataset.key = sec.key;
    b.textContent = sec.label;
    b.addEventListener('click', () => {
      if (openKey === sec.key) closeOverlay();
      else openOverlay(sec.key, null);
    });
    dock.appendChild(b);
  });

  // ---- walking over to things: the moves ----
  function isFocused(obj) {
    return !!focus && (focus.obj === obj || (GROUPED.has(focus.key) && obj.userData.hit === focus.key));
  }
  function objectFor(key, extra) {
    let objs = three.interactive.filter(o => o.userData.hit === key);
    if (extra && extra.focus) {
      const f = objs.filter(o => o.userData.focus === extra.focus);
      if (f.length) objs = f;
    }
    return objs[0] || (three.anchors && three.anchors[key]) || null;
  }
  // the point to look at: the middle of the thing (or of the whole group)
  function targetOf(obj) {
    const key = obj.userData.hit;
    const objs = GROUPED.has(key) ? three.interactive.filter(o => o.userData.hit === key) : [obj];
    const p = new THREE.Vector3();
    objs.forEach((o) => {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      p.add(o.geometry.boundingBox.getCenter(_w).applyMatrix4(o.matrixWorld));
    });
    return p.multiplyScalar(1 / objs.length);
  }
  // pick the spot to stand: on the line back toward your seat (square-on for things on a wall)
  function goTo(obj, extra) {
    const key = obj.userData.hit;
    const cfg = VIEWS[key] || { dist: 1.2 };
    const target = targetOf(obj);
    const dir = new THREE.Vector3(seat.x - target.x, 0, seat.z - target.z);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
    dir.normalize();
    if (cfg.wall) dir.lerp(_w.set(cfg.wall[0], 0, cfg.wall[2]), 0.65).normalize();
    camGoal.copy(target).addScaledVector(dir, cfg.dist);
    camGoal.y = cfg.lift != null ? target.y + cfg.lift
              : cfg.eye != null ? cfg.eye
              : seat.y * 0.45 + target.y * 0.55;
    camGoal.x = clamp(camGoal.x, -4.1, 4.1);          // stay inside the room
    camGoal.z = clamp(camGoal.z, -3.5, 3.6);
    focus = { obj, key, extra: extra || obj.userData, target, cfg };
    tracking = true;
    document.body.classList.add('away');
    dismissHint();
  }
  function backToSeat() {
    closeRpsFloat();
    hidePeek();
    focus = null;
    tracking = false;
    camGoal.copy(seat);
    document.body.classList.remove('away');
    faceTo(HOME.yaw, HOME.pitch);
  }
  // every frame: glide toward the standing spot, keeping the thing in the middle of the open view
  function tickCamera() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTick) / 1000);
    lastTick = now;
    if (!entered || three.introActive) return;
    const cam = three.camera.position;
    if (reducedMotion) cam.copy(camGoal);
    else cam.lerp(camGoal, 1 - Math.exp(-dt * 3.4));
    if (!focus || !tracking) return;
    const dx = focus.target.x - cam.x, dy = focus.target.y - cam.y, dz = focus.target.z - cam.z;
    let yaw = Math.atan2(-dx, -dz);
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));
    // an open panel covers the right side of a wide screen — put the thing in the middle of what's left
    if (openKey) {
      const panelW = overlay.getBoundingClientRect().width;
      if (window.innerWidth - panelW > 360) {
        const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(three.camera.fov) / 2) * three.camera.aspect);
        yaw -= Math.atan((panelW / window.innerWidth) * Math.tan(halfH));
      }
    }
    faceTo(yaw, pitch);
    if (cam.distanceTo(camGoal) < 0.03) tracking = false;   // arrived — the view is yours again
  }

  // what a click on a 3D thing does: walk over first, open on the second click
  function activate(obj) {
    const u = obj.userData;
    if (isFocused(obj)) { openOverlay(u.hit, u); return; }
    goTo(obj);
    if (u.hit === 'maker' && u.focus === 'robot') {
      hidePeek();
      openRpsFloat(obj);
    } else {
      closeRpsFloat();
      showPeek(obj);
      if (u.focus === 'rabbit' && three.rabbitHop) three.rabbitHop();
    }
  }

  // ---- the caption that appears beside the thing you walked up to ----
  function showPeek(obj) {
    const u = obj.userData;
    const w = C[u.hit] || {};
    const info = (u.hit === 'maker')
      ? { title: C.maker.rabbit.title, sub: C.maker.rabbit.desc }
      : { title: w.title || u.label, sub: w.sub || '' };
    peek.dataset.style = PEEK_STYLE[u.hit] || 'tag';
    peek.classList.toggle('docked', !!(VIEWS[u.hit] && VIEWS[u.hit].wall));
    $('peekTitle').innerHTML = info.title;
    $('peekSub').innerHTML = info.sub;
    $('peekOpen').textContent = PEEK_CTA[u.hit] || 'Open';
    peek.hidden = false;
  }
  function hidePeek() { peek.hidden = true; }
  function updatePeek() {
    if (peek.hidden || !focus) return;
    if (peek.classList.contains('docked')) { peek.style.transform = ''; peek.style.visibility = 'visible'; return; }
    const o = focus.obj, bb = o.geometry.boundingBox;
    _pv.set((bb.min.x + bb.max.x) / 2, bb.max.y, (bb.min.z + bb.max.z) / 2).applyMatrix4(o.matrixWorld).project(three.camera);
    const onScreen = _pv.z < 1 && Math.abs(_pv.x) < 1.1 && Math.abs(_pv.y) < 1.2;
    peek.style.visibility = onScreen ? 'visible' : 'hidden';
    if (!onScreen) return;
    const half = peek.offsetWidth / 2 + 8;
    const x = clamp((_pv.x + 1) / 2 * window.innerWidth, half, window.innerWidth - half);
    const y = clamp((-_pv.y + 1) / 2 * window.innerHeight - 14, peek.offsetHeight + 64, window.innerHeight - 90);
    peek.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }
  $('peekOpen').addEventListener('click', () => { if (focus) openOverlay(focus.key, focus.extra); });
  $('peekClose').addEventListener('click', () => backToSeat());

  // ---- overlay ----
  let openKey = null;
  let lastFocus = null;

  function openOverlay(key, extra) {
    closeRpsFloat();
    hidePeek();
    // remember where keyboard focus was, but only for real controls (not the dots over the 3D scene)
    if (!openKey) {
      const a = document.activeElement;
      lastFocus = (a && a.closest && a.closest('#dock, .hud')) ? a : null;
      if (a && a.classList && a.classList.contains('hotspot')) a.blur();
    }
    openKey = key;
    ovContent.innerHTML = renderOverlay(key, extra);
    renderNav(key);
    overlay.classList.add('open');
    scrim.classList.add('open');
    document.body.classList.add('panel-open');
    overlay.scrollTop = 0;
    dock.querySelectorAll('.dock-btn').forEach(b => b.classList.toggle('active', b.dataset.key === key));
    clearHover();
    dismissHint();
    // walk over to the thing this panel belongs to (if you are not already there)
    const obj = objectFor(key, extra);
    if (obj) {
      if (!isFocused(obj)) goTo(obj, extra);
      tracking = true;
    }
    bindPanel(key, extra);
    overlay.focus({ preventScroll: true });
  }
  function closeOverlay() {
    if (!openKey) return;
    openKey = null;
    overlay.classList.remove('open');
    scrim.classList.remove('open');
    document.body.classList.remove('panel-open');
    dock.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    tooltip.classList.remove('show');
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    // you are still standing by the thing — bring its caption (or the robot's game) back
    if (focus) {
      tracking = true;
      const u = focus.obj.userData;
      if (u.hit === 'maker' && u.focus === 'robot') openRpsFloat(focus.obj);
      else if (three.interactive.includes(focus.obj)) showPeek(focus.obj);
    }
  }
  scrim.addEventListener('click', closeOverlay);
  overlay.querySelector('.ov-close').addEventListener('click', closeOverlay);

  function step(dir) {
    const i = SECTIONS.findIndex(s => s.key === openKey);
    if (i < 0) return;
    const next = SECTIONS[i + dir];
    if (next) openOverlay(next.key, null);
  }
  function renderNav(key) {
    const i = SECTIONS.findIndex(s => s.key === key);
    if (i < 0) { ovNav.innerHTML = ''; return; }
    const prev = SECTIONS[i - 1], next = SECTIONS[i + 1];
    ovNav.innerHTML =
      (prev ? `<button type="button" class="ov-step prev" data-dir="-1">← ${prev.label}</button>` : '') +
      (next ? `<button type="button" class="ov-step next" data-dir="1">${next.label} →</button>` : '');
    ovNav.querySelectorAll('.ov-step').forEach(b => b.addEventListener('click', () => step(+b.dataset.dir)));
  }

  window.addEventListener('keydown', (e) => {
    if (!entered || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') { if (openKey) closeOverlay(); else if (focus) backToSeat(); return; }
    if (openKey) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      return;
    }
    const t = e.target;
    if (t && t.closest && t.closest('#tweaks')) return;
    tracking = false;
    switch (e.key) {
      case 'ArrowLeft':  lookBy(0.2, 0); break;
      case 'ArrowRight': lookBy(-0.2, 0); break;
      case 'ArrowUp':    lookBy(0, 0.1); break;
      case 'ArrowDown':  lookBy(0, -0.1); break;
      case 'r': case 'R': case 'Home': if (focus) tracking = true; else faceTo(HOME.yaw, HOME.pitch); break;
      default: return;
    }
    e.preventDefault();
    dismissHint();
  });

  // ---- overlay content rendering ----
  function overlayHeader(kicker, title, sub) {
    return `
      <div class="ov-kicker">${kicker}</div>
      <h2 class="ov-title" id="ov-title">${title}</h2>
      <p class="ov-sub">${sub}</p>
    `;
  }
  // a real link only when there is somewhere to go — never a dead "#"
  function linkHtml(href, label, cls) {
    if (!href || href === '#' || !label) return '';
    const ext = /^https?:/.test(href) || /\.html$|\/$/.test(href);
    return `<a class="${cls || 'ov-link'}" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  }
  function bodyHtml(w) {
    return `<div class="ov-body">${(w.body || []).map(p => `<p>${p}</p>`).join('')}</div>`;
  }

  function renderResearch(w) {
    return overlayHeader(w.kicker, w.title, w.sub) + `
      <div class="plist">
        ${w.items.map((p) => `
          <article class="pj">
            <div class="pj-num">${p.num}</div>
            <div class="pj-main">
              <h3 class="pj-title">${p.title}</h3>
              <div class="pj-where">${[p.lab, p.when].filter(Boolean).join(' · ')}${p.pi ? `<br>PI: ${p.pi}` : ''}</div>
              ${p.outcome ? `<div class="pj-outcome">→ ${p.outcome}</div>` : ''}
              ${linkHtml(p.href, p.link)}
            </div>
          </article>`).join('')}
      </div>`;
  }

  const RPS = {
    rock:     { e: '✊', n: 'Rock' },
    paper:    { e: '✋', n: 'Paper' },
    scissors: { e: '✌️', n: 'Scissors' },
  };
  const BEATEN_BY = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
  const WHY = { paper: 'Paper covers rock', scissors: 'Scissors cut paper', rock: 'Rock crushes scissors' };
  const rpsScore = { bot: 0, you: 0 };

  function renderMaker(w) {
    const r = w.rabbit, b = w.robot;
    return overlayHeader(w.kicker, w.title, w.sub) + `
      <div>
        <section class="mk" id="mk-rabbit">
          <h3 class="mk-title">${r.title}<span class="mk-status">${r.status}</span></h3>
          <p class="mk-desc">${r.desc}</p>
        </section>
        <section class="mk" id="mk-robot">
          <h3 class="mk-title">${b.title}<span class="mk-status">${b.status}</span></h3>
          <p class="mk-desc">${b.desc}</p>
          <div class="rps">
            <div class="rps-stage">
              <div><div class="rps-who">You</div><span class="rps-hand idle" id="rpsYou">✊</span></div>
              <div class="rps-vs">vs</div>
              <div><div class="rps-who">Robot</div><span class="rps-hand idle" id="rpsBot">✊</span></div>
            </div>
            <div class="rps-result" id="rpsResult" aria-live="polite">Pick your move.</div>
            <div class="rps-btns">
              ${Object.keys(RPS).map(m => `<button type="button" class="rps-btn" data-m="${m}"><span>${RPS[m].e}</span>${RPS[m].n}</button>`).join('')}
            </div>
            <div class="rps-score" id="rpsScore">Robot ${rpsScore.bot} · You ${rpsScore.you}</div>
            <div class="rps-note" id="rpsNote">${rpsScore.bot >= 1 ? `Robot: ${b.cheatNote}` : ''}</div>
          </div>
        </section>
      </div>`;
  }

  function renderOverlay(key, extra) {
    const w = C[key];
    if (!w) return `<p>Nothing here yet.</p>`;
    const head = overlayHeader(w.kicker, w.title, w.sub);
    switch (key) {
      case 'whiteboard':
        return renderResearch(w);
      case 'leftboard':
        return head + bodyHtml(w) + `
          <div class="ov-h">Education</div>
          <div>${(w.education || []).map(e => `
            <div class="edu">
              <div class="edu-top"><span class="edu-school">${e.school}</span><span class="edu-when">${e.when}</span></div>
              <div class="edu-degree">${e.degree}</div>
              ${e.notes ? `<div class="edu-notes">${e.notes}</div>` : ''}
            </div>`).join('')}</div>`;
      case 'rightboard':
        return head + `
          <div class="cgrid">
            ${w.contacts.map(c => {
              const inner = `<div class="clabel">${c.label}</div><div class="cval">${c.val}</div>`;
              if (!c.href || c.href === '#') return `<div class="cbtn">${inner}</div>`;
              const ext = !/^mailto:/.test(c.href);
              return `<a class="cbtn" href="${c.href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
            }).join('')}
          </div>
          <p class="ov-sub" style="margin-top:32px;margin-bottom:0">${w.now}</p>`;
      case 'textbook':
        return head + `
          <div>${w.pubs.map(p => `
            <div class="pub">
              <div class="pub-tag">${p.tag || p.year || ''}</div>
              <div>
                <div class="pub-title">${p.title}</div>
                <div class="pub-authors">${p.authors || ''}</div>
                <div class="pub-venue">${p.venue}</div>
                ${linkHtml(p.href, p.link)}
              </div>
            </div>`).join('')}</div>`;
      case 'assignment':
        return head + bodyHtml(w) + linkHtml(w.href, w.link);
      case 'maker':
        return renderMaker(w);
      case 'bulletin':
        return head + `
          <div>${w.items.map(i => `
            <div class="xp">
              <div class="xp-kind">${i.kind}</div>
              <div>
                <div class="xp-title">${i.title}</div>
                <div class="xp-org">${[i.org, i.meta].filter(Boolean).join(' · ')}</div>
                ${i.desc ? `<div class="xp-desc">${i.desc}</div>` : ''}
              </div>
            </div>`).join('')}</div>`;
      case 'notebook':
        return head + `
          <div>${w.entries.map(e => `
            <div class="entry">
              <div class="entry-date">${e.date}</div>
              <div class="entry-title">${e.title}</div>
              ${e.excerpt ? `<div class="entry-excerpt">${e.excerpt}</div>` : ''}
            </div>`).join('')}</div>`;
      case 'laptop':
        return head + `
          <div>${(w.demos || []).map(d => `
            <div class="mk">
              <h3 class="mk-title">${d.title}</h3>
              <div class="xp-org">${d.meta || ''}</div>
              ${d.desc ? `<p class="mk-desc">${d.desc}</p>` : ''}
              ${linkHtml(d.href, d.link)}
            </div>`).join('')}</div>`;
      case 'bookshelf':
        if (!(w.books || []).length) return head + `<div class="ov-body"><p>${w.empty || ''}</p></div>`;
        return head + `
          <div>${w.books.map(b => `
            <div class="mk">
              <h3 class="mk-title">${b.title}</h3>
              ${b.author ? `<div class="xp-org">${b.author}</div>` : ''}
              ${b.note ? `<p class="mk-desc">${b.note}</p>` : ''}
            </div>`).join('')}</div>`;
      default:
        return head + bodyHtml(w);
    }
  }

  // ---- behaviour inside a freshly rendered panel ----
  function bindPanel(key, extra) {
    if (key === 'maker') {
      const focus = extra && extra.focus;
      if (focus === 'rabbit' && three.rabbitHop) three.rabbitHop();
      if (focus === 'robot') {
        const el = $('mk-robot');
        if (el) requestAnimationFrame(() => overlay.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' }));
      }
      bindRps();
    }
  }

  // ---- the floating game: click the robot and the three moves appear beside it ----
  const rpsFloat = $('rpsFloat');
  const rpsBubble = $('rpsBubble');
  const rpsFloatBtns = [...rpsFloat.querySelectorAll('.rps-float-btn')];
  let rpsFloatBusy = false;
  const _rv = new THREE.Vector3();

  function openRpsFloat(obj) {
    rpsFloatObj = obj;
    rpsFloatBusy = false;
    rpsFloatBtns.forEach(b => { b.disabled = false; });
    rpsBubble.textContent = 'Rock, paper, scissors?';
    rpsFloat.hidden = false;
    clearHover();
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
  }
  function closeRpsFloat() {
    if (!rpsFloatObj) return;
    rpsFloatObj = null;
    rpsFloat.hidden = true;
  }
  // keep the buttons pinned just above the robot as the view moves
  function updateRpsFloat() {
    if (!rpsFloatObj) return;
    const bb = rpsFloatObj.geometry.boundingBox;
    _rv.set((bb.min.x + bb.max.x) / 2, bb.max.y, (bb.min.z + bb.max.z) / 2)
      .applyMatrix4(rpsFloatObj.matrixWorld).project(three.camera);
    const onScreen = _rv.z < 1 && Math.abs(_rv.x) < 1.1 && Math.abs(_rv.y) < 1.1;
    rpsFloat.style.visibility = onScreen ? 'visible' : 'hidden';
    if (!onScreen) return;
    const half = rpsFloat.offsetWidth / 2 + 8;
    const x = clamp((_rv.x + 1) / 2 * window.innerWidth, half, window.innerWidth - half);
    const y = Math.max(rpsFloat.offsetHeight + 8, (-_rv.y + 1) / 2 * window.innerHeight - 10);
    rpsFloat.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }
  rpsFloatBtns.forEach((b) => b.addEventListener('click', () => {
    if (rpsFloatBusy || !rpsFloatObj) return;
    rpsFloatBusy = true;
    const move = b.dataset.m;
    const botMove = (three.robotPlay && three.robotPlay(move)) || BEATEN_BY[move];
    rpsFloatBtns.forEach(o => { o.disabled = true; o.classList.toggle('picked', o === b); });
    rpsBubble.textContent = 'Rock… paper… scissors…';
    setTimeout(() => {
      rpsScore.bot += 1;
      const line = C.maker.robot.cheatNote.replace(/^[“"]|[”"]$/g, '');
      rpsBubble.innerHTML = `<strong>${RPS[botMove].e} ${WHY[botMove]}. I win.</strong><span>${line}</span>`;
      rpsFloatBtns.forEach(o => { o.disabled = false; o.classList.remove('picked'); });
      rpsFloatBusy = false;
    }, reducedMotion ? 300 : 950);
  }));
  $('rpsFloatClose').addEventListener('click', () => backToSeat());

  function bindRps() {
    const you = $('rpsYou'), bot = $('rpsBot'), result = $('rpsResult'), score = $('rpsScore'), note = $('rpsNote');
    const btns = [...ovContent.querySelectorAll('.rps-btn')];
    let busy = false;
    btns.forEach((b) => b.addEventListener('click', () => {
      if (busy) return;
      busy = true;
      const move = b.dataset.m;
      // the robot waits to see your move, then plays whatever beats it
      const botMove = (three.robotPlay && three.robotPlay(move)) || BEATEN_BY[move];
      btns.forEach(o => { o.disabled = true; });
      you.classList.remove('idle'); bot.classList.remove('idle');
      you.textContent = RPS[move].e;
      bot.textContent = RPS.rock.e;
      bot.classList.add('shake');
      result.textContent = 'Rock… paper… scissors…';
      setTimeout(() => {
        if (!document.contains(bot)) return;   // panel was closed or changed mid-round
        bot.classList.remove('shake');
        bot.textContent = RPS[botMove].e;
        rpsScore.bot += 1;
        result.innerHTML = `${WHY[botMove]}. <strong>The robot wins.</strong>`;
        score.textContent = `Robot ${rpsScore.bot} · You ${rpsScore.you}`;
        note.textContent = `Robot: ${C.maker.robot.cheatNote}`;   // it owns up after the very first round
        btns.forEach(o => { o.disabled = false; });
        busy = false;
      }, reducedMotion ? 300 : 950);
    }));
  }

  // ---- HUD clock tick ----
  setInterval(() => updateTimeHud(effectiveTimeMode()), 1000 * 15);

  // ---- TWEAKS ----
  const tweakPanel = $('tweaks');
  const twTime = $('tw-time');
  const twAccent = $('tw-accent');
  const twSens = $('tw-sens');
  const twSway = $('tw-sway');
  const twDust = $('tw-dust');

  twTime.value = state.timeOfDay;
  twAccent.value = state.accent;
  twSens.value = state.sensitivity;
  twSway.value = state.sway;
  twDust.value = state.dust;
  $('tw-sens-val').textContent = (+state.sensitivity).toFixed(2);
  $('tw-sway-val').textContent = (+state.sway).toFixed(2);

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
    $('tw-sens-val').textContent = state.sensitivity.toFixed(2);
    persistEdits({ sensitivity: state.sensitivity });
  });
  twSway.addEventListener('input', () => {
    state.sway = +twSway.value;
    three.swayAmp = state.sway;
    $('tw-sway-val').textContent = state.sway.toFixed(2);
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

  if (wantEnter) enterRoom();
})();
