// _src/js/islands/focused-quick-buy.js
import { deferrableData } from "data-island";

// _src/js/components/focused-quick-buy.js
var focused_quick_buy_default = ({ product, variant }) => ({
  productRoot: null,
  product,
  currentVariant: variant,
  loading: false,
  quantity: "1",
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
  init() {
    this.productRoot = this.$root;
    if (this.$refs.productForm) {
      this.$refs.productForm.addEventListener(
        "submit",
        this.submitForm.bind(this)
      );
    }
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

// _src/js/islands/focused-quick-buy.js
deferrableData("FocusedQuickBuy", focused_quick_buy_default);
