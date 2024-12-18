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

/*
 ** The Math.sign() function returns the sign of a number, indicating whether the number is positive, negative or zero.
 */
if (!Math.sign) {
  Math.sign = function(x) {
    return ((x > 0) - (x < 0)) || +x;
  };
}

/**
 * Check if a string is an Integer
 * @param {string} str - string to be tested
 * @returns {boolean} true if str is an Integer
 */
Math.isStringInteger = function(str) {
  return Number.isInteger(parseInt(str, 10));
};

/**
 * @param {number} x The value to clamp
 * @param {number} min The minimum value
 * @param {number} max The maximum value
 * @returns The value clamped between the min and max value
 */
Math.clamp = function(x, min, max) {
  return Math.min(Math.max(x, min), max);
};

/**
 * Check if the point is contained in the ElementRect
 * If the point is on the border, the method return true
 * @param {DOMRect} ElementRect The DomElement rect
 * @param {number} pointX The X coordinate of the point
 * @param {number} pointY The Y coordinate of the point
 */
Math.isInBound = function(ElementRect, pointX, pointY) {
  return (pointX >= ElementRect.left && pointX <= ElementRect.right) &&
    (pointY >= ElementRect.top && pointY <= ElementRect.bottom);
};
