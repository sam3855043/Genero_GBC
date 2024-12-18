/// FOURJS_START_COPYRIGHT(D,2014)
/// Property of Four Js*
/// (c) Copyright Four Js 2014, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

/*jshint -W121 */
Function.prototype.debounce = function(threshold, execAsap) {
  let timeout = null;
  const func = this;
  return function(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    const context = this;
    const delayed = function() {
      if (!execAsap) {
        func.apply(context, [arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]);
      }
      timeout = null;
    };

    if (timeout) {
      clearTimeout(timeout);
    } else if (execAsap) {
      func.apply(context, [arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]);
    }

    timeout = setTimeout(delayed, threshold || 100);
  };
};

Function.prototype.throttle = function(threshold) {
  const func = this;
  let throttling = false;
  const clear = function() {
    throttling = false;
  };
  return function() {
    if (!throttling) {
      func.apply(this, arguments);
      window.setTimeout(clear, threshold);
      throttling = true;
    }
  };
};

Function.noop = function() {};
Function.true = function() {
  return true;
};
Function.false = function() {
  return false;
};
