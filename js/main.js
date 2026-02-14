document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================
     ENVIRONMENT
  ===================================================== */

  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 768px)");

  let cleanupCurrentMode = null;



  /* =====================================================
     INITIALIZE CONTROLLER
  ===================================================== */

  function init() {

    if (cleanupCurrentMode) {
      cleanupCurrentMode();
      cleanupCurrentMode = null;
    }

    const isMobile = mobileQuery.matches;

    if (!isMobile) {
      cleanupCurrentMode = initDesktopNavbar();
    } else if (!prefersReducedMotion.matches) {
      cleanupCurrentMode = initMobileNavbar();
    }
  }

  init();

  mobileQuery.addEventListener("change", debounce(init, 120));
  window.addEventListener("resize", debounce(init, 120));



  /* =====================================================
     DESKTOP NAVBAR (Threshold Based)
  ===================================================== */

  function initDesktopNavbar() {

    let lastState = null;
    let threshold = getThreshold();

    function getThreshold() {
      return Math.round(window.innerHeight * 0.06);
    }

    function update() {
      const y = window.scrollY || document.documentElement.scrollTop;
      const nextState = y > threshold ? "scrolled" : "top";

      if (nextState === lastState) return;

      navbar.classList.toggle("scrolled", nextState === "scrolled");
      lastState = nextState;
    }

    function handleResize() {
      threshold = getThreshold();
      update();
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", handleResize);

    update();

    return function cleanup() {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", handleResize);
      navbar.classList.remove("scrolled");
    };
  }



  /* =====================================================
     MOBILE NAVBAR (Velocity Based)
  ===================================================== */

  function initMobileNavbar() {

    let lastY = window.scrollY;
    let lastTime = performance.now();
    let navState = "visible";
    let rafId = null;

    const TOP_LOCK = 80;
    const HIDE_VELOCITY = 0.35;
    const SHOW_VELOCITY = -0.15;

    function setNav(state) {
      if (navState === state) return;
      navbar.dataset.state = state;
      navState = state;
    }

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

        if (currentY < TOP_LOCK) {
          setNav("visible");
          return;
        }

        if (velocity > HIDE_VELOCITY && navState === "visible") {
          setNav("hidden");
          return;
        }

        if (velocity < SHOW_VELOCITY && navState === "hidden") {
          setNav("visible");
        }

      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    navbar.addEventListener("focusin", () => {
      setNav("visible");
    });

    return function cleanup() {
      window.removeEventListener("scroll", onScroll);
      navbar.dataset.state = "visible";
    };
  }



  /* =====================================================
     FAQ – EXCLUSIVE ACCORDION
  ===================================================== */

  (function initFAQ() {

    const faqItems = document.querySelectorAll(".faq details");
    if (!faqItems.length) return;

    faqItems.forEach(item => {

      item.addEventListener("toggle", () => {

        if (!item.open) return;

        faqItems.forEach(other => {
          if (other !== item) {
            other.removeAttribute("open");
          }
        });

      });

    });

  })();



  /* =====================================================
     SECTION-AWARE NAV (Intersection Observer)
  ===================================================== */

  (function initSectionObserver() {

    if (!("IntersectionObserver" in window)) return;

    const navLinks = document.querySelectorAll(".nav-links a[href^='#']");
    const sections = document.querySelectorAll("section[id]");

    if (!navLinks.length || !sections.length) return;

    const observer = new IntersectionObserver(entries => {

      entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const id = entry.target.id;

        navLinks.forEach(link => {
          const isActive = link.getAttribute("href") === `#${id}`;
          link.classList.toggle("active", isActive);
        });

      });

    }, {
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));

  })();



  /* =====================================================
     SMOOTH ANCHOR SCROLL (Refined Offset)
  ===================================================== */

  (function enhanceAnchorScroll() {

    const anchorLinks = document.querySelectorAll("a[href^='#']");
    if (!anchorLinks.length) return;

    anchorLinks.forEach(link => {

      link.addEventListener("click", e => {

        const targetId = link.getAttribute("href");
        if (!targetId || targetId.length <= 1) return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const offset = 110;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top,
          behavior: prefersReducedMotion.matches ? "auto" : "smooth"
        });

      });

    });

  })();



  /* =====================================================
     UTILITIES
  ===================================================== */

  function debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

});