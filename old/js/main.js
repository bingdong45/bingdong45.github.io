// ── Scroll reveal ────────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ── Navbar: scrolled shadow ───────────────────────────────────
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 10);
  updateActiveLink();
}, { passive: true });

// ── Active nav link on scroll ─────────────────────────────────
// Section ids in page order.
const sections = ["hero", "publications", "projects", "background", "contact"];

// Sections without their own nav item highlight a neighbouring one.
const navAlias = {};

function updateActiveLink() {
  const scrollY = window.scrollY + 80; // offset for navbar height

  let current = sections[0];
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollY) current = id;
  });

  // The last section is short, so it never reaches the top of the viewport.
  const atBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (atBottom) current = sections[sections.length - 1];

  const active = navAlias[current] || current;

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === active);
  });
}

updateActiveLink(); // run once on load

// ── Smooth scroll for all anchor links (offset for fixed nav) ─
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const href = anchor.getAttribute("href");
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 56;
    const top = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: "smooth" });
    // close mobile drawer if open
    closeMobileMenu();
  });
});

// ── Hamburger / mobile drawer ─────────────────────────────────
const hamburger = document.getElementById("hamburger");
const drawer    = document.getElementById("nav-drawer");

function closeMobileMenu() {
  hamburger.classList.remove("open");
  drawer.classList.remove("open");
}

hamburger.addEventListener("click", () => {
  const isOpen = hamburger.classList.toggle("open");
  drawer.classList.toggle("open", isOpen);
});

// close drawer on drawer-link click
document.querySelectorAll(".drawer-link").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

// ── Email reveal (anti-scrape) ────────────────────────────────
function revealEmail() {
  const btn = document.getElementById("email-reveal");
  const email = "bingyxdong" + "@" + "gmail.com";
  btn.outerHTML =
    '<a href="mailto:' + email + '" class="contact-link">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>' +
    "<span>" + email + "</span>" +
    '<svg class="link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
    "</a>";
}
