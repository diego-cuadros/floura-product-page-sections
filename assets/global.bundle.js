// node_modules/wicg-inert/dist/inert.esm.js
var _createClass = /* @__PURE__ */ function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
(function() {
  if (typeof window === "undefined") {
    return;
  }
  var slice = Array.prototype.slice;
  var matches = Element.prototype.matches || Element.prototype.msMatchesSelector;
  var _focusableElementsString = ["a[href]", "area[href]", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])", "button:not([disabled])", "details", "summary", "iframe", "object", "embed", "[contenteditable]"].join(",");
  var InertRoot = function() {
    function InertRoot2(rootElement, inertManager2) {
      _classCallCheck(this, InertRoot2);
      this._inertManager = inertManager2;
      this._rootElement = rootElement;
      this._managedNodes = /* @__PURE__ */ new Set();
      if (this._rootElement.hasAttribute("aria-hidden")) {
        this._savedAriaHidden = this._rootElement.getAttribute("aria-hidden");
      } else {
        this._savedAriaHidden = null;
      }
      this._rootElement.setAttribute("aria-hidden", "true");
      this._makeSubtreeUnfocusable(this._rootElement);
      this._observer = new MutationObserver(this._onMutation.bind(this));
      this._observer.observe(this._rootElement, { attributes: true, childList: true, subtree: true });
    }
    _createClass(InertRoot2, [{
      key: "destructor",
      value: function destructor() {
        this._observer.disconnect();
        if (this._rootElement) {
          if (this._savedAriaHidden !== null) {
            this._rootElement.setAttribute("aria-hidden", this._savedAriaHidden);
          } else {
            this._rootElement.removeAttribute("aria-hidden");
          }
        }
        this._managedNodes.forEach(function(inertNode) {
          this._unmanageNode(inertNode.node);
        }, this);
        this._observer = /** @type {?} */
        null;
        this._rootElement = /** @type {?} */
        null;
        this._managedNodes = /** @type {?} */
        null;
        this._inertManager = /** @type {?} */
        null;
      }
      /**
       * @return {!Set<!InertNode>} A copy of this InertRoot's managed nodes set.
       */
    }, {
      key: "_makeSubtreeUnfocusable",
      /**
       * @param {!Node} startNode
       */
      value: function _makeSubtreeUnfocusable(startNode) {
        var _this2 = this;
        composedTreeWalk(startNode, function(node2) {
          return _this2._visitNode(node2);
        });
        var activeElement = document.activeElement;
        if (!document.body.contains(startNode)) {
          var node = startNode;
          var root = void 0;
          while (node) {
            if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
              root = /** @type {!ShadowRoot} */
              node;
              break;
            }
            node = node.parentNode;
          }
          if (root) {
            activeElement = root.activeElement;
          }
        }
        if (startNode.contains(activeElement)) {
          activeElement.blur();
          if (activeElement === document.activeElement) {
            document.body.focus();
          }
        }
      }
      /**
       * @param {!Node} node
       */
    }, {
      key: "_visitNode",
      value: function _visitNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        var element = (
          /** @type {!HTMLElement} */
          node
        );
        if (element !== this._rootElement && element.hasAttribute("inert")) {
          this._adoptInertRoot(element);
        }
        if (matches.call(element, _focusableElementsString) || element.hasAttribute("tabindex")) {
          this._manageNode(element);
        }
      }
      /**
       * Register the given node with this InertRoot and with InertManager.
       * @param {!Node} node
       */
    }, {
      key: "_manageNode",
      value: function _manageNode(node) {
        var inertNode = this._inertManager.register(node, this);
        this._managedNodes.add(inertNode);
      }
      /**
       * Unregister the given node with this InertRoot and with InertManager.
       * @param {!Node} node
       */
    }, {
      key: "_unmanageNode",
      value: function _unmanageNode(node) {
        var inertNode = this._inertManager.deregister(node, this);
        if (inertNode) {
          this._managedNodes["delete"](inertNode);
        }
      }
      /**
       * Unregister the entire subtree starting at `startNode`.
       * @param {!Node} startNode
       */
    }, {
      key: "_unmanageSubtree",
      value: function _unmanageSubtree(startNode) {
        var _this3 = this;
        composedTreeWalk(startNode, function(node) {
          return _this3._unmanageNode(node);
        });
      }
      /**
       * If a descendant node is found with an `inert` attribute, adopt its managed nodes.
       * @param {!HTMLElement} node
       */
    }, {
      key: "_adoptInertRoot",
      value: function _adoptInertRoot(node) {
        var inertSubroot = this._inertManager.getInertRoot(node);
        if (!inertSubroot) {
          this._inertManager.setInert(node, true);
          inertSubroot = this._inertManager.getInertRoot(node);
        }
        inertSubroot.managedNodes.forEach(function(savedInertNode) {
          this._manageNode(savedInertNode.node);
        }, this);
      }
      /**
       * Callback used when mutation observer detects subtree additions, removals, or attribute changes.
       * @param {!Array<!MutationRecord>} records
       * @param {!MutationObserver} self
       */
    }, {
      key: "_onMutation",
      value: function _onMutation(records, self) {
        records.forEach(function(record) {
          var target = (
            /** @type {!HTMLElement} */
            record.target
          );
          if (record.type === "childList") {
            slice.call(record.addedNodes).forEach(function(node) {
              this._makeSubtreeUnfocusable(node);
            }, this);
            slice.call(record.removedNodes).forEach(function(node) {
              this._unmanageSubtree(node);
            }, this);
          } else if (record.type === "attributes") {
            if (record.attributeName === "tabindex") {
              this._manageNode(target);
            } else if (target !== this._rootElement && record.attributeName === "inert" && target.hasAttribute("inert")) {
              this._adoptInertRoot(target);
              var inertSubroot = this._inertManager.getInertRoot(target);
              this._managedNodes.forEach(function(managedNode) {
                if (target.contains(managedNode.node)) {
                  inertSubroot._manageNode(managedNode.node);
                }
              });
            }
          }
        }, this);
      }
    }, {
      key: "managedNodes",
      get: function get() {
        return new Set(this._managedNodes);
      }
      /** @return {boolean} */
    }, {
      key: "hasSavedAriaHidden",
      get: function get() {
        return this._savedAriaHidden !== null;
      }
      /** @param {?string} ariaHidden */
    }, {
      key: "savedAriaHidden",
      set: function set(ariaHidden) {
        this._savedAriaHidden = ariaHidden;
      },
      get: function get() {
        return this._savedAriaHidden;
      }
    }]);
    return InertRoot2;
  }();
  var InertNode = function() {
    function InertNode2(node, inertRoot) {
      _classCallCheck(this, InertNode2);
      this._node = node;
      this._overrodeFocusMethod = false;
      this._inertRoots = /* @__PURE__ */ new Set([inertRoot]);
      this._savedTabIndex = null;
      this._destroyed = false;
      this.ensureUntabbable();
    }
    _createClass(InertNode2, [{
      key: "destructor",
      value: function destructor() {
        this._throwIfDestroyed();
        if (this._node && this._node.nodeType === Node.ELEMENT_NODE) {
          var element = (
            /** @type {!HTMLElement} */
            this._node
          );
          if (this._savedTabIndex !== null) {
            element.setAttribute("tabindex", this._savedTabIndex);
          } else {
            element.removeAttribute("tabindex");
          }
          if (this._overrodeFocusMethod) {
            delete element.focus;
          }
        }
        this._node = /** @type {?} */
        null;
        this._inertRoots = /** @type {?} */
        null;
        this._destroyed = true;
      }
      /**
       * @type {boolean} Whether this object is obsolete because the managed node is no longer inert.
       * If the object has been destroyed, any attempt to access it will cause an exception.
       */
    }, {
      key: "_throwIfDestroyed",
      /**
       * Throw if user tries to access destroyed InertNode.
       */
      value: function _throwIfDestroyed() {
        if (this.destroyed) {
          throw new Error("Trying to access destroyed InertNode");
        }
      }
      /** @return {boolean} */
    }, {
      key: "ensureUntabbable",
      /** Save the existing tabindex value and make the node untabbable and unfocusable */
      value: function ensureUntabbable() {
        if (this.node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        var element = (
          /** @type {!HTMLElement} */
          this.node
        );
        if (matches.call(element, _focusableElementsString)) {
          if (
            /** @type {!HTMLElement} */
            element.tabIndex === -1 && this.hasSavedTabIndex
          ) {
            return;
          }
          if (element.hasAttribute("tabindex")) {
            this._savedTabIndex = /** @type {!HTMLElement} */
            element.tabIndex;
          }
          element.setAttribute("tabindex", "-1");
          if (element.nodeType === Node.ELEMENT_NODE) {
            element.focus = function() {
            };
            this._overrodeFocusMethod = true;
          }
        } else if (element.hasAttribute("tabindex")) {
          this._savedTabIndex = /** @type {!HTMLElement} */
          element.tabIndex;
          element.removeAttribute("tabindex");
        }
      }
      /**
       * Add another inert root to this inert node's set of managing inert roots.
       * @param {!InertRoot} inertRoot
       */
    }, {
      key: "addInertRoot",
      value: function addInertRoot(inertRoot) {
        this._throwIfDestroyed();
        this._inertRoots.add(inertRoot);
      }
      /**
       * Remove the given inert root from this inert node's set of managing inert roots.
       * If the set of managing inert roots becomes empty, this node is no longer inert,
       * so the object should be destroyed.
       * @param {!InertRoot} inertRoot
       */
    }, {
      key: "removeInertRoot",
      value: function removeInertRoot(inertRoot) {
        this._throwIfDestroyed();
        this._inertRoots["delete"](inertRoot);
        if (this._inertRoots.size === 0) {
          this.destructor();
        }
      }
    }, {
      key: "destroyed",
      get: function get() {
        return (
          /** @type {!InertNode} */
          this._destroyed
        );
      }
    }, {
      key: "hasSavedTabIndex",
      get: function get() {
        return this._savedTabIndex !== null;
      }
      /** @return {!Node} */
    }, {
      key: "node",
      get: function get() {
        this._throwIfDestroyed();
        return this._node;
      }
      /** @param {?number} tabIndex */
    }, {
      key: "savedTabIndex",
      set: function set(tabIndex) {
        this._throwIfDestroyed();
        this._savedTabIndex = tabIndex;
      },
      get: function get() {
        this._throwIfDestroyed();
        return this._savedTabIndex;
      }
    }]);
    return InertNode2;
  }();
  var InertManager = function() {
    function InertManager2(document2) {
      _classCallCheck(this, InertManager2);
      if (!document2) {
        throw new Error("Missing required argument; InertManager needs to wrap a document.");
      }
      this._document = document2;
      this._managedNodes = /* @__PURE__ */ new Map();
      this._inertRoots = /* @__PURE__ */ new Map();
      this._observer = new MutationObserver(this._watchForInert.bind(this));
      addInertStyle(document2.head || document2.body || document2.documentElement);
      if (document2.readyState === "loading") {
        document2.addEventListener("DOMContentLoaded", this._onDocumentLoaded.bind(this));
      } else {
        this._onDocumentLoaded();
      }
    }
    _createClass(InertManager2, [{
      key: "setInert",
      value: function setInert(root, inert) {
        if (inert) {
          if (this._inertRoots.has(root)) {
            return;
          }
          var inertRoot = new InertRoot(root, this);
          root.setAttribute("inert", "");
          this._inertRoots.set(root, inertRoot);
          if (!this._document.body.contains(root)) {
            var parent = root.parentNode;
            while (parent) {
              if (parent.nodeType === 11) {
                addInertStyle(parent);
              }
              parent = parent.parentNode;
            }
          }
        } else {
          if (!this._inertRoots.has(root)) {
            return;
          }
          var _inertRoot = this._inertRoots.get(root);
          _inertRoot.destructor();
          this._inertRoots["delete"](root);
          root.removeAttribute("inert");
        }
      }
      /**
       * Get the InertRoot object corresponding to the given inert root element, if any.
       * @param {!Node} element
       * @return {!InertRoot|undefined}
       */
    }, {
      key: "getInertRoot",
      value: function getInertRoot(element) {
        return this._inertRoots.get(element);
      }
      /**
       * Register the given InertRoot as managing the given node.
       * In the case where the node has a previously existing inert root, this inert root will
       * be added to its set of inert roots.
       * @param {!Node} node
       * @param {!InertRoot} inertRoot
       * @return {!InertNode} inertNode
       */
    }, {
      key: "register",
      value: function register(node, inertRoot) {
        var inertNode = this._managedNodes.get(node);
        if (inertNode !== void 0) {
          inertNode.addInertRoot(inertRoot);
        } else {
          inertNode = new InertNode(node, inertRoot);
        }
        this._managedNodes.set(node, inertNode);
        return inertNode;
      }
      /**
       * De-register the given InertRoot as managing the given inert node.
       * Removes the inert root from the InertNode's set of managing inert roots, and remove the inert
       * node from the InertManager's set of managed nodes if it is destroyed.
       * If the node is not currently managed, this is essentially a no-op.
       * @param {!Node} node
       * @param {!InertRoot} inertRoot
       * @return {?InertNode} The potentially destroyed InertNode associated with this node, if any.
       */
    }, {
      key: "deregister",
      value: function deregister(node, inertRoot) {
        var inertNode = this._managedNodes.get(node);
        if (!inertNode) {
          return null;
        }
        inertNode.removeInertRoot(inertRoot);
        if (inertNode.destroyed) {
          this._managedNodes["delete"](node);
        }
        return inertNode;
      }
      /**
       * Callback used when document has finished loading.
       */
    }, {
      key: "_onDocumentLoaded",
      value: function _onDocumentLoaded() {
        var inertElements = slice.call(this._document.querySelectorAll("[inert]"));
        inertElements.forEach(function(inertElement) {
          this.setInert(inertElement, true);
        }, this);
        this._observer.observe(this._document.body || this._document.documentElement, { attributes: true, subtree: true, childList: true });
      }
      /**
       * Callback used when mutation observer detects attribute changes.
       * @param {!Array<!MutationRecord>} records
       * @param {!MutationObserver} self
       */
    }, {
      key: "_watchForInert",
      value: function _watchForInert(records, self) {
        var _this = this;
        records.forEach(function(record) {
          switch (record.type) {
            case "childList":
              slice.call(record.addedNodes).forEach(function(node) {
                if (node.nodeType !== Node.ELEMENT_NODE) {
                  return;
                }
                var inertElements = slice.call(node.querySelectorAll("[inert]"));
                if (matches.call(node, "[inert]")) {
                  inertElements.unshift(node);
                }
                inertElements.forEach(function(inertElement) {
                  this.setInert(inertElement, true);
                }, _this);
              }, _this);
              break;
            case "attributes":
              if (record.attributeName !== "inert") {
                return;
              }
              var target = (
                /** @type {!HTMLElement} */
                record.target
              );
              var inert = target.hasAttribute("inert");
              _this.setInert(target, inert);
              break;
          }
        }, this);
      }
    }]);
    return InertManager2;
  }();
  function composedTreeWalk(node, callback, shadowRootAncestor) {
    if (node.nodeType == Node.ELEMENT_NODE) {
      var element = (
        /** @type {!HTMLElement} */
        node
      );
      if (callback) {
        callback(element);
      }
      var shadowRoot = (
        /** @type {!HTMLElement} */
        element.shadowRoot
      );
      if (shadowRoot) {
        composedTreeWalk(shadowRoot, callback, shadowRoot);
        return;
      }
      if (element.localName == "content") {
        var content = (
          /** @type {!HTMLContentElement} */
          element
        );
        var distributedNodes = content.getDistributedNodes ? content.getDistributedNodes() : [];
        for (var i = 0; i < distributedNodes.length; i++) {
          composedTreeWalk(distributedNodes[i], callback, shadowRootAncestor);
        }
        return;
      }
      if (element.localName == "slot") {
        var slot = (
          /** @type {!HTMLSlotElement} */
          element
        );
        var _distributedNodes = slot.assignedNodes ? slot.assignedNodes({ flatten: true }) : [];
        for (var _i = 0; _i < _distributedNodes.length; _i++) {
          composedTreeWalk(_distributedNodes[_i], callback, shadowRootAncestor);
        }
        return;
      }
    }
    var child = node.firstChild;
    while (child != null) {
      composedTreeWalk(child, callback, shadowRootAncestor);
      child = child.nextSibling;
    }
  }
  function addInertStyle(node) {
    if (node.querySelector("style#inert-style, link#inert-style")) {
      return;
    }
    var style = document.createElement("style");
    style.setAttribute("id", "inert-style");
    style.textContent = "\n[inert] {\n  pointer-events: none;\n  cursor: default;\n}\n\n[inert], [inert] * {\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n";
    node.appendChild(style);
  }
  if (!HTMLElement.prototype.hasOwnProperty("inert")) {
    var inertManager = new InertManager(document);
    Object.defineProperty(HTMLElement.prototype, "inert", {
      enumerable: true,
      /** @this {!HTMLElement} */
      get: function get() {
        return this.hasAttribute("inert");
      },
      /** @this {!HTMLElement} */
      set: function set(inert) {
        inertManager.setInert(this, inert);
      }
    });
  }
})();

