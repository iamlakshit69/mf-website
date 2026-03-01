/* =====================================================
   METABOLIC FREEDOM – MESSBARE WAHRHEIT
   script.js  |  Full replacement
===================================================== */

document.addEventListener("DOMContentLoaded", () => {


  /* ===================================================
     1. NAVBAR
  =================================================== */

  const navbar = document.querySelector(".navbar");

  if (navbar) {
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    let navCleanup = null;

    function initNavbar() {
      if (navCleanup) { navCleanup(); navCleanup = null; }
      navCleanup = mobileQuery.matches ? initMobileNavbar() : initDesktopNavbar();
    }

    function initDesktopNavbar() {
      const threshold = window.innerHeight * 0.06;

      function onScroll() {
        navbar.classList.toggle("scrolled", window.scrollY > threshold);
      }

      window.addEventListener("scroll", onScroll, { passive: true });

      return () => {
        window.removeEventListener("scroll", onScroll);
        navbar.classList.remove("scrolled");
      };
    }

    function initMobileNavbar() {
      let lastScrollY = window.scrollY;
      let navState    = "visible";
      const TOP_LOCK  = 80;
      const DISTANCE  = 60;

      function setState(state) {
        if (navState === state) return;
        navbar.dataset.state = state;
        navState = state;
      }

      function onScroll() {
        const currentY = window.scrollY;

        if (currentY < TOP_LOCK) {
          setState("visible");
          lastScrollY = currentY;
          return;
        }

        const delta = currentY - lastScrollY;

        if (Math.abs(delta) > DISTANCE) {
          setState(delta > 0 ? "hidden" : "visible");
          lastScrollY = currentY;
        }
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      navbar.addEventListener("focusin", () => setState("visible"));

      return () => {
        window.removeEventListener("scroll", onScroll);
        navbar.dataset.state = "visible";
      };
    }

    initNavbar();
    mobileQuery.addEventListener("change", initNavbar);
  }


  /* ===================================================
     2. REVEAL ON SCROLL (IntersectionObserver)
  =================================================== */

  const revealEls = document.querySelectorAll(".reveal");

  if (revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }


  /* ===================================================
     3. PILLARS PROGRESS BAR + ACTIVE STEP
  =================================================== */

  const pillarsSection   = document.querySelector(".section--pillars");
  const progressBar      = document.querySelector(".pillars-progress-bar");
  const progressSteps    = document.querySelectorAll(".progress-step");
  const pillarDossiers   = document.querySelectorAll(".pillar-dossier");

  if (pillarsSection && progressBar && pillarDossiers.length) {

    function updateProgress() {
      const sectionTop    = pillarsSection.offsetTop;
      const sectionHeight = pillarsSection.offsetHeight;
      const scrolled      = window.scrollY + window.innerHeight * 0.5;

      // Fill the progress line
      const raw     = (scrolled - sectionTop) / sectionHeight;
      const percent = Math.min(Math.max(raw, 0), 1) * 100;
      progressBar.style.width = percent + "%";

      // Detect which pillar is currently centred in the viewport
      let activePillar = null;
      const viewMid = window.scrollY + window.innerHeight * 0.45;

      pillarDossiers.forEach((dossier) => {
        const top    = dossier.offsetTop;
        const bottom = top + dossier.offsetHeight;
        if (viewMid >= top && viewMid < bottom) {
          activePillar = dossier.dataset.pillar;
        }
      });

      // Update step buttons
      progressSteps.forEach((btn) => {
        const target      = btn.dataset.target;
        const targetEl    = document.getElementById(target);
        let btnPillar     = null;

        if (targetEl) {
          btnPillar = targetEl.dataset.pillar;
        }

        btn.classList.toggle(
          "progress-step--active",
          btnPillar === activePillar
        );
      });
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress(); // run once on load

    // Clicking a step scrolls to that pillar
    progressSteps.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;

        const navbarHeight   = navbar ? navbar.offsetHeight : 64;
        const progressHeight = document.querySelector(".pillars-progress")
          ? document.querySelector(".pillars-progress").offsetHeight
          : 52;
        const offset = navbarHeight + progressHeight + 16;

        const y = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: "smooth" });
      });
    });
  }


  /* ===================================================
     4. STICKY CTA BAR
  =================================================== */

  const stickyCta = document.querySelector(".sticky-cta");

  if (stickyCta) {
    // Show the bar after user scrolls past the first viewport height
    const SHOW_AFTER    = window.innerHeight * 0.9;
    // Hide the bar when user reaches the footer
    const footer        = document.querySelector(".footer");
    let ctaVisible      = false;

    function updateStickyCta() {
      const scrollY      = window.scrollY;
      const footerTop    = footer
        ? footer.getBoundingClientRect().top + scrollY - window.innerHeight
        : Infinity;

      const shouldShow = scrollY > SHOW_AFTER && scrollY < footerTop;

      if (shouldShow !== ctaVisible) {
        ctaVisible = shouldShow;
        stickyCta.dataset.state = ctaVisible ? "visible" : "hidden";
      }
    }

    window.addEventListener("scroll", updateStickyCta, { passive: true });
    updateStickyCta();
  }


  /* ===================================================
     5. PILLAR PILL SMOOTH SCROLL (authority intro)
     Accounts for sticky navbar + progress bar offset
  =================================================== */

  const pillarPills = document.querySelectorAll(".pillar-pill");

  pillarPills.forEach((pill) => {
    pill.addEventListener("click", (e) => {
      const href   = pill.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const navbarHeight   = navbar ? navbar.offsetHeight : 64;
      const progressEl     = document.querySelector(".pillars-progress");
      const progressHeight = progressEl ? progressEl.offsetHeight : 52;
      const offset         = navbarHeight + progressHeight + 20;

      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });


  /* ===================================================
     6. METRIC CARDS – COUNT-UP ANIMATION
     Triggers once when the metrics row enters the viewport
  =================================================== */

  const metricValues = document.querySelectorAll(".metric-value");

  if (metricValues.length) {

    function animateValue(el, target, suffix, duration) {
      const isDecimal  = String(target).includes(".");
      const start      = 0;
      const startTime  = performance.now();

      function step(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease out cubic
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = start + (target - start) * eased;

        el.firstChild.textContent = isDecimal
          ? current.toFixed(1)
          : Math.floor(current);

        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    const metricsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el        = entry.target;
          const unitEl    = el.querySelector(".metric-unit");
          const unitText  = unitEl ? unitEl.textContent : "";

          // Parse the numeric part (text before the unit span)
          const rawText   = el.firstChild ? el.firstChild.textContent.trim() : "";
          const numericVal= parseFloat(rawText);

          if (!isNaN(numericVal)) {
            // Preserve the unit span, reset text node
            if (!el.firstChild || el.firstChild.nodeType !== Node.TEXT_NODE) {
              el.insertBefore(document.createTextNode("0"), el.firstChild);
            }
            animateValue(el, numericVal, unitText, 1200);
          }

          metricsObserver.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );

    metricValues.forEach((el) => metricsObserver.observe(el));
  }


  /* ===================================================
     7. PROTOCOL STEPS – STAGGERED REVEAL ON MOBILE
     Each step gets a slightly delayed entrance
  =================================================== */

  const protocolSteps = document.querySelectorAll(".protocol-step");

  if (protocolSteps.length) {
    const stepsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const steps = entry.target.querySelectorAll(".protocol-step");
          steps.forEach((step, i) => {
            setTimeout(() => {
              step.style.opacity   = "1";
              step.style.transform = "translateY(0)";
            }, i * 120);
          });

          stepsObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    const stepsContainer = document.querySelector(".protocol-steps");
    if (stepsContainer) {
      // Set initial hidden state via JS (avoids flash if JS disabled)
      protocolSteps.forEach((step) => {
        step.style.opacity   = "0";
        step.style.transform = "translateY(20px)";
        step.style.transition = "opacity .5s ease, transform .5s ease";
      });

      stepsObserver.observe(stepsContainer);
    }
  }


}); // end DOMContentLoaded