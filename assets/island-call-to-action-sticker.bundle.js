// _src/js/islands/call-to-action-sticker.js
import { deferrableData } from "data-island";

// _src/js/components/call-to-action-sticker.js
var call_to_action_sticker_default = ({ animateIn = false, hideWhenScrollingUp = false }) => ({
  animateIn,
  hideWhenScrollingUp,
  lastY: 0,
  firstSectionIsIntersecting: true,
  goingUp: false,
  get show() {
    if (this.animateIn && this.hideWhenScrollingUp) {
      if (this.firstSectionIsIntersecting) {
        return false;
      } else {
        return !this.goingUp;
      }
    } else {
      if (this.animateIn) {
        return !this.firstSectionIsIntersecting;
      }
      if (this.hideWhenScrollingUp) {
        return !this.goingUp;
      }
    }
  },
  init() {
    if (animateIn) {
      const mainContentEl = document.getElementById("MainContent");
      const firstSection = mainContentEl.querySelector(".shopify-section");
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.firstSectionIsIntersecting = true;
            return;
          }
          this.firstSectionIsIntersecting = false;
        },
        {
          root: null,
          threshold: 0
        }
      );
      observer.observe(firstSection);
    }
    if (hideWhenScrollingUp) {
      window.addEventListener("scroll", this.scrollListener.bind(this), {
        passive: true
      });
    }
  },
  scrollListener() {
    const y = window.scrollY;
    this.goingUp = y < this.lastY;
    this.lastY = y;
  },
  destroy() {
    if (hideWhenScrollingUp) {
      window.removeEventListener("scroll", this.scrollListener);
    }
  }
});

// _src/js/islands/call-to-action-sticker.js
deferrableData("CallToActionSticker", call_to_action_sticker_default);
