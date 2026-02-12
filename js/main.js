document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================
     1. ENVIRONMENT & PREFERENCES
     ===================================================== */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const navbar = document.querySelector(".navbar");

  if (!navbar) return;

  /* =====================================================
     2. DESKTOP NAVBAR — SCROLLED STATE ONLY
     ===================================================== */
  if (!isMobile) {
    let lastState = "top";

    const getThreshold = () => Math.round(window.innerHeight * 0.06);
    let threshold = getThreshold();

    function updateDesktopNavbar() {
      const y =
        window.scrollY ||
        document.documentElement.scrollTop;

      const nextState = y > threshold ? "scrolled" : "top";

      if (nextState !== lastState) {
        navbar.classList.toggle("scrolled", nextState === "scrolled");
        lastState = nextState;
      }
    }

    window.addEventListener("scroll", updateDesktopNavbar, { passive: true });
    window.addEventListener("resize", () => {
      threshold = getThreshold();
      updateDesktopNavbar();
    });

    updateDesktopNavbar();
    return;
  }

  /* =====================================================
     3. MOBILE SAFARI-STYLE NAVBAR (VELOCITY BASED)
     ===================================================== */
  if (prefersReducedMotion) return;

  let lastY = window.scrollY;
  let lastTime = performance.now();
  let navState = "visible";
  let rafId = null;

  const TOP_LOCK = 80;          // always visible near top
  const HIDE_VELOCITY = 0.35;   // px/ms downward
  const SHOW_VELOCITY = -0.15;  // px/ms upward

  function setNav(state) {
    if (navState === state) return;
    navbar.dataset.state = state;
    navState = state;
  }

  setNav("visible");

  function onScroll() {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const now = performance.now();

      const dy = currentY - lastY;
      const dt = now - lastTime || 16;
      const velocity = dy / dt;

      lastY = currentY;
      lastTime = now;
      rafId = null;

      /* Always visible near top */
      if (currentY < TOP_LOCK) {
        setNav("visible");
        return;
      }

      /* Scroll down → hide */
      if (velocity > HIDE_VELOCITY && navState === "visible") {
        setNav("hidden");
        return;
      }

      /* Scroll up → show */
      if (velocity < SHOW_VELOCITY && navState === "hidden") {
        setNav("visible");
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  /* Accessibility: reveal on focus */
  navbar.addEventListener("focusin", () => {
    setNav("visible");
  });

  /* =====================================================
     4. DESKTOP HOVER LIFT (UNCHANGED)
     ===================================================== */
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0;

  if (!isTouch && !prefersReducedMotion) {
    document.querySelectorAll(
      ".problem-card, .plan-card, .visual-box"
    ).forEach(el => {
      el.addEventListener("mouseenter", () => el.classList.add("lift"));
      el.addEventListener("mouseleave", () => el.classList.remove("lift"));
    });
  }

  /* =====================================================
     5. FAQ — EXCLUSIVE ACCORDION
     ===================================================== */
  const faqItems = document.querySelectorAll(".faq details");

  faqItems.forEach(item => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach(other => {
        if (other !== item) other.removeAttribute("open");
      });
    });
  });

  /* =====================================================
     6. NAV SECTION AWARENESS (DESKTOP ONLY)
     ===================================================== */
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id]");

  if ("IntersectionObserver" in window && navLinks.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}`
            );
          });
        });
      },
      { rootMargin: "-30% 0px -50% 0px" }
    );

    sections.forEach(section => observer.observe(section));
  }

});