// _src/js/global.js
import { Alpine as Alpine2, AlpinePlugins } from "vendor";

// _src/js/alpine-plugins/fetched-fragment.js
function fetched_fragment_default(Alpine3) {
  Alpine3.magic("fetchedFragment", (el, { Alpine: Alpine4, evaluateLater }) => {
    return (url, selector, loadingClasses = null, forceFresh = false) => {
      let classNames;
      if (loadingClasses) {
        classNames = loadingClasses.split(/\s+/g);
        el.classList.add(...classNames);
      }
      return async () => {
        const html = await fetchHTMLFragment(url, selector, forceFresh);
        Alpine4.$data(el).$nextTick(() => {
          if (classNames) {
            el.classList.remove(...classNames);
          }
        });
        return html;
      };
    };
  });
}

// _src/js/alpine-plugins/html-if-set.js
function html_if_set_default(Alpine3) {
  Alpine3.directive(
    "html-if-set",
    (el, { modifiers, expression }, { effect, evaluateLater }) => {
      let evaluate = evaluateLater(expression);
      let useEmpty = modifiers.includes("use-empty");
      function saveInitialHTML() {
        el._x_custom_initialHTML = el.innerHTML;
      }
      function getInitialHTML() {
        return el._x_custom_initialHTML;
      }
      effect(() => {
        let newHTML;
        evaluate((value) => {
          if (Boolean(value)) {
            newHTML = value;
            if (!getInitialHTML()) {
              saveInitialHTML();
            }
          } else {
            if (useEmpty && value === "") {
              newHTML = value;
            } else {
              if (getInitialHTML()) {
                newHTML = getInitialHTML();
              }
            }
          }
          if (newHTML || useEmpty && newHTML === "") {
            Alpine3.mutateDom(() => {
              el.innerHTML = newHTML;
              el._x_ignoreSelf = true;
              Alpine3.initTree(el);
              delete el._x_ignoreSelf;
            });
          }
        });
      });
    }
  );
}

