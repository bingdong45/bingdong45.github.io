// Scroll reveal animation
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 32;
      window.scrollTo({ top, behavior: "smooth" });
    }
  });
});

// Email reveal (obfuscated so bots can't scrape it)
function revealEmail() {
  const btn = document.getElementById("email-reveal");
  const user = "bingyxdong";
  const domain = "gmail.com";
  const email = user + "@" + domain;
  btn.outerHTML =
    '<a href="mailto:' + email + '" class="contact-link">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>' +
    "<span>" + email + "</span>" +
    '<svg class="link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
    "</a>";
}
