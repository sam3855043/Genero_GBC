/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

/**
 * Return true if mobile browser, false otherwise
 * @returns bool if the browser is mobile
 */
/* jshint ignore:start */
window.isMobile = function() {
  const testExp = new RegExp('BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile|webOS', 'i');
  const isOtherMobile = (testExp.test(navigator.userAgent) === true);
  const isAndroid = window.isAndroid();
  const isIOS = window.isIOS();
  // window.orientation works well but is deprecated. So we use additional check.
  return typeof window.orientation !== "undefined" || isAndroid || isIOS || isOtherMobile;
};

window.isPhone = function() {
  if (window.isMobile()) {
    return Math.min(window.screen.width, window.screen.height) < 768;
  }
  return false;
};

window.isTablet = function() {
  if (window.isMobile()) {
    return Math.min(window.screen.width, window.screen.height) >= 768;
  }
  return false;
};

window.isAndroid = function() {
  if (window.androidEmulationDebug === true) {
    return true
  }
  const testExp = new RegExp('Android', 'i');
  // window.orientation works well but is deprecated. So we use additional check.
  return typeof window.orientation !== "undefined" && testExp.test(navigator.userAgent) === true;
};

window.isIOS = function() {
  const testExp = new RegExp('iPhone|iPad|iPod|GMI', 'i');
  if (testExp.test(window.navigator.userAgent)) {
    return true;
  } else {
    return window.navigator.maxTouchPoints &&
      window.navigator.maxTouchPoints > 2 &&
      /MacIntel/.test(window.navigator.platform);
  }
};

window.isTouchDevice = function() {
  return "ontouchstart" in document.documentElement || 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
};

// detect mouse
window.hasMouse = function() {
  return window.matchMedia('(pointer:fine)').matches;
};

/* jshint ignore:end */
window.offset = function(elt) {
  const rect = elt[0].getBoundingClientRect();
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    centerX: Math.round(rect.left + rect.width / 2),
    centerY: Math.round(rect.top + rect.height / 2)
  };
};

/**
 * Check if capslock is on
 * @param {KeyboardEvent} e - event emitted on keydown
 * @return {boolean} true if capsLock is on, false otherwise
 */
window.isCapslock = function(e) {
  if (e.key === 'CapsLock') {
    // toggle capsLock state when the key is CapsLock
    this._capsLock = !this._capsLock;
  } else if (e?.getModifierState) {
    // Otherwise get the caps modifier of the key
    this._capsLock = e.getModifierState("CapsLock") || (e.key === 'CapsLock' && !e.getModifierState("CapsLock"));
  }
  return this._capsLock;
};

/**
 * Test if a string is a valid URL
 *
 * @returns {boolean}
 */
window.isValidURL = function(str) {
  const pattern = new RegExp("(?:https?:\\/\\/)?(?:[a-zA-Z0-9]+\\.)+[a-zA-Z0-9]+(?:\\/[a-zA-Z0-9]+)*\\/?", "i");
  return pattern.test(str);
};

/**
 * Check if url has a parameter with corresponding value
 * @param {string} url - url to check parameter on
 * @param {string} param - parameter
 * @param {string} value - value of parameter
 * @returns {boolean} true if parameter with corresponding value has been found in url
 */
window.hasParameterValue = function(url, param, value) {
  const queryString = (param + "=" + value).toLowerCase();
  // extract url parameters only
  const start = url.lastIndexOf("?") + 1;
  let end = url.lastIndexOf("#"); // manage optional hash section located at the end of the url
  if (end < start) {
    end = url.length;
  }
  const variables = url.substring(start, end).toLowerCase().split("&"); // get array of parameters
  for (const element of variables) {
    if (element === queryString) {
      return true;
    }
  }
  return false;
};

/**
 * Check if url has the parameter set as active (1 value)
 * @param {string?} url - optional. If unset, we look by default for current browser url
 * @param {string} param - parameter name to check
 * @returns {boolean} true if parameter is set and enabled in url
 */
