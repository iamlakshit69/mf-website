/* =====================================================
   METABOLIC FREEDOM – main.js  (fixed)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {


  /* ===================================================
     UTILITIES
  =================================================== */

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );


  /* ===================================================
     1. NAVBAR — desktop scroll darken + mobile hide/show
  =================================================== */

  const navbar = document.querySelector(".navbar");

  if (navbar) {
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    let navCleanup = null;

    function initNavbar() {
      if (navCleanup) { navCleanup(); navCleanup = null; }
      navCleanup = mobileQuery.matches
        ? initMobileNavbar()
        : initDesktopNavbar();
    }

    function initDesktopNavbar() {
      let lastState = null;
      let threshold = Math.round(window.innerHeight * 0.06);

      function update() {
        const next = window.scrollY > threshold ? "scrolled" : "top";
        if (next === lastState) return;
        navbar.classList.toggle("scrolled", next === "scrolled");
        lastState = next;
      }

      function onResize() {
        threshold = Math.round(window.innerHeight * 0.06);
        update();
      }

      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", onResize);
      update();

      return () => {
        window.removeEventListener("scroll", update);
        window.removeEventListener("resize", onResize);
        navbar.classList.remove("scrolled");
      };
    }

    function initMobileNavbar() {
      let lastScrollY  = window.scrollY;
      let scrollStartY = window.scrollY;
      let direction    = null;
      let navState     = "visible";
      let cooldown     = false;

      const TOP_LOCK    = 80;
      const DISTANCE    = 60;
      const COOLDOWN_MS = 300;

      function setState(state) {
        if (navState === state || cooldown) return;
        navbar.dataset.state = state;
        navState = state;
        cooldown = true;
        setTimeout(() => { cooldown = false; }, COOLDOWN_MS);
      }

      function onScroll() {
        const y = window.scrollY;

        if (y < TOP_LOCK) {
          setState("visible");
          lastScrollY = scrollStartY = y;
          return;
        }

        const delta = y - lastScrollY;
        if (delta > 0 && direction !== "down") {
          direction = "down"; scrollStartY = y;
        } else if (delta < 0 && direction !== "up") {
          direction = "up"; scrollStartY = y;
        }

        if (Math.abs(y - scrollStartY) > DISTANCE) {
          setState(direction === "down" ? "hidden" : "visible");
          scrollStartY = y;
        }

        lastScrollY = y;
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      navbar.addEventListener("focusin", () => setState("visible"));

      return () => {
        window.removeEventListener("scroll", onScroll);
        navbar.dataset.state = "visible";
      };
    }

    initNavbar();
    mobileQuery.addEventListener("change", debounce(initNavbar, 120));
  }


  /* ===================================================
     2. REVEAL ON SCROLL
  =================================================== */

  const revealEls = document.querySelectorAll(".reveal");

  if (revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }


  /* ===================================================
     3. SECTION-AWARE NAV LINKS
  =================================================== */

  (function initSectionObserver() {
    if (!("IntersectionObserver" in window)) return;

    const navLinks = document.querySelectorAll(".nav-links a[href^='#']");
    const sections = document.querySelectorAll("main section[id], main header[id]");

    if (!navLinks.length || !sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}`
            );
          });
        });
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
  })();


  /* ===================================================
     4. SMOOTH ANCHOR SCROLL
  =================================================== */

  (function initSmoothScroll() {
    document.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href.length <= 1) return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const offset = (navbar ? navbar.offsetHeight : 64) + 20;
        const y = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top: y,
          behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        });
      });
    });
  })();


  /* ===================================================
     5. FOUNDER IMAGE CAROUSEL
     — Pauses when section is off-screen
     — Reads interval from data-interval attribute
  =================================================== */

  (function initFounderCarousel() {
    const portrait = document.querySelector(".founder-portrait");
    if (!portrait) return;

    const images = portrait.querySelectorAll("img");
    if (images.length < 2) return;

    const interval = parseInt(portrait.dataset.interval, 10) || 6500;
    let index  = 0;
    let timer  = null;
    let paused = false;

    function next() {
      if (paused) return;
      images[index].classList.remove("active");
      index = (index + 1) % images.length;
      images[index].classList.add("active");
    }

    function start() {
      if (timer) return;
      timer = setInterval(next, interval);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    if (prefersReducedMotion.matches) return; // don't run at all

    const section = portrait.closest("section");
    if (section && "IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          paused = !entry.isIntersecting;
          paused ? stop() : start();
        },
        { threshold: 0.1 }
      );
      visibilityObserver.observe(section);
    } else {
      start();
    }
  })();


  /* ===================================================
     6. HERO VIDEO CONTROLLER
  =================================================== */

  (function initHeroVideo() {
    const video = document.querySelector(".hero-video");
    if (!video) return;

    // CSS already has opacity:1 on the video so the poster shows
    // immediately. JS just needs to make sure it plays.
    video.muted      = true;
    video.playsInline = true;

    function tryPlay() {
      const p = video.play();
      if (p !== undefined) p.catch(() => {});
    }

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener("loadeddata", tryPlay, { once: true });
    }

    document.addEventListener("visibilitychange", () => {
      document.hidden ? video.pause() : tryPlay();
    });

    if (prefersReducedMotion.matches) video.pause();
  })();


  /* ===================================================
     7. TESTIMONIAL VIDEOS
     FIX: after load(), attach canplay listener and call play()
          so videos actually start without user interaction.
     FIX: sound icon state driven by CSS via data-muted attribute
          (CSS rules now handle show/hide of SVG icons).
  =================================================== */

  (function initTestimonialVideos() {
    const wrappers = document.querySelectorAll(".video-wrapper");
    if (!wrappers.length) return;

    // ── Helper: attempt play, catching the NotAllowedError that
    //    browsers throw if autoplay policy blocks it ──────────────
    function safePlay(video) {
      const p = video.play();
      if (p !== undefined) {
        p.catch((err) => {
          // Autoplay blocked — video stays paused, poster shows.
          // User can tap to start. No console error needed.
          if (err.name !== "NotAllowedError") {
            console.warn("Video play failed:", err);
          }
        });
      }
    }

    // ── Lazy-load + autoplay when wrapper enters viewport ────────
    if ("IntersectionObserver" in window) {
      const loadObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const video = entry.target.querySelector(".testimonial-video");
            if (!video) return;

            if (video.preload === "none") {
              // FIX: set preload then attach canplay so we play
              //      as soon as enough data is buffered.
              video.preload = "metadata";
              video.load();

              video.addEventListener("canplay", () => {
                safePlay(video);
              }, { once: true });
            }

            loadObserver.unobserve(entry.target);
          });
        },
        { rootMargin: "200px 0px" }
      );

      wrappers.forEach((w) => loadObserver.observe(w));
    }

    // ── Per-wrapper interactivity ────────────────────────────────
    wrappers.forEach((wrapper) => {
      const video    = wrapper.querySelector(".testimonial-video");
      const soundBtn = wrapper.querySelector(".video-sound-btn");
      if (!video || !soundBtn) return;

      // Sync the data-muted attribute CSS uses to toggle icon visibility
      function syncMuteUI() {
        const muted = video.muted;
        soundBtn.dataset.muted = muted ? "true" : "false";
        soundBtn.setAttribute(
          "aria-label",
          muted ? "Ton einschalten" : "Ton ausschalten"
        );
      }

      // Initial state — video starts muted per HTML attribute
      syncMuteUI();

      // ── Tap/click on video area: play/pause + first-tap unmute ──
      wrapper.addEventListener("click", (e) => {
        // Sound button has its own handler — don't double-fire
        if (e.target === soundBtn || soundBtn.contains(e.target)) return;

        // Pause all OTHER videos first
        document.querySelectorAll(".testimonial-video").forEach((v) => {
          if (v !== video && !v.paused) {
            v.pause();
            const w = v.closest(".video-wrapper");
            if (w) {
              w.classList.add("paused");
              w.classList.remove("active");
            }
          }
        });

        wrapper.classList.add("active");

        // First tap: unmute and ensure playing
        if (video.muted) {
          video.muted = false;
          syncMuteUI();

          if (video.readyState >= 2) {
            safePlay(video);
          } else {
            // Video not loaded yet — force load then play
            video.preload = "auto";
            video.load();
            video.addEventListener("canplay", () => safePlay(video), { once: true });
          }
          return;
        }

        // Subsequent taps: toggle play/pause
        if (video.paused) {
          if (video.readyState >= 2) {
            safePlay(video);
          } else {
            video.preload = "auto";
            video.load();
            video.addEventListener("canplay", () => safePlay(video), { once: true });
          }
          wrapper.classList.remove("paused");
        } else {
          video.pause();
          wrapper.classList.add("paused");
        }
      });

      // ── Sound button: mute toggle only, never pause ──────────
      soundBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        syncMuteUI();

        // If toggling unmute and video is paused, start playing
        if (!video.muted && video.paused) {
          if (video.readyState >= 2) {
            safePlay(video);
          } else {
            video.preload = "auto";
            video.load();
            video.addEventListener("canplay", () => safePlay(video), { once: true });
          }
        }
      });

      // ── Keep paused class in sync with actual video state ────
      video.addEventListener("pause", () => {
        wrapper.classList.add("paused");
      });
      video.addEventListener("play", () => {
        wrapper.classList.remove("paused");
      });

      // ── Pause when video scrolls out of view ─────────────────
      if ("IntersectionObserver" in window) {
        const pauseObserver = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting && !video.paused) {
              video.pause();
            }
          },
          { threshold: 0.2 }
        );
        pauseObserver.observe(wrapper);
      }
    });
  })();


  /* ===================================================
     8. MEDIA CAROUSELS
     — Arrow navigation
     — Drag to scroll
     — Dot indicators
     FIX: scroll hint fires via IntersectionObserver (not
          a fixed timeout) so it only runs when the carousel
          is actually in the viewport.
  =================================================== */

  document.querySelectorAll(".media-carousel").forEach((carousel) => {
    const track         = carousel.querySelector(".media-track");
    const prevBtn       = carousel.querySelector(".carousel-arrow.prev");
    const nextBtn       = carousel.querySelector(".carousel-arrow.next");
    const dotsContainer = carousel.querySelector(".carousel-dots");

    if (!track) return;

    const boxes = track.querySelectorAll(".media-box");

    // ── Build dot buttons ────────────────────────────────────────
    if (dotsContainer && boxes.length) {
      boxes.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.setAttribute("aria-label", `Element ${i + 1}`);
        if (i === 0) dot.classList.add("active");
        dotsContainer.appendChild(dot);

        dot.addEventListener("click", () => {
          boxes[i].scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        });
      });
    }

    const dots = dotsContainer
      ? dotsContainer.querySelectorAll("button")
      : [];

    // ── Arrow scroll amount = box width + gap ───────────────────
    function getScrollAmount() {
      const box = track.querySelector(".media-box");
      return box ? box.offsetWidth + 24 : 300;
    }

    // ── Update arrow disabled state + active dot ─────────────────
    function updateState() {
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 4;
      if (nextBtn) {
        nextBtn.disabled =
          track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      }

      if (!dots.length) return;

      // Find the box whose centre is closest to the track centre
      const centre = track.scrollLeft + track.clientWidth / 2;
      let closest     = 0;
      let closestDist = Infinity;

      boxes.forEach((box, i) => {
        const boxCentre = box.offsetLeft + box.offsetWidth / 2;
        const dist      = Math.abs(boxCentre - centre);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });

      dots.forEach((dot, i) =>
        dot.classList.toggle("active", i === closest)
      );
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
      });
    }

    track.addEventListener("scroll", updateState, { passive: true });
    updateState();

    // ── Drag to scroll ────────────────────────────────────────────
    let isDown  = false;
    let startX  = 0;
    let startSL = 0;
    let didDrag = false;

    track.addEventListener("mousedown", (e) => {
      isDown  = true;
      didDrag = false;
      startX  = e.pageX - track.offsetLeft;
      startSL = track.scrollLeft;
      track.style.userSelect = "none";
    });

    track.addEventListener("mouseleave", () => {
      isDown = false;
      track.style.userSelect = "";
    });

    track.addEventListener("mouseup", () => {
      isDown = false;
      track.style.userSelect = "";
    });

    track.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      didDrag = true;
      const x    = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.2;
      track.scrollLeft = startSL - walk;
    });

    // Prevent click-through after drag (e.g. accidentally clicking a video)
    track.addEventListener("click", (e) => {
      if (didDrag) {
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      }
    }, true);

    // ── FIX: Scroll hint via IntersectionObserver ─────────────────
    // Only fires when the carousel is actually on screen, and only once.
    if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
      const hintObserver = new IntersectionObserver(
        ([entry], obs) => {
          if (!entry.isIntersecting) return;

          // Small delay after becoming visible, then nudge and return
          setTimeout(() => {
            track.scrollBy({ left: 32, behavior: "smooth" });
            setTimeout(() => {
              track.scrollBy({ left: -32, behavior: "smooth" });
            }, 420);
          }, 700);

          obs.disconnect(); // Only hint once
        },
        { threshold: 0.75 } // carousel must be mostly visible
      );
      hintObserver.observe(carousel);
    }
  });


  /* ===================================================
     9. FAQ — Category switch + accordion
     FIX: category scroll hint uses IntersectionObserver
          so it only fires when FAQ is actually visible.
     FIX: double rAF for reliable animation re-trigger.
     FIX: smooth max-height with measured scrollHeight.
  =================================================== */

  (function initFAQ() {
    const categories = document.querySelectorAll(".faq-cat");
    const groups     = document.querySelectorAll(".faq-group");

    if (!categories.length || !groups.length) return;

    // ── Category switch ──────────────────────────────────────────
    categories.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.cat;

        categories.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        groups.forEach((g) => {
          const isTarget = g.dataset.group === target;
          g.classList.remove("active");

          if (isTarget) {
            // Double rAF lets browser register the removal before re-adding,
            // ensuring the CSS fade animation re-triggers every time.
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                g.classList.add("active");
              });
            });
          }
        });
      });
    });

    // ── FIX: Category scroll hint — only when FAQ is in view ────
    const catWrapper = document.querySelector(".faq-categories");
    if (catWrapper && !prefersReducedMotion.matches) {
      const faqSection = document.querySelector(".section--faq");

      if (faqSection && "IntersectionObserver" in window) {
        const faqHintObserver = new IntersectionObserver(
          ([entry], obs) => {
            if (!entry.isIntersecting) return;

            setTimeout(() => {
              catWrapper.scrollBy({ left: 60, behavior: "smooth" });
              setTimeout(() => {
                catWrapper.scrollBy({ left: -60, behavior: "smooth" });
              }, 500);
            }, 400);

            obs.disconnect();
          },
          { threshold: 0.3 }
        );
        faqHintObserver.observe(faqSection);
      }
    }

    // ── Accordion ────────────────────────────────────────────────
    document.querySelectorAll(".faq-question").forEach((question) => {
      question.addEventListener("click", () => {
        const item   = question.closest(".faq-item");
        const answer = item.querySelector(".faq-answer");
        const group  = question.closest(".faq-group");

        // Close any already-open sibling
        group.querySelectorAll(".faq-item.active").forEach((open) => {
          if (open !== item) {
            open.classList.remove("active");
          }
        });

        const isOpening = !item.classList.contains("active");
        item.classList.toggle("active");

        // Set exact pixel height so CSS transition is smooth
        if (isOpening && answer) {
          answer.style.setProperty(
            "--faq-answer-height",
            answer.scrollHeight + "px"
          );
        }
      });
    });
  })();


  /* ===================================================
     10. DECISION PANELS — touch device tap-toggle
     CSS handles hover on pointer devices via @media (hover:hover).
     JS adds tap-toggle for touch devices only.
  =================================================== */

  (function initDecisionTouch() {
    if (window.matchMedia("(hover: hover)").matches) return;

    const panels = document.querySelectorAll(".decision-panel");
    if (!panels.length) return;

    function resetAll() {
      panels.forEach((p) => {
        p.classList.remove("tap-active");
        p.style.transform = "";
        p.style.filter    = "";
      });
    }

    panels.forEach((panel) => {
      panel.setAttribute("tabindex", "0"); // keyboard accessible on touch devices

      function activate() {
        const isActive = panel.classList.contains("tap-active");
        resetAll();

        if (!isActive) {
          panel.classList.add("tap-active");
          panel.style.transform = "scale(1.02)";
          panel.style.filter    = "brightness(1.06)";

          panels.forEach((p) => {
            if (p !== panel) {
              p.style.transform = "scale(.98)";
              p.style.filter    = "brightness(.72)";
            }
          });
        }
      }

      panel.addEventListener("click",   activate);
      panel.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
  })();
  /* ===================================================
     11. MESSBARE WAHRHEIT — Cursor-tracking card glow
     ─────────────────────────────────────────────────
     For each .mw-card, tracks the mouse position
     relative to the card and writes --mx / --my as
     percentage values. The CSS radial-gradient on
     .mw-card-glow reads those properties to follow
     the cursor in real time.

     Also handles touch devices gracefully — the glow
     simply stays hidden (opacity:0) since CSS already
     gates it behind :hover.
  =================================================== */

  (function initMWCardGlow() {
    const cards = document.querySelectorAll(".mw-card");
    if (!cards.length) return;

    // Skip the effect entirely if the user prefers reduced motion
    if (prefersReducedMotion.matches) return;

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        card.style.setProperty("--mx", `${x}%`);
        card.style.setProperty("--my", `${y}%`);
      });

      // Reset to centre when mouse leaves so the next
      // hover always starts from a neutral position
      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
      });
    });
  })();


}); // end DOMContentLoaded