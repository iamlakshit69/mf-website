document.addEventListener("DOMContentLoaded", () => {

    const navbar = document.querySelector(".navbar");
    if (!navbar) return;
  
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    let cleanup = null;
  
    function initNavbar() {
  
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
  
      if (mobileQuery.matches) {
        cleanup = initMobileNavbar();
      } else {
        cleanup = initDesktopNavbar();
      }
    }
  
    initNavbar();
    mobileQuery.addEventListener("change", initNavbar);
  
  
  
    /* =====================================================
       DESKTOP NAVBAR
    ===================================================== */
  
    function initDesktopNavbar() {
  
      const threshold = window.innerHeight * 0.06;
  
      function onScroll() {
        if (window.scrollY > threshold) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      }
  
      window.addEventListener("scroll", onScroll, { passive: true });
  
      return function cleanup() {
        window.removeEventListener("scroll", onScroll);
        navbar.classList.remove("scrolled");
      };
    }
  
  
  
    /* =====================================================
       MOBILE NAVBAR
    ===================================================== */
  
    function initMobileNavbar() {
  
      let lastScrollY = window.scrollY;
      let navState = "visible";
  
      const TOP_LOCK = 80;
      const DISTANCE = 60;
  
      function setState(state) {
        if (navState === state) return;
        navbar.dataset.state = state;
        navState = state;
      }
  
      function onScroll() {
  
        const currentY = window.scrollY;
  
        // Always visible near top
        if (currentY < TOP_LOCK) {
          setState("visible");
          lastScrollY = currentY;
          return;
        }
  
        const delta = currentY - lastScrollY;
  
        if (Math.abs(delta) > DISTANCE) {
          if (delta > 0) {
            setState("hidden");
          } else {
            setState("visible");
          }
          lastScrollY = currentY;
        }
      }
  
      window.addEventListener("scroll", onScroll, { passive: true });
  
      navbar.addEventListener("focusin", () => {
        setState("visible");
      });
  
      return function cleanup() {
        window.removeEventListener("scroll", onScroll);
        navbar.dataset.state = "visible";
      };
    }
  
  });