// _src/js/islands/quick-buy.js
import { deferrableData } from "data-island";

// _src/js/components/quick-buy.js
var quick_buy_default = ({ product, variant, featuredMediaID }) => ({
  productRoot: null,
  product,
  currentVariant: variant,
  currentMediaId: featuredMediaID,
  loading: false,
  quantity: "1",
  options: [],
  optionHandles: [],
  addedToCart: false,
  cartAddErrorMessage: null,
  get addToCartText() {
    if (this.currentVariant) {
      if (this.loading) {
        return window.theme.strings.addingToCart;
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
  get currentPrice() {
    return this.currentVariant.price;
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
    if (this.$refs.productForm) {
      this.$refs.productForm.addEventListener(
        "submit",
        this.submitForm.bind(this)
      );
    }
    this.getOptions();
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
        if (this.productRoot.querySelector("[data-single-option-selector]")) {
          this.productRoot.querySelectorAll(
            `[data-single-option-selector][data-position="${position + 1}"]`
          ).forEach((optionEl) => {
            optionEl.checked = optionEl.value === variant2.options[position];
            optionEl.dispatchEvent(new Event("change"));
          });
        } else {
          this.updateVariant(variant2);
        }
      }
    });
  },
  mainSelectorChange() {
    const matchedVariant = this.getVariantById(
      parseInt(this.$refs.singleVariantSelector.value)
    );
    this.updateVariant(matchedVariant);
  },
  optionChange() {
    this.getOptions();
    const matchedVariant = this.variantFromOptions(this.options);
    this.updateVariant(matchedVariant);
  },
  updateVariant(variant2) {
    this.currentVariant = variant2;
    if (this.currentVariant) {
      if (this.currentVariant.featured_media) {
        this.currentMediaId = this.currentVariant.featured_media.id;
      }
    }
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
          const value = selector.value;
          this.options.push(value);
          this.optionHandles.push(selector.dataset.handle);
        }
      }
    });
  },
  submitForm(evt) {
    evt.preventDefault();
    this.loading = true;
    liveRegion(window.theme.strings.addingToCart);
    const formData = new FormData(
      this.$root.querySelector(".quick-buy-product-form")
    );
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
        this.addedToCart = false;
        const errors = data.errors || data.description;
        const message = data.description || data.message;
        this.cartAddErrorMessage = message || window.theme.strings.cartError;
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
      this.addedToCart = true;
      if (modalCart) {
        document.body.dispatchEvent(
          new CustomEvent("shapes:cart:afteradditem", {
            bubbles: true,
            detail: { response: data }
          })
        );
      }
      if (!document.querySelector('[data-show-on-add="true"]')) {
        if (this.$refs.added) this.$nextTick(() => this.$refs.added.focus());
      }
    }).catch((error) => {
      this.loading = false;
      if (typeof error.json === "function") {
        error.json().then((a) => {
          alert(a.description);
        });
      } else {
        console.error(error);
      }
    });
  }
});

// _src/js/islands/quick-buy.js
deferrableData("QuickBuy", quick_buy_default);
