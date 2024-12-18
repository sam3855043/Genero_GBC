/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

/**
 * HtmlParser class
 */
const HtmlParser = Class({
  /**
   * Init the parser with some options
   * @param {Object} options
   */
  constructor: function(options) {
    this._html = null;
    this._options = {
      tinyMCECompat: true,
      textDecoration: true,
      fontSize: true,
      nestedLists: true
    };
    if (typeof options !== "undefined") {
      this._options = window.copyObject(this._options, options);
    }
    this._styleRegex = {
      fontWeight: /font-weight:(\d*)/gm,
      fontStyle: /font-style:(\w*)/gm,
      fontSize: /font-size:(\d*.\d*)(\w{2})/,
      textDecoration: /text-decoration: (\w*);/gm,
      blockIndent: /-qt-block-indent:(\d);/
    };
  },

  /**
   * Define html to be parsed
   * @param {String} html - stringified html to parse
   */
  setHtml: function(html) {
    this._html = html;
  },

  /**
   * Run the parser, and get the generated html
   * @return {null|*}
   */
  parse: function() {
    // keep only body content
    this._cleanHtml();

    if (this._options.nestedLists) {
      this._parseNestedLists("ul");
      this._parseNestedLists("ol");
    }
    if (this._options.textDecoration) {
      this._parseFontWeight();
      this._parseFontStyle();
      this._parseStrong();
      this._parseUnderline();
    }
    if (this._options.tinyMCECompat) {
      this._parseIndent();
    }
    if (this._options.fontSize) {
      this._parseFontSize();
    }
    return this._html;
  },

  /**
   * Replace tag with another and keep content
   * @param {HTMLElement} element to change
   * @param {string} newTag - new tagname to use
   * @param {Boolean} keepStyle - true to keep value of style attribute
   * @private
   */
  _changeTag: function(element, newTag, keepStyle) {
    const newElem = window.document.createElement(newTag);
    newElem.innerHTML = element.innerHTML;
    if (keepStyle && element.getAttribute("style")) {
      newElem.setAttribute("style", element.getAttribute("style"));
    }
    element.parentNode.replaceChild(newElem, element);
  },

  /**
   * Create a fake invisible element to manipulate
   * @param {string} tag - tagname for the element
   * @param {string} content - html formatted
   * @return {HTMLElement}
   * @private
   */
  _fakeElement: function(tag, content) {
    const tempEl = window.document.createElement(tag);
    tempEl.setAttribute('style', 'display: none;');
    tempEl.innerHTML = content;
    return tempEl;
  },

  /**
   * Remove anything else than regular div
   * @private
   */
  _cleanHtml: function() {
    const tempEl = this._fakeElement('div', this._html);

    const stylesElem = tempEl.querySelectorAll("style");
    Array.prototype.forEach.call(stylesElem, function(st) {
      tempEl.removeChild(st);
    });

    const scriptElem = tempEl.querySelectorAll("script");
    Array.prototype.forEach.call(scriptElem, function(sc) {
      tempEl.removeChild(sc);
    });

    const metaElem = tempEl.querySelectorAll("meta");
    Array.prototype.forEach.call(metaElem, function(m) {
      tempEl.removeChild(m);
    });

    const pElem = tempEl.querySelectorAll("p");
    Array.prototype.forEach.call(pElem, function(p) {
      if (p.innerHTML.length <= 0) {
        p.innerHTML = "<p><br/></p>";
      }
    });

    this._html = tempEl.innerHTML;
  },


  /**
   * Parse loaded html to create bold tag instead of inline style
   * @private
   */
  _parseFontWeight: function() {
    const tempEl = this._fakeElement('div', this._html);
    const span = tempEl.querySelectorAll("span");
    let style = "";
    let m = null;
    let fontWeight = 400;

    Array.prototype.forEach.call(span, function(spanEl) {
      style = spanEl.getAttribute("style");
      m = this._styleRegex.fontWeight.exec(style);
      if (m) {
        fontWeight = parseInt(m[1], 10);
        if (fontWeight > 400) {
          // 400 is the same as normal, and 700 is the same as bold
          this._changeTag(spanEl, "b", true);
        }
      }
    }.bind(this));
    this._html = tempEl.innerHTML;
  },

  /**
   * Parse loaded html to create bold tag instead of inline style
   * @private
   */
  _parseFontStyle: function() {
    const tempEl = this._fakeElement('div', this._html);
    const span = tempEl.querySelectorAll("span");
    let style = "";
    let m = null;
    let fontStyle = "";

    Array.prototype.forEach.call(span, function(spanEl) {
      style = spanEl.getAttribute("style");
      m = this._styleRegex.fontStyle.exec(style);
      if (m) {
        fontStyle = m[1];
        if (fontStyle === "italic") {
          this._changeTag(spanEl, "i", true);
        }
      }
    }.bind(this));
    this._html = tempEl.innerHTML;
  },

  /**
   * Parse loaded html to create bold tag instead of strong
   * @private
   */
  _parseStrong: function() {
    const tempEl = this._fakeElement('div', this._html);
    const strong = tempEl.querySelectorAll("strong");

    Array.prototype.forEach.call(strong, function(strongEl) {
      this._changeTag(strongEl, "b", true);
    }.bind(this));
    this._html = tempEl.innerHTML;
  },

  /**
   * Parse loaded html to create underline tag instead of inline style
   * @private
   */
  _parseUnderline: function() {
    let tempEl = this._fakeElement('div', this._html);
    const span = tempEl.querySelectorAll("span, b");
    let style = "";
    let m = null;
    let underline = false;

    Array.prototype.forEach.call(span, function(spanEl) {
      style = spanEl.getAttribute("style");
      m = this._styleRegex.textDecoration.exec(style);
      if (m) {
        underline = m[1];
        if (underline) {
          this._changeTag(spanEl, "u", true);
        }
      }
    }.bind(this));
    this._html = tempEl.innerHTML;

    // Old formats
    tempEl = this._fakeElement('div', this._html);
    const ins = tempEl.querySelectorAll("ins");
    Array.prototype.forEach.call(ins, function(insEl) {
      this._changeTag(insEl, "u", true);
    }.bind(this));
    this._html = tempEl.innerHTML;
  },

  /**
   * Parse loaded html to Take of old qt indent values
   * @private
   */
  _parseIndent: function() {
    const tempEl = this._fakeElement('div', this._html);
    const p = tempEl.querySelectorAll("p");
    let style = "";
    let indentLvl = false;

    Array.prototype.forEach.call(p, function(pEl) {
      style = pEl.getAttribute("style");
      const m = this._styleRegex.blockIndent.exec(style);
      if (m) {
        indentLvl = parseInt(m[1], 10);
        if (indentLvl) {
          pEl.classList.add("ql-indent-" + indentLvl);
        }
      }
    }.bind(this));
    this._html = tempEl.innerHTML;
  },

  /**
   * Parse loaded html to convert font-size to quill compliant units : px
   * @private
   */
  _parseFontSize: function() {
    const tempEl = this._fakeElement('div', this._html);
    const span = tempEl.querySelectorAll("span");
    let style = "";
    let m = null;
    let fontSize = false;

    Array.prototype.forEach.call(span, function(spanEl) {
      style = spanEl.getAttribute("style");
      m = this._styleRegex.fontSize.exec(style);
      if (m) {
        fontSize = m[1];
        if (fontSize) {
          const fSizeElem = window.document.createElement('span');
          fSizeElem.innerHTML = spanEl.innerHTML;
          const newStyle = style.replace(m[0], "font-size:" + parseInt(m[1], 10) + "px");
          fSizeElem.setAttribute("style", newStyle);
          spanEl.parentNode.replaceChild(fSizeElem, spanEl);
        }
      }
    }.bind(this));
    this._html = tempEl.innerHTML;
  },

  /**
   * Convert lists in provided html string to something that quilljs understand
   * @param {string} listStyle - ul or ol
   * @private
   */
  _parseNestedLists: function(listStyle) {
    // hidden div to put html in
    const tempEl = this._fakeElement('div', this._html);

    const listElements = tempEl.querySelectorAll("li"); // get list items
    let indentLvl = 0;
    // Calculate the deepness of elements, and add it as a class
    Array.prototype.forEach.call(listElements, function(el) {
      const parentList = this._getParentNodes(el, listStyle);
      indentLvl = parentList.length - 1;
      if (indentLvl > 0) {
        el.classList.add("ql-indent-" + indentLvl);
      } else {
        // Convert old qt indent to quill compliant
        const style = el.getAttribute("style");
        const m = this._styleRegex.blockIndent.exec(style);
        if (m) {
          indentLvl = m[1];
          el.classList.add("ql-indent-" + indentLvl);
        }
      }

    }.bind(this));
    this._html = this._flatNestedLists(tempEl.innerHTML, listStyle);
  },

  /**
   * Put everything at the same level (+ correct classes) to make it quill.js compliant
   * @param {string} html - stringified html to check
   * @param {string} listStyle - 'ul' or 'ol'
   * @return {string} - html with list flattened
   * @private
   */
  _flatNestedLists: function(html, listStyle) {
    // hidden div to put html in
    const tempEl = this._fakeElement('div', html);

    // tricky trick!
    // Get all the UL, get all subelements and put them to the same level, replace original ul with newly built UL

    // only replace top lvl ul
    const topUl = tempEl.querySelectorAll("*>" + listStyle);
    Array.prototype.forEach.call(topUl, function(ul, i) {
      const ulEl = window.document.createElement(listStyle);
      const listElements = ul.querySelectorAll("li"); // get list items
      Array.prototype.forEach.call(listElements, function(el, i) {
        //remove child before inserting
        const child = el.children[0];
        if (child && child.tagName.toLowerCase() === "li") {
          el.removeChild(child);
        }
        ulEl.appendChild(el);
      }.bind(this));
      ul.innerHTML = ulEl.innerHTML;

    }.bind(this));

    return tempEl.innerHTML;
  },

  /**
   * Get the list of the parents nodes
   * @param {HTMLElement} el - element to get parent of
   * @param {string} tagName - lookup for parents with this tagname
   * @return {Array} the list of parents
   * @private
   */
  _getParentNodes: function(el, tagName) {
    const els = [];
    while (el) {
      if (tagName && tagName === el.tagName.toLowerCase()) {
        els.unshift(el);
      }
      el = el.parentNode;
    }
    return els;
  }

});