// _src/js/stores/modals.js
var modals_default = {
  leftDrawer: { open: false, contents: "" },
  rightDrawer: { open: false, contents: "" },
  modal: { open: false, contents: "" },
  popup: { open: false, contents: "" },
  modals: {},
  register(name, slotName) {
    this.modals[name] = slotName;
    this.setUpHide(slotName);
  },
  async open(name) {
    if (this.modals[name]) {
      const slotName = this.modals[name];
      if (this[slotName].contents === name && this[slotName].open === true)
        return;
      document.body.dispatchEvent(
        new CustomEvent(`${kebabCase(name)}-will-open`, { bubbles: true })
      );
      document.body.dispatchEvent(
        new CustomEvent(`${kebabCase(slotName)}-will-open`, { bubbles: true })
      );
      this[slotName].contents = name;
      this[slotName].open = true;
      await Alpine.nextTick();
      await Alpine.nextTick();
      const dispatchOpenEvents = () => {
        document.body.dispatchEvent(
          new CustomEvent(`${kebabCase(name)}-is-open`, { bubbles: true })
        );
        document.body.dispatchEvent(
          new CustomEvent(`${kebabCase(slotName)}-is-open`, {
            bubbles: true
          })
        );
      };
      try {
        const slotEl = document.getElementById(`${kebabCase(slotName)}-slot`);
        const transitionEl = slotEl.hasAttribute("x-show") ? slotEl : slotEl.closest("[x-show]");
        await Promise.all(
          transitionEl.getAnimations().map((animation) => animation.finished)
        );
        dispatchOpenEvents();
      } catch (e) {
        dispatchOpenEvents();
      }
    }
  },
  close(nameOrSlotName) {
    let name, slotName;
    if (this.modals[nameOrSlotName]) {
      name = nameOrSlotName;
      slotName = this.modals[nameOrSlotName];
    } else {
      name = this[nameOrSlotName].contents;
      slotName = nameOrSlotName;
    }
    if (this[slotName].contents !== name || this[slotName].open !== true)
      return;
    document.body.dispatchEvent(
      new CustomEvent(`${kebabCase(name)}-will-close`, {
        bubbles: true
      })
    );
    document.body.dispatchEvent(
      new CustomEvent(`${kebabCase(slotName)}-will-close`, { bubbles: true })
    );
    this[slotName].open = false;
  },
  setUpHide(slotName) {
    const slotEl = document.getElementById(`${kebabCase(slotName)}-slot`);
    const transitionEl = slotEl.hasAttribute("x-show") ? slotEl : slotEl.closest("[x-show]");
    if (!transitionEl) return;
    transitionEl._x_doHide = () => {
      Alpine.mutateDom(() => {
        transitionEl.style.setProperty("display", "none");
      });
      const name = Alpine.store("modals")[slotName].contents;
      Alpine.store("modals")[slotName].contents = "";
      document.body.dispatchEvent(
        new CustomEvent(`${kebabCase(name)}-is-closed`, {
          bubbles: true
        })
      );
      document.body.dispatchEvent(
        new CustomEvent(`${kebabCase(slotName)}-is-closed`, {
          bubbles: true
        })
      );
    };
  },
  closeAll() {
    Object.keys(this.modals).forEach((modal) => {
      Alpine.store("modals").close(modal);
    });
  },
  isRegistered(name) {
    return Boolean(this.modals[name]);
  },
  isOpen(name) {
    if (Object.keys(this.modals).includes(name)) {
      const slotName = this.modals[name];
      if (this[slotName].contents === name && this[slotName].open) {
        return true;
      }
    }
    return false;
  }
};

// _src/js/stores/cart-count.js
var cart_count_default = {
  count: window.theme && window.theme.cartItemCount || 0,
  init() {
    window.addEventListener("shapes:cart:afteradditem", (e) => {
      this._setFromFetchedSection(e.detail.response);
    });
    window.addEventListener("shapes:cart:cartqtychange", (e) => {
      this._setFromFetchedSection(e.detail.response);
    });
    window.addEventListener("shapes:cart:update", (e) => {
      this._setFromFetchedSection(e.detail.response);
    });
  },
  _setFromFetchedSection(data) {
    const countSectionHTML = data.sections["cart-item-count"];
    this.count = parseInt(
      parseDOMFromString(countSectionHTML).firstElementChild.innerText.trim(),
      10
    );
    window.theme.cartItemCount = this.count;
  },
  countWithText() {
    let string = theme.strings.itemCountOther;
    if (this.count === 1) {
      string = theme.strings.itemCountOne;
    }
    return string.replace("{{ count }}", this.count);
  }
};

// _src/js/components/age-check.js
var age_check_default = ({ mode, dateFormat, minimumAge, redirectURL, enabled }) => ({
  authenticated: false,
  mode,
  dateFormat,
  minimumAge,
  redirectURL,
  month: "",
  day: "",
  year: "",
  date: "",
  enabled,
  sectionId: null,
  storageKey: null,
  get fullDate() {
    return `${this.month}/${this.day}/${this.year}`;
  },
  init() {
    this.sectionId = getSectionId(this.$root);
    this.storageKey = `switch-age-check-${this.sectionId}`;
    if (window.location.pathname === "/challenge") return;
    initTeleport(this.$root);
    if (!(Shopify.designMode && Alpine.store("modals").isRegistered("ageCheck"))) {
      Alpine.store("modals").register("ageCheck", "modal");
    }
    if (!Shopify.designMode) {
      if (getExpiringStorageItem(this.storageKey) !== "approved") {
        Alpine.store("modals").open("ageCheck");
      }
    } else {
      if (window.theme.designMode.selected === this.sectionId) {
        if (this.enabled === true) {
          Alpine.store("modals").open("ageCheck");
        } else {
          Alpine.store("modals").close("ageCheck");
        }
      }
      document.addEventListener(
        "shopify:section:select",
        this.onSectionSelect.bind(this)
      );
      document.addEventListener(
        "shopify:section:deselect",
        this.onSectionDeselect.bind(this)
      );
    }
    if (!this.redirectURL) {
      this.redirectURL = "https://www.google.com";
    }
    if (this.mode === "dob") {
      this.date = /* @__PURE__ */ new Date();
      setTimeout(() => this.setUpDOB(), 100);
    }
  },
  onSectionSelect(e) {
    if (!e.target.contains(this.$root)) return;
    if (!this.enabled) return;
    if (!Alpine.store("modals").isOpen("ageCheck")) {
      Alpine.store("modals").open("ageCheck");
    }
  },
  onSectionDeselect(e) {
    if (!e.target.contains(this.$root)) return;
    this.$store.modals.close("ageCheck");
  },
  approveEntry() {
    Alpine.store("modals").close("ageCheck");
    if (!Shopify.designMode) {
      setExpiringStorageItem(this.storageKey, "approved", daysInMs(30));
    }
  },
  denyEntry() {
    window.location = this.redirectURL;
  },
  checkInput(name) {
    switch (name) {
      case "day":
        return parseInt(this.day) > 0 && parseInt(this.day) < 32 ? true : false;
      case "month":
        return parseInt(this.month) > 0 && parseInt(this.month) < 13 ? true : false;
      case "year":
        return parseInt(this.year) < this.date.getFullYear() && parseInt(this.year) > 1900 ? true : false;
    }
    return true;
  },
  checkAge() {
    const currentDate = Math.round(this.date.getTime() / 1e3);
    const enteredDate = Math.round(
      (/* @__PURE__ */ new Date(`${this.fullDate}`)).getTime() / 1e3
    );
    const yearInSeconds = 31536e3;
    const difference = Math.floor((currentDate - enteredDate) / yearInSeconds);
    if (difference > parseInt(this.minimumAge, 10)) {
      this.approveEntry();
    } else {
      this.denyEntry();
    }
  },
  setUpDOB() {
    const container = document.getElementById(`dob-form-${this.sectionId}`);
    container.addEventListener("input", (e) => {
      const target = e.srcElement || e.target;
      const maxLength = parseInt(target.attributes["maxlength"].value, 10);
      const targetLength = target.value.length;
      if (targetLength >= maxLength) {
        const valid = this.checkInput(target.getAttribute("name"));
        if (!valid) {
          target.value = "";
          return false;
        }
        let next = target.closest(".input-grid-item");
        while (next = next.nextElementSibling) {
          if (next == null) break;
          let input = next.querySelector("input");
          if (input !== null) {
            input.focus();
            break;
          }
        }
      } else if (targetLength === 0) {
        let previous = target.closest(".input-grid-item");
        while (previous = previous.previousElementSibling) {
          if (previous == null) break;
          const input = previous.querySelector("input");
          if (input !== null) {
            input.focus();
            break;
          }
        }
      }
      if (this.checkInput("day") && this.checkInput("month") && this.checkInput("year")) {
        setTimeout(() => this.checkAge(), 500);
      }
    });
  },
  destroy() {
    document.removeEventListener(
      "shopify:section:select",
      this.onSectionSelect
    );
    document.removeEventListener(
      "shopify:section:deselect",
      this.onSectionDeselect
    );
  }
});

// _src/js/components/cart-items.js
var cart_items_default = () => ({
  itemsRoot: null,
  loading: null,
  init() {
    this.itemsRoot = this.$root;
    window.addEventListener(
      "shapes:cart:afteradditem",
      this.onCartQuantityChange.bind(this)
    );
    window.addEventListener(
      "shapes:cart:cartqtychange",
      this.onCartQuantityChange.bind(this)
    );
    window.addEventListener(
      "shapes:cart:update",
      this.onCartQuantityChange.bind(this)
    );
    document.addEventListener("shapes:cart:lock", () => {
      this.loading = true;
    });
    document.addEventListener("shapes:cart:unlock", () => {
      this.loading = false;
    });
  },
  onCartQuantityChange(e) {
    Alpine.morph(
      this.itemsRoot,
      querySelectorInHTMLString(
        "[data-cart-items]",
        e.detail.response.sections["cart-items"]
      ).outerHTML
    );
    this.$nextTick(() => {
      this.itemsRoot.querySelectorAll("input").forEach((inputEl) => {
        inputEl.value = inputEl.getAttribute("value");
        inputEl.dispatchEvent(new Event("input"));
      });
    });
    this.updateLiveRegion(
      parseDOMFromString(e.detail.response.sections["cart-live-region"]).firstElementChild.textContent
    );
    if (e.detail.originalTarget) {
      this.$nextTick(() => {
        if (!this.itemsRoot.contains(e.detail.originalTarget)) {
          let focusRoot;
          if (this.itemsRoot.closest('[role="dialog"]')) {
            focusRoot = this.itemsRoot.closest('[role="dialog"]').parentNode;
          } else {
            focusRoot = this.itemsRoot;
          }
          this.$focus.within(focusRoot).first();
        }
      });
    }
    const itemsRootEl = this.itemsRoot;
    switch (e.type) {
      case "shapes:cart:afteradditem":
        document.dispatchEvent(
          new CustomEvent("theme:product:add", {
            detail: {
              cartItemCount: window.theme.cartItemCount,
              itemsRootEl,
              lineItemEl: document.querySelector(
                `[data-line-item-key="${e.detail.response.key}"]`
              ) || null,
              variantId: e.detail.response.variant_id,
              key: e.detail.response.key,
              formEl: document.getElementById(e.detail.sourceId),
              get cartPromise() {
                return fetch(
                  window.theme.routes.cart_url,
                  fetchConfigDefaults()
                ).then((res) => res.json()).then((cart) => cart).catch(
                  (error) => console.error(
                    "Error fetching cart in `theme:product:add`",
                    error
                  )
                );
              }
            }
          })
        );
        break;
      case "shapes:cart:cartqtychange":
        document.dispatchEvent(
          new CustomEvent("theme:line-item:change", {
            detail: {
              cartItemCount: e.detail.response.item_count,
              itemsRootEl,
              lineItemEl: document.querySelector(
                `[data-line-item-key="${e.detail.key}"]`
              ) || null,
              variantId: e.detail.variantId,
              key: e.detail.key,
              quantity: e.detail.quantity,
              previousQuantity: e.detail.previousQuantity,
              cart: e.detail.response
            }
          })
        );
        break;
      case "shapes:cart:update":
        document.dispatchEvent(
          new CustomEvent("theme:cart:update", {
            detail: {
              cartItemCount: window.theme.cartItemCount,
              itemsRootEl,
              get cartPromise() {
                return fetch(
                  window.theme.routes.cart_url,
                  fetchConfigDefaults()
                ).then((res) => res.json()).then((cart) => cart).catch(
                  (error) => console.error(
                    "Error fetching cart in `theme:cart:update`",
                    error
                  )
                );
              }
            }
          })
        );
        break;
    }
  },
  updateLiveRegion(liveRegionText) {
    if (!liveRegionText) return;
    const cartStatus = document.getElementById("cart-live-region-text");
    cartStatus.textContent = liveRegionText;
    cartStatus.setAttribute("aria-hidden", false);
    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1e3);
  }
});

