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

// jshint ignore:start
String.prototype.getBytesCount = function() {
  const log = Math.log(256);
  let total = 0;
  for (let i = 0; i < this.length; i++) {
    const charCode = this.charCodeAt(i);
    total += Math.ceil(Math.log(charCode) / log);
  }
  return total;
};

// Replace char at index
String.prototype.replaceAt = function(index, character) {
  return this.substr(0, index) + character + this.substr(index + character.length);
};
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(search, pos) {
    return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
  };
}
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search, this_len) {
    if (this_len === undefined || this_len > this.length) {
      this_len = this.length;
    }
    return this.substring(this_len - search.length, this_len) === search;
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^\s+/, "").replace(/\s+$/, "");
  };
}

String.prototype.capitalize = function() {
  return this.substr(0, 1).toUpperCase() + this.substr(1).toLowerCase();
};

if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    const total = Math.floor(Number(count));
    if (total > 0) {
      return new Array(total + 1).join(this);
    } else {
      return "";
    }
  };
}

/**
 * generate a random hexadecimal string
 * @param length
 * @returns {string}
 */
String.random = function(length = 16) {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
};

const ESC_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

// escape most problematic html chars from the string
String.prototype.escapeHTML = function() {
  return this.replace(/[&<>'"]/g, function(c) {
    return ESC_MAP[c];
  });
};

String.prototype.htmlDecode = function() {
  const doc = new DOMParser().parseFromString(this, "text/html");
  return doc.documentElement.textContent;
};

/**
 * put quote around font name when it contains a space
 * @return {string}
 */
String.prototype.escapeFontFamily = function() {
  let fontList = [];

  fontList = this.split(",").map(function(font) {
    return (font.indexOf(" ") >= 0 ? '"' + font.trim() + '"' : font)
  });

  return fontList.join(",");
};

/**
 * The splice() method changes the content of a string by removing a range of
 * characters and/or adding new characters.
 *
 * @this {String}
 * @param {number} start Index at which to start changing the string.
 * @param {number} delCount An integer indicating the number of old chars to remove.
 * @param {string} newSubStr The String that is spliced in.
 * @return {string} A new string with the spliced substring.
 */
String.prototype.splice = function(start, delCount, newSubStr) {
  return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

/**
 * Verif if the unicode char code belong to the encoding table
 * @param table table of authorized utf-16 codes
 * @param charCode utf-16 char code
 * @return {boolean} true if the char exist in the table
 */
String.charExistInEncoding = function(table, charCode) {
  for (let i = 0; i < table.length && table[i][0] <= charCode; i++) {
    if (table[i][0] <= charCode && charCode <= table[i][1]) {
      return true;
    }
  }

  return false;
}

/**
 * @return {boolean} true if the current encoding is single byte
 */
String.isSingleByteEncoding = function() {
  const encoding = gbc.classes.EncodingHelper.getVMEncoding();

  return encoding !== 'utf-8' && encoding !== 'big5' && encoding !== 'cp950';
}

/**
 * Remove unauthorized char for the current encoding
 * @return {string} return a clean string
 */
String.prototype.removeUnknownChar = function() {
  return gbc.classes.EncodingHelper.removeUnknownChar(this);
}

/**
 * Give the display width of the current string
 * @return {number}
 */
String.prototype.displayWidth = function() {
  return gbc.classes.EncodingHelper.displayWidth(this);
};

/**
 * Give the byte length of the string for the current encoding (if unknown fallback to iso-8859)
 * @return {number}
 */
String.prototype.countBytes = function() {
  const encoding = gbc.classes.EncodingHelper.getVMEncoding();
  if (encoding === 'utf-8') {
    return gbc.classes.EncodingHelper.utf8Count(this);
  } else if (encoding === 'big5' || encoding === 'cp950') {
    return gbc.classes.EncodingHelper.big5Count(this);
  }

  //Use a single byte encoding as default
  return gbc.classes.EncodingHelper.iso8859Count(this);
}

// jshint ignore:end
