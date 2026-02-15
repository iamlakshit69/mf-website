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

/* =====================================================
   TESTIMONIAL AUTO SCROLL
===================================================== */

document.querySelectorAll(".testimonial-media").forEach(carousel => {

  let isPaused = false;

  function autoScroll() {
    if (isPaused) return;

    carousel.scrollLeft += 0.5;

    if (carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth) {
      carousel.scrollLeft = 0;
    }
  }

  const interval = setInterval(autoScroll, 20);

  carousel.addEventListener("mouseenter", () => isPaused = true);
  carousel.addEventListener("mouseleave", () => isPaused = false);
  carousel.addEventListener("touchstart", () => isPaused = true);
  carousel.addEventListener("touchend", () => isPaused = false);

});

/* =====================================================
   STACKED MEDIA CAROUSEL – TRUE SEAMLESS LOOP
===================================================== */

document.querySelectorAll(".media-carousel").forEach(carousel => {

  const track = carousel.querySelector(".media-track");
  const slides = Array.from(track.children);
  const dotsContainer = carousel.querySelector(".carousel-dots");

  let index = 1;
  let autoplay;

  // Clone first & last
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);

  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);

  const allSlides = Array.from(track.children);

  function slideWidth() {
    return allSlides[0].offsetWidth + 30;
  }

  function setPosition(animate = true) {
    track.style.transition = animate
      ? "transform .6s cubic-bezier(.22,1,.36,1)"
      : "none";

    track.style.transform = `translateX(-${index * slideWidth()}px)`;

    updateDots();
  }

  function updateDots() {
    dotsContainer.querySelectorAll("button").forEach((dot, i) => {
      dot.classList.toggle("active", i === index - 1);
    });
  }

  function nextSlide() {
    index++;
    setPosition(true);
  }

  // When slide finishes moving
  track.addEventListener("transitionend", () => {

    // If we are on fake last slide
    if (index === allSlides.length - 1) {
      index = 1;
      setPosition(false);
    }

    // If we are on fake first slide
    if (index === 0) {
      index = slides.length;
      setPosition(false);
    }

  });

  function startAutoplay() {
    autoplay = setInterval(nextSlide, 4000);
  }

  function stopAutoplay() {
    clearInterval(autoplay);
  }

  // Dots
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.addEventListener("click", () => {
      index = i + 1;
      setPosition(true);
    });
    dotsContainer.appendChild(dot);
  });

  // Autoplay only in viewport
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) startAutoplay();
      else stopAutoplay();
    });
  }, { threshold: 0.4 });

  observer.observe(carousel);

  // Initial position (immediately at real first slide)
  setPosition(false);

});

/* =====================================================
   FAQ ACCORDION
===================================================== */

document.querySelectorAll(".faq-question").forEach(button => {

  button.addEventListener("click", () => {

    const item = button.parentElement;

    document.querySelectorAll(".faq-item").forEach(i => {
      if (i !== item) i.classList.remove("active");
    });

    item.classList.toggle("active");

  });

});

const videos = document.querySelectorAll('.video-box video');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;

    if (entry.isIntersecting) {
      video.play();
    } else {
      video.pause();
    }
  });
}, {
  threshold: 0.6
});

videos.forEach(video => {
  observer.observe(video);
});