// _src/js/islands/gift-card-recipient.js
import { deferrableData } from "data-island";

// _src/js/components/gift-card-recipient.js
var gift_card_recipient_default = () => ({
  enabled: false,
  recipientMessage: "",
  get messageLength() {
    return this.recipientMessage.length;
  },
  errors: null,
  init() {
    document.body.addEventListener("shapes:cart:adderror", (e) => {
      if (e.detail.source === "product-form" && e.detail.sourceId === this.$root.closest("form").getAttribute("id")) {
        this.errors = e.detail.errors;
        this.enabled = true;
        this.$root.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    });
  }
});

// _src/js/islands/gift-card-recipient.js
deferrableData("GiftCardRecipient", gift_card_recipient_default);