// _src/js/components/cart-item.js
var cart_item_default = (key) => ({
  quantity: null,
  previousQuantity: null,
  key,
  locked: false,
  errorMessage: null,
  init() {
    document.addEventListener("shapes:cart:lock", () => {
      this.locked = true;
    });
    document.addEventListener("shapes:cart:unlock", () => {
      this.locked = false;
    });
  },
  async itemQuantityChange() {
    if (this.locked || this.loading) return;
    if (this.$refs.quantityInput.hasAttribute("data-last-value")) {
      if (this.quantity === Number(this.$refs.quantityInput.dataset.lastValue)) {
        return;
      }
    }
    this.locked = true;
    this.loading = true;
    const request = {
      ...fetchConfigDefaults("application/javascript"),
      body: JSON.stringify({
        id: this.key,
        quantity: this.quantity,
        sections: "cart-items,cart-footer,cart-item-count,cart-live-region",
        // eslint-disable-next-line camelcase
        sections_url: window.location.pathname
      })
    };
    try {
      const response = await fetch(theme.routes.cart_change_url, request);
      const data = await response.json();
      if (data.status) {
        this.errorMessage = data.message;
        this.quantity = this.previousQuantity;
        document.dispatchEvent(
          new CustomEvent("theme:line-item:error", {
            detail: {
              message: this.errorMessage,
              itemsRootEl: this.itemsRoot,
              lineItemEl: document.querySelector(`[data-line-item-key="${this.key}"]`) || null,
              variantId: Number(this.$refs.quantityInput.dataset.variantId),
              key: this.key,
              quantity: this.quantity
            }
          })
        );
      } else {
        this.errorMessage = null;
        document.body.dispatchEvent(
          new CustomEvent("shapes:cart:cartqtychange", {
            bubbles: true,
            detail: {
              response: data,
              key: this.key,
              quantity: this.quantity,
              previousQuantity: this.previousQuantity,
              variantId: Number(this.$refs.quantityInput.dataset.variantId),
              originalTarget: this.$refs.quantityControl
            }
          })
        );
      }
    } catch (e) {
      console.error(e);
      document.getElementById("cart-errors").textContent = theme.strings.cartError;
      document.dispatchEvent(
        new CustomEvent("theme:cart:error:other", {
          detail: {
            message: theme.strings.cartError,
            error: e
          }
        })
      );
    } finally {
      this.locked = false;
      this.loading = false;
    }
  },
  removeItem() {
    const visibleQtyControl = Array.from(
      this.$root.querySelectorAll('[x-data="CartItemQuantity"]')
    ).filter((el) => el.offsetParent)[0];
    visibleQtyControl.dispatchEvent(new CustomEvent("remove"));
  }
});

// _src/js/components/core/quantity.js
var quantity_default = {
  adjustQuantity(adjustCb) {
    if (typeof this.previousQuantity !== "undefined") {
      this.previousQuantity = this.quantity;
    }
    const quantityBeforeAdjustment = this.quantity;
    adjustCb();
    this.dispatchInputEvent();
    if (this.quantity === quantityBeforeAdjustment) return;
    this.$nextTick(() => {
      this.dispatchChangeEvent();
    });
  },
  increment() {
    this.adjustQuantity(() => {
      this.$refs.quantityInput.stepUp();
    });
  },
  decrement() {
    this.adjustQuantity(() => {
      this.$refs.quantityInput.stepDown();
    });
  },
  dispatchInputEvent() {
    this.$refs.quantityInput.dispatchEvent(new Event("input"));
  },
  dispatchChangeEvent() {
    this.$refs.quantityInput.dispatchEvent(new Event("change"));
  }
};

// _src/js/components/cart-item-quantity.js
var cart_item_quantity_default = () => ({
  remove() {
    this.adjustQuantity(() => {
      this.$refs.quantityInput.value = 0;
    });
  },
  ...quantity_default
});

// _src/js/components/cart-footer.js
var cart_footer_default = () => ({
  footerRoot: null,
  _morphFooter(e) {
    const newFooterSection = querySelectorInHTMLString(
      "[data-cart-footer]",
      e.detail.response.sections["cart-footer"]
    );
    Alpine.morph(
      this.footerRoot,
      newFooterSection ? newFooterSection.outerHTML : "",
      {
        updating(el, toEl, childrenOnly, skip) {
          if (el.classList && el.classList.contains("additional-checkout-buttons")) {
            skip();
          }
        }
      }
    );
  },
  init() {
    this.footerRoot = this.$root;
    window.addEventListener("shapes:cart:afteradditem", (e) => {
      this._morphFooter(e);
    });
    window.addEventListener("shapes:cart:cartqtychange", (e) => {
      this._morphFooter(e);
    });
    window.addEventListener("shapes:cart:update", (e) => {
      this._morphFooter(e);
    });
  }
});

// _src/js/components/cart-note.js
var cart_note_default = () => ({
  updating: false,
  updateNote() {
    this.updating = true;
    fetch(theme.routes.cart_update_url, {
      method: "POST",
      body: JSON.stringify({
        note: this.$el.value
      }),
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json;",
        Accept: "application/json"
      }
    }).then(() => {
      this.updating = false;
    });
  }
});

// _src/js/components/header.js
var header_default = (count) => {
  return {
    menuOpen: {},
    searchOpen: false,
    headerIsSticky: false,
    scrollY: 0,
    navWrapped: false,
    headerHeight: 0,
    activeWrappedMenuToggleEl: null,
    get isStuck() {
      return this.headerIsSticky && this.scrollY > this.headerHeight * 2;
    },
    get menuIsActive() {
      return !Object.keys(this.menuOpen).every((k) => !this.menuOpen[k]);
    },
    get headerIsActive() {
      return this.menuIsActive || this.searchOpen;
    },
    init() {
      Alpine.store("modals").register("nav", "leftDrawer");
      for (let i = 0; i < parseInt(count); i++) {
        this.menuOpen["menu" + i] = false;
      }
      document.addEventListener("keyup", this.keyUpListener.bind(this));
      document.body.addEventListener(
        "shapes:search:closebutton",
        this.searchCloseButtonListener.bind(this)
      );
      if (this.$root.hasAttribute("data-sticky-header")) {
        this.setUpStickyDetection();
      }
      this.headerResizeFunctions();
      this._debouncedHeaderFunctions = debounce(
        this.headerResizeFunctions.bind(this),
        300
      );
      window.addEventListener("resize", this._debouncedHeaderFunctions);
      if (Shopify.designMode) {
        document.addEventListener(
          "shopify:section:load",
          this.sectionLoadListener.bind(this)
        );
      }
      this.$watch("menuIsActive", (value) => {
        if (!value && this.activeWrappedMenuToggleEl) {
          this.activeWrappedMenuToggleEl = null;
        }
      });
      this.$watch("navWrapped", (value) => {
        if (value) {
          this.activeWrappedMenuToggleEl = null;
        }
      });
    },
    headerResizeFunctions() {
      this.calculateHeaderHeight();
      this.calculateNavWrap();
    },
    setUpStickyDetection() {
      const headerContainerEl = this.$root.closest(".shopify-section");
      const sentinelEl = document.createElement("div");
      sentinelEl.setAttribute("id", "HeaderSentinel");
      headerContainerEl.parentNode.insertBefore(sentinelEl, headerContainerEl);
      const observer = new IntersectionObserver(
        (e) => {
          e.forEach((entry) => {
            this.headerIsSticky = entry.intersectionRatio < 1 ? true : false;
          });
        },
        {
          rootMargin: "-1px 0px 0px 0px",
          threshold: [1]
        }
      );
      observer.observe(sentinelEl);
      let timer = null;
      const checkScrollPosition = (e) => {
        this.scrollY = window.scrollY;
        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          this.scrollY = window.scrollY;
        }, 150);
      };
      this._throttledScrollHandler = throttle(checkScrollPosition, 150);
      window.addEventListener(
        "scroll",
        this._throttledScrollHandler.bind(this),
        {
          passive: true
        }
      );
      this.scrollY = window.scrollY;
    },
    calculateNavWrap() {
      const wrappedItems = [];
      let prevItemRect = {};
      let currItemRect = {};
      if (this.$refs.navigation !== void 0) {
        const items = this.$refs.navigation.children;
        for (let i = 0; i < items.length; i++) {
          const currItem = items[i];
          window.requestAnimationFrame(() => {
            currItemRect = currItem.getBoundingClientRect();
            if (prevItemRect && prevItemRect.top < currItemRect.top) {
              wrappedItems.push(items[i]);
            }
            prevItemRect = currItemRect;
            if (i === items.length - 1) {
              if (wrappedItems.length > 0) {
                this.navWrapped = true;
              } else {
                this.navWrapped = false;
              }
            }
          });
        }
      }
    },
    calculateHeaderHeight() {
      window.requestAnimationFrame(() => {
        this.headerHeight = document.getElementById("headerBorderWrap").clientHeight;
        document.documentElement.style.setProperty(
          "--header-height",
          `${this.headerHeight}px`
        );
      });
    },
    toggleMenu(index) {
      this.menuOpen["menu" + index] = !this.menuOpen["menu" + index];
    },
    focusOut(event, menu) {
      if (event.relatedTarget) {
        let focusedOnTopLevelButton = false;
        let dropdownParent = event.relatedTarget.getAttribute(
          "data-dropdown-parent"
        );
        if (dropdownParent && dropdownParent === menu) {
          focusedOnTopLevelButton = true;
        }
        const focusedOnChild = event.relatedTarget.closest(
          "[data-header-dropdown]"
        );
        if (!focusedOnTopLevelButton && !focusedOnChild) {
          this.menuOpen[menu] = false;
        }
      }
    },
    searchFocusOut() {
      this.$nextTick(() => {
        if (!this.$refs.searchFieldComponent.contains(document.activeElement))
          this.searchOpen = false;
      });
    },
    closeSearch() {
      this.searchOpen = false;
      this.$refs.search.focus();
    },
    openSearch() {
      this.searchOpen = true;
      let input = document.querySelector(".header-search-input");
      setTimeout(() => {
        input.focus();
      }, 100);
    },
    keyUpListener(event) {
      if (event.key === "Escape") {
        if (this.searchOpen === false) {
          for (let i = 0; i < dropdownCount; i++) {
            if (this.menuOpen["menu" + i] === true) {
              this.menuOpen["menu" + i] = false;
              document.querySelector(`[aria-controls="menu${i}"]`).focus();
            }
          }
        } else {
          if (!document.getElementById("predictiveSearchResults")) {
            document.body.dispatchEvent(
              new CustomEvent("shapes:search:closebutton")
            );
          }
        }
      }
    },
    searchCloseButtonListener() {
      this.searchOpen = false;
      this.$nextTick(() => {
        const searchToggleEl = this.$root.querySelector("[data-open-search]");
        if (searchToggleEl) {
          setTimeout(() => {
            searchToggleEl.focus();
          }, 300);
        }
      });
    },
    sectionLoadListener(event) {
      if (!event.target.querySelector(".site-header")) return;
      this.headerResizeFunctions();
    },
    destroy() {
      document.removeEventListener("keyup", this.keyUpListener);
      document.body.removeEventListener(
        "shapes:search:closebutton",
        this.searchCloseButtonListener
      );
      window.removeEventListener("resize", this._debouncedHeaderFunctions);
      window.removeEventListener("scroll", this._throttledScrollHandler);
      if (Shopify.designMode) {
        document.removeEventListener(
          "shopify:section:load",
          this.sectionLoadListener
        );
      }
    }
  };
};

