document.addEventListener("DOMContentLoaded", () => {

  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 768px)");

  let cleanupCurrentMode = null;

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

  mobileQuery.addEventListener("change", init);
  window.addEventListener("resize", init);


  /* ================= DESKTOP ================= */

  function initDesktopNavbar() {

    let lastState = null;
    let threshold = Math.round(window.innerHeight * 0.06);

    function update() {
      const y = window.scrollY || document.documentElement.scrollTop;
      const nextState = y > threshold ? "scrolled" : "top";

      if (nextState === lastState) return;

      navbar.classList.toggle("scrolled", nextState === "scrolled");
      lastState = nextState;
    }

    window.addEventListener("scroll", update, { passive: true });
    update();

    return function cleanup() {
      window.removeEventListener("scroll", update);
      navbar.classList.remove("scrolled");
    };
  }


  /* ================= MOBILE ================= */

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

});