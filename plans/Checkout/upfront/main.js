/* =====================================================
   CHECKOUT — UPFRONT · main.js
   Metabolic Freedom · Freedom Journey Einmalzahlung
   Shared by installments.html via data-target attribute
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
     If reduced motion is on, ensure all animated
     children are immediately visible.
  =================================================== */

  (function initEntranceGuard() {
    if (!prefersReducedMotion.matches) return;

    const animated = document.querySelectorAll(
      ".co-summary-inner > *, .co-payment-inner > *"
    );
    animated.forEach((el) => {
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

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

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
     4. AMOUNT DISPLAY — count-up on load
     Reads target from data-target attribute.
     Fallback: 2249 (upfront page default).
     installments.html uses data-target="1500"
  =================================================== */

  (function initPriceCountUp() {
    const el = document.querySelector(".co-amount-value");
    if (!el || prefersReducedMotion.matches) return;

    const target   = parseInt(el.dataset.target || "2249", 10);
    const duration = 1100;
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
     5. SAVING BADGE — pulse after pop animation
  =================================================== */

  (function initSavingBadgePulse() {
    const badge = document.querySelector(".co-amount-saving-badge");
    if (!badge || prefersReducedMotion.matches) return;

    if (!document.getElementById("saving-pulse-style")) {
      const style = document.createElement("style");
      style.id = "saving-pulse-style";
      style.textContent = `
        @keyframes savingBadgePulse {
          0%, 100% { box-shadow: 0 0 0 0px rgba(186, 230, 62, 0);    }
          50%       { box-shadow: 0 0 0 5px rgba(186, 230, 62, 0.08); }
        }
      `;
      document.head.appendChild(style);
    }

    badge.addEventListener("animationend", () => {
      badge.style.animation = "savingBadgePulse 3s ease-in-out infinite 1s";
    }, { once: true });
  })();


  /* ===================================================
     6. PAYPAL ZONE — loading skeleton
  =================================================== */

  (function initPayPalSkeleton() {
    const zone    = document.querySelector(".co-paypal-zone");
    const wrapper = document.querySelector(".co-paypal-wrapper");
    if (!zone || !wrapper) return;

    // Inject skeleton styles
    if (!document.getElementById("paypal-skeleton-style")) {
      const style = document.createElement("style");
      style.id = "paypal-skeleton-style";
      style.textContent = `
        .co-paypal-skeleton {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }

        .co-paypal-skeleton-bar {
          border-radius: 8px;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.03) 25%,
            rgba(255,255,255,0.06) 50%,
            rgba(255,255,255,0.03) 75%
          );
          background-size: 200% 100%;
          animation: skeletonShimmer 1.6s ease-in-out infinite;
        }

        .co-paypal-skeleton-bar--main {
          height: 55px;
          width: 100%;
        }

        .co-paypal-skeleton-bar--alt {
          height: 55px;
          width: 100%;
          opacity: 0.5;
        }

        @keyframes skeletonShimmer {
          0%   { background-position:  100% 0; }
          100% { background-position: -100% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .co-paypal-skeleton-bar { animation: none; }
        }
      `;
      document.head.appendChild(style);
    }

    // Build skeleton
    const skeleton = document.createElement("div");
    skeleton.className = "co-paypal-skeleton";
    skeleton.setAttribute("aria-hidden", "true");
    skeleton.innerHTML = `
      <div class="co-paypal-skeleton-bar co-paypal-skeleton-bar--main"></div>
      <div class="co-paypal-skeleton-bar co-paypal-skeleton-bar--alt"></div>
    `;
    wrapper.appendChild(skeleton);

    function removeSkeleton() {
      if (!skeleton.parentNode) return;
      skeleton.style.opacity = "0";
      setTimeout(() => {
        if (skeleton.parentNode) skeleton.remove();
      }, 450);
    }

    // Watch for PayPal iframe
    const observer = new MutationObserver(() => {
      const iframe = wrapper.querySelector("iframe");
      if (!iframe) return;
      observer.disconnect();
      iframe.addEventListener("load", removeSkeleton, { once: true });
      // Fallback if load already fired
      setTimeout(removeSkeleton, 2500);
    });

    observer.observe(wrapper, { childList: true, subtree: true });

    // Hard fallback — 6s
    setTimeout(removeSkeleton, 6000);
  })();


  /* ===================================================
     7. PAYPAL SUCCESS STATE
     Replaces the paypal zone with a success card.
     Call window.__mf_onPayPalApprove(id) from
     the onApprove callback in the HTML script tag.
  =================================================== */

  (function initPayPalSuccess() {
    const zone = document.querySelector(".co-paypal-zone");
    if (!zone) return;

    // Inject success card styles once
    if (!document.getElementById("success-card-style")) {
      const style = document.createElement("style");
      style.id = "success-card-style";
      style.textContent = `
        .co-success-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 28px;
          border-radius: 16px;
          background: rgba(186, 230, 62, 0.05);
          border: 1px solid rgba(186, 230, 62, 0.2);
          animation: successIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .co-success-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(186, 230, 62, 0.08);
          border: 1px solid rgba(186, 230, 62, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--green-accent);
        }

        .co-success-text {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 4px;
        }

        .co-success-text strong {
          font-size: 1rem;
          color: var(--green-accent);
          font-weight: 600;
        }

        .co-success-text span {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.55;
        }

        @keyframes successIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `;
      document.head.appendChild(style);
    }

    window.__mf_onPayPalApprove = function (subscriptionID) {
      const card = document.createElement("div");
      card.className = "co-success-card";
      card.setAttribute("role", "status");
      card.setAttribute("aria-live", "polite");
      card.innerHTML = `
        <div class="co-success-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="currentColor" stroke-width="1.4"/>
            <path d="M9 14.5l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="co-success-text">
          <strong>Zahlung erfolgreich</strong>
          <span>Du erhältst in Kürze eine E-Mail mit allen nächsten Schritten.</span>
        </div>
      `;

      zone.style.transition = "opacity 0.35s ease, transform 0.35s ease";
      zone.style.opacity    = "0";
      zone.style.transform  = "translateY(-6px)";

      setTimeout(() => zone.replaceWith(card), 380);
    };
  })();


  /* ===================================================
     8. SMOOTH BACK LINK — page fade on exit
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
     9. GUARANTEE BLOCK — icon pulse on scroll-in
  =================================================== */

  (function initGuaranteePulse() {
    const block = document.querySelector(".co-guarantee");
    if (!block || prefersReducedMotion.matches) return;

    const icon = block.querySelector(".co-guarantee-icon");
    if (!icon) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          setTimeout(() => {
            icon.style.transition = "box-shadow 0.4s ease";
            icon.style.boxShadow  = "0 0 0 8px rgba(186, 230, 62, 0.06)";
            setTimeout(() => {
              icon.style.boxShadow = "0 0 0 0px rgba(186, 230, 62, 0)";
            }, 500);
          }, 300);

          observer.disconnect();
        });
      },
      { threshold: 0.8 }
    );

    observer.observe(block);
  })();


  /* ===================================================
     10. RESIZE — recalc sticky summary height
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
     11. PAGE FADE IN on load
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