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

modulum('HtmlFilterWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Widget used to filter html document values \n Inspired from https://github.com/jitbit/HtmlSanitizer
     * @class HtmlFilterWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.HtmlFilterWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.HtmlFilterWidget.prototype */ {
        __name: "HtmlFilterWidget",

        _tagWhitelist: null,
        _contentTagWhiteList: null,
        _cssWhitelist: null,
        _schemaWhiteList: null,
        _uriAttributes: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);

          // Authorized tags: a b blockquote br center code div em font h1 h2 h3 h4 h5 h6 hr i img label li ol p pre small source span strong table tbody tr td th thead ul u video
          this._tagWhitelist = {
            'A': true,
            'B': true,
            'BLOCKQUOTE': true,
            'BODY': true,
            'BR': true,
            'CENTER': true,
            'CODE': true,
            'DIV': true,
            'EM': true,
            'FONT': true,
            'H1': true,
            'H2': true,
            'H3': true,
            'H4': true,
            'H5': true,
            'H6': true,
            'HR': true,
            'I': true,
            'IMG': true,
            'LABEL': true,
            'LI': true,
            'OL': true,
            'P': true,
            'PRE': true,
            'SMALL': true,
            'SOURCE': true,
            'SPAN': true,
            'STRONG': true,
            'TABLE': true,
            'TBODY': true,
            'TR': true,
            'TD': true,
            'TH': true,
            'THEAD': true,
            'UL': true,
            'U': true,
            'VIDEO': true
          };

          this._contentTagWhiteList = {
            'FORM': true
          }; //tags that will be converted to DIVs

          // Authorized attributes: align color controls height href src style target title type width
          this._attributeWhitelist = {
            'align': true,
            'color': true,
            'controls': true,
            'height': true,
            'href': true,
            'src': true,
            'style': true,
            'target': true,
            'title': true,
            'type': true,
            'width': true
          };

          // Authorized CSS: color background-color font-size text-align text-decoration font-weight
          this._cssWhitelist = {
            'color': true,
            'background-color': true,
            'font-size': true,
            'text-align': true,
            'text-decoration': true,
            'font-weight': true
          };
          this._schemaWhiteList = ['http:', 'https:', 'data:', 'm-files:', 'file:',
            'ftp:'
          ]; //which "protocols" are allowed in "href", "src" etc
          this._uriAttributes = {
            'href': true,
            'action': true
          };
        },

        /**
         * Sanitize HTML
         * @param {string} input to sanitize
         * @return {string} - the html string corresponding to the body content only, cleaned from unwanted code
         */
        sanitize: function(input) {
          input = input.trim();
          if (input === "") {
            return ""; //to save performance and not create iframe
          }

          // Create a new DOMParser
          const parser = new DOMParser();

          // Parse the input string as a new HTML document
          const doc = parser.parseFromString(input, 'text/html');

          // Retrieve the sanitized HTML string from the document and remove unauthorized tags/attributes
          const resultElement = this._makeSanitizedCopy(doc.body);
          return resultElement.innerHTML
            .replace(/<br[^>]*>(\S)/g, "<br>\n$1")
            .replace(/div><div/g, "div>\n<div"); //replace is just for cleaner code;
        },

        /**
         * Check if string start with another
         * @param {string} str - string to look into
         * @param {string} substrings - string to look for
         * @return {boolean} true if it starts with it false otherwise
         * @private
         */
        _startsWithAny: function(str, substrings) {
          for (const element of substrings) {
            if (str.indexOf(element) === 0) {
              return true;
            }
          }
          return false;
        },

        /**
         * Get a sanitized copy of the htmlNode
         * @param {Node} node to copy clean
         * @return {ActiveX.IXMLDOMNode|Node|DocumentFragment} - cleaned copy of the node
         * @private
         */
        _makeSanitizedCopy: function(node) {
          let newNode = null;
          if (node.nodeType === Node.TEXT_NODE) {
            newNode = node.cloneNode(true);
          } else if (node.nodeType === Node.ELEMENT_NODE && (this._tagWhitelist[node.tagName] || this._contentTagWhiteList[node.tagName])) {
            //remove useless empty spans (lots of those when pasting from MS Outlook)
            if ((node.tagName === "SPAN" || node.tagName === "B" || node.tagName === "I" || node.tagName === "U") && node.innerHTML.trim() ===
              "") {
              return document.createDocumentFragment();
            }
            if (this._contentTagWhiteList[node.tagName]) {
              newNode = document.createElement('DIV'); //convert to DIV
            } else {
              newNode = document.createElement(node.tagName);
            }

            for (const attr of node.attributes) {
              if (this._attributeWhitelist[attr.name]) {
                if (attr.name === "style") {
                  for (const styleName of node.style) {
                    if (this._cssWhitelist[styleName]) {
                      newNode.style.setProperty(styleName, node.style.getPropertyValue(styleName));
                    }
                  }
                } else {
                  if (this._uriAttributes[attr.name]) { //if this is a "uri" attribute, that can have "javascript:" or something
                    if (this._startsWithAny(attr.value, ['http', 'https'])) {
                      if (node.getAttribute("target") === null) {
                        newNode.setAttribute("target", "_blank");
                      }
                    }
                    if (attr.value.indexOf(":") > -1 && !this._startsWithAny(attr.value, this._schemaWhiteList)) {
                      continue;
                    }
                  }
                  newNode.setAttribute(attr.name, attr.value);
                }
              }
            }
            for (const element of node.childNodes) {
              const subCopy = this._makeSanitizedCopy(element);
              newNode.appendChild(subCopy, false);
            }
          } else {
            newNode = document.createDocumentFragment();
          }
          return newNode;
        },

      };
    });
    cls.WidgetFactory.registerBuilder('HtmlFilterWidget', cls.HtmlFilterWidget);

  });
