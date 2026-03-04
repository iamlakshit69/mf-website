/* =====================================================
   PLAN.JS — Metabolic Freedom · Leistungen Page
   Contains ALL shared site logic (navbar, reveal,
   smooth scroll, etc.) PLUS plan-page specific logic.
   Use this file INSTEAD of main.js on plan.html.
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
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );
  
      revealEls.forEach((el) => revealObserver.observe(el));
    }
  
  
    /* ===================================================
       3. SMOOTH ANCHOR SCROLL
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
       4. SECTION-AWARE NAV LINKS
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
       5. PAYMENT TAB TOGGLE
       Switches between Option 1 (Einmalzahlung) and
       Option 2 (2 Raten) panels with smooth animation.
    =================================================== */
  
    (function initPaymentTabs() {
      const tabs   = document.querySelectorAll(".payment-tab");
      const panels = document.querySelectorAll(".payment-panel");
  
      if (!tabs.length || !panels.length) return;
  
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const targetIndex = tab.dataset.tab;
  
          // ── Update tab active state ──
          tabs.forEach((t) => {
            const isActive = t.dataset.tab === targetIndex;
            t.classList.toggle("active", isActive);
            t.setAttribute("aria-selected", isActive ? "true" : "false");
          });
  
          // ── Swap panels ──
          panels.forEach((panel) => {
            const panelNum = panel.id.replace("payment-panel-", "");
            const isTarget = panelNum === targetIndex;
  
            if (isTarget) {
              // Remove hidden, trigger re-animation
              panel.hidden = false;
              panel.classList.add("active");
  
              // Force reflow so animation re-fires every switch
              void panel.offsetWidth;
  
              panel.style.animation = "none";
              requestAnimationFrame(() => {
                panel.style.animation = "";
              });
            } else {
              panel.hidden = true;
              panel.classList.remove("active");
            }
          });
  
          // Re-play the savings badge pop animation when switching to tab 1
          if (targetIndex === "1") {
            const badge = document.querySelector(".payment-saving-badge");
            if (badge && !prefersReducedMotion.matches) {
              badge.style.animation = "none";
              requestAnimationFrame(() => {
                badge.style.animation = "";
              });
            }
          }
        });
      });
  
      // ── Keyboard navigation for tabs ──
      const tabList = document.querySelector(".payment-toggle");
      if (tabList) {
        tabList.addEventListener("keydown", (e) => {
          const tabsArr = Array.from(tabs);
          const current = tabsArr.findIndex((t) => t === document.activeElement);
          if (current === -1) return;
  
          let next = -1;
  
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            next = (current + 1) % tabsArr.length;
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            next = (current - 1 + tabsArr.length) % tabsArr.length;
          } else if (e.key === "Home") {
            e.preventDefault();
            next = 0;
          } else if (e.key === "End") {
            e.preventDefault();
            next = tabsArr.length - 1;
          }
  
          if (next !== -1) {
            tabsArr[next].focus();
            tabsArr[next].click();
          }
        });
      }
    })();
  
  
    /* ===================================================
       6. PHASE ACCORDION
       Opens / closes the 4 "Was dich erwartet" phases
       with measured max-height for a smooth transition.
       Only one phase open at a time.
    =================================================== */
  
    (function initPhaseAccordion() {
      const phaseItems = document.querySelectorAll(".phase-item");
      if (!phaseItems.length) return;
  
      function openPhase(item) {
        const trigger = item.querySelector(".phase-trigger");
        const body    = item.querySelector(".phase-body");
        if (!trigger || !body) return;
  
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
  
        body.hidden = false;
        // Measure real height then animate
        const height = body.scrollHeight;
        body.style.maxHeight = "0px";
        body.classList.add("is-open");
  
        // Double rAF to ensure browser registers the maxHeight:0 first
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            body.style.maxHeight = height + "px";
          });
        });
      }
  
      function closePhase(item) {
        const trigger = item.querySelector(".phase-trigger");
        const body    = item.querySelector(".phase-body");
        if (!trigger || !body) return;
  
        item.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        body.classList.remove("is-open");
        body.style.maxHeight = "0px";
  
        // Hide after transition so it's removed from tab order
        body.addEventListener(
          "transitionend",
          () => {
            if (!item.classList.contains("is-open")) {
              body.hidden = true;
            }
          },
          { once: true }
        );
      }
  
      phaseItems.forEach((item) => {
        const trigger = item.querySelector(".phase-trigger");
        if (!trigger) return;
  
        trigger.addEventListener("click", () => {
          const isOpen = item.classList.contains("is-open");
  
          // Close all others first
          phaseItems.forEach((other) => {
            if (other !== item && other.classList.contains("is-open")) {
              closePhase(other);
            }
          });
  
          // Toggle clicked item
          isOpen ? closePhase(item) : openPhase(item);
        });
  
        // Keyboard: Enter / Space already fire click on buttons.
        // Add arrow key navigation between phase triggers.
        trigger.addEventListener("keydown", (e) => {
          const triggers = Array.from(
            document.querySelectorAll(".phase-trigger")
          );
          const idx = triggers.indexOf(trigger);
  
          if (e.key === "ArrowDown") {
            e.preventDefault();
            triggers[(idx + 1) % triggers.length].focus();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            triggers[(idx - 1 + triggers.length) % triggers.length].focus();
          }
        });
      });
  
      // Open the first phase by default for a nice first impression
      if (phaseItems[0]) {
        openPhase(phaseItems[0]);
      }
    })();
  
  
    /* ===================================================
       7. PREMIUM CARD AMBIENT GLOW — cursor tracking
       Mirrors the mw-card glow from the home page but
       applied to the single premium card.
    =================================================== */
  
    (function initPremiumCardGlow() {
      const card = document.querySelector(".premium-card");
      const glow = card ? card.querySelector(".premium-card-ambient") : null;
      if (!card || !glow) return;
      if (prefersReducedMotion.matches) return;
  
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        glow.style.transform = `translate(${x - 50}%, ${y - 50}%)`;
        glow.style.opacity   = "1";
      });
  
      card.addEventListener("mouseleave", () => {
        glow.style.transform = "translate(0%, 0%)";
        glow.style.opacity   = "0.6";
      });
    })();
  
  
    /* ===================================================
       8. STAGGERED PHASE ENTRANCE ANIMATION
       When the phases container enters the viewport,
       each phase item staggers in one by one.
    =================================================== */
  
    (function initPhaseEntrance() {
      const phases = document.querySelectorAll(".phase-item");
      if (!phases.length || prefersReducedMotion.matches) return;
  
      // Set initial invisible state
      phases.forEach((phase, i) => {
        phase.style.opacity   = "0";
        phase.style.transform = "translateX(-16px)";
        phase.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.08}s`;
      });
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
  
            phases.forEach((phase) => {
              phase.style.opacity   = "1";
              phase.style.transform = "translateX(0)";
            });
  
            observer.disconnect();
          });
        },
        { threshold: 0.15 }
      );
  
      const container = document.querySelector(".premium-phases");
      if (container) observer.observe(container);
    })();
  
  
    /* ===================================================
       9. KOMPAKT CARD — subtle entrance counter
       Counts up the price from 0 to 236 when the card
       enters the viewport. A small but memorable detail.
    =================================================== */
  
    (function initPriceCounter() {
      const priceEl = document.querySelector(".kompakt-price");
      if (!priceEl || prefersReducedMotion.matches) return;
  
      const target   = 236;
      const duration = 900; // ms
      let started    = false;
  
      function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
      }
  
      function runCounter(startTime) {
        const elapsed  = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current  = Math.round(easeOutQuart(progress) * target);
  
        priceEl.textContent = current + " €";
  
        if (progress < 1) {
          requestAnimationFrame(() => runCounter(startTime));
        } else {
          priceEl.textContent = "236 €";
        }
      }
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || started) return;
            started = true;
            runCounter(Date.now());
            observer.disconnect();
          });
        },
        { threshold: 0.5 }
      );
  
      const card = document.querySelector(".kompakt-card");
      if (card) observer.observe(card);
    })();
  
  
    /* ===================================================
       10. PLAN HERO PARALLAX — subtle depth on scroll
       The glow blobs drift slightly as the user scrolls
       past the hero, adding depth without being distracting.
    =================================================== */
  
    (function initHeroParallax() {
      const glow1 = document.querySelector(".plan-hero-glow--1");
      const glow2 = document.querySelector(".plan-hero-glow--2");
      const hero  = document.querySelector(".plan-hero");
  
      if (!glow1 || !glow2 || !hero || prefersReducedMotion.matches) return;
  
      let ticking = false;
  
      function update() {
        const heroBottom = hero.getBoundingClientRect().bottom;
        // Only run while hero is visible
        if (heroBottom < 0) return;
  
        const progress = Math.max(0, 1 - heroBottom / hero.offsetHeight);
  
        glow1.style.transform = `translate(${progress * -30}px, ${progress * 20}px) scale(${1 + progress * 0.05})`;
        glow2.style.transform = `translate(${progress * 20}px, ${progress * -15}px) scale(${1 + progress * 0.04})`;
  
        ticking = false;
      }
  
      window.addEventListener("scroll", () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });
    })();
  
  
    /* ===================================================
       11. TRUST STRIP — stagger items on reveal
    =================================================== */
  
    (function initTrustStagger() {
      const items = document.querySelectorAll(".plan-trust-item");
      if (!items.length || prefersReducedMotion.matches) return;
  
      items.forEach((item, i) => {
        item.style.opacity   = "0";
        item.style.transform = "translateY(12px)";
        item.style.transition = `opacity 0.5s ease ${i * 0.12}s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12}s`;
      });
  
      const trustSection = document.querySelector(".plan-trust");
      if (!trustSection) return;
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            items.forEach((item) => {
              item.style.opacity   = "1";
              item.style.transform = "translateY(0)";
            });
            observer.disconnect();
          });
        },
        { threshold: 0.4 }
      );
  
      observer.observe(trustSection);
    })();
  
  
    /* ===================================================
       12. BADGE STRIP — stagger on reveal
    =================================================== */
  
    (function initBadgeStagger() {
      const badges = document.querySelectorAll(".premium-badge");
      if (!badges.length || prefersReducedMotion.matches) return;
  
      badges.forEach((badge, i) => {
        badge.style.opacity   = "0";
        badge.style.transform = "translateY(10px) scale(0.95)";
        badge.style.transition = `opacity 0.45s ease ${i * 0.1}s, transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s`;
      });
  
      const strip = document.querySelector(".premium-badge-strip");
      if (!strip) return;
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            badges.forEach((badge) => {
              badge.style.opacity   = "1";
              badge.style.transform = "translateY(0) scale(1)";
            });
            observer.disconnect();
          });
        },
        { threshold: 0.5 }
      );
  
      observer.observe(strip);
    })();
  
  
    /* ===================================================
       13. KOMPAKT LIST ITEMS — stagger on reveal
    =================================================== */
  
    (function initKompaktListStagger() {
      const items = document.querySelectorAll(".kompakt-list li");
      if (!items.length || prefersReducedMotion.matches) return;
  
      items.forEach((item, i) => {
        item.style.opacity   = "0";
        item.style.transform = "translateX(-12px)";
        item.style.transition = `opacity 0.45s ease ${i * 0.09}s, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.09}s`;
      });
  
      const card = document.querySelector(".kompakt-card");
      if (!card) return;
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            items.forEach((item) => {
              item.style.opacity   = "1";
              item.style.transform = "translateX(0)";
            });
            observer.disconnect();
          });
        },
        { threshold: 0.3 }
      );
  
      observer.observe(card);
    })();
  
  
    /* ===================================================
       14. PLAN DIVIDER — animate rules on reveal
    =================================================== */
  
    (function initDividerAnimation() {
      const divider = document.querySelector(".plan-divider");
      const rules   = divider ? divider.querySelectorAll(".plan-divider-rule") : [];
      const text    = divider ? divider.querySelector(".plan-divider-text") : null;
  
      if (!divider || !rules.length || prefersReducedMotion.matches) return;
  
      rules.forEach((rule) => {
        rule.style.transform = "scaleX(0)";
        rule.style.transition = "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s";
      });
  
      if (text) {
        text.style.opacity = "0";
        text.style.transition = "opacity 0.5s ease 0.3s";
      }
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            rules.forEach((rule) => { rule.style.transform = "scaleX(1)"; });
            if (text) text.style.opacity = "1";
            observer.disconnect();
          });
        },
        { threshold: 0.8 }
      );
  
      observer.observe(divider);
    })();
  
  
    /* ===================================================
       15. PHASE BODY — recalculate max-height on resize
       If fonts scale or content reflows, open phase
       bodies need their max-height recalculated.
    =================================================== */
  
    (function initPhaseResizeHandler() {
      const handleResize = debounce(() => {
        document.querySelectorAll(".phase-item.is-open").forEach((item) => {
          const body = item.querySelector(".phase-body");
          if (body && body.classList.contains("is-open")) {
            body.style.maxHeight = body.scrollHeight + "px";
          }
        });
      }, 200);
  
      window.addEventListener("resize", handleResize);
    })();
  
  
  }); // end DOMContentLoaded