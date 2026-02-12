document.addEventListener("DOMContentLoaded", () => {

  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;


  /* =====================================================
     DESKTOP NAVBAR — SCROLLED STATE
  ===================================================== */
  if (!isMobile()) {

    let lastState = "top";
    const getThreshold = () =>
      Math.round(window.innerHeight * 0.06);

    let threshold = getThreshold();

    function updateDesktopNavbar() {
      const y = window.scrollY || document.documentElement.scrollTop;
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
     MOBILE NAVBAR — VELOCITY BASED
  ===================================================== */
  if (prefersReducedMotion) return;

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

});
