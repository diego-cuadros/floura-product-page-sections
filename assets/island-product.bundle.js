// _src/js/islands/product.js
import { deferrableData } from "data-island";

// _src/js/components/product.js
var product_default = ({
  product,
  variant,
  featuredMediaID,
  template,
  thumbnailsPosition,
  showThumbnailsOnMobile
}) => ({
  productRoot: null,
  product,
  currentVariant: variant,
  currentMediaId: featuredMediaID,
  loading: false,
  quantity: "1",
  options: [],
  optionHandles: [],
  addedToCart: false,
  stickyAddToCartShown: false,
  variantChanged: false,
  template,
  thumbnailsPosition,
  showThumbnailsOnMobile,
  hasGiftCardRecipientForm: false,
  cartAddErrorMessage: null,
  isMaxLgBreakpoint: window.isMaxLgBreakpoint(),
  maxLgBreakpointMQL: window.maxLgBreakpointMQL(),
  get addToCartText() {
    if (this.currentVariant) {
      if (this.loading) {
        return window.theme.strings.loading;
      }
      if (!this.loading && this.currentVariant.available) {
        if (this.template === "product.preorder") {
          return window.theme.strings.preOrder;
        } else {
          return window.theme.strings.addToCart;
        }
      }
      if (!this.loading && !this.currentVariant.available) {
        return window.theme.strings.soldOut;
      }
    } else {
      return window.theme.strings.unavailable;
    }
  },
  get currentVariantId() {
    if (this.currentVariant) {
      return this.currentVariant.id;
    } else {
      return null;
    }
  },
  get currentVariantAvailable() {
    if (this.currentVariant) {
      return this.currentVariant.available;
    } else {
      return null;
    }
  },
  get currentVariantTitle() {
    if (this.currentVariant && this.currentVariant.title) {
      if (!this.currentVariant.title.includes("Default")) {
        return this.currentVariant.title;
      }
    }
    return "";
  },
  get currentPrice() {
    return this.currentVariant.price;
  },
  get isUsingSlideshowToDisplayMedia() {
    const splideEl = this.productRoot.querySelector(".splide--product");
    if (window.Splide && this.productRoot && splideEl) {
      if (window.slideshows && window.slideshows[`${splideEl.id}`] && !window.slideshows[`${splideEl.id}`].state.is(
        window.Splide.STATES.DESTROYED
      )) {
        return true;
      }
    }
    return false;
  },
  get currentVariantHasCompareAtPrice() {
    return this.currentVariant && this.product.compare_at_price_max && this.currentVariant.compare_at_price > this.currentVariant.price;
  },
  variantFromOptions(options = this.options) {
    return this.product.variants.find(
      (variant2) => variant2.options.every((value, index) => value === options[index])
    ) || null;
  },
  getVariantById(id) {
    return this.product.variants.find((variant2) => variant2.id === id) || null;
  },
  formatMoney(price) {
    return formatMoney(price, theme.moneyFormat);
  },
  init() {
    this.productRoot = this.$root;
    this.isMaxLgBreakpoint = this.maxLgBreakpointMQL.matches;
    this.maxLgBreakpointMQL.addEventListener("change", (e) => {
      this.isMaxLgBreakpoint = e.matches;
    });
    if (this.$root.querySelector('[x-data="GiftCardRecipient"]')) {
      this.hasGiftCardRecipientForm = true;
    }
    if (this.$refs.productForm) {
      this.$refs.productForm.addEventListener(
        "submit",
        this.submitForm.bind(this)
      );
    }
    this.getOptions();
    this.$watch("currentMediaId", (value, oldValue) => {
      if (showThumbnailsOnMobile) {
        this.$root.dispatchEvent(
          new CustomEvent("shapes:product:mediachange", {
            bubbles: true,
            detail: {
              mediaId: this.currentMediaId,
              slideshowId: this.productRoot.querySelector(".splide--product")?.id
            }
          })
        );
      }
      if (this.isUsingSlideshowToDisplayMedia) return;
      this.$root.querySelector(`[data-product-single-media-wrapper="${oldValue}"]`).dispatchEvent(new CustomEvent("mediaHidden"));
      this.$root.querySelector(`[data-product-single-media-wrapper="${value}"]`).dispatchEvent(new CustomEvent("mediaVisible"));
    });
    this.$watch("currentVariant", (value, oldValue) => {
      document.dispatchEvent(
        new CustomEvent("theme:variant:change", {
          detail: {
            productRootEl: this.productRoot,
            formEl: this.productRoot.querySelector("form.shopify-product-form"),
            variant: value,
            previousVariant: oldValue,
            product: this.product
          }
        })
      );
    });
    this.productRoot.addEventListener("theme:change:variant", (event) => {
      if (!event.detail || !event.detail.variantId) {
        console.error("theme:change:variant requires a variant ID");
        return;
      }
      const variant2 = this.getVariantById(event.detail.variantId);
      if (!variant2) {
        console.error("theme:change:variant: variant not found");
      }
      const allPositions = Array.from(
        { length: this.product.options.length },
        (_, index) => index
      );
      for (const position of allPositions) {
        this.productRoot.querySelectorAll(
          `[data-single-option-selector][data-position="${position + 1}"]`
        ).forEach((optionEl) => {
          if (optionEl.tagName === "SELECT") {
            optionEl.value = variant2.options[position];
          } else {
            optionEl.checked = optionEl.value === variant2.options[position];
          }
          optionEl.dispatchEvent(new Event("change"));
        });
      }
    });
    this.$watch("currentVariantId", (value, oldValue) => {
      if (value && oldValue !== value) {
        this.$refs.singleVariantSelector.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
    });
  },
  optionChange() {
    this.getOptions();
    const matchedVariant = this.variantFromOptions(this.options);
    this.currentVariant = matchedVariant;
    if (this.currentVariant) {
      variantLiveRegion(this.currentVariant);
      if (this.currentVariant.featured_media) {
        this.currentMediaId = this.currentVariant.featured_media.id;
      }
      const url = currentURLWithParams([
        ["variant", this.currentVariantId]
      ]).toString();
      window.history.replaceState({ path: url }, "", url);
      this.$root.dispatchEvent(
        new CustomEvent("shapes:product:variantchange", {
          bubbles: true,
          detail: { variant: this.currentVariant }
        })
      );
    }
    this.variantChanged = true;
  },
  getOptions() {
    this.options = [];
    this.optionHandles = [];
    let selectors = this.$root.querySelectorAll(
      "[data-single-option-selector]"
    );
    selectors.forEach((selector) => {
      if (selector.nodeName === "SELECT") {
        const value = selector.value;
        this.options.push(value);
        this.optionHandles.push(
          selector.options[selector.selectedIndex].dataset.handle
        );
      } else {
        if (selector.checked) {
          console;
          const value = selector.value;
          this.options.push(value);
          this.optionHandles.push(selector.dataset.handle);
        }
      }
    });
  },
  changeMedia(direction) {
    this.$root.dispatchEvent(
      new CustomEvent("shapes:product:arrow-change", {
        bubbles: true,
        detail: { direction }
      })
    );
    if (this.thumbnailsPosition == "under") {
      const currentThumbnail = this.$root.querySelector(
        ".product-thumbnail-list-item--active"
      );
      const nextElement = direction == "prev" ? currentThumbnail.previousElementSibling : currentThumbnail.nextElementSibling;
      if (nextElement !== null) {
        nextElement.querySelector(".media-thumbnail").click();
      }
    }
  },
  submitForm(evt) {
    evt.preventDefault();
    this.loading = true;
    this.addedToCart = false;
    liveRegion(window.theme.strings.loading);
    const formData = new FormData(this.$refs.productForm);
    const formId = this.$refs.productForm.getAttribute("id");
    let modalCart = theme.settings.cartType === "modal";
    const config = fetchConfigDefaults("application/javascript");
    if (modalCart) {
      formData.append("sections", "cart-items,cart-footer,cart-item-count");
      formData.append("sections_url", window.location.pathname);
    }
    config.body = formData;
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    delete config.headers["Content-Type"];
    fetch(`${theme.routes.cart_add_url}`, config).then((res) => res.json()).then((data) => {
      if (data.status) {
        this.loading = false;
        const errors = data.errors || data.description;
        const message = data.description || data.message;
        if (!this.hasGiftCardRecipientForm) {
          this.cartAddErrorMessage = message || window.theme.strings.cartError;
        }
        const errorDetail = {
          sourceId: formId,
          variantId: Number(formData.get("id")),
          errors,
          message
        };
        document.body.dispatchEvent(
          new CustomEvent("shapes:cart:adderror", {
            detail: {
              source: "product-form",
              ...errorDetail
            }
          })
        );
        document.dispatchEvent(
          new CustomEvent("theme:product:error:add-to-cart", {
            detail: {
              productRootEl: Alpine.raw(this.productRoot),
              formEl: Alpine.raw(this.$refs.productForm),
              ...errorDetail
            }
          })
        );
        return;
      }
      this.loading = false;
      this.cartAddErrorMessage = null;
      this.addedToCart = true;
      if (modalCart) {
        document.body.dispatchEvent(
          new CustomEvent("shapes:cart:afteradditem", {
            bubbles: true,
            detail: { response: data, sourceId: formId }
          })
        );
      }
      if (!document.querySelector('[data-show-on-add="true"]')) {
        if (this.$refs.added) this.$nextTick(() => this.$refs.added.focus());
      }
    }).catch((error) => {
      console.error(error);
    });
  },
  openZoom(id) {
    const imageZoomDataEl = this.productRoot.querySelector(
      "[data-photoswipe-images]"
    );
    if (!imageZoomDataEl) return;
    const imageZoomData = JSON.parse(imageZoomDataEl.innerHTML);
    const imageMediaIDsArray = Object.keys(imageZoomData);
    const index = imageMediaIDsArray.indexOf(id);
    this.$refs.photoSwipeComponent.dispatchEvent(
      new CustomEvent("shapes:photoswipe:open", {
        detail: {
          index
        }
      })
    );
  }
});

// _src/js/islands/product.js
deferrableData("Product", product_default);