// _src/js/components/predictive-search.js
var predictive_search_default = (resources) => ({
  cachedResults: {},
  loading: false,
  resultsOpen: false,
  rawQuery: "",
  results: false,
  resultsMarkup: null,
  resources,
  get trimmedQuery() {
    return this.rawQuery.trim();
  },
  get queryKey() {
    return this.trimmedQuery.replace(" ", "-").toLowerCase();
  },
  init() {
    this.cachedResults = {};
    const toggles = document.querySelectorAll("[data-open-search]");
    toggles.forEach((toggle) => {
      toggle.setAttribute("role", "button");
    });
    this.$watch("searchOpen", (value) => {
      if (value === true) {
        this.onOpen();
      }
    });
  },
  close(clearSearchTerm = true) {
    this.closeResults(clearSearchTerm);
    this.closePredictiveSearch();
  },
  closePredictiveSearch() {
    document.body.dispatchEvent(new CustomEvent("shapes:search:closebutton"));
  },
  closeResults(clearSearchTerm = false) {
    this.resultsOpen = false;
    if (clearSearchTerm) {
      this.rawQuery = "";
    }
    const selected = this.$root.querySelector('[aria-selected="true"]');
    if (selected) selected.setAttribute("aria-selected", false);
    this.$refs.input.setAttribute("aria-activedescendant", "");
    this.$refs.input.setAttribute("aria-expanded", false);
    document.documentElement.style.overflowY = "auto";
  },
  getSearchResults() {
    this.loading = true;
    liveRegion(window.theme.strings.loading);
    fetch(
      `${window.theme.routes.predictive_search_url}?q=${encodeURIComponent(
        this.trimmedQuery
      )}&${encodeURIComponent("resources[type]")}=${this.resources}&section_id=predictive-search`
    ).then((response) => {
      this.loading = false;
      if (!response.ok) {
        var error = new Error(response.status);
        this.close(true);
        throw error;
      }
      return response.text();
    }).then((text) => {
      this.results = true;
      const resultsMarkup = new DOMParser().parseFromString(text, "text/html").querySelector("#shopify-section-predictive-search").innerHTML;
      const liveRegionText = new DOMParser().parseFromString(text, "text/html").querySelector("#predictive-search-count").textContent;
      this.cachedResults[this.queryKey] = resultsMarkup;
      this.renderSearchResults(resultsMarkup);
      liveRegion(liveRegionText);
    }).catch((error) => {
      this.close(true);
      throw error;
    });
  },
  onChange() {
    if (!this.trimmedQuery.length) {
      this.closeResults();
    } else {
      this.openResults();
      this.getSearchResults();
    }
  },
  onFocus() {
    if (!this.trimmedQuery.length) return;
    if (this.results === true) {
      this.openResults();
    } else {
      this.getSearchResults();
    }
  },
  onFormSubmit() {
    if (!this.trimmedQuery.length || this.$root.querySelector('[aria-selected="true"] a'))
      this.$event.preventDefault();
  },
  onKeyup() {
    this.$event.preventDefault();
    switch (this.$event.code) {
      case "ArrowUp":
        this.switchOption("up");
        break;
      case "ArrowDown":
        this.switchOption("down");
        break;
      case "Enter":
        this.selectOption();
        break;
    }
  },
  onKeydown() {
    if (this.$event.code === "Escape" && this.trimmedQuery.length) {
      this.$event.preventDefault();
    }
    if (this.$event.code === "ArrowUp" || this.$event.code === "ArrowDown" || this.$event.code === "Enter" && this.selectedElement) {
      this.$event.preventDefault();
    }
  },
  onOpen() {
    if (this.trimmedQuery.length) {
      this.openResults();
      this.$nextTick(() => {
        if (this.cachedResults[this.queryKey]) {
          this.renderSearchResults(this.cachedResults[this.queryKey]);
        } else {
          this.getSearchResults();
        }
      });
    }
  },
  openResults() {
    this.resultsOpen = true;
    this.$refs.input.setAttribute("aria-expanded", true);
    document.documentElement.style.overflowY = "hidden";
  },
  renderSearchResults(resultsMarkup) {
    this.$refs.results.innerHTML = resultsMarkup;
    this.results = true;
    this.openResults();
  },
  selectOption() {
    const selectedProduct = this.$root.querySelector(
      '[aria-selected="true"] a, [aria-selected="true"] button'
    );
    if (selectedProduct) selectedProduct.click();
  },
  switchOption(direction) {
    if (!this.resultsOpen) return;
    const moveUp = direction === "up";
    const selectedElement = this.$root.querySelector('[aria-selected="true"]');
    const allElements = Array.from(
      this.$root.querySelectorAll(".predictive-search__option")
    );
    let activeElement = this.$root.querySelector(".predictive-search__option");
    if (moveUp && !allElements.length) return;
    if (!moveUp && selectedElement) {
      activeElement = allElements[allElements.indexOf(selectedElement) + 1] || allElements[0];
    } else if (moveUp) {
      activeElement = allElements[allElements.indexOf(selectedElement) - 1] || allElements[allElements.length - 1];
    }
    if (activeElement === selectedElement) return;
    activeElement.setAttribute("aria-selected", true);
    if (selectedElement) selectedElement.setAttribute("aria-selected", false);
    this.$refs.input.setAttribute("aria-activedescendant", activeElement.id);
    activeElement.scrollIntoView(false, { behavior: "smooth" });
  }
});

// _src/js/components/video.js
var video_default = (playback = "inline", mode = "preview") => ({
  player: null,
  enabled: false,
  shown: false,
  playing: false,
  id: "",
  playback,
  mode,
  init() {
    this.id = this.$root.id;
    document.body.addEventListener("pauseAllMedia", (e) => {
      if (this.mode === "autoplay" || e.detail !== null && e.detail.id === this.$root.id)
        return;
      this.pause();
    });
    this.$watch("enabled", async (value) => {
      await this.$nextTick();
      this.shown = value;
      if (value === true) {
        this.player = this.$root.querySelector("[\\@play][\\@pause]");
        this.player.addEventListener("playing", () => {
          this.playing = true;
        });
        this.player.addEventListener("paused", () => {
          this.playing = false;
        });
      }
    });
    this.$watch("playing", (value) => {
      if (value === true) {
        this.dispatchPauseAllMediaEvent();
      }
    });
    this.productMediaWrapper = this.$root.closest(
      "[data-product-single-media-wrapper]"
    );
    if (this.productMediaWrapper) {
      this.setUpProductMediaListeners();
    }
    if (this.mode === "autoplay") {
      this.enabled = true;
    }
  },
  dispatchPauseAllMediaEvent() {
    document.body.dispatchEvent(
      new CustomEvent("pauseAllMedia", {
        detail: {
          id: this.$root.id
        }
      })
    );
  },
  play() {
    if (this.enabled === false || this.player === null) return;
    this.player.dispatchEvent(new CustomEvent("play"));
  },
  pause() {
    if (this.enabled === false || this.player === null) return;
    this.player.dispatchEvent(new CustomEvent("pause"));
  },
  setUpProductMediaListeners() {
    this.productMediaWrapper.addEventListener("mediaHidden", () => {
      this.pause();
    });
    this.productMediaWrapper.addEventListener("mediaVisible", () => {
    });
  }
});

// _src/js/components/html-video.js
var html_video_default = () => ({
  init() {
    this.$refs.video.addEventListener("play", () => {
      this.$root.dispatchEvent(
        new CustomEvent("playing", {
          bubbles: true
        })
      );
    });
    this.$refs.video.addEventListener("pause", () => {
      this.$root.dispatchEvent(
        new CustomEvent("paused", {
          bubbles: true
        })
      );
    });
    if (this.$refs.video.autoplay) {
      this.$nextTick(() => {
        this.$refs.video.play();
      });
    }
  },
  play() {
    this.$refs.video.play();
  },
  pause() {
    this.$refs.video.pause();
  }
});

// _src/js/components/product-thumbnails.js
var product_thumbnails_default = () => ({
  firstVisible: true,
  lastVisible: false,
  init() {
    const firstThumbnail = this.$refs.firstThumbnail;
    const lastThumbnail = this.$refs.lastThumbnail;
    const options = {
      root: this.$root.querySelector(".splide__track"),
      rootMargin: "0px",
      threshold: 1
    };
    const firstThumbnailObserver = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.firstVisible = true;
        } else {
          this.firstVisible = false;
        }
      },
      options
    );
    const lastThumbnailObserver = new window.IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.lastVisible = true;
      } else {
        this.lastVisible = false;
      }
    }, options);
    firstThumbnailObserver.observe(firstThumbnail);
    lastThumbnailObserver.observe(lastThumbnail);
  }
});

