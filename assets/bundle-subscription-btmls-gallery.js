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
    { key: 'mango', title: ['mango'],                file: ['mango'] },
    { key: 'mint', title: ['mint'],                file: ['mint'] }


  ];

  var HIDE_CLASS = 'btmls-gallery-hide';

  function init() {
    var buybox = document.querySelector('.bundle-subscription-buybox');
    if (!buybox) return;

    var root = buybox.closest('[data-product-root]') || document;

    // The main carousel's slide list (Splide's __list) and every slide in its
    // original server order. We keep references to ALL slides — including ones we
    // later detach while filtering — so any flavor change can bring them back.
    var slideListEl = root.querySelector ? root.querySelector('.feature-media-list') : null;
    var allSlides = slideListEl
      ? Array.prototype.slice.call(slideListEl.querySelectorAll('.feature-media-item[data-media-id]'))
      : [];

    /** The Alpine Product() scope for this section, once hydrated (else null). */
    function getData() {
      try {
        if (root && root !== document && window.Alpine && window.Alpine.$data) {
          return window.Alpine.$data(root);
        }
      } catch (e) { /* not ready */ }
      return null;
    }

    /** Run `cb` once Alpine has hydrated the product island (polls, then gives up). */
    function whenReady(cb) {
      var tries = 0;
      (function check() {
        var d = getData();
        if (d && typeof d.currentMediaId !== 'undefined') { cb(d); return; }
        if (++tries > 150) { cb(null); return; }
        setTimeout(check, 80);
      })();
    }

    /** Drive the featured image through Alpine (never by clicking the <a>, which navigates). */
    function setActiveMedia(id) {
      var d = getData();
      if (d && typeof id === 'number' && d.currentMediaId !== id) {
        d.currentMediaId = id;
      }
    }

    /** Media id of the first visible (matching) slide after filtering/ordering. */
    function firstVisibleMediaId() {
      var el = root.querySelector('.feature-media-item:not(.' + HIDE_CLASS + ')[data-media-id]');
      return el ? Number(el.getAttribute('data-media-id')) : null;
    }

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

    /**
     * Render order encoded in the file name as "<keyword>-<n>" (e.g. blueberry-1
     * renders before blueberry-2). Returns the number, or a large fallback so
     * unnumbered / non-matching images sort to the end.
     */
    function orderOf(fileName, group) {
      for (var i = 0; i < group.file.length; i++) {
        var kw = group.file[i];
        var idx = fileName.indexOf(kw);
        if (idx === -1) continue;
        var m = fileName.slice(idx + kw.length).match(/^-(\d+)/);
        if (m) return parseInt(m[1], 10);
      }
      return Number.MAX_SAFE_INTEGER;
    }

    function galleryItems() {
      return root.querySelectorAll(
        '.feature-media-item[data-media-id], .product-thumbnail-list-item[data-media-id]'
      );
    }

    /**
     * Reorder a list's items by their "<keyword>-<n>" render order. Matching
     * images move to the front in ascending order; everything else (hidden /
     * unnumbered) is pushed to the end, preserving its relative order.
     */
    function reorderList(container, itemSelector, group) {
      var items = Array.prototype.filter.call(container.children, function (c) {
        return c.matches && c.matches(itemSelector);
      });
      items
        .sort(function (a, b) {
          return orderOf(fileNameOf(a), group) - orderOf(fileNameOf(b), group);
        })
        .forEach(function (item) {
          container.appendChild(item);
        });
    }

    // Reorder the thumbnail strips (mobile grid + desktop list). These are not
    // Splide carousels, so display:none filtering is fine here; only the main
    // carousel needs the physical rebuild below.
    function reorderThumbnails(group) {
      var thumbLists = [];
      root.querySelectorAll('.product-thumbnail-list-item').forEach(function (li) {
        if (li.parentNode && thumbLists.indexOf(li.parentNode) === -1) {
          thumbLists.push(li.parentNode);
        }
      });
      thumbLists.forEach(function (list) {
        reorderList(list, '.product-thumbnail-list-item', group);
      });
    }

    /**
     * Rebuild the main carousel so it holds ONLY the matching slides, in render
     * order. We physically detach non-matching slides rather than display:none-ing
     * them: Splide (autoWidth) derives its scroll limit from the last slide's
     * position, so trailing display:none slides — which have width/position 0 —
     * collapse the limit to 0. Then every go()/drag/arrow is clamped to
     * translateX(0): on mobile the featured image freezes on the first slide or,
     * when a swipe lands the index on a hidden slide, blanks out entirely.
     * Removing them from the list keeps Splide's slide set, indices and limits
     * correct, so navigation works natively.
     */
    function rebuildSlideList(group) {
      if (!slideListEl || !allSlides.length) return;
      var matching = allSlides.filter(function (el) {
        return fileMatchesGroup(fileNameOf(el), group);
      });
      matching.sort(function (a, b) {
        return orderOf(fileNameOf(a), group) - orderOf(fileNameOf(b), group);
      });
      // Detach whatever is currently in the list, then re-attach only the
      // matching slides in order. Non-matching slides stay detached (still
      // referenced by allSlides for the next flavor change). Clear HIDE_CLASS on
      // the matching slides — a slide filtered out by a previous flavor still
      // carries it, and an attached display:none slide would zero its width and
      // re-break Splide's limit.
      allSlides.forEach(function (el) {
        if (el.parentNode === slideListEl) slideListEl.removeChild(el);
      });
      matching.forEach(function (el) {
        el.classList.remove(HIDE_CLASS);
        slideListEl.appendChild(el);
      });
    }

    /** The mounted, non-destroyed Splide instance for the main gallery, or null. */
    function activeSplide() {
      var splideEl = root.querySelector ? root.querySelector('.splide--product') : null;
      if (!splideEl || !window.slideshows) return null;
      var splide = window.slideshows[splideEl.id];
      if (!splide) return null;
      try {
        var Splide = window.Splide;
        if (Splide && splide.state && splide.state.is(Splide.STATES.DESTROYED)) return null;
      } catch (e) { return null; }
      return splide;
    }

    function refreshSplide() {
      var splide = activeSplide();
      try {
        if (splide && typeof splide.refresh === 'function') splide.refresh();
      } catch (e) { /* no-op */ }
    }

    /**
     * Move the mobile Splide carousel to a given media id. The featured image on
     * mobile is whichever slide Splide shows, so this must run after filtering/
     * rebuilding (and after refresh) to keep it in sync with the selected variant.
     */
    function goToMedia(mediaId) {
      var splide = activeSplide();
      if (!splide || !splide.Components || mediaId == null) return;
      try {
        var slides = splide.Components.Elements.slides;
        var idx = slides.findIndex(function (s) {
          return Number(s.dataset.mediaId) === Number(mediaId);
        });
        if (idx > -1) splide.go(idx);
      } catch (e) { /* no-op */ }
    }

    /** Hide every gallery item not belonging to `group`; show the rest. */
    function applyFilter(group) {
      if (!group) return;

      // Hide the gallery while we swap/reorder images, then fade it back in.
      var media = root.querySelector('.product-media');
      if (media) {
        media.classList.add('btmls-gallery-fading');
        void media.offsetHeight; // commit opacity:0 before the images change
      }

      galleryItems().forEach(function (el) {
        var show = fileMatchesGroup(fileNameOf(el), group);
        el.classList.toggle(HIDE_CLASS, !show);
      });

      // Order the visible thumbnails by their "<keyword>-<n>" suffix (blueberry-1
      // first), and rebuild the main carousel to contain only those slides.
      reorderThumbnails(group);
      rebuildSlideList(group);

      // If the currently-featured image isn't part of this flavor, switch the
      // featured image to the first visible one (via Alpine, not an <a> click)
      // so the main view never shows a non-matching/blank slide.
      var d = getData();
      var curId = d ? d.currentMediaId : null;
      var curSlide = curId != null
        ? root.querySelector('.feature-media-item[data-media-id="' + curId + '"]')
        : null;
      if (!curSlide || curSlide.classList.contains(HIDE_CLASS)) {
        var fid = firstVisibleMediaId();
        if (fid != null) setActiveMedia(fid);
      }

      refreshSplide();

      // Re-sync the mobile Splide carousel to the selected media after the
      // refresh (which would otherwise leave it on the previous slide). Done on
      // the next frame so the refreshed layout is in place first.
      requestAnimationFrame(function () {
        var dd = getData();
        var targetId = dd && dd.currentMediaId != null
          ? Number(dd.currentMediaId)
          : firstVisibleMediaId();
        if (targetId != null) goToMedia(targetId);
        // Fade the gallery back in.
        if (media) media.classList.remove('btmls-gallery-fading');
      });
    }

    /** Flavor name attached to a 1-pack flavor radio. */
    function radioFlavorName(radio) {
      var row = radio.closest('.variant-selector__row') || radio.parentNode;
      var nameEl = row && row.querySelector('.variant-selector__flavor-name');
      return nameEl ? nameEl.textContent : '';
    }

    /** Group for the flavor currently selected in the 1-pack radio list. */
    function groupFromCheckedRadio() {
      var checked = buybox.querySelector('[data-variant-radio]:checked');
      if (!checked) return null;
      return groupFromName(radioFlavorName(checked));
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

    // Initial state: wait for Alpine to hydrate, then filter the gallery to
    // whatever flavor is already selected (no flavor is forced on load).
    whenReady(function () {
      var group = groupFromCheckedRadio();
      if (group) {
        applyFilter(group);
        var fid = firstVisibleMediaId();
        if (fid != null) setActiveMedia(fid);
      }
      // Reveal the gallery now that it's filtered + ordered (fades in).
      root.classList.add('btmls-gallery-ready');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
