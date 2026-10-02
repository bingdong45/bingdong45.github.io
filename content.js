// Content for all the overlays — Mason's (Bingyixuan Dong) CV-classroom.
// Kept deliberately light: names and titles, no descriptions. See EDITING.md for a field-by-field guide.

window.CONTENT = {
  profile: {
    name: 'Bingyixuan (Mason) Dong',
    role: 'Master\'s student in Computer Science at Cornell · interested in how people use, rely on, and trust LLMs',
    location: 'Ithaca, NY',
  },

  // ---- the big chalkboard: research ----
  // Names only, on purpose: each entry says the project exists and where — no descriptions.
  //   title — the project name.   lab / when — shown on the chalkboard and in the panel.   pi — shown in the panel.
  //   outcome — optional one-line result (e.g. a paper).   href + link — optional real link (omit href and none is shown).
  // Clicking the chalkboard walks you up to it; clicking again (or "Research" in the bottom bar) opens the panel.
  whiteboard: {
    kicker: 'The chalkboard · Research',
    title: 'What I\'ve worked on',
    sub: 'Labs and projects, most recent first.',
    items: [
      { num: '01', title: 'Patterns in Student–LLM Conversations',
        lab: 'LearnLab, Carnegie Mellon', pi: 'Prof. Ken Koedinger', when: 'Summer 2026' },
      { num: '02', title: 'AI Tutor for Jupyter Notebooks',
        lab: 'MadCSE Lab, UW–Madison', pi: 'Prof. Meenakshi Syamkumar', when: 'Aug 2025 – Jun 2026',
        outcome: 'Full paper, SIGCSE TS 2027 (to appear)' },
      { num: '03', title: 'VisualCS — honors thesis',
        lab: 'Honors thesis, UW–Madison', pi: 'Prof. Bilge Mutlu', when: 'Sep 2025 – May 2026' },
      { num: '04', title: 'Immersive Geometric Reasoning (VR)',
        lab: 'MAGIC Lab, UW–Madison', pi: 'Prof. Mitchell J. Nathan', when: 'Oct 2025 – May 2026' },
      { num: '05', title: 'LLM Tools in CS Education — a review',
        lab: 'MadCSE Lab, UW–Madison', pi: 'Prof. Meenakshi Syamkumar', when: 'Sep 2025 – May 2026' },
      { num: '06', title: 'LLM Course Analysis Agent',
        lab: 'MadCSE Lab, UW–Madison', pi: 'Prof. Meenakshi Syamkumar', when: 'Sep 2025 – May 2026' },
      { num: '07', title: 'Learning Exploration Robot',
        lab: 'People and Robots Lab, UW–Madison', pi: 'Prof. Bilge Mutlu', when: 'Jul – Aug 2025' },
      { num: '08', title: 'RobotPlan B',
        lab: 'People and Robots Lab, UW–Madison', pi: 'Prof. Bilge Mutlu', when: 'May – Aug 2025' },
    ],
  },

  // ---- the left board: about ----
  leftboard: {
    kicker: 'The nametag',
    title: "Hi, I'm Mason.",
    sub: 'Bingyixuan Dong — master\'s student in Computer Science at Cornell.',
    // the three chalk lines + tags painted on the 3D board itself
    board: {
      line1: 'CS master\'s · Cornell',
      line2: 'How people use & trust LLMs',
      tags: ['LLMs', 'Trust', 'Learning', 'HCI'],
    },
    body: [
      'I\'m a master\'s student in Computer Science at Cornell, working with Prof. René F. Kizilcec. I\'m interested in how people use, rely on, and come to trust large language models.',
      'Previously I was at UW–Madison, where I worked with Prof. Bilge Mutlu.',
    ],
    education: [
      { school: 'Cornell University', where: 'Ithaca, NY', when: 'Expected May 2027',
        degree: 'Master of Engineering in Computer Science' },
      { school: 'University of Wisconsin–Madison', where: 'Madison, WI', when: 'May 2026',
        degree: 'B.S. in Computer Sciences (Honors) and Data Science',
        notes: 'Certificates in Educational Policy Studies and in Education and Educational Services.' },
    ],
  },

  // ---- the ribbons on the right: contact ----
  rightboard: {
    kicker: 'Find me',
    title: 'Get in touch',
    sub: 'Email is best.',
    contacts: [
      { label: 'Email',    val: 'bingyxdong@gmail.com',  href: 'mailto:bingyxdong@gmail.com', icon: 'email' },
      { label: 'GitHub',   val: 'github.com/bingdong45', href: 'https://github.com/bingdong45', icon: 'github' },
      { label: 'LinkedIn', val: 'Bingyixuan Dong',       href: 'https://www.linkedin.com/in/bingyixuan-dong-866819302/', icon: 'linkedin' },
    ],
    now: 'My CV is available on request — just email me.',
  },

  // ---- the textbook: publications ----
  textbook: {
    kicker: 'The textbook',
    title: 'Publications & talks',
    sub: 'Peer-reviewed papers first, then talks.',
    pubs: [
      { tag: 'C1', year: '2027',
        authors: 'Yiyin Shen, <strong>Bingyixuan Dong</strong>, Louis Oliphant, Matthew Berland, Meenakshi Syamkumar, and Andrea C. Arpaci-Dusseau.',
        title: 'What Do Students Ask LLM Programming Assistants For? A Large-Scale Problem-Level Analysis of Student Interactions.',
        venue: 'Proceedings of the 58th ACM Technical Symposium on Computer Science Education (SIGCSE TS 2027). Full paper, to appear.' },
      { tag: 'T1', year: '2026',
        authors: '<strong>Bingyixuan Dong</strong>. Advisor: Bilge Mutlu.',
        title: 'VisualCS: Enhancing Visualization in Computer Science Education Through AI-Powered Visual Generation.',
        venue: 'Senior Honors Thesis Symposium, University of Wisconsin–Madison, April 24, 2026.' },
    ],
  },

  // ---- the sheet on the teacher's desk: honors thesis ----
  assignment: {
    kicker: 'Turned in · Honors thesis',
    title: 'VisualCS',
    sub: 'Enhancing Visualization in Computer Science Education With AI-Powered Visual Generation · Advisor: Prof. Bilge Mutlu · UW–Madison, 2026.',
    // handwritten lines on the 3D sheet of paper (keep each line short)
    paper: [
      'Honors thesis:',
      '',
      '"VisualCS: Enhancing',
      'Visualization in CS',
      'Education With AI"',
      '',
      'advisor: Prof. Bilge Mutlu',
      'UW–Madison, May 2026',
      '',
      '— Mason',
    ],
    body: [],
  },

  // ---- the side desk: personal projects (the rabbit + the robot) ----
  maker: {
    kicker: 'The side desk · personal projects',
    title: 'Things I build for fun',
    sub: 'Two side projects, both in progress.',
    rabbit: {
      title: 'The AI rabbit',
      status: 'In progress',
      desc: 'A rabbit with an AI built into it. More details soon — for now, this one just hops around the desk.',
    },
    robot: {
      title: 'Rock-paper-scissors robot',
      status: 'In progress',
      desc: 'A small robot that plays rock-paper-scissors with you. The real one is still being built; this stand-in has googly eyes and a bad habit. Try it:',
      cheatNote: '“Yes, I will always win, because I wait for your move.”',
    },
  },

  // ---- experience (no object in the room — opened from the bottom bar) ----
  bulletin: {
    kicker: 'The record',
    title: 'Experience & honors',
    sub: 'Teaching, industry, service, and honors.',
    items: [
      { kind: 'Teaching', title: 'Peer Mentor, CS 639: Data Management for Data Science',
        org: 'UW–Madison, Department of Computer Sciences', meta: 'Spring 2024 & Spring 2025' },
      { kind: 'Industry', title: 'Software Engineering Intern',
        org: 'CrissCross Express, Los Angeles', meta: 'Summers 2023 & 2024' },
      { kind: 'Service', title: 'Advisory Board Member',
        org: 'UW–Madison University Housing', meta: 'Oct 2023 – May 2024' },
      { kind: 'Honor', title: 'Dean\'s List', org: 'University of Wisconsin–Madison', meta: '2024' },
      { kind: 'Honor', title: 'President\'s Silver Volunteer Service Award', org: '', meta: '2022' },
    ],
  },

  // ---- the bookshelf: favorite books ----
  // Add a book as { title: '…', author: '…', note: 'one line on why (optional)' }.
  // While the list is empty the panel shows `empty` instead.
  bookshelf: {
    kicker: 'The bookshelf',
    title: 'Favorite books',
    sub: 'The ones I keep coming back to.',
    books: [
    ],
    empty: 'Still deciding which ones make the shelf. Check back soon.',
  },

  // ---- small objects ----
  notebook: {
    kicker: 'The diary',
    title: 'Field notes',
    sub: "Short notes on things I'm learning. Nothing public yet.",
    entries: [
      { date: 'Coming soon', title: 'Nothing published yet' },
    ],
  },

  laptop: {
    kicker: 'On the laptop · demos',
    title: 'Things you can try',
    sub: 'Working prototypes that run in the browser.',
    demos: [
      { title: 'MathVisual', meta: 'AI-generated math animations',
        href: 'mathvisual/', link: 'Open the demo →' },
    ],
  },

  pencil: {
    kicker: 'The pencil',
    title: 'A fun fact',
    sub: 'One for now.',
    body: [
      'I sat on the UW–Madison housing advisory board, representing a residence hall of 800+ residents. I learned more about running a meeting there than anywhere else.',
    ],
  },

  mug: {
    kicker: 'The coffee mug',
    title: 'Currently',
    sub: 'What the coffee is fueling.',
    body: [
      '<strong>Studying:</strong> for my master\'s in Computer Science at Cornell.',
      '<strong>On the side:</strong> an AI rabbit and a rock-paper-scissors robot — look to your left.',
    ],
  },

  eraser: {
    kicker: 'The eraser',
    title: 'Things I changed my mind about',
    sub: 'A running list — coming soon as I collect good ones.',
    body: [
      'Nothing here yet. If you have one I should steal, email me.',
    ],
  },

  window: {
    kicker: 'Out the window',
    title: 'Weather & time',
    sub: 'The view follows your clock.',
    body: [
      'The window shows a time of day that matches the current hour wherever you are. The clock on the wall is synced to your browser.',
      'If it\'s after dark for you, you\'ll see the campus lights come on.',
    ],
  },

  clock: {
    kicker: 'The clock',
    title: 'Real time',
    sub: 'The hands on the classroom clock are your current local time.',
    body: ['You are not late. You are not early. You are right on time.'],
  },

  globe: {
    kicker: 'The globe',
    title: "Where I've been",
    sub: 'A short geographic story.',
    body: [
      'Grew up in mainland China. Now based in Ithaca, NY for my master\'s at Cornell, after undergrad in Madison, WI.',
      'A summer in Pittsburgh at Carnegie Mellon, and two summers in Los Angeles.',
    ],
  },
};