// _src/js/components/filterable.js
var filterable_default = () => ({
  focusId: "",
  filterData: [],
  sectionId: null,
  init() {
    this.sectionId = getSectionId(this.$root);
    initTeleport(this.$root);
    Alpine.store("modals").register("filters", "leftDrawer");
    Alpine.store("modals").register("sort", "rightDrawer");
    window.addEventListener("popstate", this.onHistoryChange.bind(this));
    this._observeResultsMutations();
  },
  filterFormSubmit(e, close) {
    this.focusId = e.target.id;
    if (close) {
      Alpine.store("modals").close(close);
    }
    let form = e.target.form;
    if (e.target.tagName.toLowerCase() === "form") {
      form = e.target;
    }
    const formData = new FormData(form);
    const searchParams = new URLSearchParams(formData);
    searchParams.delete("price_range");
    this.renderPage(searchParams.toString(), e);
  },
  clearAllFilters(e) {
    Alpine.store("modals").close("filters");
    this.renderPage(new URL(e.currentTarget.href).searchParams.toString());
  },
  renderPage(searchParams, event, updateURLHash = true) {
    document.getElementById("facets-results").classList.add("opacity-50");
    const url = `${window.location.pathname}?section_id=${this.sectionId}&${searchParams}`;
    const filterDataUrl = (element) => element.url === url;
    this.filterData.some(filterDataUrl) ? this.renderFromCache(filterDataUrl, event) : this.renderFromFetch(url, event);
    if (updateURLHash) this.updateURLHash(searchParams);
  },
  renderFromFetch(url, event) {
    fetch(url).then((response) => response.text()).then((responseText) => {
      const html = responseText;
      this.filterData = [...this.filterData, { html, url }];
      this.renderMarkup(html);
    });
  },
  renderFromCache(filterDataUrl, event) {
    const html = this.filterData.find(filterDataUrl).html;
    this.renderMarkup(html);
  },
  renderMarkup(html) {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const innerHTML = parsed.getElementById("facets-filterable").innerHTML;
    const filterableEl = document.getElementById("facets-filterable");
    if (innerHTML !== filterableEl.innerHTML) {
      filterableEl.closest(".shopify-section").dispatchEvent(
        new CustomEvent("shapes:section:willmutate", {
          bubbles: true
        })
      );
      setTimeout(() => {
        filterableEl.querySelectorAll("[x-teleport]").forEach((el) => {
          el.remove();
        });
        filterableEl.innerHTML = innerHTML;
        this.$nextTick(() => {
          initTeleport(filterableEl);
        });
      }, 300);
    } else {
      document.getElementById("facets-results").classList.remove("opacity-50");
    }
    const count = parsed.getElementById("facets-results-count").innerHTML;
    liveRegion(count);
    const element = document.getElementById(this.focusId);
    if (element) {
      setTimeout(() => {
        document.getElementById(this.focusId).focus();
      }, 50);
    }
  },
  updateURLHash(searchParams) {
    history.pushState(
      { searchParams },
      "",
      `${window.location.pathname}${searchParams && "?".concat(searchParams)}`
    );
  },
  onHistoryChange(event) {
    const searchParams = event.state.searchParams || "";
    this.renderPage(searchParams, null, false);
  },
  _observeResultsMutations() {
    const containerEl = document.getElementById("facets-filterable");
    const mutationObserverOptions = {
      childList: true,
      attributes: false,
      // Omit (or set to false) to observe only changes to the parent node
      subtree: false
    };
    const callback = (mutationList, observer) => {
      mutationList.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.target.closest(".shopify-section").dispatchEvent(
            new CustomEvent("shapes:section:hasmutated", {
              bubbles: true
            })
          );
        }
      });
    };
    const mutationObserver = new MutationObserver(callback);
    mutationObserver.observe(containerEl, mutationObserverOptions);
  }
});

// _src/js/components/quantity.js
var quantity_default2 = () => ({
  quantity: null,
  ...quantity_default
});

// _src/js/components/modal-cart.js
var modal_cart_default = ({ openOnAddToCart }) => ({
  init() {
    if (openOnAddToCart === true) {
      document.body.addEventListener("shapes:cart:afteradditem", () => {
        Alpine.store("modals").open("cart");
      });
    }
    Alpine.store("modals").register("cart", "rightDrawer");
  }
});

// _src/js/components/rte.js
var rte_default = () => ({
  init() {
    this.$root.querySelectorAll("table").forEach((tableEl) => {
      const wrapper = wrap(tableEl);
      wrapper.classList.add("table-wrapper");
    });
    const iframeSelector = 'iframe[src*="youtube.com"],iframe[src*="player.vimeo"]';
    this.$root.querySelectorAll(iframeSelector).forEach((extVideoEl) => {
      const wrapper = wrap(extVideoEl);
      wrapper.classList.add("video-wrapper");
    });
  }
});

// _src/js/components/shape-divider.js
var shape_divider_default = () => ({
  _debouncedResizeHandler: null,
  init() {
    const resizeHandler = (e) => {
      this.$refs["animation-container"].style.display = "none";
      this.$refs["animation-container"].style.animation = "none";
      this.$refs["animation-container"].offsetHeight;
      this.$refs["animation-container"].style.display = "";
      setTimeout(() => {
        this.$refs["animation-container"].style.animation = null;
      }, 100);
    };
    this._debouncedResizeHandler = debounce(resizeHandler, 150);
    window.addEventListener("resize", this._debouncedResizeHandler.bind(this));
  },
  destroy() {
    window.removeEventListener("resize", this._debouncedResizeHandler);
  }
});

// _src/js/components/free-shipping-bar.js
var free_shipping_bar_default = () => ({
  contentHTML: null,
  styleString: null,
  init() {
    this.updateStyleString(this.$root);
    window.addEventListener(
      "shapes:cart:afteradditem",
      this.onCartUpdate.bind(this)
    );
    window.addEventListener(
      "shapes:cart:cartqtychange",
      this.onCartUpdate.bind(this)
    );
    window.addEventListener("shapes:cart:update", this.onCartUpdate.bind(this));
  },
  async onCartUpdate() {
    const updatedSection = await freshHTML(
      getURLWithParams(window.theme.routes.root_url, {
        // eslint-disable-next-line camelcase
        section_id: this.$root.id
      })
    );
    const updatedRoot = querySelectorInHTMLString(
      '[x-data="FreeShippingBar"]',
      updatedSection
    );
    this.updateStyleString(updatedRoot);
    this.contentHTML = updatedRoot.querySelector("[data-content]").innerHTML;
  },
  updateStyleString(el) {
    if (!this.$root.hasAttribute("style")) return;
    this.styleString = el.style.cssText;
  }
});

// _src/js/components/offset-gallery-item.js
var offset_gallery_item_default = () => ({
  tabIndex: -1,
  init() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.tabIndex = 0;
          return;
        }
        this.isVisible = -1;
      },
      {
        root: null,
        threshold: 0
      }
    );
    observer.observe(this.$root);
  },
  focused() {
    const containerEl = this.$el.closest(".offset-gallery-container");
    containerEl.scrollTop = 0;
    containerEl.scrollLeft = 0;
  }
});

