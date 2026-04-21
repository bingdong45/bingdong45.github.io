// The classroom scene. Primitives only, baked-feel materials, one warm key light.
// All hit-testable objects are tagged via .userData.hit = 'keyname'.

window.Classroom = (function () {
  const THREE = window.THREE;

  function makeCanvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }

  // ---- textures ----

  function woodTexture(tone = 0) {
    return makeCanvasTexture(512, 512, (ctx, w, h) => {
      const base = tone === 1 ? '#a57a4a' : '#8b5a2b';
      const dark = tone === 1 ? '#6b4420' : '#4a2e14';
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      // grain lines
      for (let i = 0; i < 60; i++) {
        ctx.strokeStyle = `rgba(60, 35, 15, ${0.05 + Math.random() * 0.12})`;
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.beginPath();
        const y = Math.random() * h;
        ctx.moveTo(0, y);
        for (let x = 0; x < w; x += 16) {
          ctx.lineTo(x, y + (Math.random() - 0.5) * 4);
        }
        ctx.stroke();
      }
      // knots
      for (let i = 0; i < 4; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const g = ctx.createRadialGradient(x, y, 2, x, y, 16);
        g.addColorStop(0, dark);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 20, y - 20, 40, 40);
      }
    });
  }

  function wallTexture() {
    return makeCanvasTexture(256, 256, (ctx, w, h) => {
      // classroom sage-cream — cheerful, slightly green-yellow, feels like a real elementary room
      ctx.fillStyle = '#e7e4c8';
      ctx.fillRect(0, 0, w, h);
      // subtle noise
      for (let i = 0; i < 800; i++) {
        ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '70,80,40' : '255,250,220'}, ${Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
      // very faint horizontal banding (wall panels)
      for (let y = 0; y < h; y += 64) {
        ctx.fillStyle = 'rgba(0,0,0,0.025)';
        ctx.fillRect(0, y, w, 1);
      }
    });
  }

  function floorTexture() {
    return makeCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#a8764a';
      ctx.fillRect(0, 0, w, h);
      // plank lines
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(${100 + Math.random() * 50}, ${60 + Math.random() * 20}, 35, 1)`;
        ctx.fillRect(i * 64, 0, 62, h);
        ctx.strokeStyle = 'rgba(40,20,10,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(i * 64, 0, 62, h);
      }
      // grain
      for (let i = 0; i < 120; i++) {
        ctx.strokeStyle = `rgba(40, 20, 10, ${0.06 + Math.random() * 0.1})`;
        ctx.beginPath();
        const y = Math.random() * h;
        ctx.moveTo(0, y);
        for (let x = 0; x < w; x += 20) ctx.lineTo(x, y + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }
    });
  }

  // helper: wrap text to a max width, return array of lines
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // main whiteboard — drawn like a teacher organized it, marker-feel rectangles
  function whiteboardTexture(accentColor) {
    const C = (window.CONTENT && window.CONTENT.whiteboard) || {};
    const items = (C.items || []).slice(0, 5);
    return makeCanvasTexture(2048, 1024, (ctx, W, H) => {
      // base
      ctx.fillStyle = '#f8f4e8';
      ctx.fillRect(0, 0, W, H);
      // ghost marker stains
      for (let i = 0; i < 25; i++) {
        ctx.strokeStyle = `rgba(80, 80, 80, ${0.04 + Math.random() * 0.05})`;
        ctx.lineWidth = 2 + Math.random() * 8;
        ctx.beginPath();
        const sx = Math.random() * W, sy = Math.random() * H;
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx + 100, sy + 20, sx + 200, sy - 30, sx + 300 * Math.random(), sy + 50 * Math.random());
        ctx.stroke();
      }

      // Title at top — handwritten
      ctx.fillStyle = '#1a1510';
      ctx.font = '88px "Patrick Hand", cursive';
      ctx.textBaseline = 'top';
      ctx.fillText('Today:', 80, 40);
      ctx.fillStyle = accentColor;
      ctx.font = 'italic 72px "Caveat", cursive';
      ctx.fillText(C.title || 'things I\'ve been working on', 310, 60);

      // divider line — marker feel
      ctx.strokeStyle = '#2a2520';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(80, 180);
      ctx.lineTo(W - 80, 184);
      ctx.stroke();

      // 5 zones laid out like the teacher organized them
      const slots = [
        { x: 80,   y: 230, w: 560, h: 310 },
        { x: 720,  y: 230, w: 560, h: 310 },
        { x: 1360, y: 230, w: 608, h: 310 },
        { x: 80,   y: 610, w: 870, h: 350 },
        { x: 1030, y: 610, w: 938, h: 350 },
      ];

      items.forEach((it, i) => {
        const z = slots[i]; if (!z) return;
        // rectangle - sketchy
        ctx.strokeStyle = i % 2 ? accentColor : '#1a1510';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const jitter = () => (Math.random() - 0.5) * 3;
        ctx.moveTo(z.x + jitter(), z.y + jitter());
        ctx.lineTo(z.x + z.w + jitter(), z.y + jitter());
        ctx.lineTo(z.x + z.w + jitter(), z.y + z.h + jitter());
        ctx.lineTo(z.x + jitter(), z.y + z.h + jitter());
        ctx.closePath();
        ctx.stroke();

        // title (truncate if too long)
        ctx.fillStyle = '#1a1510';
        ctx.font = '44px "Patrick Hand", cursive';
        const titleText = `${it.num || String(i+1).padStart(2, '0')}  ${it.title}`;
        const titleLines = wrapText(ctx, titleText, z.w - 40);
        titleLines.slice(0, 2).forEach((ln, li) =>
          ctx.fillText(ln, z.x + 22, z.y + 20 + li * 46));

        // tag
        ctx.fillStyle = accentColor;
        ctx.font = '22px "JetBrains Mono", monospace';
        ctx.fillText((it.meta || '').toLowerCase(), z.x + 22, z.y + Math.min(120, 20 + titleLines.length * 46 + 14));

        // note (short desc, wrapped)
        ctx.fillStyle = 'rgba(26,21,16,0.78)';
        ctx.font = '32px "Caveat", cursive';
        const noteLines = wrapText(ctx, it.desc || '', z.w - 40);
        const noteTop = z.y + Math.min(165, 20 + titleLines.length * 46 + 58);
        const maxLines = Math.floor((z.h - (noteTop - z.y) - 60) / 40);
        noteLines.slice(0, maxLines).forEach((line, li) =>
          ctx.fillText(line, z.x + 22, noteTop + li * 40));

        // little underline flourish
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(z.x + 22, z.y + z.h - 36);
        ctx.lineTo(z.x + 120 + Math.random() * 80, z.y + z.h - 32);
        ctx.stroke();

        // click indicator
        ctx.fillStyle = accentColor;
        ctx.font = '22px "JetBrains Mono", monospace';
        ctx.fillText('→ open', z.x + z.w - 140, z.y + z.h - 40);
      });
    });
  }

  // small side board — name/intro
  function nameBoardTexture(accentColor) {
    const C = (window.CONTENT && window.CONTENT.leftboard) || {};
    const P = (window.CONTENT && window.CONTENT.profile) || {};
    // parse title like "Hi, I'm Mason." into greeting + name
    const fullTitle = C.title || "Hi, I'm there.";
    let greeting = 'hello,';
    let name = fullTitle;
    const m = fullTitle.match(/^([^,]+,)\s*(.+)$/);
    if (m) { greeting = m[1].toLowerCase(); name = m[2]; }
    return makeCanvasTexture(1024, 1280, (ctx, W, H) => {
      ctx.fillStyle = '#f8f4e8';
      ctx.fillRect(0, 0, W, H);

      // HELLO header
      ctx.fillStyle = accentColor;
      ctx.font = '120px "Patrick Hand", cursive';
      ctx.fillText(greeting, 60, 140);

      ctx.fillStyle = '#1a1510';
      ctx.font = '110px "Patrick Hand", cursive';
      ctx.fillText(name, 60, 270);

      // underline
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(60, 300);
      ctx.lineTo(580, 305);
      ctx.stroke();

      // role line
      ctx.fillStyle = 'rgba(26,21,16,0.75)';
      ctx.font = '42px "Caveat", cursive';
      const subLines = wrapText(ctx, C.sub || P.role || '', W - 120);
      subLines.slice(0, 3).forEach((line, i) => ctx.fillText(line, 60, 370 + i * 52));

      // body — first paragraph, wrapped short
      ctx.fillStyle = 'rgba(26,21,16,0.85)';
      ctx.font = '38px "Caveat", cursive';
      const bodyText = (C.body && C.body[0]) || '';
      const bodyLines = wrapText(ctx, bodyText, W - 120);
      const bodyTop = 380 + subLines.length * 52 + 30;
      const maxBodyLines = Math.floor((H - bodyTop - 180) / 48);
      bodyLines.slice(0, maxBodyLines).forEach((line, i) =>
        ctx.fillText(line, 60, bodyTop + i * 48));

      // little arrow
      ctx.strokeStyle = '#1a1510';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(60, H - 180);
      ctx.lineTo(340, H - 180);
      ctx.moveTo(320, H - 195);
      ctx.lineTo(340, H - 180);
      ctx.lineTo(320, H - 165);
      ctx.stroke();
      ctx.fillStyle = '#1a1510';
      ctx.font = '48px "Patrick Hand", cursive';
      ctx.fillText('click for more', 60, H - 130);

      // click zone marker
      ctx.strokeStyle = accentColor;
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 60, W - 80, H - 150);
      ctx.setLineDash([]);

      ctx.fillStyle = accentColor;
      ctx.font = '36px "JetBrains Mono", monospace';
      ctx.fillText('→ read', W - 220, H - 70);
    });
  }

  // right side contact board
  function contactBoardTexture(accentColor) {
    const C = (window.CONTENT && window.CONTENT.rightboard) || {};
    const contacts = C.contacts || [];
    return makeCanvasTexture(1024, 1280, (ctx, W, H) => {
      ctx.fillStyle = '#f8f4e8';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1a1510';
      ctx.font = '96px "Patrick Hand", cursive';
      ctx.fillText(C.title || 'Get in touch', 60, 140);

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(60, 170);
      ctx.lineTo(560, 175);
      ctx.stroke();

      // sub
      if (C.sub) {
        ctx.fillStyle = 'rgba(26,21,16,0.7)';
        ctx.font = 'italic 34px "Caveat", cursive';
        const subLines = wrapText(ctx, C.sub, W - 120);
        subLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 60, 220 + i * 40));
      }

      // contacts
      ctx.font = '48px "Caveat", cursive';
      const startY = 320;
      contacts.slice(0, 5).forEach((c, i) => {
        ctx.fillStyle = accentColor;
        ctx.fillText((c.label || '').toLowerCase(), 60, startY + i * 90);
        ctx.fillStyle = '#1a1510';
        ctx.font = '44px "Caveat", cursive';
        // truncate long values
        let val = c.val || '';
        if (ctx.measureText(val).width > W - 360) {
          while (val.length > 10 && ctx.measureText(val + '…').width > W - 360) val = val.slice(0, -1);
          val = val + '…';
        }
        ctx.fillText(val, 340, startY + i * 90);
        ctx.font = '48px "Caveat", cursive';
      });

      // now working on
      const divY = startY + Math.min(contacts.length, 5) * 90 + 40;
      ctx.strokeStyle = 'rgba(26,21,16,0.3)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, divY);
      ctx.lineTo(W - 60, divY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = accentColor;
      ctx.font = '44px "Patrick Hand", cursive';
      ctx.fillText('currently looking for:', 60, divY + 60);

      ctx.fillStyle = '#1a1510';
      ctx.font = '36px "Caveat", cursive';
      const nowLines = wrapText(ctx, C.now || '', W - 120);
      const maxNow = Math.max(1, Math.floor((H - (divY + 90) - 160) / 44));
      nowLines.slice(0, maxNow).forEach((l, i) => ctx.fillText(l, 60, divY + 110 + i * 44));

      ctx.strokeStyle = accentColor;
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 60, W - 80, H - 150);
      ctx.setLineDash([]);

      ctx.fillStyle = accentColor;
      ctx.font = '36px "JetBrains Mono", monospace';
      ctx.fillText('→ reach out', W - 290, H - 70);
    });
  }

  // paper — today's assignment
  function paperTexture(accentColor) {
    return makeCanvasTexture(768, 1024, (ctx, W, H) => {
      // cream paper
      ctx.fillStyle = '#fffdf4';
      ctx.fillRect(0, 0, W, H);
      // blue rule lines
      ctx.strokeStyle = 'rgba(90, 130, 200, 0.25)';
      ctx.lineWidth = 1.5;
      for (let y = 120; y < H - 40; y += 48) {
        ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W - 50, y); ctx.stroke();
      }
      // red margin line
      ctx.strokeStyle = 'rgba(200, 60, 40, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(100, 20); ctx.lineTo(100, H - 20); ctx.stroke();

      // heading
      ctx.fillStyle = accentColor;
      ctx.font = '54px "Patrick Hand", cursive';
      ctx.fillText("Today's assignment", 120, 90);

      ctx.fillStyle = '#1a1510';
      ctx.font = '40px "Caveat", cursive';
      const body = [
        'Featured this week:',
        '',
        'a short illustrated essay',
        'on "slow interfaces" —',
        'software that deliberately',
        'takes a beat.',
        '',
        'goes up Thursday.',
        '',
        '— Avery',
      ];
      body.forEach((l, i) => ctx.fillText(l, 120, 168 + i * 48));

      // corner fold
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.moveTo(W - 60, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 60); ctx.closePath(); ctx.fill();
    });
  }

  // notebook open-page texture
  function notebookTexture() {
    return makeCanvasTexture(1024, 768, (ctx, W, H) => {
      ctx.fillStyle = '#fffdf4';
      ctx.fillRect(0, 0, W, H);
      // spiral
      ctx.fillStyle = '#d4cbb5';
      ctx.fillRect(W/2 - 4, 0, 8, H);
      for (let y = 30; y < H - 20; y += 50) {
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(W/2, y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fffdf4';
        ctx.beginPath(); ctx.arc(W/2, y, 5, 0, Math.PI * 2); ctx.fill();
      }
      // rule lines both pages
      ctx.strokeStyle = 'rgba(90,130,200,0.2)';
      for (let y = 80; y < H - 40; y += 40) {
        ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W/2 - 30, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W/2 + 30, y); ctx.lineTo(W - 40, y); ctx.stroke();
      }
      // handwriting
      ctx.fillStyle = '#1a1510';
      ctx.font = '36px "Caveat", cursive';
      ctx.fillText('field notes.', 60, 110);
      ctx.font = '28px "Caveat", cursive';
      ['apr 2 — loading states, a taxonomy', 'mar 18 — on quitting the dashboard',
       'feb 24 — the desk is the interface', 'jan 11 — prompts are a syntax...'].forEach((l, i) =>
        ctx.fillText(l, 60, 180 + i * 40));

      ctx.font = '34px "Patrick Hand", cursive';
      ctx.fillStyle = '#c0392b';
      ctx.fillText('click to read →', W/2 + 60, 110);
      ctx.fillStyle = '#1a1510';
      ctx.font = '26px "Caveat", cursive';
      ['• longer essays go on letters.', '• shorter things stay here.', '• some are rough drafts,',
       '  kept that way on purpose.', '', 'thanks for reading.'].forEach((l, i) =>
        ctx.fillText(l, W/2 + 60, 180 + i * 40));
    });
  }

  // textbook cover
  function textbookTexture(accentColor) {
    return makeCanvasTexture(512, 768, (ctx, W, H) => {
      ctx.fillStyle = '#3a5a7a';
      ctx.fillRect(0, 0, W, H);
      // worn edges
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, W, 20);
      ctx.fillRect(0, H - 20, W, 20);

      ctx.fillStyle = '#f0e8d0';
      ctx.font = '60px "Fraunces", serif';
      ctx.fillText('Publications', 40, 200);
      ctx.fillText('& talks', 40, 270);

      ctx.strokeStyle = '#f0e8d0';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 320, W - 80, 3);

      ctx.font = 'italic 30px "Fraunces", serif';
      ctx.fillStyle = 'rgba(240,232,208,0.7)';
      ctx.fillText('A. Okonkwo, ed.', 40, 370);
      ctx.fillText('2017 — present', 40, 410);

      // sticky notes drawn separately as child meshes
    });
  }

  // bulletin board
  function bulletinTexture(accentColor) {
    return makeCanvasTexture(1536, 1024, (ctx, W, H) => {
      // cork
      ctx.fillStyle = '#b8956a';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = `rgba(${60 + Math.random()*40}, ${40 + Math.random()*30}, 20, ${Math.random()*0.3})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      }

      // title card
      ctx.fillStyle = '#f8f4e8';
      ctx.save();
      ctx.translate(100, 80);
      ctx.rotate(-0.03);
      ctx.fillRect(0, 0, 340, 90);
      ctx.restore();
      ctx.fillStyle = '#1a1510';
      ctx.font = '50px "Patrick Hand", cursive';
      ctx.fillText('Press & things', 120, 140);

      // pinned cards
      const cards = [
        { x: 520, y: 60, w: 360, h: 260, r: -0.04, c: '#fffdf4', t: 'Profile', s: 'The Creative\nIndependent', d: 'mar 2026' },
        { x: 920, y: 90, w: 340, h: 240, r: 0.03, c: '#fef5db', t: 'Talk', s: 'Keynote · Config\nLondon', d: 'oct 2025' },
        { x: 1300, y: 70, w: 200, h: 260, r: -0.02, c: '#e8e0c8', t: 'Photo', s: '[gallery opening]', d: 'sep 2025' },
        { x: 150, y: 380, w: 300, h: 200, r: 0.02, c: '#fef5db', t: 'Award', s: 'Fast Co. IxD\nfinalist', d: 'jun 2025' },
        { x: 500, y: 420, w: 360, h: 220, r: -0.05, c: '#fffdf4', t: 'Press', s: 'Offscreen Mag\n#27', d: 'feb 2025' },
        { x: 930, y: 400, w: 340, h: 240, r: 0.04, c: '#f2e0d0', t: 'Talk', s: 'RISD GD\nguest lecture', d: 'nov 2024' },
        { x: 1310, y: 420, w: 200, h: 200, r: 0.02, c: '#e8e0c8', t: 'Photo', s: '[studio desk]', d: 'aug 2024' },
        { x: 200, y: 700, w: 380, h: 240, r: -0.02, c: '#fffdf4', t: 'Writing', s: 'WorksInProgress\nessay', d: 'jul 2024' },
        { x: 650, y: 720, w: 320, h: 220, r: 0.03, c: '#fef5db', t: 'Interview', s: 'Off-Record\npodcast', d: 'jun 2024' },
        { x: 1020, y: 710, w: 420, h: 240, r: -0.03, c: '#f0e8d0', t: 'Exhibition', s: 'group show,\nred hook gallery', d: 'may 2024' },
      ];
      cards.forEach(c => {
        ctx.save();
        ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
        ctx.rotate(c.r);
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = c.c;
        ctx.fillRect(-c.w/2, -c.h/2, c.w, c.h);
        ctx.shadowColor = 'transparent';
        // pin
        const pg = ctx.createRadialGradient(0, -c.h/2 + 14, 2, 0, -c.h/2 + 14, 10);
        pg.addColorStop(0, '#ff6a4d'); pg.addColorStop(1, accentColor);
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(0, -c.h/2 + 14, 10, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = accentColor;
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.fillText(c.t.toUpperCase(), -c.w/2 + 20, -c.h/2 + 54);
        ctx.fillStyle = '#1a1510';
        ctx.font = '32px "Fraunces", serif';
        c.s.split('\n').forEach((line, i) => ctx.fillText(line, -c.w/2 + 20, -c.h/2 + 90 + i*38));
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = '18px "JetBrains Mono", monospace';
        ctx.fillText(c.d, -c.w/2 + 20, c.h/2 - 24);
        ctx.restore();
      });
    });
  }

  // laptop screen — a tiny fake demo rendered to texture
  function laptopScreenTexture(accentColor) {
    return makeCanvasTexture(1024, 640, (ctx, W, H) => {
      // editor-like
      ctx.fillStyle = '#1a1715';
      ctx.fillRect(0, 0, W, H);
      // title bar
      ctx.fillStyle = '#2a2522';
      ctx.fillRect(0, 0, W, 40);
      ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(24 + i*22, 20, 7, 0, Math.PI*2); ctx.fill();
      });
      ctx.fillStyle = '#999';
      ctx.font = '16px "JetBrains Mono", monospace';
      ctx.fillText('margin-notes — live demo', 140, 25);

      // left: "book" text
      ctx.fillStyle = '#f0e8d0';
      ctx.font = '18px "Fraunces", serif';
      const book = [
        'Chapter one. The town of Verrières',
        'must be one of the prettiest in the',
        'Franche-Comté. Its white houses',
        'with their red-tiled, pointed roofs',
        'stretch along the slope of a hill...',
        '',
        'The Doubs flows some hundreds of',
        'feet below its fortifications.',
      ];
      book.forEach((l, i) => ctx.fillText(l, 40, 100 + i * 28));

      // highlight
      ctx.fillStyle = 'rgba(255, 220, 100, 0.25)';
      ctx.fillRect(40, 180, 380, 26);

      // right gutter: model response
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(560, 80); ctx.lineTo(560, H - 40); ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText('MARGIN', 580, 110);
      ctx.fillStyle = 'rgba(240,232,208,0.85)';
      ctx.font = 'italic 16px "Fraunces", serif';
      const notes = [
        'Stendhal opens not with a',
        'person but with a geography.',
        '',
        'The red tiles will echo later',
        'in the novel\'s title.',
        '',
        '— you highlighted this on apr 2',
      ];
      notes.forEach((l, i) => ctx.fillText(l, 580, 150 + i * 28));

      // blinking cursor indicator
      ctx.fillStyle = accentColor;
      ctx.fillRect(580, 352, 2, 18);

      // footer
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('→ click the laptop to open the real version', 40, H - 24);
    });
  }

  // ---- scene setup ----

  function init(canvas, opts) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#2a2d1d');
    scene.fog = new THREE.Fog('#2a2d1d', 10, 22);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 40);
    // seated at back of room so all three front-wall boards fill the view when centered
    camera.position.set(0, 1.65, 0.8);
    camera.rotation.order = 'YXZ';

    // ---- lighting ----
    const ambient = new THREE.AmbientLight(0xfff6e0, 0.45);
    scene.add(ambient);

    // warm key from window (left) — slightly cooler than before for a schoolroom feel
    const key = new THREE.DirectionalLight(0xffd8a0, 1.2);
    key.position.set(-4, 3.5, 1.5);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 22;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -5;
    key.shadow.bias = -0.0001;
    key.shadow.normalBias = 0.02;
    scene.add(key);

    // cool fill from right
    const fill = new THREE.DirectionalLight(0xaec9e0, 0.3);
    fill.position.set(3, 2, 2);
    scene.add(fill);

    // soft warm hemisphere
    const hemi = new THREE.HemisphereLight(0xfdecc0, 0x3a3a20, 0.4);
    scene.add(hemi);

    // A soft window "god ray" as a plane with additive material
    const rayGeo = new THREE.PlaneGeometry(2.2, 4.5);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xffcf88, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const ray = new THREE.Mesh(rayGeo, rayMat);
    ray.position.set(-2.5, 1.0, 0);
    ray.rotation.y = Math.PI / 2.6;
    ray.rotation.z = -0.15;
    scene.add(ray);

    // ---- room shell ----
    const roomW = 9, roomH = 3.5, roomD = 8;
    const wallMat = new THREE.MeshLambertMaterial({ map: wallTexture(), color: 0xeee9c8 });
    const floorMat = new THREE.MeshLambertMaterial({ map: floorTexture() });
    floorMat.map.wrapS = floorMat.map.wrapT = THREE.RepeatWrapping;
    floorMat.map.repeat.set(3, 3);
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xf7f3df });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomH;
    scene.add(ceiling);

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), wallMat);
    frontWall.position.set(0, roomH / 2, -roomD / 2);
    scene.add(frontWall);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), wallMat);
    backWall.position.set(0, roomH / 2, roomD / 2);
    backWall.rotation.y = Math.PI;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, roomH), wallMat);
    leftWall.position.set(-roomW / 2, roomH / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, roomH), wallMat);
    rightWall.position.set(roomW / 2, roomH / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // baseboard
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
    [[-0, 0.08, -roomD/2 + 0.01, roomW, 0.16, 0.02],
     [-0, 0.08, roomD/2 - 0.01, roomW, 0.16, 0.02],
     [-roomW/2 + 0.01, 0.08, 0, 0.02, 0.16, roomD],
     [roomW/2 - 0.01, 0.08, 0, 0.02, 0.16, roomD]].forEach(p => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(p[3], p[4], p[5]), baseMat);
      b.position.set(p[0], p[1], p[2]);
      scene.add(b);
    });

    // Interactive objects registry
    const interactive = [];

    // ---- main whiteboard (enlarged) ----
    const whiteboardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 3.1, 0.1),
      new THREE.MeshLambertMaterial({ map: woodTexture(0) })
    );
    whiteboardFrame.position.set(0, 1.85, -roomD / 2 + 0.06);
    whiteboardFrame.castShadow = true;
    whiteboardFrame.receiveShadow = true;
    scene.add(whiteboardFrame);

    const wbTex = whiteboardTexture(opts.accentHex);
    const whiteboard = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 2.9),
      new THREE.MeshLambertMaterial({ map: wbTex })
    );
    whiteboard.position.set(0, 1.85, -roomD / 2 + 0.12);
    whiteboard.userData.hit = 'whiteboard';
    whiteboard.userData.label = 'Projects';
    scene.add(whiteboard);
    // NOTE: whiteboard itself is NOT in `interactive` — the 5 per-project pick planes below handle clicks
    // so each project gets its own hover glow.

    // Per-project invisible pick planes, aligned to the 5 zones drawn inside whiteboardTexture().
    // Canvas is 2048x1024; board plane is 4.6 x 2.9 m. Convert zone rects (x,y,w,h) to local plane coords.
    //   zoneX (local) = (zone.x + zone.w/2) / 2048 * 4.6 - 4.6/2
    //   zoneY (local) = 2.9/2 - (zone.y + zone.h/2) / 1024 * 2.9
    //   zoneW         = zone.w / 2048 * 4.6
    //   zoneH         = zone.h / 1024 * 2.9
    const wbZoneRects = [
      { x: 80,   y: 230, w: 560, h: 310 },
      { x: 720,  y: 230, w: 560, h: 310 },
      { x: 1360, y: 230, w: 608, h: 310 },
      { x: 80,   y: 610, w: 870, h: 350 },
      { x: 1030, y: 610, w: 938, h: 350 },
    ];
    const wbItems = ((window.CONTENT && window.CONTENT.whiteboard && window.CONTENT.whiteboard.items) || []).slice(0, 5);
    wbZoneRects.forEach((z, i) => {
      const localX = (z.x + z.w / 2) / 2048 * 4.6 - 4.6 / 2;
      const localY = 2.9 / 2 - (z.y + z.h / 2) / 1024 * 2.9;
      const w = z.w / 2048 * 4.6;
      const h = z.h / 1024 * 2.9;
      const pick = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
      );
      pick.position.set(localX, 1.85 + localY, -roomD / 2 + 0.125);
      pick.userData.hit = 'whiteboard';
      pick.userData.projectIndex = i;
      pick.userData.label = wbItems[i] ? wbItems[i].title : `Project ${i + 1}`;
      scene.add(pick);
      interactive.push(pick);
    });

    // marker tray
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.05, 0.15),
      new THREE.MeshLambertMaterial({ map: woodTexture(1) })
    );
    tray.position.set(0, 0.35, -roomD / 2 + 0.2);
    scene.add(tray);
    // markers on tray
    ['#c0392b', '#2c3e50', '#27ae60'].forEach((col, i) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.18, 12),
        new THREE.MeshLambertMaterial({ color: col })
      );
      m.rotation.z = Math.PI/2;
      m.position.set(-0.4 + i*0.4, 0.39, -roomD/2 + 0.2);
      scene.add(m);
    });

    // ---- left small board (name) ----
    const leftBoardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.8, 0.1),
      new THREE.MeshLambertMaterial({ map: woodTexture(0) })
    );
    leftBoardFrame.position.set(-3.4, 1.75, -roomD/2 + 0.06);
    leftBoardFrame.castShadow = true;
    leftBoardFrame.receiveShadow = true;
    scene.add(leftBoardFrame);

    const leftBoardTex = nameBoardTexture(opts.accentHex);
    const leftBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.65),
      new THREE.MeshLambertMaterial({ map: leftBoardTex })
    );
    leftBoard.position.set(-3.4, 1.75, -roomD/2 + 0.12);
    leftBoard.rotation.y = 0;
    leftBoard.userData.hit = 'leftboard';
    leftBoard.userData.label = 'About me';
    scene.add(leftBoard);
    interactive.push(leftBoard);

    // ---- right small board (contact) ----
    const rightBoardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.8, 0.1),
      new THREE.MeshLambertMaterial({ map: woodTexture(0) })
    );
    rightBoardFrame.position.set(3.4, 1.75, -roomD/2 + 0.06);
    rightBoardFrame.castShadow = true;
    rightBoardFrame.receiveShadow = true;
    scene.add(rightBoardFrame);

    const rightBoardTex = contactBoardTexture(opts.accentHex);
    const rightBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.65),
      new THREE.MeshLambertMaterial({ map: rightBoardTex })
    );
    rightBoard.position.set(3.4, 1.75, -roomD/2 + 0.12);
    rightBoard.rotation.y = 0;
    rightBoard.userData.hit = 'rightboard';
    rightBoard.userData.label = 'Contact';
    scene.add(rightBoard);
    interactive.push(rightBoard);

    // (teacher's desk removed per request — it was blocking the boards)

    // ---- my desk group (so we can scale uniformly) ----
    const myDesk = new THREE.Group();
    scene.add(myDesk);
    myDesk.scale.set(1.35, 1.35, 1.35);
    // keep floor contact: translate so base y ~0 after scale (items sit at y≈0.85; (0.85*0.35)=0.3 extra so push down by 0.3)
    myDesk.position.set(0, -0.1, 0.2);

    // ---- student desk (YOUR desk — just in front of camera, look down) ----
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.7),
      new THREE.MeshStandardMaterial({ map: woodTexture(1), roughness: 0.65, metalness: 0.0 })
    );
    desk.position.set(0, 0.85, 0.0);
    desk.castShadow = true;
    desk.receiveShadow = true;
    myDesk.add(desk);

    // lip
    const deskLip = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x5c3a1c }));
    deskLip.position.set(0, 0.84, -0.34);
    myDesk.add(deskLip);

    // legs
    [[-0.65, 0.42, -0.28], [0.65, 0.42, -0.28], [-0.65, 0.42, 0.28], [0.65, 0.42, 0.28]].forEach(p => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.05), new THREE.MeshLambertMaterial({ color: 0x4a2e14 }));
      l.position.set(p[0], p[1], p[2]);
      myDesk.add(l);
    });

    // ---- desk items ----

    // Closed diary — single hardcover book, design on top
    const diaryTex = makeCanvasTexture(512, 720, (ctx, W, H) => {
      // leather base
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#7a3b2a');
      grad.addColorStop(0.5, '#8a4532');
      grad.addColorStop(1, '#6a2f22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // leather grain noise
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let i = 0; i < 1400; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 2, 1);
      }
      // embossed inner border
      ctx.strokeStyle = 'rgba(255, 220, 170, 0.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(38, 48, W - 76, H - 96);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(46, 56, W - 92, H - 112);
      // little corner ornaments
      const corner = (cx, cy, flipX, flipY) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(flipX, flipY);
        ctx.strokeStyle = 'rgba(255, 220, 170, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 28);
        ctx.quadraticCurveTo(0, 0, 28, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(8, 8, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 220, 170, 0.7)';
        ctx.fill();
        ctx.restore();
      };
      corner(60, 70, 1, 1);
      corner(W - 60, 70, -1, 1);
      corner(60, H - 70, 1, -1);
      corner(W - 60, H - 70, -1, -1);
      // title
      ctx.fillStyle = '#f6d8a8';
      ctx.font = 'bold 68px "Fraunces", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Diary', W / 2, H * 0.4);
      ctx.font = 'italic 34px "Caveat", cursive';
      ctx.fillText('— field notes —', W / 2, H * 0.5);
      // year at bottom
      ctx.font = '28px "JetBrains Mono", monospace';
      ctx.fillText('MMXXVI', W / 2, H * 0.86);
      // central ornament (compass / asterisk)
      ctx.save();
      ctx.translate(W / 2, H * 0.66);
      ctx.strokeStyle = 'rgba(255, 220, 170, 0.75)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(4, 0);
        ctx.lineTo(0, 30);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 220, 170, 0.6)';
      ctx.fill();
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    });
    const diaryColor = 0x6a2f22;
    const notebook = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.055, 0.5),
      [
        new THREE.MeshLambertMaterial({ color: diaryColor }),       // +x (right edge)
        new THREE.MeshLambertMaterial({ color: 0x4a1f14 }),          // -x (spine side)
        new THREE.MeshLambertMaterial({ map: diaryTex }),            // +y (top — the cover design)
        new THREE.MeshLambertMaterial({ color: 0xe8d8b0 }),          // -y (bottom — page edges visible from below)
        new THREE.MeshLambertMaterial({ color: 0xe8d8b0 }),          // +z (front page-edges)
        new THREE.MeshLambertMaterial({ color: 0xe8d8b0 }),          // -z (back page-edges)
      ]
    );
    notebook.position.set(-0.38, 0.905, -0.05);
    notebook.rotation.y = 0.2;
    notebook.castShadow = true;
    notebook.receiveShadow = true;
    notebook.userData.hit = 'notebook';
    notebook.userData.label = 'Open the diary';
    myDesk.add(notebook);
    interactive.push(notebook);
    // elastic band across the diary
    const diaryBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.057, 0.52),
      new THREE.MeshLambertMaterial({ color: 0x2a1a14 })
    );
    diaryBand.position.set(-0.38 + Math.cos(0.2) * 0.12, 0.905, -0.05 + Math.sin(0.2) * 0.12);
    diaryBand.rotation.y = 0.2;
    myDesk.add(diaryBand);

    // ---- Textbook (hardcover, stacked pages, bookmark ribbon) ----
    const textbookGroup = new THREE.Group();
    textbookGroup.position.set(0.42, 0.885, 0.15);
    textbookGroup.rotation.y = -0.18;
    myDesk.add(textbookGroup);

    const textbookTex = textbookTexture(opts.accentHex);
    // hard cover (top, slightly larger than pages)
    const tbCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.02, 0.48),
      [
        new THREE.MeshLambertMaterial({ color: 0x1f3348 }),
        new THREE.MeshLambertMaterial({ color: 0x1f3348 }),
        new THREE.MeshLambertMaterial({ map: textbookTex }),
        new THREE.MeshLambertMaterial({ color: 0x16293d }),
        new THREE.MeshLambertMaterial({ color: 0x1f3348 }),
        new THREE.MeshLambertMaterial({ color: 0x1f3348 }),
      ]
    );
    tbCover.position.set(0, 0.055, 0);
    tbCover.userData.hit = 'textbook';
    tbCover.userData.label = 'Publications & talks';
    textbookGroup.add(tbCover);
    interactive.push(tbCover);

    // page block underneath — thicker, slightly inset so cover overhangs
    const pageBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.06, 0.46),
      new THREE.MeshLambertMaterial({ color: 0xf3ebd6 })
    );
    pageBlock.position.set(0, 0.015, 0);
    textbookGroup.add(pageBlock);
    // page striations (horizontal lines suggesting stacked pages)
    for (let i = 0; i < 8; i++) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.342, 0.001, 0.462),
        new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0xddd3b8 : 0xe8dfc5 })
      );
      line.position.set(0, -0.015 + i * 0.007, 0);
      textbookGroup.add(line);
    }
    // spine (left edge, wrapping around)
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.09, 0.48),
      new THREE.MeshLambertMaterial({ color: 0x16293d })
    );
    spine.position.set(-0.18, 0.025, 0);
    textbookGroup.add(spine);
    // bottom hard cover
    const tbBottom = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.015, 0.48),
      new THREE.MeshLambertMaterial({ color: 0x1f3348 })
    );
    tbBottom.position.set(0, -0.018, 0);
    textbookGroup.add(tbBottom);
    // bookmark ribbon (poking out top)
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.002, 0.14),
      new THREE.MeshLambertMaterial({ color: 0xc0392b })
    );
    ribbon.position.set(0.08, 0.065, 0.3);
    textbookGroup.add(ribbon);
    // (removed: floating gold title strip — it was poking out the side of the book and reading as an anomaly)

    // Sticky notes poking out of the book's right page edge
    const stickyColors = [0xfff59d, 0xffab91, 0xb2dfdb];
    [-0.12, 0.05, 0.18].forEach((off, i) => {
      const sticky = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.005, 0.06),
        new THREE.MeshLambertMaterial({ color: stickyColors[i] })
      );
      sticky.position.set(0.185, 0.02, off);
      sticky.rotation.y = (Math.random() - 0.5) * 0.2;
      textbookGroup.add(sticky);
    });

    // ---- Laptop (proper clamshell: base w/ keyboard + trackpad, raised lid w/ bezel) ----
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(-0.02, 0.88, -0.18);
    laptopGroup.rotation.y = 0.08;
    myDesk.add(laptopGroup);

    const laptopBodyColor = 0x8a8a90;
    const laptopBodyDark = 0x4a4a52;
    const laptopBodyMat = new THREE.MeshStandardMaterial({ color: laptopBodyColor, roughness: 0.12, metalness: 0.88 });
    const laptopBodyDarkMat = new THREE.MeshStandardMaterial({ color: laptopBodyDark, roughness: 0.15, metalness: 0.85 });

    // base (deck)
    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.018, 0.3),
      laptopBodyMat
    );
    laptopBase.position.set(0, 0.009, 0);
    laptopBase.castShadow = true;
    laptopBase.receiveShadow = true;
    laptopGroup.add(laptopBase);
    // slight bottom chassis (so it looks like a unibody not a flat slab)
    const laptopBelly = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.008, 0.28),
      laptopBodyDarkMat
    );
    laptopBelly.position.set(0, -0.001, 0);
    laptopGroup.add(laptopBelly);

    // keyboard recess (dark inset panel)
    const kbRecess = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.002, 0.16),
      new THREE.MeshLambertMaterial({ color: 0x22242a })
    );
    kbRecess.position.set(0, 0.0195, -0.03);
    laptopGroup.add(kbRecess);

    // keyboard keys — a grid of tiny cubes
    const keyMat = new THREE.MeshLambertMaterial({ color: 0x2e3038 });
    const keyCols = 14, keyRows = 5;
    const keyW = 0.022, keyH = 0.004, keyD = 0.022;
    const kbW = 0.34, kbD = 0.13;
    const keyXStep = kbW / keyCols;
    const keyZStep = kbD / keyRows;
    for (let r = 0; r < keyRows; r++) {
      // offset rows slightly for staggering
      const rowOff = (r === 4) ? 0 : 0;
      for (let c = 0; c < keyCols; c++) {
        // skip some to look like function row / space bar area
        const isSpace = (r === keyRows - 1 && c >= 4 && c <= 8);
        if (isSpace && c !== 4) continue; // draw space once
        const w = isSpace ? keyXStep * 5 - 0.002 : keyW;
        const key = new THREE.Mesh(
          new THREE.BoxGeometry(w, keyH, keyD),
          keyMat
        );
        const x = -kbW / 2 + keyXStep / 2 + c * keyXStep + (isSpace ? (keyXStep * 2) : 0) + rowOff;
        const z = -0.03 - kbD / 2 + keyZStep / 2 + r * keyZStep;
        key.position.set(x, 0.022, z);
        laptopGroup.add(key);
      }
    }

    // trackpad
    const trackpad = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.001, 0.085),
      new THREE.MeshLambertMaterial({ color: 0x6a6a72 })
    );
    trackpad.position.set(0, 0.0195, 0.09);
    laptopGroup.add(trackpad);
    // trackpad subtle border
    const trackpadBorder = new THREE.Mesh(
      new THREE.BoxGeometry(0.164, 0.0008, 0.089),
      new THREE.MeshLambertMaterial({ color: 0x4a4a52 })
    );
    trackpadBorder.position.set(0, 0.0192, 0.09);
    laptopGroup.add(trackpadBorder);

    // hinge (small cylinder across the back)
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.36, 8),
      laptopBodyDarkMat
    );
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, 0.02, -0.148);
    laptopGroup.add(hinge);

    // screen lid assembly (rotates around hinge)
    const laptopScreenGroup = new THREE.Group();
    laptopScreenGroup.position.set(0, 0.02, -0.148);
    laptopScreenGroup.rotation.x = -0.22; // slightly tilted back from vertical

    const lidHeight = 0.27;
    // lid back (what you'd see if looking from behind; also the outer shell)
    const laptopLid = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, lidHeight, 0.012),
      laptopBodyMat
    );
    laptopLid.position.set(0, lidHeight / 2, -0.006);
    laptopScreenGroup.add(laptopLid);
    // bezel (front, dark)
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, lidHeight - 0.01, 0.002),
      new THREE.MeshLambertMaterial({ color: 0x15161a })
    );
    bezel.position.set(0, lidHeight / 2, 0.001);
    laptopScreenGroup.add(bezel);
    // screen (emissive-looking)
    const laptopScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.22),
      new THREE.MeshBasicMaterial({ map: laptopScreenTexture(opts.accentHex) })
    );
    laptopScreen.position.set(0, lidHeight / 2, 0.003);
    laptopScreenGroup.add(laptopScreen);
    // tiny camera dot
    const camDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.003, 12),
      new THREE.MeshBasicMaterial({ color: 0x555 })
    );
    camDot.position.set(0, lidHeight - 0.012, 0.0035);
    laptopScreenGroup.add(camDot);
    // small logo circle on back of lid
    const logo = new THREE.Mesh(
      new THREE.CircleGeometry(0.025, 24),
      new THREE.MeshLambertMaterial({ color: 0xc5c5cc })
    );
    logo.position.set(0, lidHeight / 2, -0.0065);
    logo.rotation.y = Math.PI;
    laptopScreenGroup.add(logo);

    laptopGroup.add(laptopScreenGroup);
    laptopScreen.userData.hit = 'laptop';
    laptopScreen.userData.label = 'Open live demo';
    interactive.push(laptopScreen);

    // Pencil
    const pencil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8),
      new THREE.MeshLambertMaterial({ color: 0xf5c542 })
    );
    pencil.rotation.z = Math.PI/2;
    pencil.rotation.y = 0.3;
    pencil.position.set(-0.55, 0.885, -0.28);
    pencil.userData.hit = 'pencil';
    pencil.userData.label = 'A fun fact';
    myDesk.add(pencil);
    interactive.push(pencil);
    // pencil tip
    const pencilTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.009, 0.03, 8),
      new THREE.MeshLambertMaterial({ color: 0xf0d8a0 })
    );
    pencilTip.rotation.z = -Math.PI/2;
    pencilTip.rotation.y = 0.3;
    pencilTip.position.set(-0.55 - Math.cos(0.3)*0.105, 0.815, -0.28 - Math.sin(0.3)*0.105);
    myDesk.add(pencilTip);

    // Coffee mug — LatheGeometry for a proper curved silhouette
    const mugProfile = [
      new THREE.Vector2(0.000, 0.000),
      new THREE.Vector2(0.044, 0.000),
      new THREE.Vector2(0.048, 0.006),
      new THREE.Vector2(0.048, 0.012),
      new THREE.Vector2(0.045, 0.018),
      new THREE.Vector2(0.048, 0.030),
      new THREE.Vector2(0.052, 0.050),
      new THREE.Vector2(0.055, 0.080),
      new THREE.Vector2(0.056, 0.104),
      new THREE.Vector2(0.056, 0.112),
      new THREE.Vector2(0.052, 0.112),
      new THREE.Vector2(0.052, 0.104),
      new THREE.Vector2(0.050, 0.080),
      new THREE.Vector2(0.047, 0.050),
      new THREE.Vector2(0.043, 0.018),
    ];
    const mugBody = new THREE.Mesh(
      new THREE.LatheGeometry(mugProfile, 32),
      new THREE.MeshStandardMaterial({ color: 0xe8dcc2, roughness: 0.55, metalness: 0.0, side: THREE.DoubleSide })
    );
    mugBody.position.set(0.58, 0.885, -0.24);
    mugBody.userData.hit = 'mug';
    mugBody.userData.label = 'Current rotation';
    myDesk.add(mugBody);
    interactive.push(mugBody);
    const mugHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.008, 8, 16, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0xe8dcc2 })
    );
    mugHandle.position.set(0.64, 0.945, -0.24);
    mugHandle.rotation.y = Math.PI/2;
    mugHandle.rotation.z = Math.PI/2;
    myDesk.add(mugHandle);
    const coffee = new THREE.Mesh(
      new THREE.CircleGeometry(0.05, 24),
      new THREE.MeshLambertMaterial({ color: 0x3a2010 })
    );
    coffee.rotation.x = -Math.PI/2;
    coffee.position.set(0.58, 0.996, -0.24);
    myDesk.add(coffee);

    // Eraser
    const eraser = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.025, 0.04),
      new THREE.MeshLambertMaterial({ color: 0xf5a5a0 })
    );
    eraser.position.set(-0.35, 0.89, -0.28);
    eraser.rotation.y = -0.2;
    eraser.userData.hit = 'eraser';
    eraser.userData.label = 'Things I changed my mind about';
    myDesk.add(eraser);
    interactive.push(eraser);

    // (paper / today's assignment removed from the desk — lives as the whiteboard's kicker now)

    // ---- chair (you can see back of it) ----
    const chairSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x8b6640, roughness: 0.8, metalness: 0.0 })
    );
    chairSeat.position.set(0, 0.52, 0.5);
    chairSeat.castShadow = true;
    chairSeat.receiveShadow = true;
    scene.add(chairSeat);

    // ======================================================================
    // Classroom decorations
    // ======================================================================

    // ---- Bookshelf against the right wall, back corner ----
    const bookshelfGroup = new THREE.Group();
    bookshelfGroup.position.set(roomW/2 - 0.25, 0, -2.4);
    bookshelfGroup.rotation.y = -Math.PI / 2;
    scene.add(bookshelfGroup);
    const shelfMat = new THREE.MeshLambertMaterial({ map: woodTexture(0) });
    // side panels
    [-0.6, 0.6].forEach(x => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.0, 0.3), shelfMat);
      side.position.set(x, 1.0, 0);
      bookshelfGroup.add(side);
    });
    // back panel
    const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(1.22, 2.0, 0.02), shelfMat);
    shelfBack.position.set(0, 1.0, -0.14);
    bookshelfGroup.add(shelfBack);
    // shelves
    const shelfYs = [0.02, 0.55, 1.05, 1.55, 1.98];
    shelfYs.forEach(y => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.3), shelfMat);
      s.position.set(0, y, 0);
      bookshelfGroup.add(s);
    });
    // books on the shelves
    const bookColors = [0xb85450, 0x355070, 0x6d597a, 0xb56576, 0xe56b6f, 0xe8a87c, 0xc38d9e, 0x41b3a3, 0xd9bf77, 0x8d5524, 0x485696, 0xe7b10a];
    for (let sh = 0; sh < 4; sh++) {
      let x = -0.56;
      while (x < 0.55) {
        const w = 0.035 + Math.random() * 0.035;
        const h = 0.28 + Math.random() * 0.15;
        const tilt = Math.random() < 0.08 ? (Math.random() - 0.5) * 0.4 : 0;
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, 0.22),
          new THREE.MeshLambertMaterial({ color: bookColors[Math.floor(Math.random() * bookColors.length)] })
        );
        b.position.set(x + w/2, shelfYs[sh] + 0.015 + h/2, 0);
        b.rotation.z = tilt;
        bookshelfGroup.add(b);
        x += w + 0.005;
      }
    }
    // a leaning stack on the top shelf
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.04, 0.16),
        new THREE.MeshLambertMaterial({ color: bookColors[(i * 3) % bookColors.length] })
      );
      b.position.set(0.3, 1.6 + 0.015 + 0.02 + i * 0.045, 0.02);
      b.rotation.y = 0.1 + i * 0.05;
      bookshelfGroup.add(b);
    }

    // ---- Globe on top of the bookshelf ----
    const globeGroup = new THREE.Group();
    globeGroup.position.set(roomW/2 - 0.25, 2.02, -2.1);
    scene.add(globeGroup);
    // base
    const globeBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 0.04, 20),
      new THREE.MeshLambertMaterial({ color: 0x3a2818 })
    );
    globeBase.position.set(0, 0.02, 0);
    globeGroup.add(globeBase);
    // arc
    const globeArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.008, 8, 24, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0xd4a04a })
    );
    globeArc.position.set(0, 0.18, 0);
    globeArc.rotation.y = Math.PI / 2;
    globeGroup.add(globeArc);
    // sphere
    const globeTex = makeCanvasTexture(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#3b7ea8';
      ctx.fillRect(0, 0, w, h);
      // blob continents
      ctx.fillStyle = '#7aa35c';
      const blob = (cx, cy, rx, ry) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      blob(90, 110, 40, 55);   // africa/europe
      blob(130, 160, 30, 40);
      blob(240, 130, 60, 40);  // asia
      blob(290, 170, 25, 30);
      blob(380, 120, 40, 45);  // americas
      blob(390, 180, 20, 25);
      blob(430, 90, 25, 15);   // greenland
      blob(260, 210, 35, 18);  // australia
      // subtle lat/long lines
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      for (let y = 30; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let x = 40; x < w; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
    });
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 18),
      new THREE.MeshLambertMaterial({ map: globeTex })
    );
    globe.position.set(0, 0.17, 0);
    globe.rotation.z = 0.24; // earth's tilt
    globeGroup.add(globe);
    globe.userData.hit = 'globe';
    globe.userData.label = 'Where I\'ve worked';
    interactive.push(globe);

    // ---- Potted plant on the floor near the window ----
    function makePlant(x, z, scaleFactor = 1) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.scale.setScalar(scaleFactor);
      // pot (lathe for a nicer silhouette)
      const potProfile = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.15, 0.0),
        new THREE.Vector2(0.17, 0.02),
        new THREE.Vector2(0.18, 0.08),
        new THREE.Vector2(0.2, 0.22),
        new THREE.Vector2(0.21, 0.26),
        new THREE.Vector2(0.19, 0.27),
      ];
      const pot = new THREE.Mesh(
        new THREE.LatheGeometry(potProfile, 20),
        new THREE.MeshLambertMaterial({ color: 0xa85b3d, side: THREE.DoubleSide })
      );
      g.add(pot);
      // soil
      const soil = new THREE.Mesh(
        new THREE.CircleGeometry(0.18, 20),
        new THREE.MeshLambertMaterial({ color: 0x3a2818 })
      );
      soil.rotation.x = -Math.PI / 2;
      soil.position.y = 0.26;
      g.add(soil);
      // leaves — a handful of green cones/ellipsoids
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x5a8a3a });
      const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x6ea050 });
      for (let i = 0; i < 11; i++) {
        const ang = (i / 11) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.05, 0.4 + Math.random() * 0.2, 6),
          i % 2 ? leafMat : leafMat2
        );
        leaf.position.set(Math.cos(ang) * 0.06, 0.5, Math.sin(ang) * 0.06);
        leaf.rotation.z = Math.cos(ang) * 0.6 + (Math.random() - 0.5) * 0.3;
        leaf.rotation.x = Math.sin(ang) * 0.6 + (Math.random() - 0.5) * 0.3;
        g.add(leaf);
      }
      // a few taller stalks
      for (let i = 0; i < 4; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.08;
        const stalk = new THREE.Mesh(
          new THREE.ConeGeometry(0.03, 0.55 + Math.random() * 0.15, 6),
          leafMat
        );
        stalk.position.set(Math.cos(ang) * r, 0.6, Math.sin(ang) * r);
        stalk.rotation.z = (Math.random() - 0.5) * 0.2;
        stalk.rotation.x = (Math.random() - 0.5) * 0.2;
        g.add(stalk);
      }
      return g;
    }
    // Plants: window side (tall floor plants) + shelves + a small one on my desk
    scene.add(makePlant(-roomW/2 + 0.4, -2.6, 1.0));  // near window, front
    scene.add(makePlant(-roomW/2 + 0.4, 2.8, 0.85));  // near window, back
    scene.add(makePlant(-roomW/2 + 0.45, 0.3, 0.7));  // near window, middle (smaller)
    // Back-right corner floor plant
    scene.add(makePlant(roomW/2 - 0.45, roomD/2 - 0.8, 0.9));
    // Tiny succulent on the bookshelf top (next to the globe)
    const shelfPlant = makePlant(0, 0, 0.35);
    shelfPlant.position.set(roomW/2 - 0.25, 2.02, -1.6);
    scene.add(shelfPlant);
    // Small hanging-ish plant on top of the left nameboard frame — removed (was floating mid-air)
    // A small pot on my desk — right-back corner
    const deskPlantGroup = new THREE.Group();
    deskPlantGroup.position.set(0.5, 0.885, 0.2);
    deskPlantGroup.scale.setScalar(0.18);
    const deskPotProfile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.18, 0.0),
      new THREE.Vector2(0.2, 0.05),
      new THREE.Vector2(0.2, 0.3),
      new THREE.Vector2(0.18, 0.32),
    ];
    const deskPot = new THREE.Mesh(
      new THREE.LatheGeometry(deskPotProfile, 16),
      new THREE.MeshLambertMaterial({ color: 0xc4a48a, side: THREE.DoubleSide })
    );
    deskPlantGroup.add(deskPot);
    // succulent-ish fronds on desk plant
    const deskLeafMat = new THREE.MeshLambertMaterial({ color: 0x6ea050 });
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2;
      const blade = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.38 + Math.random()*0.12, 5),
        deskLeafMat
      );
      blade.position.set(Math.cos(ang)*0.04, 0.52, Math.sin(ang)*0.04);
      blade.rotation.z = Math.cos(ang) * 0.5;
      blade.rotation.x = Math.sin(ang) * 0.5;
      deskPlantGroup.add(blade);
    }
    myDesk.add(deskPlantGroup);

    // ---- Backpack on the floor, slumped against my desk's chair ----
    const backpackGroup = new THREE.Group();
    backpackGroup.position.set(-0.8, 0, 0.3);
    backpackGroup.rotation.y = 0.4;
    scene.add(backpackGroup);
    const bagMat = new THREE.MeshLambertMaterial({ color: 0x355070 });
    const bagAccent = new THREE.MeshLambertMaterial({ color: 0x1f3348 });
    // main body (rounded-ish via multiple boxes)
    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.22), bagMat);
    bagBody.position.set(0, 0.26, 0);
    bagBody.rotation.z = 0.06;
    backpackGroup.add(bagBody);
    // front pocket
    const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.05), bagAccent);
    bagPocket.position.set(0, 0.2, 0.135);
    bagPocket.rotation.z = 0.06;
    backpackGroup.add(bagPocket);
    // top handle
    const bagHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI),
      bagAccent
    );
    bagHandle.position.set(0, 0.52, 0);
    bagHandle.rotation.x = Math.PI / 2;
    backpackGroup.add(bagHandle);
    // straps
    [-0.12, 0.12].forEach(x => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.02), bagAccent);
      strap.position.set(x, 0.3, -0.12);
      strap.rotation.z = 0.06;
      backpackGroup.add(strap);
    });

    // ---- A pair of school pennants in the front-right corner, above the side-board ----
    // (old pole was clipping the alphabet banner; moved to the side wall / corner)
    function makePennant(origin, rotY, color, text) {
      const g = new THREE.Group();
      g.position.copy(origin);
      g.rotation.y = rotY;
      // short mounting bracket on the wall
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.06),
        new THREE.MeshLambertMaterial({ color: 0x3a2818 })
      );
      bracket.position.set(0, 0, 0.03);
      g.add(bracket);
      // pole extending out from the wall
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.7, 10),
        new THREE.MeshLambertMaterial({ color: 0x8d6b3d })
      );
      pole.rotation.x = Math.PI / 2;
      pole.position.set(0, 0, 0.38);
      g.add(pole);
      // triangular felt pennant hanging off the pole
      const pennantTex = makeCanvasTexture(512, 256, (ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, color); grad.addColorStop(1, shade(color, -0.15));
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
        // felt noise
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let i = 0; i < 800; i++) ctx.fillRect(Math.random()*w, Math.random()*h, 2, 1);
        // text
        ctx.fillStyle = '#fff8ea';
        ctx.font = 'bold 120px "Patrick Hand", cursive';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 60, h / 2 - 10);
        // stitched edge
        ctx.strokeStyle = 'rgba(255,248,234,0.5)';
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 3;
        ctx.strokeRect(12, 12, w - 24, h - 24);
        ctx.setLineDash([]);
      });
      const flagShape = new THREE.Shape();
      flagShape.moveTo(0, 0);
      flagShape.lineTo(0, 0.26);
      flagShape.lineTo(0.7, 0.13);
      flagShape.closePath();
      const pennantGeo = new THREE.ShapeGeometry(flagShape);
      // remap UVs so the canvas fills the triangle
      const uv = pennantGeo.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        const x = pennantGeo.attributes.position.getX(i);
        const y = pennantGeo.attributes.position.getY(i);
        uv.setXY(i, x / 0.7, y / 0.26);
      }
      uv.needsUpdate = true;
      const pennant = new THREE.Mesh(
        pennantGeo,
        new THREE.MeshLambertMaterial({ map: pennantTex, side: THREE.DoubleSide })
      );
      // pennant hangs from the pole, drooping slightly
      pennant.position.set(0, -0.13, 0.03);
      pennant.rotation.z = -0.08;
      g.add(pennant);
      return g;
    }
    // helper to shade a hex color
    function shade(hex, amt) {
      const c = new THREE.Color(hex);
      c.offsetHSL(0, 0, amt);
      return `#${c.getHexString()}`;
    }
    // Two UW–Madison style pennants, hung high on the front-left wall
    scene.add(makePennant(
      new THREE.Vector3(-roomW/2 + 0.05, 3.0, -2.2),
      Math.PI / 2, '#c41e3a', 'WISCONSIN'
    ));
    scene.add(makePennant(
      new THREE.Vector3(-roomW/2 + 0.05, 2.55, -2.2),
      Math.PI / 2, '#ffffff', 'BADGERS'
    ));

    // ---- Poster on the right wall ----
    function makePoster(x, y, z, rotY, title, bgColor) {
      const posterTex = makeCanvasTexture(512, 700, (ctx, w, h) => {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
        // decorative marks
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < 14; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 20, 0, Math.PI * 2);
          ctx.fill();
        }
        // big title
        ctx.fillStyle = '#fff8ea';
        ctx.font = 'bold 80px "Patrick Hand", cursive';
        ctx.textBaseline = 'top';
        const words = title.split(' ');
        let yy = 60;
        words.forEach(wd => { ctx.fillText(wd, 48, yy); yy += 78; });
        // divider
        ctx.strokeStyle = '#fff8ea';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(48, yy + 10);
        ctx.lineTo(w - 48, yy + 14);
        ctx.stroke();
        // subtitle
        ctx.font = 'italic 40px "Caveat", cursive';
        ctx.fillText('— classroom rules —', 48, yy + 30);
        // corner tape strips
        ctx.save();
        ctx.fillStyle = 'rgba(255,240,180,0.7)';
        ctx.translate(40, 30); ctx.rotate(-0.3);
        ctx.fillRect(-30, -10, 80, 22);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(255,240,180,0.7)';
        ctx.translate(w - 40, 30); ctx.rotate(0.3);
        ctx.fillRect(-50, -10, 80, 22);
        ctx.restore();
      });
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 1.0),
        new THREE.MeshLambertMaterial({ map: posterTex })
      );
      poster.position.set(x, y, z);
      poster.rotation.y = rotY;
      scene.add(poster);
    }
    makePoster(roomW/2 - 0.02, 2.1, 0.2, -Math.PI/2, 'Be Curious Ask Often', 0x2f5d8f);
    makePoster(roomW/2 - 0.02, 2.1, 1.6, -Math.PI/2, 'Show Your Work', 0xc2583a);

    // ---- Alphabet banner above the whiteboard (sized to fit the whiteboard, safely below ceiling) ----
    const bannerTex = makeCanvasTexture(2048, 180, (ctx, w, h) => {
      // string — a thin line across the top so the cards look like they hang
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(60, 35, 15, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(w, 14);
      ctx.stroke();
      const letters = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' ');
      const cellW = w / letters.length;
      const cardPad = 6;
      letters.forEach((L, i) => {
        const bgs = ['#e9a15f', '#6ba3a5', '#c26b5a', '#7b9b5a', '#b98cc2', '#e8c15a'];
        const cx = i * cellW + cellW / 2;
        const tilt = ((i % 2) ? 1 : -1) * 0.05;
        ctx.save();
        ctx.translate(cx, h / 2 + 6);
        ctx.rotate(tilt);
        // little triangle-tab at top connecting to string
        ctx.fillStyle = bgs[i % bgs.length];
        ctx.beginPath();
        ctx.moveTo(-cellW/2 + cardPad, -h/2 + 14);
        ctx.lineTo( cellW/2 - cardPad, -h/2 + 14);
        ctx.lineTo( cellW/2 - cardPad,  h/2 - 14);
        ctx.lineTo(-cellW/2 + cardPad,  h/2 - 14);
        ctx.closePath();
        ctx.fill();
        // letter
        ctx.fillStyle = '#fff8ea';
        ctx.font = 'bold 86px "Patrick Hand", cursive';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(L, 0, 0);
        ctx.restore();
      });
      ctx.textAlign = 'left';
    });
    // Whiteboard frame spans 4.8m; match its width exactly so the banner doesn't spill.
    // Ceiling is at y=3.5; keep entire banner (height 0.28) safely under it.
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 0.28),
      new THREE.MeshLambertMaterial({ map: bannerTex, transparent: true, alphaTest: 0.02 })
    );
    banner.position.set(0, 3.3, -roomD/2 + 0.09);
    scene.add(banner);

    // ---- Coat hooks on the back wall ----
    const hookMat = new THREE.MeshLambertMaterial({ color: 0x3a2818 });
    for (let i = 0; i < 6; i++) {
      const hook = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8),
        hookMat
      );
      hook.rotation.x = Math.PI / 2;
      hook.position.set(-2.5 + i * 1.0, 2.4, roomD/2 - 0.1);
      scene.add(hook);
      // ball at end
      const hookBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 6),
        hookMat
      );
      hookBall.position.set(-2.5 + i * 1.0, 2.4, roomD/2 - 0.18);
      scene.add(hookBall);
    }
    // a jacket hung on one hook
    const jacket = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x5a6b82 })
    );
    jacket.position.set(0.5, 2.0, roomD/2 - 0.16);
    scene.add(jacket);

    // ---- window on the left wall ----
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.8, 2.2),
      new THREE.MeshLambertMaterial({ map: woodTexture(0) })
    );
    windowFrame.position.set(-roomW/2 + 0.05, 1.9, 1.2);
    scene.add(windowFrame);

    const windowTex = makeCanvasTexture(512, 512, (ctx, w, h) => {
      drawWindowScene(ctx, w, h, 'afternoon');
    });
    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.6),
      new THREE.MeshBasicMaterial({ map: windowTex })
    );
    windowGlass.position.set(-roomW/2 + 0.12, 1.9, 1.2);
    windowGlass.rotation.y = Math.PI/2;
    windowGlass.userData.hit = 'window';
    windowGlass.userData.label = 'Out the window';
    windowGlass.userData.isWindow = true;
    scene.add(windowGlass);
    interactive.push(windowGlass);

    // window mullions (cross)
    const mullionMat = new THREE.MeshLambertMaterial({ map: woodTexture(0) });
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.6, 0.04), mullionMat);
    mullionV.position.set(-roomW/2 + 0.1, 1.9, 1.2);
    scene.add(mullionV);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 2.0), mullionMat);
    mullionH.position.set(-roomW/2 + 0.1, 1.9, 1.2);
    scene.add(mullionH);

    // ---- clock on back wall (behind you when you turn around) ----
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 2.6, roomD/2 - 0.05);
    clockGroup.rotation.y = Math.PI;

    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 32),
      new THREE.MeshLambertMaterial({ color: 0xf8f4e8 })
    );
    clockGroup.add(clockFace);
    const clockRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.02, 8, 32),
      new THREE.MeshLambertMaterial({ color: 0x1a1510 })
    );
    clockGroup.add(clockRim);
    // tick marks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.03, 0.002),
        new THREE.MeshLambertMaterial({ color: 0x1a1510 })
      );
      tick.position.set(Math.sin(a) * 0.26, Math.cos(a) * 0.26, 0.001);
      tick.rotation.z = -a;
      clockGroup.add(tick);
    }
    // hands
    const hourHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.14, 0.004),
      new THREE.MeshLambertMaterial({ color: 0x1a1510 })
    );
    const minHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.2, 0.004),
      new THREE.MeshLambertMaterial({ color: 0x1a1510 })
    );
    const secHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.22, 0.004),
      new THREE.MeshLambertMaterial({ color: 0xc0392b })
    );
    // pivot at center — use groups so we can rotate
    const hourPivot = new THREE.Group(); hourPivot.add(hourHand); hourHand.position.y = 0.06;
    const minPivot = new THREE.Group(); minPivot.add(minHand); minHand.position.y = 0.09;
    const secPivot = new THREE.Group(); secPivot.add(secHand); secHand.position.y = 0.1;
    hourPivot.position.z = 0.005;
    minPivot.position.z = 0.007;
    secPivot.position.z = 0.009;
    clockGroup.add(hourPivot, minPivot, secPivot);
    clockFace.userData.hit = 'clock';
    clockFace.userData.label = 'The clock';
    interactive.push(clockFace);
    scene.add(clockGroup);

    // ---- bulletin board on back wall ----
    const bulletinFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 2.0, 0.08),
      new THREE.MeshLambertMaterial({ map: woodTexture(0) })
    );
    bulletinFrame.position.set(-2.2, 1.5, roomD/2 - 0.04);
    bulletinFrame.rotation.y = Math.PI;
    scene.add(bulletinFrame);
    const bulletin = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.85),
      new THREE.MeshLambertMaterial({ map: bulletinTexture(opts.accentHex) })
    );
    bulletin.position.set(-2.2, 1.5, roomD/2 - 0.08);
    bulletin.rotation.y = Math.PI;
    bulletin.userData.hit = 'bulletin';
    bulletin.userData.label = 'Press & things';
    scene.add(bulletin);
    interactive.push(bulletin);

    // A picture frame on right side back wall
    const artFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.9, 0.06),
      new THREE.MeshLambertMaterial({ map: woodTexture(0) })
    );
    artFrame.position.set(2.4, 1.7, roomD/2 - 0.03);
    artFrame.rotation.y = Math.PI;
    scene.add(artFrame);
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 0.78),
      new THREE.MeshLambertMaterial({
        map: makeCanvasTexture(512, 384, (ctx, w, h) => {
          // abstract warm landscape
          const g = ctx.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, '#f8c77a'); g.addColorStop(0.6, '#e8906a'); g.addColorStop(1, '#8b4a3a');
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#3a2418';
          ctx.beginPath();
          ctx.moveTo(0, h*0.7);
          ctx.lineTo(w*0.3, h*0.5); ctx.lineTo(w*0.55, h*0.65);
          ctx.lineTo(w*0.8, h*0.45); ctx.lineTo(w, h*0.6); ctx.lineTo(w, h); ctx.lineTo(0, h);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#fff6d8';
          ctx.beginPath(); ctx.arc(w*0.72, h*0.3, 30, 0, Math.PI*2); ctx.fill();
        })
      })
    );
    art.position.set(2.4, 1.7, roomD/2 - 0.07);
    art.rotation.y = Math.PI;
    scene.add(art);

    // ---- ceiling fluorescent stand-ins (warm) ----
    for (let i = -1; i <= 1; i++) {
      const lightFix = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.06, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xfff8e8 })
      );
      lightFix.position.set(i * 2.5, roomH - 0.05, -1 + i * 0.5);
      scene.add(lightFix);

      const pl = new THREE.PointLight(0xfff8e8, 0.55, 7, 2);
      pl.position.set(i * 2.5, roomH - 0.12, -1 + i * 0.5);
      scene.add(pl);
    }

    // ---- extra desks to either side to make it feel like a classroom ----
    function otherDesk(x, z) {
      const g = new THREE.Group();
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.06, 0.6),
        new THREE.MeshLambertMaterial({ map: woodTexture(1) })
      );
      top.position.y = 0.78;
      g.add(top);
      [[-0.55, 0.39, -0.25], [0.55, 0.39, -0.25], [-0.55, 0.39, 0.25], [0.55, 0.39, 0.25]].forEach(p => {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.78, 0.04), new THREE.MeshLambertMaterial({ color: 0x4a2e14 }));
        l.position.set(p[0], p[1], p[2]); g.add(l);
      });
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.04, 0.45),
        new THREE.MeshLambertMaterial({ color: 0x7a5a3a })
      );
      seat.position.set(0, 0.42, 0.6);
      g.add(seat);
      g.position.set(x, 0, z);
      return g;
    }
    // other student desks — flanking mine and one row behind, leaving the front clear
    [[-2.4, 0.0], [2.4, 0.0], [-2.4, 1.6], [2.4, 1.6], [0, 2.4]].forEach(([x,z]) => scene.add(otherDesk(x, z)));

    // ---- dust motes (cheap sprites) ----
    const dustGroup = new THREE.Group();
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 80;
    const dustPos = new Float32Array(dustCount * 3);
    const dustSeeds = [];
    for (let i = 0; i < dustCount; i++) {
      dustPos[i*3] = (Math.random() - 0.5) * 6;
      dustPos[i*3+1] = Math.random() * 2.5 + 0.5;
      dustPos[i*3+2] = (Math.random() - 0.5) * 6;
      dustSeeds.push(Math.random() * 10);
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfff0c0, size: 0.015, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dustGroup.add(dust);
    scene.add(dustGroup);

    // ---- outline highlight: pulsing backside-glow on hover ----
    let hoverGlow = null;
    let hoverPulseStart = 0;
    function setHover(obj) {
      if (hoverGlow) {
        scene.remove(hoverGlow);
        hoverGlow.geometry.dispose();
        hoverGlow.material.dispose();
        hoverGlow = null;
      }
      if (!obj) return;
      const geo = obj.geometry.clone();
      const mat = new THREE.MeshBasicMaterial({
        color: opts.accentHex,
        transparent: true, opacity: 0.45,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      hoverGlow = new THREE.Mesh(geo, mat);
      // resolve world transform in case obj is nested inside a group (my desk items are!)
      obj.updateWorldMatrix(true, false);
      const wp = new THREE.Vector3();
      const wq = new THREE.Quaternion();
      const ws = new THREE.Vector3();
      obj.matrixWorld.decompose(wp, wq, ws);
      hoverGlow.position.copy(wp);
      hoverGlow.quaternion.copy(wq);
      hoverGlow.scale.copy(ws).multiplyScalar(1.06);
      hoverGlow.renderOrder = 999;
      scene.add(hoverGlow);
      hoverPulseStart = performance.now();
    }

    // ---- animation loop state ----
    const state = {
      yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0,
      damping: 0.1,
      sensitivity: opts.sensitivity || 0.8,
      swayAmp: opts.sway || 0.35,
      dust: (opts.dust !== 'off'),
      clockHands: { hour: hourPivot, min: minPivot, sec: secPivot },
      windowTex, windowMat: windowGlass.material,
      wbTex, leftBoardTex, rightBoardTex, bulletinMat: bulletin.material,
      laptopScreenMat: laptopScreen.material,
      paperMat: null,
      textbookMats: tbCover.material,
      rayMat, ambient, key, fill, hemi, scene,
      interactive,
      setHover,
      accentHex: opts.accentHex,
    };

    // resize
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    window.addEventListener('resize', onResize);

    let t0 = performance.now();
    function frame(tNow) {
      const dt = Math.min(0.05, (tNow - t0) / 1000);
      t0 = tNow;
      // ease yaw/pitch toward target
      state.yaw += (state.targetYaw - state.yaw) * state.damping;
      state.pitch += (state.targetPitch - state.pitch) * state.damping;

      // subtle head sway
      const sway = Math.sin(tNow * 0.0008) * 0.008 * state.swayAmp;
      const swayX = Math.cos(tNow * 0.0011) * 0.006 * state.swayAmp;
      camera.rotation.y = state.yaw + sway;
      camera.rotation.x = state.pitch + swayX;

      // dust motion
      if (state.dust) {
        const pos = dust.geometry.attributes.position.array;
        for (let i = 0; i < dustCount; i++) {
          pos[i*3+1] += Math.sin(tNow * 0.0005 + dustSeeds[i]) * 0.0005;
          pos[i*3] += Math.cos(tNow * 0.0003 + dustSeeds[i]) * 0.0004;
          if (pos[i*3+1] > 3) pos[i*3+1] = 0.5;
          if (pos[i*3+1] < 0.5) pos[i*3+1] = 3;
        }
        dust.geometry.attributes.position.needsUpdate = true;
      }
      dust.visible = state.dust;

      // clock hands sync to real time
      const now = new Date();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      hourPivot.rotation.z = -(h / 12) * Math.PI * 2;
      minPivot.rotation.z = -(m / 60) * Math.PI * 2;
      secPivot.rotation.z = -(s / 60) * Math.PI * 2;

      // animate hover glow — gentle pulse
      if (hoverGlow) {
        const pulse = 0.35 + Math.sin((tNow - hoverPulseStart) * 0.006) * 0.18;
        hoverGlow.material.opacity = pulse;
      }

      renderer.render(scene, camera);
      state._raf = requestAnimationFrame(frame);
    }
    state._raf = requestAnimationFrame(frame);

    state.camera = camera;
    state.renderer = renderer;
    return state;
  }

  // ---- window scene ----
  function drawWindowScene(ctx, W, H, mode) {
    // modes: morning, afternoon, dusk, night
    let skyTop, skyBot, sunColor, sunY, groundTone;
    if (mode === 'morning') {
      skyTop = '#ffd8a8'; skyBot = '#fff4d8'; sunColor = '#ffeeaa'; sunY = H*0.55; groundTone = '#c89668';
    } else if (mode === 'afternoon') {
      skyTop = '#f8c56a'; skyBot = '#fbe4a8'; sunColor = '#fff2b8'; sunY = H*0.4; groundTone = '#a87a55';
    } else if (mode === 'dusk') {
      skyTop = '#4a3668'; skyBot = '#e8805a'; sunColor = '#ff8a4a'; sunY = H*0.7; groundTone = '#5a3a4a';
    } else { // night
      skyTop = '#0d1028'; skyBot = '#1a1a3a'; sunColor = '#ffeeaa'; sunY = -100; groundTone = '#2a2035';
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, skyTop); g.addColorStop(1, skyBot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    if (mode === 'night') {
      // stars
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(255,255,230,${0.3 + Math.random()*0.6})`;
        ctx.fillRect(Math.random()*W, Math.random()*H*0.7, 1.5, 1.5);
      }
      // moon
      ctx.fillStyle = '#f8f0d0';
      ctx.beginPath(); ctx.arc(W*0.7, H*0.3, 28, 0, Math.PI*2); ctx.fill();
    } else {
      // sun glow
      const rg = ctx.createRadialGradient(W*0.3, sunY, 10, W*0.3, sunY, 180);
      rg.addColorStop(0, sunColor); rg.addColorStop(0.3, sunColor.replace(')', ',0.4)').replace('rgb','rgba'));
      rg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = sunColor;
      ctx.beginPath(); ctx.arc(W*0.3, sunY, 38, 0, Math.PI*2); ctx.fill();
    }

    // tree silhouettes
    ctx.fillStyle = mode === 'night' ? '#050308' : '#2a1a0f';
    ctx.fillRect(0, H*0.72, W, H*0.28);
    for (let i = 0; i < 6; i++) {
      const tx = W*0.15 + i*W*0.14 + (Math.random()-0.5)*30;
      const tw = 40 + Math.random()*50;
      const th = 80 + Math.random()*60;
      ctx.beginPath();
      ctx.ellipse(tx, H*0.72 - th*0.3, tw, th*0.6, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillRect(tx - 4, H*0.72 - 20, 8, 30);
    }
    // building silhouette
    ctx.fillRect(W*0.6, H*0.55, W*0.35, H*0.2);
    // windows in building
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = mode === 'night'
          ? (Math.random() > 0.4 ? 'rgba(255,220,120,0.8)' : 'rgba(60,40,30,0.4)')
          : 'rgba(255,255,255,0.15)';
        ctx.fillRect(W*0.62 + i*38, H*0.58 + j*30, 14, 18);
      }
    }
  }

  // expose helper
  return {
    init,
    updateWindow(state, mode) {
      const c = state.windowTex.source.data;
      const ctx = c.getContext('2d');
      drawWindowScene(ctx, c.width, c.height, mode);
      state.windowTex.needsUpdate = true;

      // also adjust lighting
      const presets = {
        morning:   { amb: 0xfff4dc, amb_i: 0.42, key: 0xffc890, key_i: 1.05, ray: 0.08, bg: '#2b2d1f' },
        afternoon: { amb: 0xfff6e0, amb_i: 0.45, key: 0xffd8a0, key_i: 1.2,  ray: 0.10, bg: '#2a2d1d' },
        dusk:      { amb: 0xe8b098, amb_i: 0.28, key: 0xff8a60, key_i: 0.9,  ray: 0.12, bg: '#231a22' },
        night:     { amb: 0x6478a8, amb_i: 0.15, key: 0x8896b8, key_i: 0.35, ray: 0.02, bg: '#0e121e' },
      };
      const p = presets[mode] || presets.afternoon;
      state.ambient.color.set(p.amb); state.ambient.intensity = p.amb_i;
      state.key.color.set(p.key); state.key.intensity = p.key_i;
      state.rayMat.opacity = p.ray;
      state.scene.background.set(p.bg);
      state.scene.fog.color.set(p.bg);
    },
    updateAccent(state, accentHex) {
      state.accentHex = accentHex;
      // rebuild textures that reference the accent
      const newWB = whiteboardTexture(accentHex);
      state.wbTex.image = newWB.image; state.wbTex.needsUpdate = true;
      // simpler: just regen and assign
      const wb = state.interactive.find(o => o.userData.hit === 'whiteboard');
      if (wb) wb.material.map = whiteboardTexture(accentHex);
      const lb = state.interactive.find(o => o.userData.hit === 'leftboard');
      if (lb) lb.material.map = nameBoardTexture(accentHex);
      const rb = state.interactive.find(o => o.userData.hit === 'rightboard');
      if (rb) rb.material.map = contactBoardTexture(accentHex);
      const bl = state.interactive.find(o => o.userData.hit === 'bulletin');
      if (bl) bl.material.map = bulletinTexture(accentHex);
      const lp = state.interactive.find(o => o.userData.hit === 'laptop');
      if (lp) lp.material.map = laptopScreenTexture(accentHex);
      const pp = state.interactive.find(o => o.userData.hit === 'assignment');
      if (pp) pp.material.map = paperTexture(accentHex);
    },
  };
})();
