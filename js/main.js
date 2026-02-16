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
   MOBILE NAVBAR (Distance Based – Smooth)
===================================================== */

function initMobileNavbar() {

  let lastScrollY = window.scrollY;
  let scrollStartY = window.scrollY;
  let direction = null;
  let navState = "visible";
  let cooldown = false;

  const TOP_LOCK = 80;        // always visible near top
  const DISTANCE = 60;        // px required before toggle
  const COOLDOWN_TIME = 300;  // ms after toggle

  function setNav(state) {
    if (navState === state || cooldown) return;

    navbar.dataset.state = state;
    navState = state;

    cooldown = true;
    setTimeout(() => cooldown = false, COOLDOWN_TIME);
  }

  function onScroll() {

    const currentY = window.scrollY;

    // Always show near top
    if (currentY < TOP_LOCK) {
      setNav("visible");
      lastScrollY = currentY;
      scrollStartY = currentY;
      return;
    }

    const delta = currentY - lastScrollY;

    // Determine direction
    if (delta > 0) {
      if (direction !== "down") {
        direction = "down";
        scrollStartY = currentY;
      }
    } else if (delta < 0) {
      if (direction !== "up") {
        direction = "up";
        scrollStartY = currentY;
      }
    }

    const distanceScrolled = Math.abs(currentY - scrollStartY);

    if (distanceScrolled > DISTANCE) {

      if (direction === "down") {
        setNav("hidden");
      }

      if (direction === "up") {
        setNav("visible");
      }

      scrollStartY = currentY;
    }

    lastScrollY = currentY;
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

    const anchorLinks = document.querySelectorAll(".nav-links a[href^='#']");
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





/* =====================================================
   FOUNDER IMAGE FADE CAROUSEL
===================================================== */

(function initFounderCarousel() {

  const portrait = document.querySelector(".founder-portrait");
  if (!portrait) return;

  const images = portrait.querySelectorAll("img");
  if (images.length < 2) return;

  let index = 0;

  setInterval(() => {

    images[index].classList.remove("active");
    index = (index + 1) % images.length;
    images[index].classList.add("active");

  }, 4000);

})();

/* =====================================================
   FAQ – PREMIUM SPLIT LOGIC
===================================================== */

(function initPremiumFAQ() {

  const categories = document.querySelectorAll(".faq-cat");
  const groups = document.querySelectorAll(".faq-group");

  if (!categories.length || !groups.length) return;

  /* ----------------------------
     CATEGORY SWITCH
  ---------------------------- */

  categories.forEach(button => {
    button.addEventListener("click", () => {

      const target = button.dataset.cat;

      // Activate category button
      categories.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      // Show correct group
      groups.forEach(group => {
        group.classList.toggle("active", group.dataset.group === target);
      });

    });
  });


  /* ----------------------------
     ACCORDION (Exclusive)
  ---------------------------- */

  document.querySelectorAll(".faq-question").forEach(question => {

    question.addEventListener("click", () => {

      const item = question.closest(".faq-item");
      const group = question.closest(".faq-group");

      // Close others inside same group
      group.querySelectorAll(".faq-item").forEach(i => {
        if (i !== item) i.classList.remove("active");
      });

      item.classList.toggle("active");

    });

  });

})();

/* =====================================================
   DRAG SCROLL – MEDIA CAROUSEL
===================================================== */

document.querySelectorAll(".media-track").forEach(track => {

  let isDown = false;
  let startX;
  let scrollLeft;

  track.addEventListener("mousedown", (e) => {
    isDown = true;
    track.classList.add("dragging");
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener("mouseleave", () => {
    isDown = false;
  });

  track.addEventListener("mouseup", () => {
    isDown = false;
  });

  track.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.2;
    track.scrollLeft = scrollLeft - walk;
  });

});

document.querySelectorAll(".media-carousel").forEach(carousel => {

  const track = carousel.querySelector(".media-track");
  const prevBtn = carousel.querySelector(".prev");
  const nextBtn = carousel.querySelector(".next");

  if (!track || !prevBtn || !nextBtn) return;

  const scrollAmount = () => {
    const box = track.querySelector(".media-box");
    return box ? box.offsetWidth + 30 : 300; // 30 = gap
  };

  function updateButtons() {
    prevBtn.disabled = track.scrollLeft <= 5;
    nextBtn.disabled =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
  }

  prevBtn.addEventListener("click", () => {
    track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });

  track.addEventListener("scroll", updateButtons);

  updateButtons();
});

/* =====================================================
   DECISION – PREMIUM INTERACTION
===================================================== */

(function initDecisionPremium() {

  const panels = document.querySelectorAll(".decision-panel");
  if (!panels.length) return;

  panels.forEach(panel => {

    panel.addEventListener("mouseenter", () => {

      panels.forEach(p => {
        if (p !== panel) {
          p.style.transform = "scale(0.97)";
          p.style.filter = "brightness(0.7)";
        }
      });

      panel.style.transform = "scale(1.05)";
      panel.style.zIndex = "3";

    });

    panel.addEventListener("mouseleave", () => {

      panels.forEach(p => {
        p.style.transform = "";
        p.style.filter = "";
        p.style.zIndex = "";
      });

    });

  });

})();



/* =====================================================
   HERO VIDEO CONTROLLER (Refined)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const video = document.querySelector(".hero-video");
  if (!video) return;

  // Enforce autoplay-safe attributes
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");

  function tryPlay() {
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {});
    }
  }

  // Play when ready
  if (video.readyState >= 2) {
    tryPlay();
  } else {
    video.addEventListener("loadeddata", tryPlay, { once: true });
  }

  /* Pause when tab hidden */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      video.pause();
    } else {
      tryPlay();
    }
  });

  /* Respect reduced motion */
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.matches) {
    video.pause();
  }

});

/* =====================================================
   TESTIMONIAL CAROUSEL + VIDEO CONTROLLER
===================================================== */

document.querySelectorAll(".media-carousel").forEach(carousel => {

  const track = carousel.querySelector(".media-track");

  /* ---------- Subtle Scroll Hint (per carousel) ---------- */

  if (track) {
    setTimeout(() => {
      track.scrollBy({ left: 24, behavior: "smooth" });

      setTimeout(() => {
        track.scrollBy({ left: -24, behavior: "smooth" });
      }, 400);

    }, 800);
  }

});


/* =====================================================
   TESTIMONIAL VIDEO – CLEAN STATE CONTROL
===================================================== */

document.querySelectorAll(".testimonial-video").forEach(video => {

  const wrapper = video.closest(".video-wrapper");
  const soundBtn = wrapper.querySelector(".video-sound-btn");

  if (!wrapper || !soundBtn) return;

  /* ---------- VIDEO CLICK (play / pause / first unmute) ---------- */

  wrapper.addEventListener("click", (e) => {

    if (e.target === soundBtn) return;

    // Pause other videos ONLY when starting this one
    if (video.paused) {
      document.querySelectorAll(".testimonial-video").forEach(v => {
        if (v !== video) {
          v.pause();
          v.closest(".video-wrapper")?.classList.remove("active");
        }
      });
    }

    wrapper.classList.add("active");

    // First interaction → unmute but don't pause others
    if (video.muted) {
      video.muted = false;
      soundBtn.textContent = "🔊";
      video.play();
      return;
    }

    video.paused ? video.play() : video.pause();
  });

  /* ---------- SOUND BUTTON (ONLY MUTE TOGGLE) ---------- */

  soundBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    video.muted = !video.muted;
    soundBtn.textContent = video.muted ? "🔇" : "🔊";

    // IMPORTANT: do NOT pause anything here
  });

});