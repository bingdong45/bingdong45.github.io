// The side-projects desk: a workbench with the AI rabbit (hops around by itself)
// and a googly-eyed robot that plays rock-paper-scissors (and always wins).
// Self-contained: needs only the global THREE (r160). Units in metres, y up.
//
//   const side = window.SideDesk.build({ woodMap, accentHex });
//   scene.add(side.group);                 // origin = floor under the desk centre, front faces local +z
//   side.interactive.forEach(o => interactive.push(o));
//   side.update(performance.now(), dt, { pointerNX, pointerNY });   // every frame
//   side.robotPlay('rock');                // -> 'paper'
//   side.rabbitHop();

window.SideDesk = (function () {
  const THREE = window.THREE;

  // ---- layout (local coordinates) ----
  const DESK_W = 1.3, DESK_D = 0.7, DESK_TOP = 0.95, TOP_THICK = 0.06;
  const MAT_THICK = 0.004;
  // where the visitor's eye roughly is, in the desk's local frame (for "face the visitor").
  // scene.js puts the desk at (-1.4, 0, 0.55) turned a quarter-turn (rotation.y = π/2), beside the
  // seat at (0, 0.8): local x = -(0.8 - 0.55), local z = 1.4. Update this if that placement changes.
  const VISITOR = { x: -0.25, z: 1.4 };
  // rabbit roaming rectangle (root position) — everything else on the desk is kept out of reach of it
  const ROAM = { x0: 0.03, x1: 0.5, z0: -0.12, z1: 0.16 };
  const ROBOT_POS = { x: -0.44, z: -0.03, yaw: 0.13 };   // yaw = turned toward VISITOR

  const WIN = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
  const ORDER = ['rock', 'paper', 'scissors'];

  // ---- small helpers ----
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - (1 - clamp(t, 0, 1)) * (1 - clamp(t, 0, 1));
  const rand = (a, b) => a + Math.random() * (b - a);
  const damp = (dt, rate) => 1 - Math.exp(-dt * rate);
  function shortAngle(a) {
    a = (a + Math.PI) % TAU;
    if (a < 0) a += TAU;
    return a - Math.PI;
  }

  function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }

  const lambert = (color, extra) => new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));

  function mesh(geo, mat, x, y, z, parent) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(m);
    return m;
  }

  // Box with rounded edges (extruded rounded rectangle + bevel), centred on its origin.
  function roundedBox(w, h, d, r) {
    const b = Math.min(r, d / 2 - 0.0005, w / 2 - 0.0005, h / 2 - 0.0005);
    const iw = w - 2 * b, ih = h - 2 * b;
    const rc = Math.max(Math.min(r - b * 0.5, iw / 2, ih / 2), 0.0005);
    const s = new THREE.Shape();
    const x0 = -iw / 2, y0 = -ih / 2, x1 = iw / 2, y1 = ih / 2;
    s.moveTo(x0 + rc, y0);
    s.lineTo(x1 - rc, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + rc);
    s.lineTo(x1, y1 - rc);
    s.quadraticCurveTo(x1, y1, x1 - rc, y1);
    s.lineTo(x0 + rc, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - rc);
    s.lineTo(x0, y0 + rc);
    s.quadraticCurveTo(x0, y0, x0 + rc, y0);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b,
      bevelSegments: 3, curveSegments: 5,
    });
    g.center();
    return g;
  }

  // Invisible hit volume standing on the surface (origin at its base), with a flat ring for the hover outline.
  function pickMesh(w, h, d, cx, ringR, ringX, data) {
    const geo = new THREE.BoxGeometry(w, h, d);
    geo.translate(cx, h / 2, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, depthWrite: false,
    }));
    const ring = new THREE.CircleGeometry(ringR, 40);
    ring.rotateX(-Math.PI / 2);
    ring.translate(ringX, 0.004, 0);
    m.userData.hit = 'maker';
    m.userData.focus = data.focus;
    m.userData.label = data.label;
    m.userData.glowGeo = ring;
    return m;
  }

  // ------------------------------------------------------------------
  //  Desk + props
  // ------------------------------------------------------------------
  function signTexture(accentCss) {
    return canvasTexture(512, 164, (ctx, W, H) => {
      ctx.fillStyle = '#fbf5e4';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = accentCss;
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, W - 24, H - 24);
      ctx.fillStyle = '#2a2118';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let size = 62;
      ctx.font = `800 ${size}px "Helvetica Neue", Arial, sans-serif`;
      const text = 'SIDE PROJECTS';
      const maxW = W - 64;
      const tw = ctx.measureText(text).width;
      if (tw > maxW) {
        size = Math.floor(size * maxW / tw);
        ctx.font = `800 ${size}px "Helvetica Neue", Arial, sans-serif`;
      }
      ctx.fillText(text, W / 2, H / 2 + 3);
    });
  }

  function matTexture() {
    return canvasTexture(512, 370, (ctx, W, H) => {
      ctx.fillStyle = '#3f8562';
      ctx.fillRect(0, 0, W, H);
      const step = 23;
      for (let i = 0, x = 16; x < W - 8; x += step, i++) {
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(190,235,205,0.55)' : 'rgba(190,235,205,0.22)';
        ctx.lineWidth = i % 4 === 0 ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(x, 16); ctx.lineTo(x, H - 16); ctx.stroke();
      }
      for (let i = 0, y = 16; y < H - 8; y += step, i++) {
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(190,235,205,0.55)' : 'rgba(190,235,205,0.22)';
        ctx.lineWidth = i % 4 === 0 ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(W - 16, y); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(210,245,220,0.8)';
      ctx.lineWidth = 3;
      ctx.strokeRect(16, 16, W - 32, H - 32);
    });
  }

  function buildDesk(group, opts, accent) {
    const topMat = opts.woodMap
      ? new THREE.MeshStandardMaterial({ map: opts.woodMap, roughness: 0.65, metalness: 0 })
      : new THREE.MeshStandardMaterial({ color: 0x9a6a3c, roughness: 0.65, metalness: 0 });
    const top = mesh(new THREE.BoxGeometry(DESK_W, TOP_THICK, DESK_D), topMat, 0, DESK_TOP - TOP_THICK / 2, 0, group);
    top.receiveShadow = true;

    const legMat = lambert(0x4a2e14);
    const legH = DESK_TOP - TOP_THICK;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      mesh(new THREE.BoxGeometry(0.05, legH, 0.05), legMat, sx * (DESK_W / 2 - 0.05), legH / 2, sz * (DESK_D / 2 - 0.05), group);
    });
    // apron under the top + a low stretcher: reads as a workbench
    const apronMat = lambert(0x5c3a1c);
    [-1, 1].forEach(s => {
      mesh(new THREE.BoxGeometry(DESK_W - 0.15, 0.07, 0.02), apronMat, 0, legH - 0.035, s * (DESK_D / 2 - 0.05), group);
      mesh(new THREE.BoxGeometry(0.02, 0.07, DESK_D - 0.15), apronMat, s * (DESK_W / 2 - 0.05), legH - 0.035, 0, group);
    });
    mesh(new THREE.BoxGeometry(DESK_W - 0.15, 0.03, 0.03), legMat, 0, 0.22, -(DESK_D / 2 - 0.05), group);

    // green cutting mat — the rabbit's patch
    const matSide = lambert(0x2f6a4c);
    const matTop = lambert(0xffffff, { map: matTexture() });
    const mat = mesh(new THREE.BoxGeometry(0.72, MAT_THICK, 0.52),
      [matSide, matSide, matTop, matSide, matSide, matSide], 0.255, DESK_TOP + MAT_THICK / 2, 0, group);
    mat.receiveShadow = true;
    mat.userData.noShadow = true;

    // folded tent card: SIDE PROJECTS
    const paper = lambert(0xfbf5e4);
    const signMat = lambert(0xffffff, { map: signTexture(accent.css) });
    const card = new THREE.Group();
    card.position.set(-0.235, DESK_TOP, 0.29);
    card.rotation.y = 0.1;
    const cw = 0.29, ch = 0.092, tilt = 0.4;
    const panelGeo = new THREE.BoxGeometry(cw, ch, 0.003);
    panelGeo.translate(0, ch / 2, 0);
    const front = mesh(panelGeo, [paper, paper, paper, paper, signMat, paper], 0, 0, 0, card);
    front.rotation.x = -tilt;
    const back = mesh(panelGeo, paper, 0, 0, -2 * ch * Math.sin(tilt), card);
    back.rotation.x = tilt;
    group.add(card);

    // carrot, behind the rabbit's patch
    const carrot = new THREE.Group();
    carrot.position.set(0.44, DESK_TOP + 0.017, -0.305);
    carrot.rotation.y = 0.12;
    const cBody = mesh(new THREE.ConeGeometry(0.018, 0.12, 12), lambert(0xf08a2c), 0, 0, 0, carrot);
    cBody.rotation.z = Math.PI / 2;      // tip toward -x
    const leafMat = lambert(0x4f9a3e);
    [[0.3, 0.25], [-0.1, -0.3], [-0.5, 0.1]].forEach(([rz, ry]) => {
      const leaf = mesh(new THREE.ConeGeometry(0.008, 0.05, 6), leafMat, 0.078, 0.004, 0, carrot);
      leaf.rotation.set(0, ry, -Math.PI / 2 + rz);
      leaf.position.z = ry * 0.03;
      leaf.position.y = 0.004 + rz * 0.012;
    });
    group.add(carrot);

    // little circuit board + screwdriver by the robot
    const pcb = new THREE.Group();
    pcb.position.set(-0.545, DESK_TOP, 0.2);
    pcb.rotation.y = -0.3;
    mesh(new THREE.BoxGeometry(0.1, 0.005, 0.07), lambert(0x2b4a8c), 0, 0.0025, 0, pcb);
    mesh(new THREE.BoxGeometry(0.03, 0.008, 0.03), lambert(0x1c1c20), -0.012, 0.009, 0.002, pcb);
    mesh(new THREE.BoxGeometry(0.012, 0.007, 0.022), lambert(0xd9c38a), 0.03, 0.008, -0.012, pcb);
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 10), lambert(0xc9ced2), 0.03, 0.011, 0.018, pcb);
    const pcbLed = mesh(new THREE.SphereGeometry(0.005, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xff5a4a, emissive: 0xff3a2a, emissiveIntensity: 1.2, roughness: 0.4 }),
      -0.038, 0.009, -0.024, pcb);
    pcbLed.userData.noShadow = true;
    group.add(pcb);

    const driver = new THREE.Group();
    driver.position.set(-0.2, DESK_TOP + 0.011, -0.2);
    driver.rotation.y = -0.35;
    const handle = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.06, 10), lambert(0xe2603a), -0.035, 0, 0, driver);
    handle.rotation.z = Math.PI / 2;
    const shaft = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.075, 6),
      new THREE.MeshStandardMaterial({ color: 0xb8c4cc, roughness: 0.35, metalness: 0.8 }), 0.03, 0, 0, driver);
    shaft.rotation.z = Math.PI / 2;
    group.add(driver);

    return { signMat };
  }

  // ------------------------------------------------------------------
  //  Rabbit
  // ------------------------------------------------------------------
  function buildRabbit(accent) {
    const root = new THREE.Group();       // x/z travel + heading
    const jump = new THREE.Group();       // hop height, squash/stretch, pitch
    root.add(jump);

    const fur = lambert(0xfbf5e8, { emissive: 0x2e2a22 });
    const furLight = lambert(0xffffff, { emissive: 0x3a3630 });
    const pink = lambert(0xf0a0ac);
    const dark = lambert(0x2a1c16);

    // body: an egg, fatter at the hips
    const body = mesh(new THREE.SphereGeometry(0.08, 24, 18), fur, 0, 0.075, -0.012, jump);
    body.scale.set(1.0, 0.95, 1.2);
    [-1, 1].forEach(s => {
      const haunch = mesh(new THREE.SphereGeometry(0.047, 16, 12), fur, s * 0.052, 0.048, -0.035, jump);
      haunch.scale.set(0.9, 1, 1.15);
      // hind foot
      const foot = mesh(new THREE.CapsuleGeometry(0.017, 0.05, 4, 10), furLight, s * 0.066, 0.017, 0.02, jump);
      foot.rotation.x = Math.PI / 2;
      // front paw
      const paw = mesh(new THREE.SphereGeometry(0.02, 12, 10), furLight, s * 0.03, 0.02, 0.088, jump);
      paw.scale.set(1, 0.9, 1.25);
    });
    const chest = mesh(new THREE.SphereGeometry(0.05, 16, 12), furLight, 0, 0.082, 0.05, jump);
    chest.scale.set(1.05, 1.1, 0.9);
    mesh(new THREE.SphereGeometry(0.03, 14, 10), furLight, 0, 0.062, -0.108, jump);   // tail

    // collar + glowing tag: the AI inside
    const collar = mesh(new THREE.TorusGeometry(0.047, 0.0085, 8, 24), lambert(accent.color), 0, 0.128, 0.034, jump);
    collar.rotation.x = Math.PI / 2 - 0.35;
    const tagMat = new THREE.MeshStandardMaterial({
      color: 0x9ff4ff, emissive: 0x3fe0ff, emissiveIntensity: 1.2, roughness: 0.35,
    });
    const tag = mesh(new THREE.SphereGeometry(0.0135, 12, 10), tagMat, 0, 0.107, 0.083, jump);
    tag.userData.noShadow = true;

    // head
    const head = new THREE.Group();
    head.position.set(0, 0.168, 0.05);
    jump.add(head);
    const skull = mesh(new THREE.SphereGeometry(0.067, 24, 18), fur, 0, 0, 0, head);
    skull.scale.set(1.06, 0.95, 1.0);
    const cheeks = [];
    [-1, 1].forEach(s => {
      const cheek = mesh(new THREE.SphereGeometry(0.023, 12, 10), furLight, s * 0.017, -0.02, 0.054, head);
      cheeks.push(cheek);
    });
    const nose = mesh(new THREE.SphereGeometry(0.0095, 10, 8), pink, 0, -0.006, 0.07, head);
    const eyes = [];
    [-1, 1].forEach(s => {
      const eye = mesh(new THREE.SphereGeometry(0.0135, 12, 10), dark, s * 0.037, 0.014, 0.05, head);
      const glint = mesh(new THREE.SphereGeometry(0.0042, 8, 6), lambert(0xffffff, { emissive: 0x888888 }),
        s * 0.002 + 0.003, 0.005, 0.0105, eye);
      glint.userData.noShadow = true;
      eyes.push(eye);
    });

    // ears — each on a pivot at its base so it can lag and twitch
    const ears = [];
    [-1, 1].forEach(s => {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.027, 0.05, -0.008);
      pivot.userData.baseZ = -s * 0.16;
      pivot.userData.baseX = -0.1;
      pivot.rotation.set(-0.1, 0, -s * 0.16);
      const outer = mesh(new THREE.CapsuleGeometry(0.0185, 0.075, 6, 12), fur, 0, 0.05, 0, pivot);
      outer.scale.z = 0.5;
      const inner = mesh(new THREE.CapsuleGeometry(0.011, 0.066, 4, 10), pink, 0, 0.05, 0.0062, pivot);
      inner.scale.z = 0.4;
      inner.userData.noShadow = true;
      head.add(pivot);
      ears.push(pivot);
    });

    const pick = pickMesh(0.27, 0.42, 0.3, 0, 0.135, 0, { focus: 'rabbit', label: 'The AI rabbit' });
    root.add(pick);

    // ---- behaviour ----
    const baseY = DESK_TOP + MAT_THICK;
    const S = {
      x: 0.26, z: 0.03, h: 0, y: 0, s: 1, pitch: 0, spin: 0,
      queue: [], cur: null,
      prevY: 0, prevX: 0.26, prevZ: 0.03,
      earE: [0, 0], earV: [0, 0],
      twitch: null, twitchIn: rand(1.5, 3.5),
      wiggle: 0, wiggleIn: rand(1, 3),
      blink: 0, blinkIn: rand(2, 5),
      lookYaw: 0, lookTarget: 0, lookIn: rand(2, 4),
      glowKick: 0,
      clock: Math.random() * 10,
    };
    const faceVisitor = (x, z) => Math.atan2(VISITOR.x - x, VISITOR.z - z);
    S.h = faceVisitor(S.x, S.z);
    S.queue.push({ type: 'wait', dur: rand(2.2, 3.6) }, { type: 'trip' });

    const CROUCH = 0.14, LAND = 0.22;

    function makeHop(tx, tz, happy) {
      return { type: 'hop', tx, tz, happy: !!happy };
    }

    function expandTrip() {
      // pick a spot in the roaming rectangle that is a real hop away
      let tx = S.x, tz = S.z, dist = 0;
      for (let i = 0; i < 12; i++) {
        tx = rand(ROAM.x0, ROAM.x1);
        tz = rand(ROAM.z0, ROAM.z1);
        dist = Math.hypot(tx - S.x, tz - S.z);
        if (dist > 0.13) break;
      }
      const n = dist < 0.2 ? 1 : dist < 0.38 ? 2 : 3;
      const list = [{ type: 'turn', to: Math.atan2(tx - S.x, tz - S.z) }];
      for (let i = 1; i <= n; i++) {
        list.push(makeHop(lerp(S.x, tx, i / n), lerp(S.z, tz, i / n), false));
        if (i < n) list.push({ type: 'wait', dur: rand(0.04, 0.12) });
      }
      list.push({ type: 'wait', dur: rand(0.5, 1.3) });
      if (Math.random() < 0.82) list.push({ type: 'turn', to: faceVisitor(tx, tz) + rand(-0.4, 0.4) });
      S.queue.unshift.apply(S.queue, list);
    }

    function begin(a) {
      if (a.started) return;
      a.started = true;
      a.t = 0;
      if (a.type === 'turn') {
        a.from = S.h;
        a.delta = shortAngle(a.to - S.h);
        a.dur = 0.16 + Math.abs(a.delta) * 0.17;
      } else if (a.type === 'hop') {
        a.fx = S.x; a.fz = S.z;
        if (a.happy) { a.tx = S.x; a.tz = S.z; }
        const d = Math.hypot(a.tx - a.fx, a.tz - a.fz);
        a.air = a.happy ? 0.52 : 0.3 + d * 0.5;
        a.H = a.happy ? 0.15 : 0.05 + d * 0.27;
        a.dur = CROUCH + a.air + LAND;
      }
    }

    function next() {
      for (let guard = 0; guard < 4; guard++) {
        if (!S.queue.length) S.queue.push({ type: 'wait', dur: rand(4, 9) }, { type: 'trip' });
        const a = S.queue.shift();
        if (a.type === 'trip') { expandTrip(); continue; }
        begin(a);
        return a;
      }
      return { type: 'wait', dur: 1, t: 0, started: true };
    }

    function apply(a) {
      if (a.type === 'wait') {
        S.y = 0; S.s = 1; S.pitch = 0; S.spin = 0;
      } else if (a.type === 'turn') {
        const u = a.dur > 0 ? a.t / a.dur : 1;
        S.h = a.from + a.delta * smooth(u);
        // a little shuffle-bounce while turning
        const amp = Math.min(0.016, 0.004 + Math.abs(a.delta) * 0.006);
        S.y = a.flat ? 0 : amp * Math.sin(Math.PI * clamp(u, 0, 1));
        S.s = 1; S.pitch = 0; S.spin = 0;
      } else if (a.type === 'hop') {
        const t = a.t;
        if (t < CROUCH) {
          const u = t / CROUCH;
          S.x = a.fx; S.z = a.fz; S.y = 0;
          S.s = 1 - 0.24 * easeOut(u);
          S.pitch = (a.happy ? 0.04 : 0.1) * u;
          S.spin = 0;
        } else if (t < CROUCH + a.air) {
          const u = (t - CROUCH) / a.air;
          S.x = lerp(a.fx, a.tx, u); S.z = lerp(a.fz, a.tz, u);
          S.y = 4 * a.H * u * (1 - u);
          S.s = u < 0.2 ? lerp(0.76, 1.16, smooth(u / 0.2)) : lerp(1.16, 1.0, smooth((u - 0.6) / 0.4));
          const p0 = a.happy ? 0.04 : 0.1, pa = a.happy ? 0.08 : 0.2;
          S.pitch = u < 0.2 ? lerp(p0, -pa, smooth(u / 0.2)) : lerp(-pa, pa, smooth((u - 0.2) / 0.8));
          S.spin = a.happy ? TAU * smooth(u) : 0;
        } else {
          const u = clamp((t - CROUCH - a.air) / LAND, 0, 1);
          S.x = a.tx; S.z = a.tz; S.y = 0;
          S.s = 1 - 0.25 * Math.sin(Math.PI * Math.sqrt(u)) * Math.pow(1 - u, 1.2);
          S.pitch = (a.happy ? 0.08 : 0.2) * (1 - smooth(u));
          S.spin = 0;
        }
      }
    }

    function hopNow() {
      if (S.cur && S.cur.type === 'hop') return false;
      if (S.cur) {
        // park whatever it was doing; it resumes after the hop
        if (S.cur.type === 'turn') S.cur.flat = true;     // no shuffle-bounce when it picks the turn back up
        S.queue.unshift(S.cur);
      }
      const a = makeHop(S.x, S.z, true);
      begin(a);
      S.cur = a;
      S.glowKick = 1;
      return true;
    }

    function update(dt) {
      S.clock += dt;
      const c = S.clock;

      // run the action queue (consumes dt exactly, so nothing skips or teleports)
      let remaining = dt;
      for (let guard = 0; guard < 8 && remaining > 1e-6; guard++) {
        if (!S.cur) S.cur = next();
        const a = S.cur;
        const step = Math.min(remaining, Math.max(a.dur - a.t, 0));
        a.t += step;
        remaining -= step;
        apply(a);
        if (a.t >= a.dur - 1e-6) S.cur = null; else break;
      }
      const resting = !S.cur || S.cur.type === 'wait';

      // ears: they lag behind whatever the body just did, then spring back
      const dy = S.y - S.prevY;
      const df = (S.x - S.prevX) * Math.sin(S.h) + (S.z - S.prevZ) * Math.cos(S.h);
      S.prevY = S.y; S.prevX = S.x; S.prevZ = S.z;
      const sub = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / sub;
      for (let i = 0; i < 2; i++) {
        S.earE[i] -= dy * (5.2 + i * 0.9) + df * 3.2;
        const k = i === 0 ? 130 : 105, damping = i === 0 ? 7.5 : 6.2;
        for (let n = 0; n < sub; n++) {
          S.earV[i] += (-k * S.earE[i] - damping * S.earV[i]) * h;
          S.earE[i] += S.earV[i] * h;
        }
        if (S.earE[i] < -1.0) { S.earE[i] = -1.0; if (S.earV[i] < 0) S.earV[i] = 0; }
        if (S.earE[i] > 0.5) { S.earE[i] = 0.5; if (S.earV[i] > 0) S.earV[i] = 0; }
      }

      // idle fidgets
      S.twitchIn -= dt;
      if (S.twitchIn <= 0 && !S.twitch) {
        S.twitch = { ear: Math.random() < 0.5 ? 0 : 1, t: 0, dur: 0.34 };
        S.twitchIn = rand(2.2, 5.5);
      }
      let twitchAmt = 0;
      if (S.twitch) {
        S.twitch.t += dt;
        const u = S.twitch.t / S.twitch.dur;
        if (u >= 1) S.twitch = null;
        else twitchAmt = 0.38 * Math.sin(u * TAU * 2) * (1 - u);
      }
      S.wiggleIn -= dt;
      if (S.wiggleIn <= 0) { S.wiggle = 0.7; S.wiggleIn = rand(1.6, 4); }
      S.wiggle = Math.max(0, S.wiggle - dt);
      S.blinkIn -= dt;
      if (S.blinkIn <= 0) { S.blink = 0.14; S.blinkIn = rand(2, 5.5); }
      S.blink = Math.max(0, S.blink - dt);
      S.lookIn -= dt;
      if (S.lookIn <= 0) {
        S.lookTarget = Math.random() < 0.35 ? 0 : rand(-0.5, 0.5);
        S.lookIn = rand(1.6, 4.2);
      }
      S.lookYaw += ((resting ? S.lookTarget : 0) - S.lookYaw) * damp(dt, resting ? 5 : 14);
      S.glowKick = Math.max(0, S.glowKick - dt * 1.3);

      // write the pose
      root.position.set(S.x, baseY, S.z);
      root.rotation.y = S.h;
      const breathe = 1 + 0.014 * Math.sin(c * 2.7);
      const sy = S.s * breathe;
      const sxz = 1 / Math.sqrt(S.s);
      jump.position.y = S.y;
      jump.scale.set(sxz, sy, sxz);
      jump.rotation.x = S.pitch;
      jump.rotation.y = S.spin;

      head.rotation.x = -S.pitch * 0.55 + 0.02 * Math.sin(c * 1.3);
      head.rotation.y = S.lookYaw;
      head.rotation.z = S.lookYaw * 0.25;
      ears.forEach((p, i) => {
        p.rotation.x = p.userData.baseX + S.earE[i];
        p.rotation.z = p.userData.baseZ + (S.twitch && S.twitch.ear === i ? twitchAmt * (i === 0 ? 1 : -1) : 0)
          + 0.015 * Math.sin(c * 1.1 + i * 2);
      });
      const wig = S.wiggle > 0 ? Math.sin(c * 42) * Math.min(1, S.wiggle * 3) : 0;
      nose.position.y = -0.006 + wig * 0.0022;
      cheeks[0].position.y = -0.02 + wig * 0.0014;
      cheeks[1].position.y = -0.02 - wig * 0.0014;
      const open = S.blink > 0 ? 0.12 : 1;
      eyes.forEach(e => { e.scale.y = open; });
      tagMat.emissiveIntensity = 1.15 + 0.6 * Math.sin(c * 2.3) + S.glowKick * 2.2;
    }

    update(0);
    return { root, pick, update, hopNow, state: S, collarMat: collar.material };
  }

  // ------------------------------------------------------------------
  //  Robot
  // ------------------------------------------------------------------
  function buildRobot() {
    const root = new THREE.Group();
    root.position.set(ROBOT_POS.x, DESK_TOP, ROBOT_POS.z);
    root.rotation.y = ROBOT_POS.yaw;
    const rig = new THREE.Group();        // wiggle / bob
    root.add(rig);

    const teal = lambert(0x27a3b4);
    const tealDark = lambert(0x186b7c);
    const grey = lambert(0x8e9aa2);
    const handMat = lambert(0xfff3d6, { emissive: 0x2a2416 });
    const black = lambert(0x16161a);

    // feet + body
    [-1, 1].forEach(s => {
      mesh(roundedBox(0.052, 0.032, 0.08, 0.012), tealDark, s * 0.036, 0.016, 0.008, rig);
    });
    mesh(roundedBox(0.14, 0.11, 0.1, 0.024), teal, 0, 0.086, 0, rig);
    // chest panel with a little "heart" light and two buttons
    mesh(roundedBox(0.078, 0.046, 0.008, 0.008), lambert(0xe9f3ee), 0, 0.086, 0.05, rig).userData.noShadow = true;
    const heartMat = new THREE.MeshStandardMaterial({ color: 0xff8a5c, emissive: 0xff5a2c, emissiveIntensity: 0.9, roughness: 0.4 });
    mesh(new THREE.SphereGeometry(0.0095, 10, 8), heartMat, -0.02, 0.088, 0.055, rig).userData.noShadow = true;
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 10), lambert(0xf2c14e), 0.006, 0.088, 0.055, rig).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 10), tealDark, 0.025, 0.088, 0.055, rig).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.022, 14), grey, 0, 0.148, 0, rig);   // neck

    // head
    const head = new THREE.Group();
    head.position.set(0, 0.152, 0);
    rig.add(head);
    mesh(roundedBox(0.184, 0.122, 0.118, 0.03), teal, 0, 0.066, 0, head);
    [-1, 1].forEach(s => {
      const bolt = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.016, 14), grey, s * 0.097, 0.064, 0, head);
      bolt.rotation.z = Math.PI / 2;
    });

    // googly eyes: white disc, dark rim, a pupil that slides around inside
    const whiteMat = lambert(0xffffff, { emissive: 0x4a4a4a });
    function googly(x, y, R, k, damping) {
      const g = new THREE.Group();
      g.position.set(x, y, 0.059);
      const disc = mesh(new THREE.CylinderGeometry(R, R, 0.012, 28), whiteMat, 0, 0, 0, g);
      disc.rotation.x = Math.PI / 2;
      disc.userData.noShadow = true;
      const rim = mesh(new THREE.TorusGeometry(R, 0.0036, 6, 28), black, 0, 0, 0.004, g);
      rim.userData.noShadow = true;
      const r = R * 0.52;
      const pupil = mesh(new THREE.CylinderGeometry(r, r, 0.004, 22), black, 0, 0, 0.0085, g);
      pupil.rotation.x = Math.PI / 2;
      pupil.userData.noShadow = true;
      head.add(g);
      return { g, pupil, max: R - r - 0.0025, k, damping, x: 0, y: 0, vx: 0, vy: 0, prev: new THREE.Vector3(), has: false };
    }
    const eyes = [
      googly(-0.043, 0.078, 0.037, 150, 4.6),
      googly(0.046, 0.073, 0.029, 215, 5.6),
    ];

    // mouth: a smile
    const mouth = mesh(new THREE.TorusGeometry(0.021, 0.0048, 6, 16, Math.PI), black, 0.002, 0.034, 0.06, head);
    mouth.rotation.z = Math.PI;
    mouth.userData.noShadow = true;

    // antenna
    const antenna = new THREE.Group();
    antenna.position.set(0, 0.126, 0);
    head.add(antenna);
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.044, 6), grey, 0, 0.022, 0, antenna);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffc35a, emissive: 0xff9a2a, emissiveIntensity: 0.8, roughness: 0.4 });
    mesh(new THREE.SphereGeometry(0.015, 14, 10), ballMat, 0, 0.052, 0, antenna);

    // resting arm (the viewer's left)
    const armL = new THREE.Group();
    armL.position.set(-0.076, 0.118, 0);
    rig.add(armL);
    mesh(new THREE.SphereGeometry(0.017, 10, 8), tealDark, 0, 0, 0, armL);
    mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 10), grey, 0, -0.04, 0, armL);
    mesh(new THREE.SphereGeometry(0.021, 12, 10), handMat, 0, -0.085, 0, armL);

    // playing arm (the viewer's right), raised
    const armR = new THREE.Group();
    armR.position.set(0.076, 0.118, 0);
    rig.add(armR);
    mesh(new THREE.SphereGeometry(0.017, 10, 8), tealDark, 0, 0, 0, armR);
    mesh(new THREE.CapsuleGeometry(0.012, 0.075, 4, 10), grey, 0, 0.052, 0, armR);
    const hand = new THREE.Group();       // kept upright whatever the arm does
    hand.position.set(0, 0.14, 0);
    armR.add(hand);
    const handScale = new THREE.Group();
    hand.add(handScale);
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.014, 12), tealDark, 0, -0.036, 0, handScale);   // cuff

    const hands = {};
    const finger = (r, len, x, y, rz, parent) => {
      // capsule finger whose base sits at (x, y) and which leans by rz
      const p = new THREE.Group();
      p.position.set(x, y, 0);
      p.rotation.z = rz;
      mesh(new THREE.CapsuleGeometry(r, len, 4, 10), handMat, 0, len / 2, 0, p);
      parent.add(p);
      return p;
    };

    // rock: a round fist with knuckles and a thumb across the front
    hands.rock = new THREE.Group();
    const fist = mesh(new THREE.SphereGeometry(0.041, 18, 14), handMat, 0, 0.004, 0, hands.rock);
    fist.scale.set(1.06, 0.92, 0.95);
    [-0.027, -0.009, 0.009, 0.027].forEach(x => {
      mesh(new THREE.SphereGeometry(0.0135, 10, 8), handMat, x, 0.034 - Math.abs(x) * 0.25, 0.014, hands.rock);
    });
    const rockThumb = mesh(new THREE.CapsuleGeometry(0.011, 0.03, 4, 10), handMat, -0.004, -0.004, 0.036, hands.rock);
    rockThumb.rotation.z = Math.PI / 2 - 0.25;

    // paper: flat open palm, four fingers and a thumb
    hands.paper = new THREE.Group();
    mesh(roundedBox(0.072, 0.056, 0.022, 0.012), handMat, 0, -0.004, 0, hands.paper);
    [[-0.027, 0.036, 0.1], [-0.009, 0.046, 0.03], [0.009, 0.046, -0.03], [0.027, 0.038, -0.1]].forEach(([x, len, rz]) => {
      finger(0.0092, len, x, 0.018, rz, hands.paper);
    });
    finger(0.0098, 0.03, -0.034, -0.016, 1.0, hands.paper);

    // scissors: smaller fist with two long fingers in a V
    hands.scissors = new THREE.Group();
    const sFist = mesh(new THREE.SphereGeometry(0.035, 16, 12), handMat, 0, -0.008, 0, hands.scissors);
    sFist.scale.set(1.05, 0.9, 0.95);
    finger(0.0115, 0.062, -0.012, 0.012, 0.36, hands.scissors);
    finger(0.0115, 0.062, 0.012, 0.012, -0.36, hands.scissors);
    const sThumb = mesh(new THREE.CapsuleGeometry(0.0105, 0.024, 4, 10), handMat, 0.004, -0.014, 0.031, hands.scissors);
    sThumb.rotation.z = Math.PI / 2 + 0.3;

    ORDER.forEach(k => { handScale.add(hands[k]); hands[k].visible = false; });

    const pick = pickMesh(0.42, 0.4, 0.24, 0.04, 0.15, 0.01, { focus: 'robot', label: 'Play rock-paper-scissors' });
    root.add(pick);

    // ---- behaviour ----
    const PUMP = 0.9, VICTORY = 0.9, HOLD = 4.0, CYCLE = 1.2;
    const ARM_BASE = -0.62;
    const B = {
      mode: 'idle', t: 0, result: null,
      idleT: Math.random() * CYCLE, idleBase: 0,
      hand: null, pop: 1,
      armZ: ARM_BASE, armX: 0, cheer: 0,
      headZ: 0, headY: 0, headX: 0,
      px: 0, py: 0,
      antE: 0, antV: 0, prevLean: 0,
      mouth: 1,
      clock: Math.random() * 10,
    };
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), q1 = new THREE.Quaternion();

    function showHand(name) {
      if (B.hand === name) return;
      ORDER.forEach(k => { hands[k].visible = (k === name); });
      B.hand = name;
      B.pop = 0;
    }

    function play(move) {
      const m = String(move || '').toLowerCase();
      if (!WIN[m]) return null;
      B.mode = 'play';
      B.t = 0;
      B.result = WIN[m];
      return B.result;
    }

    function update(dt, env) {
      B.clock += dt;
      const c = B.clock;
      const nx = env && isFinite(env.pointerNX) ? clamp(env.pointerNX, -1, 1) : 0;
      const ny = env && isFinite(env.pointerNY) ? clamp(env.pointerNY, -1, 1) : 0;
      B.px += (nx - B.px) * damp(dt, 6);
      B.py += (ny - B.py) * damp(dt, 6);

      let handName, armZt, armXt = 0, lean = 0, bobY = 0, cheerT = 0, glow, mouthT = 1;
      let headZt = 0.05 * Math.sin(c * 0.9) + 0.028 * Math.sin(c * 0.37 + 1);
      let headYt = 0.07 * Math.sin(c * 0.5) + B.px * 0.2;
      let headXt = -B.py * 0.1;
      let justRevealed = false;

      if (B.mode === 'play') {
        const before = B.t;
        B.t += dt;
        if (B.t >= PUMP + HOLD) {
          // round over — carry on practising from the hand it is showing
          B.mode = 'idle';
          B.idleBase = ORDER.indexOf(B.result);
          B.idleT = CYCLE * 0.5;
        } else if (B.t < PUMP) {
          // one, two, three…
          const u = B.t / PUMP;
          const d = 0.5 - 0.5 * Math.cos(u * TAU * 3);
          handName = 'rock';
          armZt = -0.42 - 0.6 * d;
          armXt = 0.3 * d;
          bobY = -0.007 * d;
          headZt = -0.07; headYt = 0.3; headXt = 0.05;     // watching its own fist
          glow = 0.3 + 1.6 * d;
        } else {
          const w = (B.t - PUMP) / VICTORY;
          if (before < PUMP) justRevealed = true;
          handName = B.result;
          armZt = -0.5 + 0.03 * Math.sin(c * 2.2);
          armXt = 0.38;
          mouthT = 1.45;
          if (w < 1) {
            // victory wiggle
            lean = 0.14 * Math.sin(w * TAU * 3) * (1 - w);
            bobY = 0.016 * Math.abs(Math.sin(w * TAU * 2)) * (1 - w);
            cheerT = 1 - smooth((w - 0.72) / 0.28);
            glow = 1.7 + 0.7 * Math.sin(c * 26);
            headZt = 0;
          } else {
            glow = 1.2 + 0.25 * Math.sin(c * 4);
          }
        }
      }
      if (B.mode === 'idle') {
        B.idleT += dt;
        const phase = B.idleT / CYCLE;
        const d = 0.5 + 0.5 * Math.cos(phase * TAU);          // 1 at each hand change
        handName = ORDER[(B.idleBase + Math.floor(phase)) % 3];
        armZt = ARM_BASE - 0.05 - 0.2 * d;
        armXt = 0.1 * d;
        bobY = -0.003 * d;
        glow = 0.65 + 0.3 * Math.sin(c * 3);
      }

      showHand(handName);
      B.pop += dt;
      const popS = 1 + 0.32 * Math.exp(-B.pop * 11) * Math.cos(B.pop * 27);
      handScale.scale.setScalar(popS);

      B.armZ += (armZt - B.armZ) * damp(dt, 34);
      B.armX += (armXt - B.armX) * damp(dt, 34);
      B.cheer += (cheerT - B.cheer) * damp(dt, 14);
      B.headZ += (headZt - B.headZ) * damp(dt, 9);
      B.headY += (headYt - B.headY) * damp(dt, 9);
      B.headX += (headXt - B.headX) * damp(dt, 9);
      B.mouth += (mouthT - B.mouth) * damp(dt, 12);

      rig.rotation.z = lean;
      rig.position.y = bobY;
      armR.rotation.set(B.armX, 0, B.armZ);
      hand.quaternion.copy(armR.quaternion).invert();
      armL.rotation.z = -0.22 - B.cheer * 2.3 + 0.04 * Math.sin(c * 1.7);
      head.rotation.set(B.headX, B.headY, B.headZ);
      mouth.scale.set(B.mouth, B.mouth, 1);
      ballMat.emissiveIntensity = glow;
      heartMat.emissiveIntensity = 0.75 + 0.35 * Math.sin(c * 2.1);

      // antenna whips opposite to whatever the head/body just did
      const sub = Math.max(1, Math.ceil(dt / 0.006));
      const h = dt / sub;
      const leanNow = lean + B.headZ;
      B.antE -= (leanNow - B.prevLean) * 1.6;
      B.prevLean = leanNow;
      for (let n = 0; n < sub; n++) {
        B.antV += (-190 * B.antE - 5 * B.antV) * h;
        B.antE += B.antV * h;
      }
      B.antE = clamp(B.antE, -0.7, 0.7);
      antenna.rotation.z = B.antE;

      // googly pupils: loose weights on a soft spring. They stay behind when the head moves,
      // sag a little under gravity, and drift toward the visitor's pointer.
      head.updateWorldMatrix(true, true);
      eyes.forEach((e, i) => {
        e.g.getWorldPosition(v1);
        if (e.has) {
          v2.copy(v1).sub(e.prev);
          const moved = v2.length();
          if (moved > 1e-7 && moved < 0.2) {
            e.g.getWorldQuaternion(q1).invert();
            v2.applyQuaternion(q1);
            const ws = e.g.getWorldScale(v3).x || 1;
            e.x -= v2.x / ws;
            e.y -= v2.y / ws;
          }
        }
        e.prev.copy(v1);
        e.has = true;
        if (justRevealed) { e.vx += rand(-0.5, 0.5); e.vy += rand(0.2, 0.6); }
        let tx = B.px * 0.62 * e.max, ty = (-0.3 + B.py * 0.5) * e.max;
        // (tiny idle drift so the two eyes never sit perfectly still or perfectly matched)
        tx += Math.sin(c * 1.3 + i * 2.1) * 0.06 * e.max;
        for (let n = 0; n < sub; n++) {
          e.vx += (-e.k * (e.x - tx) - e.damping * e.vx) * h;
          e.vy += (-e.k * (e.y - ty) - e.damping * e.vy) * h;
          e.x += e.vx * h;
          e.y += e.vy * h;
          const len = Math.hypot(e.x, e.y);
          if (len > e.max) {
            // hit the rim: slide back in and bounce
            const nxr = e.x / len, nyr = e.y / len;
            e.x = nxr * e.max; e.y = nyr * e.max;
            const vn = e.vx * nxr + e.vy * nyr;
            if (vn > 0) { e.vx -= 1.45 * vn * nxr; e.vy -= 1.45 * vn * nyr; }
          }
        }
        e.pupil.position.x = e.x;
        e.pupil.position.y = e.y;
      });
    }

    update(0, null);
    return { root, pick, update, play, state: B };
  }

  // ------------------------------------------------------------------
  //  Public
  // ------------------------------------------------------------------
  function build(opts) {
    opts = opts || {};
    let accentColor;
    try { accentColor = new THREE.Color(opts.accentHex || '#c0392b'); }
    catch (e) { accentColor = new THREE.Color('#c0392b'); }
    const accent = { color: accentColor, css: '#' + accentColor.getHexString() };

    const group = new THREE.Group();
    group.name = 'SideDesk';

    const desk = buildDesk(group, opts, accent);
    const rabbit = buildRabbit(accent);
    const robot = buildRobot();
    group.add(rabbit.root);
    group.add(robot.root);

    // everything casts a shadow unless it opted out above; only the flat surfaces receive
    group.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = !o.userData.noShadow && o !== rabbit.pick && o !== robot.pick;
    });

    let lastT = null;
    function update(tNow, dt, env) {
      if (!(dt >= 0)) dt = (lastT != null && tNow > lastT) ? (tNow - lastT) / 1000 : 0;
      lastT = tNow;
      dt = clamp(dt, 0, 0.1);          // a long pause (hidden tab) must not fling anything
      rabbit.update(dt);
      robot.update(dt, env);
    }

    return {
      group,
      interactive: [rabbit.pick, robot.pick],
      update,
      robotPlay(move) { return robot.play(move); },
      rabbitHop() { return rabbit.hopNow(); },
      // extra (optional): re-tint the accent-coloured bits if the site accent changes
      setAccent(hex) {
        try {
          const col = new THREE.Color(hex);
          rabbit.collarMat.color.copy(col);
          const old = desk.signMat.map;
          desk.signMat.map = signTexture('#' + col.getHexString());
          desk.signMat.needsUpdate = true;
          if (old) old.dispose();
        } catch (e) { /* keep the old accent */ }
      },
    };
  }

  return { build };
})();