window.isURLParameterEnabled = function(url, param) {
  if (param === undefined) {
    param = url;
    url = window.location.search;
  }
  return window.hasParameterValue(url, param, "1");
};

/**
 * Check if url has the parameter set as inactive (0 value)
 * @param {string?} url - optional. If unset, we look by default for current browser url
 * @param {string} param - parameter name to check
 * @returns {boolean} true if parameter is set and disabled in url
 */
window.isURLParameterDisabled = function(url, param) {
  if (param === undefined) {
    param = url;
    url = window.location.search;
  }
  return window.hasParameterValue(url, param, "0");
};

window.isOrientationImplemented = typeof window.orientation !== "undefined";

(function(window) {
  window.waitMax = function(timeout, trigger, event, fallback) {
    let time = 0;
    const itv = window.setInterval(function() {
      if (trigger()) {
        window.clearInterval(itv);
        event();
      } else {
        time += 50;
        if (time > timeout) {
          window.clearInterval(itv);
          (fallback || event)();
        }
      }
    }, 50);
  };
})(window);
(function() {
  window.browserInfo = {
    isFirefox: false,
    isEdge: false,
    isChrome: false,
    isOpera: false,
    isSafari: false,
    isAndroid: false,
    isIOS: false
  };

  const sUsrAg = window.navigator.userAgent;

  if (sUsrAg.indexOf("Edge") > -1) {
    window.browserInfo.isEdge = true;
  } else if (sUsrAg.indexOf("Chrome") > -1) {
    window.browserInfo.isChrome = true;
  } else if (sUsrAg.indexOf("Safari") > -1) {
    window.browserInfo.isSafari = true;
  } else if (sUsrAg.indexOf("Opera") > -1) {
    window.browserInfo.isOpera = true;
  } else if (sUsrAg.indexOf("Firefox") > -1) {
    window.browserInfo.isFirefox = true;
  }

  // activate androidEmulationDebug
  if (window.isURLParameterEnabled(window.location.search, "androidemulationdebug")) {
    window.androidEmulationDebug = true;
  }
  if (window.isAndroid()) {
    window.browserInfo.isAndroid = true;
  }
  if (window.isIOS()) {
    window.browserInfo.isIOS = true;
  }
})();

// Compute ScrollBar size
(function() {
  const div = document.createElement('div');
  div.style.width = "50px";
  div.style.height = "50px";
  div.style.overflowY = "scroll";
  div.style.position = "absolute";
  div.style.top = "-200px";
  div.style.left = "-200px";
  div.innerHTML = '<div style="height:100px;width:100%"></div>';

  document.body.appendChild(div);
  const w1 = div.offsetWidth;
  const w2 = div.children[0].offsetWidth;
  document.body.removeChild(div);

  window.scrollBarSize = w1 - w2;
})();

/**
 * Convert image to base64
 * @param {String} src
 * @param {Function} callback
 * @param {String} outputFormat - image/png, image/jpeg
 */
window.toDataURL = function(src, callback, outputFormat) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    let canvas = document.createElement('CANVAS');
    const ctx = canvas.getContext('2d');
    let dataURL;
    // Resize the canvas to the original image dimensions
    canvas.height = this.naturalHeight;
    canvas.width = this.naturalWidth;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
    canvas = null;
  };
  img.src = src;
  // Make sure the load event fires for cached images too
  if (img.complete || img.complete === undefined) {
    // Flush cache
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    // Try again
    img.src = src;
  }
};

/**
 * Get the current selected text
 * @returns {?string}
 */
window.getSelectionText = function() {
  const activeElement = document.activeElement;
  let selectionText = null;
  if (activeElement) { // try to get selection form activeElement
    selectionText = activeElement.getSelectionText();
  }
  if (selectionText === null && window.getSelection) {
    // if it is impossible to retrieve selection from activeElement
    // try window.getSelection()
    selectionText = window.getSelection().toString();
  }
  return selectionText;
};
