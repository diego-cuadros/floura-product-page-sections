/**
 * bundle-subscription.js
 *
 * ⚠️  TEMPLATE RESTRICTION:
 *    This script is conditionally loaded by layout/theme.liquid only
 *    when template.suffix == 'bundle-subscription'. It bails out
 *    silently if .bundle-subscription-buybox is not found in the DOM.
 *
 * Phase 1 — UI behaviour only:
 *   • Pack selector: 1 / 2 / 3 (mix-and-match: exact total per tier; + caps like old 4-pack)
 *   • Mix-and-match +/- stepper with total enforcement
 *   • Progress bar + counter update
 *   • Add-to-cart button enabled/disabled state
 *
 * Phase 2 (out of scope here):
 *   • Skio selling_plan_id reading
 *   • Subscribe vs one-time toggle
 *   • Subscription pricing display
 *   • AJAX /cart/add.js submission
 *   • Cart drawer / cart refresh events
 */

(function () {
  'use strict';

  /** Entry point — waits for DOM then checks we are on the right template */
  function init() {
    const buybox = document.querySelector('.bundle-subscription-buybox');
    if (!buybox) return;

    const packRadios       = buybox.querySelectorAll('[name="pack-count"]');
    const variantSelector  = buybox.querySelector('[data-variant-selector]');
    const mixMatchSelector = buybox.querySelector('[data-mix-match-selector]');

    const progressFill     = buybox.querySelector('[data-progress-fill]');
    const atcBtn           = buybox.querySelector('[data-add-to-cart]');

    if (!packRadios.length) return;

    // ── Helpers ──────────────────────────────────────────────────

    /** Selected pack tier: '1' | '2' | '3' (string values from [name="pack-count"]) */
    function getPackTier() {
      var checked = buybox.querySelector('[name="pack-count"]:checked');
      return checked ? String(checked.value) : '2';
    }

    /**
     * Sums all [data-qty] span values inside the mix-match panel.
     * @returns {number}
     */
    function getTotalSelected() {
      let total = 0;
      buybox.querySelectorAll('[data-qty]').forEach(function (el) {
        total += parseInt(el.textContent, 10) || 0;
      });
      return total;
    }

    /** Resets all stepper quantities back to zero */
    function resetQuantities() {
      buybox.querySelectorAll('[data-qty]').forEach(function (el) {
        el.textContent = '0';
      });
      refreshItemActiveStates();
    }

    /** Toggles --active on each mix-match item based on whether its qty > 0 */
    function refreshItemActiveStates() {
      buybox.querySelectorAll('[data-qty]').forEach(function (qtyEl) {
        var variantId = qtyEl.dataset.qty;
        var itemEl    = buybox.querySelector('.mix-match-selector__item[data-variant-id="' + variantId + '"]');
        if (!itemEl) return;
        var qty = parseInt(qtyEl.textContent, 10) || 0;
        itemEl.classList.toggle('mix-match-selector__item--active', qty > 0);
      });
    }

    // ── View toggling ─────────────────────────────────────────────

    /**
     * Switches between the single-variant dropdown (1 pack) and
     * the mix-and-match panel (2 or 3 packs), then refreshes
     * counter/progress/button state.
     */
    function updateView() {
      var pack = getPackTier();

      if (pack === '1') {
        // Show dropdown, hide mix-match
        showElement(variantSelector);
        hideElement(mixMatchSelector);
      } else {
        // Show mix-match, hide dropdown
        hideElement(variantSelector);
        showElement(mixMatchSelector);

        // Reset quantities so previous selections don't carry over
        resetQuantities();
        refreshCounterAndProgress(pack);
        refreshStepperStates(pack);
      }

      refreshAtcButton(pack);
    }

    function showElement(el) {
      if (!el) return;
      el.style.display = '';
      el.removeAttribute('aria-hidden');
    }

    function hideElement(el) {
      if (!el) return;
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    }

    // ── Counter & progress bar ────────────────────────────────────

    /**
     * Progress bar fill toward selection target.
     * - pack 2: exact 2
     * - pack 3: minimum 3 (3+ packs)
     * @param {string} pack - '1' | '2' | '3'
     */
    function refreshCounterAndProgress(pack) {
      var selected = getTotalSelected();

      if (progressFill) {
        var cap = parseInt(pack, 10);
        var pct =
          cap > 0 ? Math.min((selected / cap) * 100, 100) : 0;
        progressFill.style.width = pct + '%';
      }
    }

    // ── Add-to-cart button state ──────────────────────────────────

    /**
     * Enables the ATC when selection is complete:
     *   • 1 pack → always
     *   • 2 packs → exact total matches pack count
     *   • 3+ packs → total is at least 3
     * @param {string} pack
     */
    function refreshAtcButton(pack) {
      if (!atcBtn) return;

      var ready;
      var total = getTotalSelected();

      if (pack === '1') {
        ready = true;
      } else if (pack === '3') {
        ready = total >= 3;
      } else {
        ready = total === parseInt(pack, 10);
      }

      atcBtn.disabled = !ready;
      atcBtn.setAttribute('aria-disabled', String(!ready));

      if (ready) {
        atcBtn.setAttribute('aria-label', 'Add to cart');
      } else {
        var remaining = (pack === '3')
          ? Math.max(3 - total, 0)
          : (parseInt(pack, 10) - total);
        atcBtn.setAttribute(
          'aria-label',
          'Add to cart — ' + remaining + ' more pack' + (remaining !== 1 ? 's' : '') + ' to select'
        );
      }
    }

    // ── Stepper interactions ──────────────────────────────────────

    /**
     * Handles +/- button clicks via event delegation on the buybox
     * wrapper, so it works regardless of DOM re-renders.
     */
    function handleStepperClick(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;

      var action    = btn.dataset.action;
      var variantId = btn.dataset.variantId;
      if (!variantId) return;

      var qtyEl = buybox.querySelector('[data-qty="' + variantId + '"]');
      if (!qtyEl) return;

      var pack    = getPackTier();
      var current = parseInt(qtyEl.textContent, 10) || 0;
      var total   = getTotalSelected();

      if (action === 'increase') {
        // pack === '3' means 3+ packs (no max)
        var cap = parseInt(pack, 10);
        if (pack === '3' || total < cap) {
          qtyEl.textContent = current + 1;
        }
      } else if (action === 'decrease') {
        if (current > 0) {
          qtyEl.textContent = current - 1;
        }
      }

      refreshCounterAndProgress(pack);
      refreshAtcButton(pack);
      refreshStepperStates(pack);
      refreshItemActiveStates();
      refreshSubPricing();
    }

    /**
     * Disables "+" when the mix-and-match total matches the pack count (2 only).
     * For 3+ packs, "+" never disables (no max).
     * @param {string} pack
     */
    function refreshStepperStates(pack) {
      var total   = getTotalSelected();
      var capHit  = (pack === '3') ? false : (total >= parseInt(pack, 10));

      buybox.querySelectorAll('[data-action="increase"]').forEach(function (btn) {
        var variantId  = btn.dataset.variantId;
        var itemEl     = buybox.querySelector('[data-variant-id="' + variantId + '"]');
        var unavailable = itemEl && itemEl.dataset.available === 'false';

        // Keep unavailable items permanently disabled
        if (!unavailable) {
          btn.disabled = capHit;
          btn.setAttribute('aria-disabled', String(capHit));
        }
      });
    }

    // ── Subscribe & Save — per-pack pricing swap ──────────────────

    var purchaseOptionsEl = buybox.querySelector('[data-purchase-options]');
    var subPriceEl        = buybox.querySelector('[data-sub-price]');
    var comparePriceEl    = buybox.querySelector('[data-compare-price]');
    var discountBadgeEl   = buybox.querySelector('[data-discount-badge]');

    function formatCents(cents) {
      // Provided by assets/utils.js (loaded globally on all pages)
      if (typeof formatMoney === 'function') return formatMoney(cents);
      return String(cents);
    }

    /**
     * Line totals for the selected pack count: (discounted per-pack price × packs)
     * and compare-at (full catalog price × packs). Values are pre-rendered in Liquid.
     */
    function refreshSubPricing() {
      if (!purchaseOptionsEl) return;
      var pack = getPackTier();

      // Use getAttribute — dataset keys for data-sub-total-1 etc. are inconsistent across browsers
      var subTotal     = purchaseOptionsEl.getAttribute('data-sub-total-' + pack);
      var compareTotal = purchaseOptionsEl.getAttribute('data-compare-total-' + pack);
      var discountPct  = purchaseOptionsEl.getAttribute('data-discount-pct-' + pack);
      var onetimeTotal = purchaseOptionsEl.getAttribute('data-onetime-total-' + pack);

      // 3+ packs: totals scale with selected qty (minimum 3)
      if (pack === '3') {
        var selectedQty = getTotalSelected();
        var qtyForPricing = Math.max(3, selectedQty || 0);

        var comparePackCents = parseInt(purchaseOptionsEl.getAttribute('data-compare-pack-cents'), 10) || 0;
        var subPackCents     = parseInt(purchaseOptionsEl.getAttribute('data-sub-pack-cents-3'), 10) || 0;
        var otPackCents      = parseInt(purchaseOptionsEl.getAttribute('data-onetime-pack-cents-3'), 10) || 0;

        compareTotal = formatCents(comparePackCents * qtyForPricing);
        subTotal     = formatCents(subPackCents * qtyForPricing);
        onetimeTotal = formatCents(otPackCents * qtyForPricing);
      }

      if (subPriceEl && subTotal) subPriceEl.textContent = subTotal;
      if (comparePriceEl && compareTotal) {
        comparePriceEl.textContent = compareTotal;
      }
      // Metafield tiers: 1 / 2 / 3-pack (discount-pct-3 from subscription_discount_percent_4)
      if (discountBadgeEl && discountPct !== null && String(discountPct).trim() !== '') {
        discountBadgeEl.textContent = 'Save ' + String(discountPct).trim() + '%';
      }

      var onetimePriceEl = buybox.querySelector('[data-onetime-price]');
      if (onetimePriceEl && onetimeTotal) {
        onetimePriceEl.textContent = onetimeTotal;
      }
    }

    // ── Pack selection (delegated — reliable when clicking labels / all browsers) ──

    buybox.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || t.name !== 'pack-count') return;
      updateView();
      refreshSubPricing();
    });

    // ── Stepper delegation ────────────────────────────────────────

    buybox.addEventListener('click', handleStepperClick);

    // ── Add to cart ───────────────────────────────────────────────

    if (atcBtn) {
      /**
       * Scoped ATC handler — attached directly to our button so it fires
       * before any delegated (parent-level) theme listeners. stopPropagation
       * prevents the event from bubbling up to the theme's cart handler.
       * Does NOT use capture phase, so it has zero effect on other buttons.
       */
      atcBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var pack = getPackTier();

        // ── Determine purchase type ──────────────────────────────
        var purchaseTypeRadio = buybox.querySelector('[data-purchase-type]:checked');
        var isSubscribe       = !purchaseTypeRadio || purchaseTypeRadio.value === 'subscribe';

        // ── Resolve selling_plan_id ──────────────────────────────
        // Only included when subscribe is active AND a valid numeric plan ID exists.
        var sellingPlanId = null;
        if (isSubscribe) {
          var freqSelect = buybox.querySelector('[data-frequency-select]');
          var rawPlanId  = freqSelect ? parseInt(freqSelect.value, 10) : NaN;
          if (!isNaN(rawPlanId) && rawPlanId > 0) sellingPlanId = rawPlanId;
        }

        // ── Build items array ────────────────────────────────────
        var items = [];

        if (pack === '1') {
          var variantIdEl = buybox.querySelector('[data-selected-variant-id]');
          var variantId   = variantIdEl ? parseInt(variantIdEl.value, 10) : null;
          if (!variantId) return;
          var item = { id: variantId, quantity: 1 };
          if (sellingPlanId) item.selling_plan = sellingPlanId;
          items.push(item);
        } else {
          buybox.querySelectorAll('[data-qty]').forEach(function (qtyEl) {
            var qty       = parseInt(qtyEl.textContent, 10) || 0;
            var variantId = parseInt(qtyEl.dataset.qty, 10);
            if (qty > 0 && variantId) {
              var item = { id: variantId, quantity: qty };
              if (sellingPlanId) item.selling_plan = sellingPlanId;
              items.push(item);
            }
          });
        }

        if (!items.length) return;

        // ── Submit to cart ───────────────────────────────────────
        var originalLabel   = atcBtn.textContent;
        atcBtn.disabled     = true;
        atcBtn.textContent  = 'Adding…';

        fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept':       'application/json'
          },
          body: JSON.stringify({ items: items })
        })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (data) {
              throw new Error(data.description || ('Cart error ' + res.status));
            });
          }
          return res.json();
        })
        .then(function () {
          atcBtn.textContent = 'Added!';

          // Reset mix-and-match selections so the customer can start a fresh order
          if (pack !== '1') {
            resetQuantities();
            refreshCounterAndProgress(pack);
            refreshStepperStates(pack);
          }

          // Trigger this theme's (Shapes) cart refresh + drawer open
          document.dispatchEvent(new CustomEvent('theme:update:cart', { bubbles: true }));
          document.dispatchEvent(new CustomEvent('theme:cart-drawer:open', { bubbles: true }));

          setTimeout(function () {
            atcBtn.textContent = originalLabel;
            refreshAtcButton(pack);
          }, 2000);
        })
        .catch(function (err) {
          console.error('[bundle-subscription] Cart add failed:', err);
          atcBtn.textContent = 'Error — try again';
          atcBtn.disabled    = false;
          setTimeout(function () {
            atcBtn.textContent = originalLabel;
            refreshAtcButton(pack);
          }, 2500);
        });
      });
    }

    // ── 1-pack variant radio list ─────────────────────────────────
    // When a flavor radio changes, keep the hidden [data-selected-variant-id]
    // input in sync so the ATC handler picks up the right variant.

    var selectedVariantInput = buybox.querySelector('[data-selected-variant-id]');

    buybox.querySelectorAll('[data-variant-radio]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (selectedVariantInput) selectedVariantInput.value = this.value;
      });
    });

    // ── Purchase option toggle (subscribe / one-time) ─────────────

    var purchaseTypeRadios   = buybox.querySelectorAll('[data-purchase-type]');
    var subscribeExpandPanel = buybox.querySelector('.purchase-option__subscribe-expand');

    /**
     * Pack tiles: catalog strikethrough + net price; unit suffix is “/bar” in Liquid.
     */
    function refreshPackPerBar() {
      var hasSellingPlans =
        buybox.getAttribute('data-has-selling-plans') === 'true';
      var subscribeRadio = buybox.querySelector(
        '[data-purchase-type][value="subscribe"]'
      );
      var useSubscribe =
        hasSellingPlans && subscribeRadio && subscribeRadio.checked;

      buybox.querySelectorAll('.pack-selector__per-bar-line').forEach(function (row) {
        var grossEl = row.querySelector('.pack-selector__per-bar-gross');
        var netEl   = row.querySelector('.pack-selector__per-bar');
        if (!netEl) return;

        var priceText = useSubscribe
          ? netEl.dataset.perBarSubscribe
          : netEl.dataset.perBarOnetime;
        if (priceText) netEl.textContent = priceText;

        if (!grossEl) return;
        var grossCents =
          parseInt(grossEl.getAttribute('data-gross-cents'), 10) || 0;
        var netCents = useSubscribe
          ? parseInt(netEl.getAttribute('data-sub-cents'), 10) || 0
          : parseInt(netEl.getAttribute('data-ot-cents'), 10) || 0;

        if (grossCents > netCents) {
          grossEl.removeAttribute('hidden');
        } else {
          grossEl.setAttribute('hidden', '');
        }
      });
    }

    /**
     * Visibility of frequency + perks is animated via CSS (grid 0fr → 1fr).
     * Use inert + aria-hidden so collapsed content isn’t focused or announced.
     */
    function refreshPurchaseView() {
      var subscribeRadio = buybox.querySelector('[data-purchase-type][value="subscribe"]');
      var isSubscribe    = subscribeRadio && subscribeRadio.checked;

      if (subscribeExpandPanel) {
        subscribeExpandPanel.setAttribute('aria-hidden', String(!isSubscribe));
        if (isSubscribe) {
          subscribeExpandPanel.removeAttribute('inert');
        } else {
          subscribeExpandPanel.setAttribute('inert', '');
        }
      }

      // Re-run line totals + “Save X%” badge so pack tier stays in sync (e.g. after toggling purchase type)
      refreshSubPricing();
      refreshPackPerBar();
    }

    purchaseTypeRadios.forEach(function (radio) {
      radio.addEventListener('change', refreshPurchaseView);
    });

    // ── Pre-select a variant from the URL (e.g. homepage banner CTA) ──
    // Supports /products/floura-daily-fibers-bars?variant=VARIANT_ID.
    // Forces the 1-Pack view and checks the matching flavor radio so the
    // customer lands with that flavor already selected and ready to buy.
    // Runs before updateView() so the initial render reflects the choice.
    function applyVariantFromUrl() {
      var requestedId = new URLSearchParams(window.location.search).get('variant');
      if (!requestedId) return;

      var targetRadio = buybox.querySelector(
        '[data-variant-radio][value="' + CSS.escape(requestedId) + '"]'
      );
      // Unknown id, or flavor out of stock (radio disabled) → leave defaults.
      if (!targetRadio || targetRadio.disabled) return;

      // Force the 1-Pack tier so the single-flavor selector is the active view.
      var onePackRadio = buybox.querySelector('[name="pack-count"][value="1"]');
      if (onePackRadio) onePackRadio.checked = true;

      // Check the requested flavor and sync the hidden id read by the ATC handler.
      targetRadio.checked = true;
      if (selectedVariantInput) selectedVariantInput.value = targetRadio.value;
    }

    // ── Initialise on load ────────────────────────────────────────

    applyVariantFromUrl();
    updateView();
    refreshPurchaseView();
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
