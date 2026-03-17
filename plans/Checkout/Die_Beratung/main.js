/* =====================================================
   CHECKOUT — DIE BERATUNG · main.js
   Metabolic Freedom · Ernährungsberatung
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
     1. NAVBAR — scroll darken
  =================================================== */

  (function initNavbar() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let lastState = null;

    function update() {
      const next = window.scrollY > 40 ? "scrolled" : "top";
      if (next === lastState) return;
      navbar.classList.toggle("scrolled", next === "scrolled");
      lastState = next;
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  })();


  /* ===================================================
     2. ENTRANCE ANIMATION GUARD
  =================================================== */

  (function initEntranceGuard() {
    if (!prefersReducedMotion.matches) return;

    document.querySelectorAll(
      ".co-summary-inner > *, .co-payment-inner > *"
    ).forEach((el) => {
      el.style.opacity   = "1";
      el.style.transform = "none";
      el.style.animation = "none";
    });
  })();


  /* ===================================================
     3. PRODUCT CARD — ambient cursor glow
  =================================================== */

  (function initCardGlow() {
    const card = document.querySelector(".co-product-card");
    if (!card || prefersReducedMotion.matches) return;

    let rafId    = null;
    let targetX  = 50;
    let targetY  = 50;
    let currentX = 50;
    let currentY = 50;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animate() {
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);
      card.style.setProperty("--glow-x", `${currentX}%`);
      card.style.setProperty("--glow-y", `${currentY}%`);
      rafId = requestAnimationFrame(animate);
    }

    card.addEventListener("mouseenter", () => {
      rafId = requestAnimationFrame(animate);
    });

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width)  * 100;
      targetY = ((e.clientY - rect.top)  / rect.height) * 100;
    });

    card.addEventListener("mouseleave", () => {
      cancelAnimationFrame(rafId);
      targetX = 50;
      targetY = 50;
    });
  })();


  /* ===================================================
     4. AMOUNT DISPLAY — count up to 236
  =================================================== */

  (function initPriceCountUp() {
    const el = document.querySelector(".co-amount-value");
    if (!el || prefersReducedMotion.matches) return;

    const target   = 236;
    const duration = 900;
    const delay    = 400;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    let startTime = null;

    function tick(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current  = Math.round(easeOutExpo(progress) * target);

      el.innerHTML = `${current.toLocaleString("de-DE")} <span class="co-amount-currency">€</span>`;

      if (progress < 1) requestAnimationFrame(tick);
    }

    setTimeout(() => requestAnimationFrame(tick), delay);
  })();


  /* ===================================================
     5. STRIPE BUTTON — hover glow pulse
  =================================================== */

  (function initStripeButtonGlow() {
    const btn = document.querySelector(".co-stripe-btn");
    if (!btn || prefersReducedMotion.matches) return;

    // Inject stripe glow pulse keyframe
    if (!document.getElementById("stripe-glow-style")) {
      const style = document.createElement("style");
      style.id = "stripe-glow-style";
      style.textContent = `
        @keyframes stripeGlowPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,.35), 0 0 0   rgba(99,91,255,0);    }
          50%       { box-shadow: 0 8px 32px rgba(0,0,0,.35), 0 0 40px rgba(99,91,255,0.15); }
        }
      `;
      document.head.appendChild(style);
    }

    btn.addEventListener("mouseenter", () => {
      btn.style.animation = "stripeGlowPulse 2s ease-in-out infinite";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.animation = "none";
    });
  })();


  /* ===================================================
     6. STRIPE BUTTON — loading state on click
     Prevents double-clicks and shows feedback while
     the browser navigates to Stripe.
  =================================================== */

  (function initStripeButtonClick() {
    const btn = document.querySelector(".co-stripe-btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      // Already loading
      if (btn.dataset.loading === "true") return;
      btn.dataset.loading = "true";

      const label = btn.querySelector(".co-stripe-btn-label");
      const arrow = btn.querySelector(".co-stripe-btn-arrow");

      if (label) label.textContent = "Wird weitergeleitet…";

      if (arrow) {
        arrow.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
               style="animation: spinOnce 0.6s linear infinite">
            <path d="M9 2a7 7 0 1 1-4.95 2.05" stroke="currentColor"
                  stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        `;

        if (!document.getElementById("spin-style")) {
          const style = document.createElement("style");
          style.id = "spin-style";
          style.textContent = `
            @keyframes spinOnce {
              from { transform: rotate(0deg);   }
              to   { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }
      }

      // Reset after 4s in case navigation is slow or blocked
      setTimeout(() => {
        btn.dataset.loading = "false";
        if (label) label.textContent = "Jetzt buchen";
        if (arrow) {
          arrow.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor"
                    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        }
      }, 4000);
    });
  })();


  /* ===================================================
     7. SMOOTH BACK LINK — page fade on exit
  =================================================== */

  (function initBackLink() {
    const back = document.querySelector(".co-back");
    if (!back || prefersReducedMotion.matches) return;

    back.addEventListener("click", (e) => {
      e.preventDefault();
      const href = back.getAttribute("href");

      document.body.style.transition = "opacity 0.3s ease";
      document.body.style.opacity    = "0";

      setTimeout(() => { window.location.href = href; }, 300);
    });
  })();


  /* ===================================================
     8. RESIZE — recalc sticky summary height
  =================================================== */

  (function initResizeHandler() {
    const summary = document.querySelector(".co-summary-inner");
    if (!summary) return;

    function recalc() {
      const navbar = document.querySelector(".navbar");
      const navH   = navbar ? navbar.offsetHeight : 68;
      summary.style.maxHeight = `calc(100vh - ${navH}px)`;
    }

    window.addEventListener("resize", debounce(recalc, 150));
    recalc();
  })();


  /* ===================================================
     9. PAGE FADE IN on load
  =================================================== */

  (function initPageFadeIn() {
    if (prefersReducedMotion.matches) return;

    document.body.style.opacity    = "0";
    document.body.style.transition = "opacity 0.4s ease";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.style.opacity = "1";
      });
    });
  })();


}); // end DOMContentLoaded