// _src/js/components/tiktok-embed.js
var tiktok_embed_default = (tikTokURL) => ({
  tikTokURL,
  async init() {
    try {
      const response = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(this.tikTokURL)}`
      );
      const data = await response.json();
      const rootElement = this.$el;
      if (rootElement) {
        rootElement.innerHTML = data.html;
        const scripts = rootElement.getElementsByTagName("script");
        for (let i = 0; i < scripts.length; i++) {
          const script = document.createElement("script");
          if (scripts[i].src) {
            script.src = scripts[i].src;
          } else {
            script.textContent = scripts[i].textContent;
          }
          document.body.appendChild(script);
        }
      }
    } catch (error) {
      console.error("Error fetching TikTok embed code:", error);
    }
  }
});

// _src/js/components/async-script-loader.js
var async_script_loader_default = () => ({
  init() {
    const scripts = this.$refs.scripts.content.querySelectorAll("script");
    for (let i = 0; i < scripts.length; i++) {
      const script = document.createElement("script");
      if (scripts[i].src) {
        script.src = scripts[i].src;
      } else {
        script.textContent = scripts[i].textContent;
      }
      document.body.appendChild(script);
    }
  }
});

// _src/js/components/focus-carousel.js
var focus_carousel_default = (splideID) => ({
  slideIndex: 0,
  isTransitioning: false,
  splideID,
  init() {
    window.addEventListener("switch:focus-carousel:move", (event) => {
      const { splideID: splideID2 } = event.detail;
      if (this.splideID === splideID2) {
        this.isTransitioning = true;
      }
    });
    window.addEventListener("switch:focus-carousel:moved", (event) => {
      const { splideID: splideID2, newIndex } = event.detail;
      if (this.splideID === splideID2) {
        this.isTransitioning = false;
        this.slideIndex = newIndex;
      }
    });
  }
});

// _src/js/elements/scrolling-items-container.js
var ScrollingItemsContainer = class extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    if (!this.isConnected) return;
    this.scrollingItemsEl = this.firstElementChild;
    this.resizeObserver = new ResizeObserver(
      debounce((entries) => {
        const entry = entries[0];
        if (entry.contentRect.width === this.lastWidth) {
          return;
        }
        this.lastWidth = entry.contentRect.width;
        this.scrollingItemsEl.adjustScrollingItemsSpeed();
        this.scrollingItemsEl.makeClones();
      }, 150)
    );
    this.resizeObserver.observe(this);
    this.addEventListener("scrolling-items:change", () => {
      this.scrollingItemsEl.adjustScrollingItemsSpeed();
      this.scrollingItemsEl.makeClones();
    });
    if (Shopify.designMode) {
      document.addEventListener("shopify:section:unload", (e) => {
        if (e.target.contains(this)) {
          this.resizeObserver.disconnect();
        }
      });
    }
  }
  disconnectedCallback() {
    this.resizeObserver.disconnect();
  }
};

// _src/js/elements/scrolling-items.js
var ScrollingItems = class extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    if (!this.isConnected) return;
    this.adjustScrollingItemsSpeed();
    this.makeClones();
  }
  adjustScrollingItemsSpeed() {
    const referenceWidth = 1024;
    document.documentElement.style.setProperty(
      "--global-scrolling-items-speed-multiplier",
      window.innerWidth / referenceWidth
    );
  }
  makeClones() {
    let i = 0;
    const fallbackContentEl = this.querySelector("noscript");
    if (fallbackContentEl) {
      this.querySelector("noscript").remove();
    }
    const scrollingItemsSurfaceEl = this.querySelector(
      "scrolling-items-surface"
    );
    const originalContentEl = this.querySelector("scrolling-items-content");
    if (!scrollingItemsSurfaceEl || !originalContentEl) {
      return;
    }
    const originalContentWidth = originalContentEl.getBoundingClientRect().width;
    if (originalContentWidth === 0) {
      return;
    }
    const totalClonesNeeded = 2 * Math.ceil(window.innerWidth * 2 / originalContentWidth / 2);
    const addClone = () => {
      const clone = originalContentEl.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      scrollingItemsSurfaceEl.append(clone);
    };
    while (scrollingItemsSurfaceEl.children.length !== totalClonesNeeded) {
      if (totalClonesNeeded === Infinity || Number.isNaN(totalClonesNeeded) || i > 1e3) {
        console.error(
          `Shapes: Scrolling items: Something went wrong inside the scrolling items layout function`,
          {
            originalContentWidth,
            windowInnerWidth: window.innerWidth,
            totalExistingClones: scrollingItemsSurfaceEl.children.length,
            totalClonesNeeded
          }
        );
        break;
      }
      if (scrollingItemsSurfaceEl.children.length > totalClonesNeeded) {
        scrollingItemsSurfaceEl.removeChild(scrollingItemsSurfaceEl.lastChild);
      } else {
        addClone();
      }
    }
    this.style.setProperty(
      "--local-scrolling-items-speed-multiplier",
      this.getBoundingClientRect().width / window.innerWidth
    );
  }
};

// node_modules/@shopify/theme-currency/currency.js
var moneyFormat = "${{amount}}";
function formatMoney(cents, format) {
  if (typeof cents === "string") {
    cents = cents.replace(".", "");
  }
  let value = "";
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || moneyFormat;
  function formatWithDelimiters(number, precision = 2, thousands = ",", decimal = ".") {
    if (isNaN(number) || number == null) {
      return 0;
    }
    number = (number / 100).toFixed(precision);
    const parts = number.split(".");
    const dollarsAmount = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      `$1${thousands}`
    );
    const centsAmount = parts[1] ? decimal + parts[1] : "";
    return dollarsAmount + centsAmount;
  }
  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }
  return formatString.replace(placeholderRegex, value);
}

// node_modules/@switchthemes/live-region/index.js
function liveRegion2(content, clear) {
  clearTimeout(window.liveRegionTimeout);
  let region = document.getElementById("screenreader-announce");
  region.innerHTML = content;
  window.liveRegionTimeout = setTimeout(() => {
    region.innerHTML = "";
  }, 3e3);
}
function cartLiveRegion(item) {
  const templateString = theme.strings.update + ": [QuantityLabel]: [Quantity], [Regular] [$$] [DiscountedPrice] [$]. [PriceInformation]";
  function _liveRegionContent() {
    let liveRegionContent = templateString;
    liveRegionContent = liveRegionContent.replace("[QuantityLabel]", theme.strings.quantity).replace("[Quantity]", item.quantity);
    let regularLabel = "";
    let regularPrice = formatMoney(item.original_line_price, theme.moneyFormat);
    let discountLabel = "";
    let discountPrice = "";
    let discountInformation = "";
    if (item.original_line_price > item.final_line_price) {
      regularLabel = theme.strings.regularTotal;
      discountLabel = theme.strings.discountedTotal;
      discountPrice = formatMoney(item.final_line_price, theme.moneyFormat);
      discountInformation = theme.strings.priceColumn;
    }
    liveRegionContent = liveRegionContent.replace("[Regular]", regularLabel).replace("[$$]", regularPrice).replace("[DiscountedPrice]", discountLabel).replace("[$]", discountPrice).replace("[PriceInformation]", discountInformation).replace("  .", "").trim();
    return liveRegionContent;
  }
  liveRegion2(_liveRegionContent(), true);
}
function variantLiveRegion(variant) {
  const templateString = "[Availability] [Regular] [$$] [Sale] [$]. [UnitPrice] [$$$]";
  function _getBaseUnit() {
    if (variant.unit_price_measurement.reference_value === 1) {
      return variant.unit_price_measurement.reference_unit;
    }
    return variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;
  }
  function _liveRegionContent() {
    let liveRegionContent = templateString;
    const availability = variant.available ? "" : theme.strings.soldOut + ",";
    liveRegionContent = liveRegionContent.replace(
      "[Availability]",
      availability
    );
    let regularLabel = "";
    let regularPrice = formatMoney(variant.price, theme.moneyFormat);
    let saleLabel = "", salePrice = "", unitLabel = "", unitPrice = "";
    if (variant.compare_at_price > variant.price) {
      regularLabel = theme.strings.regularPrice;
      regularPrice = formatMoney(variant.compare_at_price, theme.moneyFormat);
      saleLabel = theme.strings.sale;
      salePrice = formatMoney(variant.price, theme.moneyFormat);
    }
    if (variant.unit_price) {
      unitLabel = theme.strings.unitPrice;
      unitPrice = formatMoney(variant.unit_price, theme.moneyFormat) + " " + theme.strings.unitPriceSeparator + " " + _getBaseUnit();
    }
    liveRegionContent = liveRegionContent.replace("[Regular]", regularLabel).replace("[$$]", regularPrice).replace("[Sale]", saleLabel).replace("[$]", salePrice).replace("[UnitPrice]", unitLabel).replace("[$$$]", unitPrice).replace("  .", "").trim();
    return liveRegionContent;
  }
  liveRegion2(_liveRegionContent(), false);
}

// _src/js/modules/slideshow.js
import {
  Splide,
  SplideEventInterface as EventInterface,
  SplideAutoScroll as AutoScroll
} from "vendor";
window.Splide = Splide;
window.slideshows = {};
var applyInert = function(slides) {
  slides.forEach((slide) => {
    const slideEl = slide.slide;
    if (slideEl.matches(".is-visible")) {
      slideEl.removeAttribute("inert");
    } else {
      slideEl.setAttribute("inert", "");
    }
  });
};
function SplideProduct(Splide2) {
  const { on, off, bind, unbind } = EventInterface(Splide2);
  Splide2.root.addEventListener("click", (event) => {
    if (event.target.classList.contains("splide__pagination__page")) {
      Splide2.paginationClicked = true;
    }
  });
  function _goToFirstSlideForMediaWithId(mediaId) {
    const targetSlides = Splide2.Components.Slides.filter(
      (slide) => slide.slide.dataset.mediaId === mediaId.toString()
    );
    if (!targetSlides.length) return;
    Splide2.go(targetSlides[0].index);
  }
  bind(document.body, "shapes:product:variantchange", (e) => {
    if (!e.target.contains(Splide2.root)) return;
    const mediaId = e.detail.variant.featured_media.id;
    _goToFirstSlideForMediaWithId(mediaId);
  });
  function _resizeTrackForSlideAtIndex(index) {
    const slides = Splide2.Components.Slides;
    const targetSlideObject = slides.getAt(index);
    if (!targetSlideObject) return;
    const targetSlide = targetSlideObject.slide;
    const targetSlideMedia = targetSlide.querySelector(
      "[data-product-single-media-wrapper]"
    );
    let newHeight = targetSlideMedia.offsetHeight;
    if (Splide2.root.hasAttribute("data-two-slides-visible-on-mobile") && window.matchMedia("(max-width: 989px").matches) {
      const nextSlide = targetSlide.nextElementSibling;
      if (nextSlide !== null) {
        const nextSlideHeight = nextSlide.querySelector(
          "[data-product-single-media-wrapper]"
        ).offsetHeight;
        newHeight = nextSlideHeight > newHeight ? nextSlideHeight : newHeight;
      }
    }
    Splide2.root.querySelector(".splide__track").style.maxHeight = newHeight + "px";
  }
  const resizeHandler = (e) => {
    _resizeTrackForSlideAtIndex(Splide2.index);
  };
  const _debouncedResizeHandler = debounce(resizeHandler, 150);
  bind(window, "resize", _debouncedResizeHandler);
  function handleDestroy() {
    Splide2.root.querySelectorAll("[inert]").forEach((inertEl) => {
      inertEl.removeAttribute("inert");
    });
    Splide2.root.querySelectorAll("[aria-hidden]").forEach((ariaHiddenEl) => {
      ariaHiddenEl.removeAttribute("aria-hidden");
    });
    unbind(document.body, "shapes:product:variantchange");
  }
  function handleMountedMoved() {
    if (Splide2.options.destroy === true) {
      handleDestroy();
    } else {
      applyInert(Splide2.Components.Slides.get());
    }
  }
  function optionsUpdated(options) {
    if (options.destroy === true) {
      handleDestroy();
    }
  }
  function handleMounted() {
    if (Splide2.root.dataset.firstMedia) {
      _goToFirstSlideForMediaWithId(Splide2.root.dataset.firstMedia);
    }
    _resizeTrackForSlideAtIndex(Splide2.index);
  }
  function handleMoved(newIndex, oldIndex) {
    applyInert(Splide2.Components.Slides.get());
    const slides = Splide2.Components.Slides;
    const oldSlide = slides.getAt(oldIndex).slide.querySelector("[data-product-single-media-wrapper]");
    const newSlide = slides.getAt(newIndex).slide.querySelector("[data-product-single-media-wrapper]");
    if (oldSlide) oldSlide.dispatchEvent(new CustomEvent("mediaHidden"));
    if (newSlide) newSlide.dispatchEvent(new CustomEvent("mediaVisible"));
  }
  function handleMove(newIndex) {
    _resizeTrackForSlideAtIndex(newIndex);
  }
  return {
    mount() {
      on("mounted", handleMounted);
      on("mounted moved", handleMountedMoved);
      on("moved", handleMoved);
      on("move", handleMove);
      on("destroy", handleDestroy);
      on("updated", optionsUpdated);
    }
  };
}
var _setUpAutoPlay = (splideRoot) => {
  const autoplayControl = splideRoot.querySelector(".splide__toggle");
  const playText = autoplayControl.dataset.play;
  const pauseText = autoplayControl.dataset.pause;
  window.slideshows[splideRoot.id].on("autoplay:play", () => {
    autoplayControl.setAttribute("aria-label", pauseText);
  });
  window.slideshows[splideRoot.id].on("autoplay:pause", (event) => {
    autoplayControl.setAttribute("aria-label", playText);
  });
};
var _setUpFocusCarousel = (splideRoot) => {
  const splide = window.slideshows[splideRoot.id];
  const enlargeActiveSlideEnabled = splideRoot.hasAttribute(
    "data-enlarge-active-slide"
  );
  splide.on("move", (newIndex) => {
    const slides = splide.Components.Slides.get();
    slides.forEach((slide) => {
      const scaleContainer = slide.slide.querySelector(
        "[data-slide-scale-container]"
      );
      const highlightText = slide.slide.querySelector(
        "[data-slide-highlight-text]"
      );
      if (enlargeActiveSlideEnabled) {
        scaleContainer.classList.remove("scale-100");
        scaleContainer.classList.add("scale-[0.8]");
      }
      if (highlightText) {
        highlightText.classList.add("opacity-0");
        highlightText.classList.remove("opacity-100");
      }
    });
    const newSlides = slides.filter((slide) => slide.index === newIndex);
    newSlides.forEach((slide) => {
      const scaleContainer = slide.slide.querySelector(
        "[data-slide-scale-container]"
      );
      const highlightText = slide.slide.querySelector(
        "[data-slide-highlight-text]"
      );
      if (highlightText) {
        highlightText.classList.add("opacity-100");
      }
      if (enlargeActiveSlideEnabled) {
        scaleContainer.classList.remove("scale-[0.8]");
        scaleContainer.classList.add("scale-100");
      }
    });
    const event = new CustomEvent("switch:focus-carousel:move", {
      detail: {
        splideID: splideRoot.id,
        newIndex
      }
    });
    window.dispatchEvent(event);
  });
  splide.on("moved", (newIndex) => {
    const event = new CustomEvent("switch:focus-carousel:moved", {
      detail: {
        splideID: splideRoot.id,
        newIndex
      }
    });
    window.dispatchEvent(event);
  });
};
var _createSplideInstance = (splideRoot, options, extensions) => {
  if (splideRoot.hasAttribute("data-thumbnails")) {
    const thumbsRoot = document.getElementById(
      splideRoot.getAttribute("data-thumbnails")
    );
    window.slideshows[thumbsRoot.id] = new Splide(`#${thumbsRoot.id}`, {
      direction: "ttb",
      height: "var(--thumbnails-height)",
      autoHeight: true,
      arrows: false,
      pagination: false,
      isNavigation: true,
      focus: "left",
      gap: "0.625rem",
      slideFocus: false
    });
    window.slideshows[splideRoot.id] = new Splide(`#${splideRoot.id}`, options);
    const mainSplide = window.slideshows[splideRoot.id];
    const thumbsSplide = window.slideshows[thumbsRoot.id];
    mainSplide.mount(extensions);
    document.addEventListener("shapes:product:arrow-change", (e) => {
      if (e.detail.direction == "prev") {
        thumbsSplide.go("<");
      } else {
        thumbsSplide.go(">");
      }
      const slides = thumbsSplide.Components.Slides;
      const targetSlideObject = slides.getAt(thumbsSplide.index).slide.querySelector(".media-thumbnail");
      targetSlideObject.click();
    });
    document.addEventListener("shapes:product:variantchange", (e) => {
      if (!e.target.contains(splideRoot)) return;
      const mediaId = e.detail.variant.featured_media.id;
      const targetSlides = thumbsSplide.Components.Slides.filter(
        (slide) => slide.slide.dataset.mediaId === mediaId.toString()
      );
      if (!targetSlides.length) return;
      thumbsSplide.go(targetSlides[0].index);
    });
    thumbsSplide.mount();
  } else {
    window.slideshows[splideRoot.id] = new Splide(`#${splideRoot.id}`, options);
    window.slideshows[splideRoot.id].on("mounted", (e) => {
      const clones = window.slideshows[splideRoot.id].root.querySelectorAll(
        ".splide__slide--clone"
      );
      for (let i = 0; i < clones.length; i++) {
        let clone = clones[i];
        let elements = clone.getElementsByTagName("*");
        for (let j = 0; j < elements.length; j++) {
          let el = elements[j];
          if (el.hasAttribute("id")) {
            el.id = el.getAttribute("id") + "-" + i;
          }
          if (el.hasAttribute("for")) {
            let newForAttr = el.getAttribute("for") + "-" + i;
            el.setAttribute("for", newForAttr);
          }
        }
      }
    });
    if (splideRoot.dataset.autoRotate === "true") {
      _setUpAutoPlay(splideRoot);
    }
    if (splideRoot.hasAttribute("data-focus-carousel")) {
      _setUpFocusCarousel(splideRoot);
    }
    window.slideshows[splideRoot.id].mount(extensions);
  }
};
window.destroySlideshow = (splideRoot) => {
  if (!window.slideshows[splideRoot.id]) {
    return;
  }
  window.slideshows[splideRoot.id].destroy();
  delete window.slideshows[splideRoot.id];
};
window.makeSlideshow = (splideRoot) => {
  if (splideRoot.matches(".splide--thumbnails")) return;
  if (!splideRoot.id) {
    console.error(
      "Shapes Theme: makeSlideshow requires a unique ID on the slideshow root"
    );
    return;
  }
  if (window.slideshows[splideRoot.id]) return;
  const mobileOnly = splideRoot.matches(".splide--mobile");
  let options = {
    mediaQuery: "min",
    perPage: 1,
    perMove: 1,
    autoWidth: true,
    arrows: true,
    pagination: false,
    rewind: true,
    autoScroll: {
      autoStart: false
    },
    breakpoints: mobileOnly ? {
      990: {
        destroy: true
      }
    } : {}
  };
  const customOptions = splideRoot.querySelector(".slideshow-options");
  if (customOptions !== null) {
    options = JSON.parse(
      splideRoot.querySelector(".slideshow-options").textContent
    );
  }
  if (splideRoot.matches(".splide--product")) {
    const productOptions = {
      mediaQuery: "min",
      type: "slide",
      perPage: 1,
      perMove: 1,
      autoWidth: true,
      pagination: false,
      arrows: true,
      rewind: true,
      drag: splideRoot.dataset.dragDisabled !== "true",
      autoScroll: {
        autoStart: false
      },
      breakpoints: {
        990: {
          destroy: true
        }
      }
    };
    _createSplideInstance(splideRoot, productOptions, { SplideProduct });
  } else {
    if (splideRoot.dataset.autoRotate === "true") {
      options.drag = false;
      options.pauseOnHover = true;
      options.pauseOnFocus = true;
    }
    let extensions = {};
    if (options.autoScroll && options.autoScroll.autoStart === true && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      extensions = { AutoScroll };
    }
    _createSplideInstance(splideRoot, options, extensions);
  }
};
window.discoverNewSlideshows = (container = document) => {
  container.querySelectorAll(".splide").forEach((splideRoot) => {
    makeSlideshow(splideRoot);
  });
};
window.destroySlideshowsIn = (container = document) => {
  container.querySelectorAll(".splide").forEach((splideRoot) => {
    destroySlideshow(splideRoot);
  });
};
window.switchOnDOMContentLoaded(() => {
  discoverNewSlideshows();
});
document.addEventListener("shapes:productquickbuy:added", () => {
  discoverNewSlideshows();
});
document.addEventListener("shapes:productquickbuy:willremove", (e) => {
  if (!e.detail.container) return;
  destroySlideshowsIn(e.detail.container);
});
document.addEventListener("shapes:product:mediachange", (e) => {
  const splideInstance = window.slideshows[e.detail.slideshowId];
  if (!splideInstance) return;
  const slideIndex = splideInstance.Components.Elements.slides.findIndex(
    (slide) => Number(slide.dataset.mediaId) === e.detail.mediaId
  );
  if (slideIndex > -1) {
    splideInstance.go(slideIndex);
  }
});

