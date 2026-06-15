/**
 * `formatMoney` originally from Shopify’s `theme-scripts` package
 * https://github.com/Shopify/theme-scripts/blob/master/packages/theme-currency/currency.js#L20
 */

/**
 * Format money values based on your shop currency settings
 * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
 * or 3.00 dollars
 * @param  {String} formatString - shop money_format setting
 * @return {String} value - formatted value
 */

function formatMoney(cents, formatString = theme.moneyFormat) {
  if (typeof cents === 'string') {
    cents = cents.replace('.', '');
  }

  let value = '';
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;

  function formatWithDelimiters(
    number,
    precision = 2,
    thousands = ',',
    decimal = '.'
  ) {
    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    const parts = number.split('.');
    const dollarsAmount = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      `$1${thousands}`
    );
    const centsAmount = parts[1] ? decimal + parts[1] : '';

    return dollarsAmount + centsAmount;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}

window.switchDOMContentLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
  window.switchDOMContentLoaded = true;
});

window.switchOnDOMContentLoaded = (cb) => {
  if (window.switchDOMContentLoaded) {
    cb();
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    cb();
  });
};

window.requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    const start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

window.cancelIdleCallback =
  window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  };

function throttle(callback, limit) {
  var waiting = false; // Initially, we're not waiting
  return function () {
    // We return a throttled function
    if (!waiting) {
      // If we're not waiting
      callback.apply(this, arguments); // Execute users function
      waiting = true; // Prevent future invocations
      setTimeout(function () {
        // After a period of time
        waiting = false; // And allow future invocations
      }, limit);
    }
  };
}

/**
 * Wrapper around Object.assign that deletes null or undefined
 * keys from the provided object, making them fall back to
 * values in the defaults object.
 *
 *
 * @param {Object} defaults - An object with defaults for settings/config
 * @param {Object} provided - Provided settings/config object
 * @returns {Object} - Merged object
 */

function objectWithDefaults(defaults, provided) {
  filterObjectByValues(provided, (value) => {
    return value === null || value === undefined;
  });

  return Object.assign(defaults, provided);
}

function wrap(el, tagName = 'div') {
  const wrapper = document.createElement(tagName);

  el.parentNode.insertBefore(wrapper, el);

  wrapper.appendChild(el);

  return wrapper;
}

function wrapAll(nodes, wrapper) {
  // Cache the current parent and previous sibling of the first node.
  var parent = nodes[0].parentNode;
  var previousSibling = nodes[0].previousSibling;

  // Place each node in wrapper.
  //  - If nodes is an array, we must increment the index we grab from
  //    after each loop.
  //  - If nodes is a NodeList, each node is automatically removed from
  //    the NodeList when it is removed from its parent with appendChild.
  for (var i = 0; nodes.length - i; wrapper.firstChild === nodes[0] && i++) {
    wrapper.appendChild(nodes[i]);
  }

  // Place the wrapper just after the cached previousSibling
  parent.insertBefore(wrapper, previousSibling.nextSibling);

  return wrapper;
}

function unwrap(wrapper) {
  // place childNodes in document fragment
  var docFrag = document.createDocumentFragment();
  while (wrapper.firstChild) {
    var child = wrapper.removeChild(wrapper.firstChild);
    docFrag.appendChild(child);
  }

  // replace wrapper with document fragment
  wrapper.parentNode.replaceChild(docFrag, wrapper);
}

function initTeleport(el) {
  if (!el) return;

  const teleportCandidates = el.querySelectorAll('[data-should-teleport]');

  if (teleportCandidates.length) {
    teleportCandidates.forEach((teleportCandidate) => {
      teleportCandidate.setAttribute(
        'x-teleport',
        teleportCandidate.dataset.shouldTeleport
      );
    });
  }
}

async function fetchSectionHTML(url, selector) {
  const res = await fetch(url);
  const fetchedSection = await res.text();
  const result = querySelectorInHTMLString(selector, fetchedSection);
  if (result === null) {
    return null;
  } else {
    return result.innerHTML;
  }
}

function fetchConfigDefaults(acceptHeader = 'application/json') {
  return {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json;',
      Accept: acceptHeader,
    },
  };
}

function parseDOMFromString(htmlString) {
  window.___shapesDOMParser = window.___shapesDOMParser || new DOMParser();

  return window.___shapesDOMParser.parseFromString(htmlString, 'text/html');
}

function querySelectorInHTMLString(selector, htmlString) {
  return parseDOMFromString(htmlString).querySelector(selector);
}

/**
 * Light wrapper around fetch for making common
 * requests easier. Provides very basic caching.
 */

window.__fetchCache = window.__fetchCache || {};

const RESPONSE_TYPE_JSON = 0;
const RESPONSE_TYPE_TEXT = 1;

async function fetchAndCache(
  url,
  options,
  cacheTimeout = 5000,
  forceFresh = false,
  responseType
) {
  if (__fetchCache[url] && !forceFresh) {
    return __fetchCache[url];
  }

  const responseReader =
    responseType === RESPONSE_TYPE_TEXT
      ? Response.prototype.text
      : Response.prototype.json;

  const res = await fetch(url, options);
  const data = responseReader.call(res);

  if (cacheTimeout && cacheTimeout > 0) {
    __fetchCache[url] = data;

    setTimeout(() => {
      delete __fetchCache[url];
    }, cacheTimeout);
  }

  return data;
}

