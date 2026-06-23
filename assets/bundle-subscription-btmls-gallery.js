/**
 * bundle-subscription-btmls-gallery.js
 *
 * ⚠️  TEMPLATE RESTRICTION:
 *    Loaded by snippets/product-template.liquid ONLY when
 *    template.suffix == 'bundle-subscription-btmls'. Bails out silently
 *    if the bundle-subscription buy box is not present in the DOM.
 *
 * Behaviour (this template only):
 *   Filters the PDP gallery by the selected flavor. When a flavor variant is
 *   selected in the buy box, only the product media whose FILE NAME contains
 *   that flavor's keyword stays visible — all other images are hidden from the
 *   main carousel (slides) and the thumbnail strips (desktop + mobile).
 *
 *     Blueberry      -> file name contains "blueberry" (or "blueblerry")
 *     Variety Pack   -> file name contains "variety"
 *     Brownie Batter -> file name contains "brownie"
 *     Raspberry Rose -> file name contains "raspberry"
 *
 * Selection is detected from the custom buy box (this template fires no
 * theme:variant:change): the 1-pack flavor radios ([data-variant-radio]) and
 * the mix-and-match flavor tiles (.mix-match-selector__item). Both already set
 * Alpine's currentMediaId; we additionally derive the active flavor and filter.
 */

(function () {
  'use strict';

  /**
   * Flavor groups. `title` substrings are matched (case-insensitive) against the
   * selected variant/flavor name; `file` substrings are matched against image
   * file names. "blueblerry" is kept as a tolerated misspelling for file names.
   */
  var GROUPS = [
    { key: 'blueberry', title: ['blueberry', 'blueblerry'], file: ['blueberry', 'blueblerry'] },
    { key: 'variety',   title: ['variety'],                 file: ['variety'] },
    { key: 'brownie',   title: ['brownie'],                  file: ['brownie'] },
    { key: 'raspberry', title: ['raspberry'],                file: ['raspberry'] },
    { key: 'brambleberry', title: ['brambleberry'],          file: ['brambleberry'] },
    { key: 'vanilla', title: ['vanilla'],                file: ['vanilla'] },
    { key: 'mango', title: ['mango'],                file: ['mango'] }

  ];

  var HIDE_CLASS = 'btmls-gallery-hide';

  function init() {
    var buybox = document.querySelector('.bundle-subscription-buybox');
    if (!buybox) return;

    var root = buybox.closest('[data-product-root]') || document;

    /** Lowercased image file name for a gallery item (slide or thumbnail). */
    function fileNameOf(el) {
      var url = '';
      var a = el.querySelector('a[href]');
      if (a) url = a.getAttribute('href') || '';
      if (!url) {
        var img = el.querySelector('img');
        if (img) url = img.currentSrc || img.getAttribute('src') || '';
      }
      if (!url) return '';
      url = url.split('?')[0];
      var seg = url.split('/').pop() || '';
      try { seg = decodeURIComponent(seg); } catch (e) { /* keep raw */ }
      return seg.toLowerCase();
    }

    /** Resolve a flavor group from a free-text variant/flavor name. */
    function groupFromName(name) {
      if (!name) return null;
      var lower = String(name).toLowerCase();
      for (var i = 0; i < GROUPS.length; i++) {
        var g = GROUPS[i];
        for (var j = 0; j < g.title.length; j++) {
          if (lower.indexOf(g.title[j]) !== -1) return g;
        }
      }
      return null;
    }

    function fileMatchesGroup(fileName, group) {
      for (var i = 0; i < group.file.length; i++) {
        if (fileName.indexOf(group.file[i]) !== -1) return true;
      }
      return false;
    }

    function galleryItems() {
      return root.querySelectorAll(
        '.feature-media-item[data-media-id], .product-thumbnail-list-item[data-media-id]'
      );
    }

    function refreshSplide() {
      var splideEl = root.querySelector ? root.querySelector('.splide--product') : null;
      if (!splideEl || !window.slideshows) return;
      var splide = window.slideshows[splideEl.id];
      if (!splide) return;
      try {
        var Splide = window.Splide;
        if (Splide && splide.state && splide.state.is(Splide.STATES.DESTROYED)) return;
        if (typeof splide.refresh === 'function') splide.refresh();
      } catch (e) { /* no-op */ }
    }

    /** Hide every gallery item not belonging to `group`; show the rest. */
    function applyFilter(group) {
      if (!group) return;
      galleryItems().forEach(function (el) {
        var show = fileMatchesGroup(fileNameOf(el), group);
        el.classList.toggle(HIDE_CLASS, !show);
      });

      // If the currently-featured image got hidden, jump to the first visible
      // matching thumbnail so the main view never shows a non-matching/blank slide.
      var activeThumb = root.querySelector('.product-thumbnail-list-item--active');
      if (activeThumb && activeThumb.classList.contains(HIDE_CLASS)) {
        var firstVisible = root.querySelector(
          '.product-thumbnail-list-item:not(.' + HIDE_CLASS + ') .media-thumbnail'
        );
        if (firstVisible) firstVisible.click();
      }

      refreshSplide();
    }

    /** Group for the flavor currently selected in the 1-pack radio list. */
    function groupFromCheckedRadio() {
      var checked = buybox.querySelector('[data-variant-radio]:checked');
      if (!checked) return null;
      var row = checked.closest('.variant-selector__row') || checked.parentNode;
      var nameEl = row && row.querySelector('.variant-selector__flavor-name');
      return groupFromName(nameEl ? nameEl.textContent : '');
    }

    function applyFromCheckedRadio() {
      applyFilter(groupFromCheckedRadio());
    }

    // ── Wire up selection sources ────────────────────────────────────────────

    // 1-pack flavor radios
    buybox.querySelectorAll('[data-variant-radio]').forEach(function (radio) {
      radio.addEventListener('change', applyFromCheckedRadio);
    });

    // Mix-and-match flavor tiles (2 / 3+ packs) — filter to the clicked flavor
    buybox.querySelectorAll('.mix-match-selector__item').forEach(function (item) {
      item.addEventListener('click', function () {
        var nameEl = item.querySelector('.mix-match-selector__flavor-name');
        applyFilter(groupFromName(nameEl ? nameEl.textContent : ''));
      });
    });

    // Switching pack tier re-applies the active 1-pack flavor when relevant
    buybox.querySelectorAll('[name="pack-count"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (String(radio.value) === '1') applyFromCheckedRadio();
      });
    });

    // Initial state: filter to the default (first / checked) flavor.
    applyFromCheckedRadio();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
