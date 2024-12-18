/// FOURJS_START_COPYRIGHT(D,2016)
/// Property of Four Js*
/// (c) Copyright Four Js 2016, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

/**
 * swaps key/values
 *
 * @param {Object} obj the source object
 * @returns {Object} a newly created object that represents the swapped object
 */
Object.swap = function(obj) {
  const result = {};
  if (obj) {
    for (let property in obj) {
      if (obj.hasOwnProperty(property)) {
        result[obj[property]] = property;
      }
    }
  }
  return result;
};

Object.isString = function(obj) {
  return typeof obj === "string";
};
Object.isNumber = function(obj) {
  return typeof obj === "number";
};
Object.isFunction = function(obj) {
  return typeof obj === "function";
};
Object.isBoolean = function(obj) {
  return obj === true || obj === false;
};

Object.isNaN = function(i) {
  return window.isNaN(i);
};

if (!Object.values) {
  /**
   * IE11 Polyfill
   * @param obj
   * @returns {Array} Array of values
   */
  Object.values = function(obj) {
    return Object.keys(obj).map(function(e) {
      return obj[e];
    });
  };
}

/**
 * IE11 Polyfill
 */
if (typeof Object.assign !== 'function') {
  Object.assign = function(target, varArgs) {
    if (target === null) { // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }
    const to = Object(target);
    for (let index = 1; index < arguments.length; index++) {
      const nextSource = arguments[index];
      if (nextSource !== null) { // Skip over if undefined or null
        for (let nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}