// _src/js/global.js
import DataIsland from "data-island";
var { intersect, focus, collapse, morph } = AlpinePlugins;
Alpine2.plugin(intersect);
Alpine2.plugin(focus);
Alpine2.plugin(collapse);
Alpine2.plugin(morph);
Alpine2.plugin(fetched_fragment_default);
Alpine2.plugin(html_if_set_default);
window.Alpine = Alpine2;
window.Spruce = Alpine2;
window.liveRegion = liveRegion2;
window.variantLiveRegion = variantLiveRegion;
window.cartLiveRegion = cartLiveRegion;
document.addEventListener("alpine:init", () => {
  Alpine2.store("modals", modals_default);
  Alpine2.store("cart_count", cart_count_default);
});
Alpine2.data("AgeCheck", age_check_default);
Alpine2.data("FreeShippingBar", free_shipping_bar_default);
Alpine2.data("CartItems", cart_items_default);
Alpine2.data("CartItem", cart_item_default);
Alpine2.data("CartItemQuantity", cart_item_quantity_default);
Alpine2.data("CartFooter", cart_footer_default);
Alpine2.data("CartNote", cart_note_default);
Alpine2.data("Header", header_default);
Alpine2.data("PredictiveSearch", predictive_search_default);
Alpine2.data("Video", video_default);
Alpine2.data("HTMLVideo", html_video_default);
Alpine2.data("Filterable", filterable_default);
Alpine2.data("ProductThumbnails", product_thumbnails_default);
Alpine2.data("Quantity", quantity_default2);
Alpine2.data("ModalCart", modal_cart_default);
Alpine2.data("RTE", rte_default);
Alpine2.data("ShapeDivider", shape_divider_default);
Alpine2.data("OffsetGalleryItem", offset_gallery_item_default);
Alpine2.data("TikTokEmbed", tiktok_embed_default);
Alpine2.data("AsyncScriptLoader", async_script_loader_default);
Alpine2.data("FocusCarousel", focus_carousel_default);
if (!customElements.get("data-island")) {
  customElements.define("data-island", DataIsland);
}
if (!customElements.get("scrolling-items-container")) {
  customElements.define("scrolling-items-container", ScrollingItemsContainer);
}
if (!customElements.get("scrolling-items")) {
  customElements.define("scrolling-items", ScrollingItems);
}
setTimeout(() => {
  Alpine2.start();
  document.dispatchEvent(new CustomEvent("switch:alpine:started"));
});
console.log('Shapes theme (4.1.0) by SWITCH | Make the switch: https://switchthemes.co');
