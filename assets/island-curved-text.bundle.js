// _src/js/islands/curved-text.js
import { deferrableData } from "data-island";

// _src/js/components/curved-text.js
var curved_text_default = (text, waveWidth, waveHeight, direction, speed, enableAnimation) => ({
  text,
  direction,
  textOffset: 0,
  speed,
  waveWidth,
  intensityPercentage: 100,
  waveHeight,
  viewportWidth: window.innerWidth,
  enableAnimation,
  path: "",
  straightPath: "",
  totalTextSpans: 0,
  originalSpan: null,
  hasShadow: false,
  previousWindowWidth: 0,
  resizeHandler: null,
  afterResizeHandler: null,
  get textLength() {
    return this.$refs.textMeasure ? this.$refs.textMeasure.getBoundingClientRect().width : 0;
  },
  get waveIntensity() {
    return this.intensityPercentage * (this.waveHeight - this.waveMidPoint) / 100 + this.waveMidPoint;
  },
  get waveMidPoint() {
    return this.waveHeight / 2;
  },
  get halfWaveWidth() {
    return this.waveWidth / 2;
  },
  get totalTextSpanLength() {
    return this.totalTextSpans * this.textLength;
  },
  get totalPathLength() {
    return this.$refs.path.getTotalLength();
  },
  get threshold() {
    if (this.direction === "ltr") {
      return 0;
    } else {
      return this.totalTextSpanLength / 2;
    }
  },
  init() {
    if (this.$refs.shadowTextPath !== void 0) {
      this.hasShadow = true;
    }
    this.createPath();
    this.$nextTick(() => {
      this.calculateText();
      this.play();
    });
    const mql = window.matchMedia("(min-width: 990px)");
    mql.onchange = (e) => {
      this.reInit();
    };
    this.previousWindowWidth = window.innerWidth;
    this.resizeHandler = (event) => {
      let windowWidth = window.innerWidth;
      if (windowWidth !== this.previousWindowWidth) {
        this.paused = true;
        this.previousWindowWidth = windowWidth;
      }
    };
    this.afterResizeHandler = debounce(this.resizeComplete.bind(this), 300);
    window.addEventListener("resize", this.resizeHandler.bind(this));
    window.addEventListener("resize", this.afterResizeHandler.bind(this));
  },
  resizeComplete() {
    if (window.innerWidth > this.viewportWidth) {
      this.reInit();
    } else {
      if (this.paused) {
        this.play();
      }
    }
  },
  reInit() {
    this.paused = true;
    this.$refs.textPath.innerHTML = "";
    this.viewportWidth = window.innerWidth;
    this.textOffset = 0;
    this.createPath();
    this.$nextTick(() => {
      this.calculateText();
      this.play();
    });
  },
  pause() {
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.paused = true;
      }, 0);
    });
  },
  play() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !enableAnimation) {
      return;
    }
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.paused = false;
        requestAnimationFrame(this.animate.bind(this));
      }, 0);
    });
  },
  createPath() {
    this.startPoint = this.waveWidth * 2 * -1;
    this.waveSegments = Math.ceil(this.viewportWidth * 3 / this.waveWidth) + 1;
    this.firstControlPoint = this.startPoint + this.halfWaveWidth;
    this.path = "M" + this.startPoint + " " + this.waveMidPoint;
    let point = this.startPoint;
    for (let i = 0; i < this.waveSegments; i++) {
      point = point + this.waveWidth;
      if (i === 0) {
        this.path += " Q" + (this.startPoint + this.halfWaveWidth) + " " + this.waveIntensity + ", " + point + " " + this.waveMidPoint;
      } else {
        this.path += " T" + point + " " + this.waveMidPoint;
      }
    }
  },
  calculateText() {
    this.totalTextSpans = Math.ceil(this.totalPathLength / this.textLength);
    this.totalTextSpans = this.totalTextSpans % 2 !== 0 ? this.totalTextSpans + 1 : this.totalTextSpans;
    let tspanElement;
    for (let i = 0; i < this.totalTextSpans; i++) {
      tspanElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );
      tspanElement.innerHTML = this.text;
      tspanElement.setAttribute("alignment-baseline", "middle");
      tspanElement.setAttribute("aria-hidden", "true");
      this.$refs.textPath.appendChild(tspanElement);
      if (this.hasShadow) {
        tspanElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan"
        );
        tspanElement.innerHTML = this.text;
        tspanElement.setAttribute("alignment-baseline", "middle");
        tspanElement.setAttribute("aria-hidden", "true");
        this.$refs.shadowTextPath.appendChild(tspanElement);
      }
    }
    this.$nextTick(() => {
      if (this.direction === "ltr") {
        this.textOffset = this.totalTextSpanLength / 2 * -1;
      }
    });
  },
  animate() {
    this.textOffset += 1 * this.speed;
    if (this.textOffset > this.threshold) {
      if (this.direction === "ltr") {
        this.textOffset = this.totalTextSpanLength / 2 * -1;
      } else {
        this.textOffset = 0;
      }
    }
    if (this.direction === "ltr") {
      this.$refs.textPath && this.$refs.textPath.setAttribute("startOffset", this.textOffset);
      if (this.hasShadow) {
        this.$refs.shadowTextPath && this.$refs.shadowTextPath.setAttribute(
          "startOffset",
          this.textOffset
        );
      }
    } else {
      this.$refs.textPath && this.$refs.textPath.setAttribute("startOffset", -this.textOffset);
      if (this.hasShadow) {
        this.$refs.shadowTextPath && this.$refs.shadowTextPath.setAttribute(
          "startOffset",
          -this.textOffset
        );
      }
    }
    if (!this.paused) {
      requestAnimationFrame(this.animate.bind(this));
    }
  },
  destroy() {
    window.removeEventListener("resize", this.resizeHandler);
    window.removeEventListener("resize", this.afterResizeHandler);
  }
});

// _src/js/islands/curved-text.js
deferrableData("CurvedText", curved_text_default);
