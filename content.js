// Content for all the overlays — Mason's (Bingyixuan Dong) CV-classroom.

window.CONTENT = {
  profile: {
    name: 'Bingyixuan (Mason) Dong',
    role: 'CS & Data Science undergrad at UW–Madison · researching AI for education',
    location: 'Madison, WI',
    now: 'CS Honors thesis on supporting CS education in the era of AI · Advisor: Prof. Bilge Mutlu',
  },

  whiteboard: {
    kicker: 'The whiteboard · Research & projects',
    title: "Things I've been working on",
    sub: 'A snapshot of my current research. Ordered by how close each is to submission.',
    items: [
      { num: '01', title: 'Tools in CS Education — a systematic review',
        meta: 'MadCSE Lab · 2025–present',
        desc: 'Systematic analysis of 4,500+ research papers across NLP, HCI, and learning sciences to map how LLMs are being used in programming education. Synthesizing findings into a taxonomy — targeting SIGCSE 2026.',
        link: 'Read the outline →' },
      { num: '02', title: 'LLM Course Analysis Agent',
        meta: 'MadCSE Lab · 2025–present',
        desc: 'A Python + GPT-4 RAG pipeline that ingests lecture transcripts and assignments, then audits each for learning-objective coverage. Flags over-covered, under-covered, and missing objectives across a whole course.',
        link: 'Peek at the pipeline →' },
      { num: '03', title: 'Learning Exploration Robot',
        meta: 'People & Robots Lab · 2025',
        desc: 'Field studies of child–robot interactions in the home. Ran sessions across families, then coded transcripts to identify linguistic cues and interaction patterns tied to sustained, curiosity-driven engagement.',
        link: 'What we saw →' },
      { num: '04', title: 'Robot Plan B',
        meta: 'People & Robots Lab · 2025',
        desc: 'A full-stack React + Flask interface that lets non-expert operators author robot "fallback" sequences with drag-and-drop block programming. Real-time communication layer handles manipulation + navigation commands.',
        link: 'Walkthrough →' },
      { num: '05', title: 'Immersive Geometric Reasoning (VR)',
        meta: 'MAGIC Lab · 2025–present',
        desc: 'Designing VR activities + assessments to study how physical body movement affects geometric reasoning. Running study sessions and measuring learning outcomes and engagement.',
        link: 'Study design →' },
    ],
  },

  leftboard: {
    kicker: 'The nametag',
    title: "Hi, I'm Mason.",
    sub: 'Bingyixuan Dong — CS & Data Science at UW–Madison (honors), expected May 2026.',
    body: [
      'I work at the intersection of AI and education — building tools that are safe, personalized, and cognitively engaging. My honors thesis, advised by Prof. Bilge Mutlu, asks what computer-science education should become now that large language models are in every classroom.',
      'I\'ve been lucky to research across four labs this year: the MadCSE Lab (CS education + LLMs), the People & Robots Lab (child–robot interaction), the MAGIC Lab (VR + embodied mathematical cognition), and the ICE Lab (LLM vs. human tutoring).',
      'Outside the lab: I peer-mentor CS639 (Data Management for Data Science) — office hours, ARIMA/LightGBM/XGBoost labs, and the occasional real-world dataset. Before Madison I interned two summers at CrissCross Express, building a barcode-driven package-tracking system across China–US warehouses.',
    ],
  },

  rightboard: {
    kicker: 'Find me',
    title: 'Get in touch',
    sub: "Email is best — I usually reply within a day or two.",
    contacts: [
      { label: 'Email',   val: 'bingyxdong@gmail.com',       href: 'mailto:bingyxdong@gmail.com' },
      { label: 'GitHub',  val: 'github.com/bingdong45',         href: 'https://github.com/bingdong45' },
      { label: 'LinkedIn',val: 'linkedin.com/in/bingyixuan-dong — coming soon', href: '#' },
      { label: 'Website', val: 'bingyixuan.com',              href: 'https://bingyixuan.com' },
    ],
    now: 'Currently looking for: PhD programs in HCI / AI-in-education starting Fall 2026, and research collaborations in LLM-for-learning.',
  },

  notebook: {
    kicker: 'The diary',
    title: 'Field notes',
    sub: "A diary of things I'm learning while reading for the review. Public entries coming soon.",
    entries: [
      { date: 'Coming soon', title: 'Notes from 4,500 papers', excerpt: 'Patterns I keep seeing as I work through the CS-education + LLM literature. Will be posted once the taxonomy is stable.' },
      { date: 'Coming soon', title: 'What children ask a robot', excerpt: 'Quiet observations from the Learning Exploration Robot study — what "curiosity-driven" actually sounds like out loud.' },
      { date: 'Coming soon', title: 'Prompt engineering as curriculum design', excerpt: 'Lessons from building the course-audit agent — prompts are syllabi in miniature.' },
    ],
  },

  textbook: {
    kicker: 'The textbook',
    title: 'Publications & talks',
    sub: 'First submissions are in preparation. Target venues listed below; full citations once accepted.',
    pubs: [
      { date: '2026 (target)', title: 'A taxonomy of LLM tools in CS education', venue: 'SIGCSE 2026 · in preparation',   link: 'Abstract coming →' },
      { date: '—',             title: 'Course-audit agents for learning-objective coverage', venue: 'Working paper', link: 'Coming soon' },
      { date: '—',             title: 'Questioning patterns: LLM vs. human instruction',     venue: 'ICE Lab · in progress', link: 'Coming soon' },
    ],
  },

  laptop: {
    kicker: 'On the laptop · live demo',
    title: 'A prototype — coming soon',
    sub: 'I\'m planning to embed a small working demo of the course-audit agent here. For now, this space is reserved.',
    demoCaption: 'Placeholder. Real prototype going here once it\'s ready for the public.',
  },

  pencil: {
    kicker: 'The pencil',
    title: 'A fun fact',
    sub: 'Coming soon — I\'ll add one once I pick a good one.',
    body: [
      'In the meantime: I was on my housing advisory board, representing 800+ residents of Dejope Hall. I learned more about meeting facilitation there than anywhere else.',
    ],
  },

  mug: {
    kicker: 'The coffee mug',
    title: 'Currently reading / watching / working on',
    sub: 'A short list that updates whenever I remember.',
    body: [
      'Reading: papers for the CS-education review — currently on the HCI + pedagogy slice.',
      'Building: the RAG pipeline for the course-audit agent, and the React interface for the LLM tutoring study.',
      'Thinking about: how to measure "cognitive engagement" in VR geometry tasks without breaking the immersion.',
    ],
  },

  eraser: {
    kicker: 'The eraser',
    title: 'Things I changed my mind about',
    sub: 'A running list — coming soon as I collect good ones.',
    body: [
      'Placeholder. If you have one I should steal, email me.',
    ],
  },

  assignment: {
    kicker: "Today's assignment",
    title: 'Honors thesis',
    sub: '"Toward Supporting Computer Science Education in the Era of Artificial Intelligence" · Advisor: Prof. Bilge Mutlu.',
    body: [
      'The thesis asks how CS education needs to change now that students have LLMs in their pocket — and what instructors need to teach, assess, and mentor with confidence in that world.',
      'Draft in progress; defending spring 2026.',
    ],
  },

  bulletin: {
    kicker: 'The bulletin board',
    title: 'Honors & teaching',
    sub: 'Pinned in rough chronological order.',
    items: [
      { kind: 'Honor',   title: "UW–Madison Dean's List Award",                             meta: '2024' },
      { kind: 'Honor',   title: 'President Silver Volunteer Service Award',                 meta: '2022' },
      { kind: 'Teach',   title: 'Peer Mentor · CS639 Data Management for Data Science',     meta: 'Spring 2024 & Spring 2025' },
      { kind: 'Service', title: 'Advisory Board · UW Housing (Dejope Hall, 800+ residents)', meta: '2023–2024' },
      { kind: 'Intern',  title: 'Software Engineering Intern · CrissCross Express (LA)',    meta: 'Summer 2023 & 2024' },
    ],
  },

  window: {
    kicker: 'Out the window',
    title: 'Weather & time',
    sub: 'Looking out onto a Madison afternoon.',
    body: [
      'The window shows a time-of-day that matches the current hour wherever you are. The clock on the back wall is synced to your browser.',
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
      'Grew up in mainland China; currently based in Madison, WI for undergrad.',
      'Two summers at CrissCross Express in Los Angeles, building software across the China–US logistics pipeline.',
    ],
  },
};
