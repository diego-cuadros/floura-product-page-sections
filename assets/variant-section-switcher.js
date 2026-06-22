/*
 * variant-section-switcher.js
 *
 * Shared variant switcher for the custom product sections that pre-render every
 * variant's content and toggle visibility on variant change (no page reload):
 *   - sections/custom-hero.liquid
 *   - sections/custom-nutrition-facts.liquid
 *   - sections/custom-accordion-faq.liquid
 *
 * Each section marks its wrapper element with `data-variant-switcher` and is
 * configured entirely through data attributes:
 *   data-variant-switcher            Marks the element for initialization.
 *   data-slide-selector              CSS selector (within the wrapper) for the
 *                                    per-variant slides. Each slide carries a
 *                                    `data-variant-id`. Defaults to
 *                                    `[data-variant-id]`.
 *   data-hidden-variant-id           Optional. When the selected variant matches
 *                                    this id the whole section is hidden.
 *   data-question-selector           Optional. CSS selector for accordion question
 *                                    buttons; clicking one toggles aria-expanded.
 *
 * Variant changes are picked up from:
 *   - standard product templates: theme:variant:change / shapes:product:variantchange
 *   - bundle-subscription buy box: [data-variant-radio] / [data-variant-id]
 *     (that template dispatches NO theme:variant:change — see
 *     snippets/buy-box-bundle-subscription.liquid)
 *   - URL ?variant=ID on load
 */
(function () {
  'use strict';

  // The file may be requested by more than one section on the same page; only
  // wire everything up once.
  if (window.__variantSectionSwitcherLoaded) return;
  window.__variantSectionSwitcherLoaded = true;

  function showVariant(wrapper, variantId) {
    if (!variantId) return;
    var target = String(variantId);
    var hiddenId = wrapper.getAttribute('data-hidden-variant-id') || '';

    // Hide the entire section for the configured variant.
    if (hiddenId) {
      if (target === hiddenId) {
        wrapper.style.display = 'none';
        return;
      }
      wrapper.style.display = '';
    }

    var slideSelector = wrapper.getAttribute('data-slide-selector') || '[data-variant-id]';
    wrapper.querySelectorAll(slideSelector).forEach(function (slide) {
      slide.style.display = slide.dataset.variantId === target ? '' : 'none';
    });
  }

  function init(wrapper) {
    if (!wrapper || wrapper.dataset.variantSwitcherBound) return;
    wrapper.dataset.variantSwitcherBound = '1';

    // Accordion toggle (works across every pre-rendered variant), when configured.
    var questionSelector = wrapper.getAttribute('data-question-selector');
    if (questionSelector) {
      wrapper.addEventListener('click', function (event) {
        var btn = event.target.closest && event.target.closest(questionSelector);
        if (!btn || !wrapper.contains(btn)) return;
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
    }

    // Standard product templates: Shapes product island events.
    function handleThemeEvent(event) {
      var variant = event.detail && event.detail.variant;
      if (variant && variant.id) showVariant(wrapper, variant.id);
    }
    document.addEventListener('theme:variant:change', handleThemeEvent);
    document.addEventListener('shapes:product:variantchange', handleThemeEvent);

    // Bundle-subscription buy box (no variant-change event is dispatched).
    document.addEventListener('change', function (event) {
      var radio = event.target.closest && event.target.closest('[data-variant-radio]');
      if (radio) showVariant(wrapper, radio.value);
    });
    document.addEventListener('click', function (event) {
      var el = event.target.closest && event.target.closest('[data-variant-id]');
      if (el) showVariant(wrapper, el.dataset.variantId);
    });

    // Initial state: honour a pre-selected variant from the URL (?variant=ID).
    var requestedId = new URLSearchParams(window.location.search).get('variant');
    if (requestedId) showVariant(wrapper, requestedId);
  }

  function initAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-variant-switcher]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll();
    });
  } else {
    initAll();
  }

  // Theme editor: (re)initialize when a section is loaded.
  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();
