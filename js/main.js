document.addEventListener("DOMContentLoaded", () => {

  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  /* =====================================================
     INIT
  ===================================================== */
  initNavbar();
  initFAQ();
  initSectionObserver();

  /* =====================================================
     NAVBAR CONTROLLER
  ===================================================== */
  function initNavbar() {
    if (isMobile) {
      if (!prefersReducedMotion) initMobileNavbar();
    } else {
      initDesktopNavbar();
    }
  }

  /* ---------------- DESKTOP NAVBAR ---------------- */
  function initDesktopNavbar() {
    let lastState = "top";
    const threshold = () => Math.round(window.innerHeight * 0.06);

    function update() {
      const y = window.scrollY || document.documentElement.scrollTop;
      const next = y > threshold() ? "scrolled" : "top";

      if (next !== lastState) {
        navbar.classList.toggle("scrolled", next === "scrolled");
        lastState = next;
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- MOBILE NAVBAR (Velocity Based) ---------------- */
  function initMobileNavbar() {

    let lastY = window.scrollY;
    let lastTime = performance.now();
    let state = "visible";
    let raf = null;

    const TOP_LOCK = 80;
    const HIDE_VELOCITY = 0.35;
    const SHOW_VELOCITY = -0.15;

    function setState(next) {
      if (state === next) return;
      navbar.dataset.state = next;
      state = next;
    }

    function onScroll() {
      if (raf) return;

      raf = requestAnimationFrame(() => {

        const currentY = window.scrollY;
        const now = performance.now();

        const dy = currentY - lastY;
        const dt = now - lastTime || 16;
        const velocity = dy / dt;

        lastY = currentY;
        lastTime = now;
        raf = null;

        if (currentY < TOP_LOCK) {
          setState("visible");
          return;
        }

        if (velocity > HIDE_VELOCITY && state === "visible") {
          setState("hidden");
          return;
        }

        if (velocity < SHOW_VELOCITY && state === "hidden") {
          setState("visible");
        }

      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    navbar.addEventListener("focusin", () => {
      setState("visible");
    });
  }

  /* =====================================================
     FAQ — EXCLUSIVE ACCORDION
  ===================================================== */
  function initFAQ() {
    const faqItems = document.querySelectorAll(".faq details");

    faqItems.forEach(item => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;

        faqItems.forEach(other => {
          if (other !== item) other.removeAttribute("open");
        });
      });
    });
  }

  /* =====================================================
     NAV SECTION AWARENESS
  ===================================================== */
  function initSectionObserver() {

    const navLinks = document.querySelectorAll(".nav-links a");
    const sections = document.querySelectorAll("section[id]");

    if (!("IntersectionObserver" in window)) return;
    if (!navLinks.length || !sections.length) return;

    const observer = new IntersectionObserver(entries => {

      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const id = entry.target.id;

        navLinks.forEach(link => {
          const href = link.getAttribute("href");
          link.classList.toggle("active", href === `#${id}`);
        });
      });

    }, {
      threshold: 0.5
    });

    sections.forEach(section => observer.observe(section));
  }

});