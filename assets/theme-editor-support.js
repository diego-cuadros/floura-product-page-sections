/**
 * Theme Editor support
 */

window.theme.designMode = window.theme.designMode || {};
window.theme.designMode.selected = '';

document.addEventListener('shopify:section:select', (e) => {
  window.theme.designMode.selected = e.detail.sectionId;
});

document.addEventListener('shopify:section:deselect', () => {
  window.theme.designMode.selected = '';
});

/**
 * Slideshow management
 */

document.addEventListener('shopify:section:load', (e) => {
  if (!e.target.querySelector('.splide')) return;

  e.target.querySelectorAll('.splide').forEach((splideRoot) => {
    makeSlideshow(splideRoot);
  });
});

document.addEventListener('shopify:section:unload', (e) => {
  if (!e.target.querySelector('.splide')) return;

  e.target.querySelectorAll('.splide').forEach((splideRoot) => {
    destroySlideshow(splideRoot);
  });
});

document.addEventListener('shopify:block:select', (e) => {
  const block = e.target,
    splideRoot = e.target.closest('.splide');

  if (!splideRoot) return;

  const slideIndex = Array.from(
    block.closest('.splide__list').children
  ).indexOf(block);

  window.slideshows[splideRoot.id].go(slideIndex);
});

/**
 * Menu panel management
 */

document.addEventListener('shopify:block:select', (e) => {
  const menuIndex = e.target.dataset.menuIndex,
    menuRoot = e.target.closest('.menu');
  if (!menuIndex) return;

  if (menuRoot.hasAttribute('data-start-tab')) {
    menuRoot.setAttribute('data-start-tab', menuIndex);
  } else {
    Alpine.$data(menuRoot).tab = menuIndex;
  }
});
