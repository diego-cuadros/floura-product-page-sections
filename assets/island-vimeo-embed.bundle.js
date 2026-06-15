// _src/js/islands/vimeo-embed.js
import { deferrableData } from "data-island";

// _src/js/components/vimeo-embed.js
var vimeo_embed_default = () => ({
  playing: false,
  init() {
    this.$nextTick(() => {
      window.addEventListener("message", this._messageHandler.bind(this));
    });
    this.$watch("playing", (value) => {
      if (value === true) {
        this.$root.dispatchEvent(
          new CustomEvent("playing", {
            bubbles: true
          })
        );
      } else {
        this.$root.dispatchEvent(
          new CustomEvent("paused", {
            bubbles: true
          })
        );
      }
    });
  },
  play() {
    iFrameMethod(this.$refs.video, "play");
  },
  pause() {
    iFrameMethod(this.$refs.video, "pause");
  },
  _onReady() {
    this.$refs.video.contentWindow.postMessage(
      JSON.stringify({
        method: "addEventListener",
        value: "playProgress"
      }),
      this.$refs.video.src
    );
    this.$refs.video.contentWindow.postMessage(
      JSON.stringify({
        method: "addEventListener",
        value: "pause"
      }),
      this.$refs.video.src
    );
  },
  _messageHandler(e) {
    if (e.source !== this.$refs.video.contentWindow) return;
    let data;
    try {
      data = JSON.parse(e.data);
    } catch (e2) {
      console.warn("Could not parse message from Vimeo embed", e2);
    }
    if (data.event === "ready") {
      this._onReady();
    }
    if (data.event === "playProgress") {
      this.playing = true;
    }
    if (data.event === "pause") {
      this.playing = false;
    }
  },
  deinit() {
    window.removeEventListener("message", this._messageHandler);
  }
});

// _src/js/islands/vimeo-embed.js
deferrableData("VimeoEmbed", vimeo_embed_default);
