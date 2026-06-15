// _src/js/data-island.js
window.alpineIsInitialized = false;
window.alpineIsStarted = false;
document.addEventListener("alpine:initialized", () => {
  window.alpineIsInitialized = true;
});
document.addEventListener("switch:alpine:started", () => {
  window.alpineIsStarted = true;
});
window.alpineInitPromise = () => {
  return new Promise((resolve) => {
    if (window.alpineIsInitialized) {
      resolve();
    }
    document.addEventListener("alpine:initialized", () => {
      resolve();
    });
  });
};
window.alpineStartedPromise = () => {
  return new Promise((resolve) => {
    if (window.alpineIsStarted) {
      resolve();
    }
    document.addEventListener("switch:alpine:started", () => {
      resolve();
    });
  });
};
var deferrableData = (name, data) => {
  if (window.alpineIsInitialized) {
    Alpine.data(name, data);
  } else {
    document.addEventListener("alpine:init", () => {
      Alpine.data(name, data);
    });
  }
};
var importOrImportShim;
if (!(HTMLScriptElement.supports && HTMLScriptElement.supports("importmap")) || typeof window.importShim !== "undefined") {
  importOrImportShim = (name) => importShim(name);
} else {
  importOrImportShim = (name) => import(name);
}
var DataIsland = class extends HTMLElement {
  constructor() {
    super();
  }
  async connectedCallback() {
    if (!this.isConnected) return;
    this._x_ignore = true;
    let onVisible = false, onIdle = false, onInteraction = false;
    let onVisibleModifier;
    if (this.hasAttribute("on")) {
      const onAttribute = this.getAttribute("on");
      if (onAttribute === "idle") {
        onIdle = true;
      } else if (onAttribute.endsWith("visible")) {
        onVisible = true;
        onVisibleModifier = onAttribute.includes(":") ? onAttribute.split(":")[0] : null;
      } else if (onAttribute === "interaction") {
        onInteraction = true;
      }
    } else {
      onVisible = true;
    }
    if (onIdle) {
      await this.idle();
    } else if (onVisible) {
      await this.visible(onVisibleModifier);
    } else if (onInteraction) {
      await this.interaction();
    }
    this.hydrate();
  }
  idle() {
    return new Promise((resolve) => {
      requestIdleCallback(() => {
        resolve();
      });
    });
  }
  interaction() {
    const events = ["touchstart", "click"];
    return new Promise((resolve) => {
      const onInteractionListener = (event) => {
        for (const eventName of events) {
          this.removeEventListener(eventName, onInteractionListener);
        }
        resolve();
      };
      for (const eventName of events) {
        this.addEventListener(eventName, onInteractionListener);
      }
    });
  }
  visible(modifier = null) {
    const options = {
      rootMargin: "25%"
    };
    if (modifier) {
      switch (modifier) {
        case "before":
          options.rootMargin = "125%";
          break;
        case "mostly":
          options.rootMargin = "0px";
          options.threshold = 0.75;
          break;
        case "fully":
          options.rootMargin = "0px";
          options.threshold = 1;
          break;
      }
    }
    return new Promise((resolve) => {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) return;
          resolve();
          io.disconnect();
          break;
        }
      }, options);
      if (getComputedStyle(this).display === "contents") {
        for (const childEl of this.children) {
          io.observe(childEl);
        }
      } else {
        io.observe(this);
      }
    });
  }
  // disconnectedCallback() {
  // }
  async hydrate() {
    const componentName = this.getAttribute("x-data")?.trim().split("(")[0];
    if (componentName && !componentName.startsWith("{") && this.hasAttribute("src")) {
      await importOrImportShim(this.getAttribute("src"));
    }
    await this.parentHydration();
    if (!window.Alpine) await window.alpineInitPromise();
    if (!window.alpineIsStarted) await window.alpineStartedPromise();
    delete this._x_ignore;
    await Alpine.nextTick();
    Alpine.initTree(this);
    this.setAttribute("ready", "");
  }
  parentHydration() {
    const parentDeferredEl = this.parentElement.closest(
      "data-island:not([ready])"
    );
    if (!parentDeferredEl) {
      return;
    }
    return new Promise((resolve, reject) => {
      if (parentDeferredEl) {
        const parentObserver = new MutationObserver(
          (mutationsList, observer) => {
            if (parentDeferredEl.hasAttribute("ready")) {
              observer.disconnect();
              resolve();
            }
          }
        );
        parentObserver.observe(parentDeferredEl, {
          attributes: true,
          attributeFilter: ["ready"]
        });
      }
    });
  }
};
export {
  DataIsland as default,
  deferrableData
};