/**
 * fetchHTML and fetchJSON cache responses for 5 seconds
 * by default; if a fresh request is required, set
 * forceFresh to true or use the freshHTML and freshJSON
 * helper functions.
 */

async function fetchHTML(
  url,
  options,
  cacheTimeout = 5000,
  forceFresh = false
) {
  return fetchAndCache(
    url,
    options,
    cacheTimeout,
    forceFresh,
    RESPONSE_TYPE_TEXT
  );
}

function freshHTML(url, options) {
  return fetchHTML(url, options, 0, true);
}

async function fetchJSON(
  url,
  options,
  cacheTimeout = 5000,
  forceFresh = false
) {
  return fetchAndCache(
    url,
    options,
    cacheTimeout,
    forceFresh,
    RESPONSE_TYPE_JSON
  );
}

function freshJSON(url, options) {
  return fetchJSON(url, options, 0, true);
}

async function fetchHTMLFragment(url, selector, forceFresh = false) {
  const fetchedHTMLString = forceFresh
    ? await freshHTML(url)
    : await fetchHTML(url);
  const fragment = querySelectorInHTMLString(selector, fetchedHTMLString);

  return fragment ? fragment.innerHTML : '';
}

function mdBreakpointMQL() {
  return window.matchMedia('(min-width: 768px)');
}

function isMdBreakpoint() {
  return window.mdBreakpointMQL().matches;
}

function maxLgBreakpointMQL() {
  return window.matchMedia('(max-width: 989px)');
}

function isMaxLgBreakpoint() {
  return window.maxLgBreakpointMQL().matches;
}

function lgBreakpointMQL() {
  return window.matchMedia('(min-width: 990px)');
}

function isLgBreakpoint() {
  return window.lgBreakpointMQL().matches;
}

function motionSafeMQL() {
  return window.matchMedia('(prefers-reduced-motion)');
}

function isMotionSafe() {
  return !window.motionSafeMQL().matches;
}

function kebabCase(subject) {
  if ([' ', '_'].includes(subject)) return subject;
  return subject
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]/, '-')
    .toLowerCase();
}

function clearURLSearchParams(url) {
  for (const key of [...url.searchParams.keys()]) {
    url.searchParams.delete(key);
  }
}

/**
 * paramsInput can be a string, a sequence of pairs,
 * or a record, as per:
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams#examples
 *
 * It can also be an instance of URLSearchParams.
 *
 */

function _getURLByModifyingParams(
  urlString,
  paramsInput,
  clear = false,
  append
) {
  const url = new URL(urlString, window.location.origin);

  if (clear) {
    clearURLSearchParams(url);
  }

  const params = new URLSearchParams(paramsInput);

  const setOrAppendParam = append
    ? URLSearchParams.prototype.append
    : URLSearchParams.prototype.set;

  for (const [key, value] of params) {
    setOrAppendParam.call(url.searchParams, key, value);
  }

  return url;
}

function getURLWithParams(url, paramsInput, clear = false) {
  return _getURLByModifyingParams(url, paramsInput, clear, false);
}

function currentURLWithParams(paramsInput, clear = false) {
  return getURLWithParams(window.location.href, paramsInput, clear);
}

function getURLAddingParams(url, paramsInput, clear = false) {
  return _getURLByModifyingParams(url, paramsInput, clear, true);
}

function currentURLAddingParams(paramsInput, clear = false) {
  return getURLAddingParams(window.location.href, paramsInput, clear);
}

function iFrameCommand(iFrameEl, commandString) {
  if (!iFrameEl || !commandString) return;

  iFrameEl.contentWindow.postMessage(
    JSON.stringify({
      event: 'command',
      func: commandString,
      args: '',
    }),
    '*'
  );
}

function iFrameMethod(iFrameEl, methodString) {
  if (!iFrameEl || !methodString) return;

  iFrameEl.contentWindow.postMessage(
    JSON.stringify({
      method: methodString,
    }),
    '*'
  );
}

let touchDevice = false;

window.setTouch = function () {
  touchDevice = true;
};

window.isTouch = function () {
  return touchDevice;
};

function getModalLabel(modalSlotName, slotEl) {
  const modal = Alpine.store('modals')[modalSlotName];

  if (modal && modal.open) {
    const labelSourceEl = Array.from(slotEl.children).filter((el) =>
      el.hasAttribute('data-modal-label')
    )[0];

    if (labelSourceEl) {
      return labelSourceEl.dataset.modalLabel;
    }
  }

  return false;
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function asyncTimeout(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getSectionId(el) {
  if (!el._closestSectionId) {
    el._closestSectionId = el
      .closest('.shopify-section')
      .getAttribute('id')
      .replace('shopify-section-', '');
  }

  return el._closestSectionId;
}

function daysInMs(days) {
  return days * 24 * 60 * 60 * 1000;
}

function msInDays(ms) {
  return ms / 1000 / 60 / 60 / 24;
}

function isInTheFuture(msSinceEpoch) {
  return msSinceEpoch > Date.now();
}

function setExpiringStorageItem(key, value, expiresIn) {
  localStorage.setItem(
    key,
    JSON.stringify({ value, expires: Date.now() + expiresIn })
  );
}

function getExpiringStorageItem(key) {
  const value = localStorage.getItem(key);

  if (!value) {
    return null;
  }

  let valueObject;

  try {
    valueObject = JSON.parse(value);
  } catch (e) {}

  if (valueObject && valueObject.expires) {
    if (isInTheFuture(valueObject.expires)) {
      return valueObject.value;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  }

  return null;
}
