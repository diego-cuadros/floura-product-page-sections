// _src/js/islands/account-login.js
import { deferrableData } from "data-island";

// _src/js/components/account-login.js
var account_login_default = () => ({
  state: "login",
  init() {
    this.$watch("state", (state) => {
      const container = document.querySelector(`[data-state="${state}"]`);
      if (container) {
        const shouldFocus = container.querySelector("[data-should-focus]");
        if (shouldFocus) {
          this.$nextTick(() => shouldFocus.focus());
        }
      }
    });
    const hash = window.location.hash;
    if (hash === "#recover") {
      this.state = "recover";
    }
  }
});

// _src/js/islands/account-login.js
deferrableData("AccountLogin", account_login_default);
