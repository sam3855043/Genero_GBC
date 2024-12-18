/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

'use strict';

modulum('TextEditWidget', ['FieldWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * TextEdit widget.
     * @class TextEditWidget
     * @memberOf classes
     * @extends classes.FieldWidgetBase
     * @publicdoc Widgets
     */

    cls.TextEditWidget = context.oo.Class(cls.FieldWidgetBase, function($super) {

      return /** @lends classes.TextEditWidget.prototype */ {
        __name: 'TextEditWidget',
        /**
         * true if textedit can contains HTML content
         * @type {boolean}
         */
        _hasHTMLContent: false,
        /**
         * true if we must sanitize the html
         * @type {boolean}
         * */
        _sanitize: null,
        /** @type classes.HtmlFilterWidget **/
        _htmlFilter: null,
        /** @type {boolean} */
        _wantReturns: true,
        /** @type {boolean} */
        _wantTabs: false,
        /** @type {string} */
        _oldInnerHTML: null,
        /** For cache value */
        $static: {
          _sanitisationCache: {},
          _keys: [],
          getCacheValue: function(key) {
            if (!this._sanitisationCache[key]) {
              return null;
            }
            // Update the order
            this._keys.splice(this._keys.indexOf(key), 1);
            this._keys.unshift(key);

            return this._sanitisationCache[key];
          },
          setCacheValue: function(key, value) {
            if (!this._sanitisationCache[key]) {
              // Delete the less recently used value
              if (this._keys.length >= gbc.ThemeService.getValue('gbc-TextEditWidget-capacity')) {
                let oldestKey = this._keys.pop();
                delete this._sanitisationCache[oldestKey];
              }
              this._keys.unshift(key);
            } else {
              // if the key already exist update the order
              this._keys.splice(this._keys.indexOf(key), 1);
              this._keys.unshift(key);
            }
            this._sanitisationCache[key] = value;
          }
        },
        /**
         * Redefine where the data is located
         * @type {string|Object}
         */
        __dataContentPlaceholderSelector: cls.WidgetBase.selfDataContent,

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this._ignoreLayout) {
            this._layoutInformation = new cls.LayoutInformation(this);
            this._layoutInformation.shouldFillStack = true;
            this._layoutEngine = new cls.TextEditLayoutEngine(this);
            this._layoutEngine._shouldFillHeight = true;
            // shouldn't support sizepolicy dynamic, so we override it
            this._layoutInformation.getSizePolicyConfig().dynamic = cls.SizePolicy.Initial();
            this._layoutInformation.getSizePolicyConfig().setAllShrinkable(true);
            this._layoutInformation.forcedMinimalWidth = 20;
            this._layoutInformation.forcedMinimalHeight = 20;
          }
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this._inputElement = this._element.getElementsByTagName('textarea')[0];
          this._initListeners();
        },

        /**
         * Initialize all widget events listener
         */
        _initListeners: function() {
          if (window.isMobile()) {
            // Track the focus and mouse down/up events on mobile devices to handle the virtual keyboard's TAB key
            this._inputElement.on('focus.FieldWidgetBase', this._onMobileFocus.bind(this));
          }
        },

        /**
         * Clear event listeners of the widget
         */
        _unloadListeners: function() {
          if (window.isMobile()) {
            this._inputElement.off('focus.FieldWidgetBase');
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._unloadListeners();

          if (this._htmlFilter) {
            this._htmlFilter.destroy();
            this._htmlFilter = null;
          }

          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseDown: function(domEvent) {
          $super.manageMouseDown.call(this, domEvent);

          // Manage requestFocus during selection of text
          cls.WidgetBase._onSelect.call(this, domEvent);
          return true;
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this._onRequestFocus(domEvent); // request focus
          this.emit(context.constants.widgetEvents.click, domEvent);
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isEnabled()) {
            switch (keyString) {
              // Standard navigation : let default
              case "up":
              case "down":
              case "end":
              case "home":
                domKeyEvent.gbcDontPreventDefault = true;
                keyProcessed = true;
                break;

              case "enter":
              case "return":
                if (!this.isNotEditable() && this._wantReturns) {
                  domKeyEvent.gbcDontPreventDefault = true;
                  keyProcessed = true;
                }
                break;

              case "tab":
                if (!this.isNotEditable() && this._wantTabs) {
                  keyProcessed = true;
                  this._insertTab();
                }
                break;
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * @inheritDoc
         */
        _checkValue: function(text, newTextPart) {
          if (this._dialogType !== 'Input' && this._dialogType !== 'InputArray') {
            return newTextPart;
          }

          if (this._maxLength > 0 && !this.getUserInterfaceWidget().isCharLengthSemantics()) {
            newTextPart = this.checkValueByteCount(text, newTextPart, this._maxLength);
          }

          return newTextPart;
        },

        /**
         * @inheritDoc
         */
        manageInput: function(dataString = "", event = null) {
          $super.manageInput.call(this, dataString, event);

          if (!this._hasHTMLContent) {
            this.controlValueLength(event);
          }
          if (!this.getInputTextState().isRestored()) {
            this.triggerValueChangedEvent(this.getValue(), false);
          }
        },

        /**
         * Insert a TAB char
         * @private
         */
        _insertTab: function() {
          const s = this._inputElement.selectionStart;
          const value = this._inputElement.value.substring(0, this._inputElement.selectionStart) + "\t" + this._inputElement.value
            .substring(this._inputElement.selectionEnd);

          // If Maxlength is not defined, insert tab character anyway
          if (!this.getMaxLength() || value.length <= this.getMaxLength()) {
            this.setValue(value);
            this._inputElement.selectionEnd = s + 1;
          }
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM = false, cursorPosition = null) {
          $super.setValue.call(this, value, fromVM, cursorPosition);
          this._setValue(value);

          if (cursorPosition && this.isEnabled()) {
            this._inputElement.selectionStart = this._inputElement.selectionEnd = cursorPosition;
          }
        },

        /**
         * Internal setValue used to be inherited correctly by DummyWidget
         * @param {string} value - the value
         * @private
         */
        _setValue: function(value) {
          if (this._hasHTMLContent) {
            if (this._sanitize) {
              if (value === '') {
                if (value !== this.oldInnerHTML) {
                  this._inputElement.innerHTML = value;
                  this.oldInnerHTML = value;
                }

                // If empty string, then we just ignore
                return;
              }

              // If the value is not in the cache, then we clean it
              if (!cls.TextEditWidget.getCacheValue(value)) {
                // Clean and update the cache
                cls.TextEditWidget.setCacheValue(value, this._htmlFilter.sanitize(value));
              }

              const valueGet = cls.TextEditWidget.getCacheValue(value);
              if (valueGet !== this.oldInnerHTML) {
                this._inputElement.innerHTML = valueGet;
                this.oldInnerHTML = valueGet;
              }
            } else {
              this._inputElement.innerHTML = value;
            }
          } else {
            this._inputElement.value = value;
          }
        },

        /**
         * @inheritDoc
         */
        getValue: function() {
          if (this._hasHTMLContent === true) {
            return this._inputElement.innerHTML;
          } else if (this._editingTime === 0) { // not touched by user
            // return exact VM value to avoid bad conversion from \r to \n
            return this._valueStack[this._valueStackCursor] || "";
          } else {
            let result = this._inputElement.value;
            if (this.isEditing()) {
              if (this.getTextTransform() === 'up') {
                result = result.toLocaleUpperCase();
              }
              if (this.getTextTransform() === 'down') {
                result = result.toLocaleLowerCase();
              }
            }
            return result;
          }
        },

        /**
         * @inheritDoc
         */
        setReadOnly: function(readonly) {
          $super.setReadOnly.call(this, readonly);
          this._setInputReadOnly(readonly || this._notEditable || !this._enabled);
        },

        /**
         * Set input readonly attribute if it doesn't have focus or is noentry.
         * @param {boolean} readonly - true to set the edit part as read-only, false otherwise
         */
        _setInputReadOnly: function(readonly) {
          if (readonly || this._isReadOnly) {
            if (this._hasHTMLContent) {
              if (this._inputElement.hasAttribute("contenteditable")) {
                this._inputElement.removeAttribute('contenteditable');
              }
            } else {
              this._inputElement.setAttribute('readonly', 'readonly');
            }
          } else {
            if (this._hasHTMLContent) {
              if (!this._inputElement.hasAttribute("contenteditable")) {
                this._inputElement.setAttribute('contenteditable', true);
              }
            } else {
              this._inputElement.removeAttribute('readonly');
            }
          }
        },

        /**
         * @inheritDoc
         */
        setMaxLength: function(maxLength) {
          $super.setMaxLength.call(this, maxLength);
          if (maxLength > 0) {
            this._setElementAttribute('maxlength', maxLength, "_inputElement");
          }
        },

        /** Place the cursor at the given position,
         * @param {number} cursor - first cursor position
         * @param {number} [cursor2] - second cursor position
         * @publicdoc
         */
        setCursors: function(cursor, cursor2) {
          if (!cursor2) {
            cursor2 = cursor;
          }

          this._inputElement.setCursorPosition(cursor, cursor2);
        },

        /**
         * Get cursors
         * @return {{start: number, end: number}} object with cursors
         * @publicdoc
         */
        getCursors: function() {
          const cursors = {
            start: 0,
            end: 0
          };
          if (this._inputElement && this._inputElement.value) {
            try {
              cursors.start = this._inputElement.selectionStart;
              cursors.end = this._inputElement.selectionEnd;
            } catch (ignore) {
              // Some input types don't allow cursor manipulation
            }
          }
          return cursors;
        },

        /**
         * @inheritDoc
         */
        setTextAlign: function(align) {
          $super.setTextAlign.call(this, align);
          this.setStyle(">textarea", {
            "text-align": align
          });
        },

        /**
         * Replace default textarea element used to display text with a html element which can displays HTML
         * @param {HTMLElement} jcontrol - div element
         * @publicdoc
         */
        setHtmlControl: function(jcontrol) {
          if (this._htmlFilter === null) {
            this._htmlFilter = cls.WidgetFactory.createWidget('HtmlFilterWidget', this.getBuildParameters());
          }
          if (this.isEnabled()) {
            jcontrol.setAttribute('contenteditable', true);
          }
          jcontrol.innerHTML = this.getValue();
          // Remove events before replacing the widget
          this._unloadListeners();
          this._inputElement.replaceWith(jcontrol);
          this._hasHTMLContent = true;
          this._inputElement = jcontrol;
          // Initialize events for the new widget
          this._initListeners();
          if (this.hasFocus()) {
            // Force focus again if it has focus
            this.setFocus();
          }
        },

        /**
         * sanitize = false : Authorize to send html text without control
         * @param {boolean} sanitize
         */
        setSanitize: function(sanitize) {
          this._sanitize = sanitize;
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {
          this._inputElement.domFocus();
          $super.setFocus.call(this, fromMouse);
          this._inputElement.scrollTop = 0;
        },

        /**
         * Set number of editable rows inside the textedit widget
         * @param {number} rows - number of rows
         * @publicdoc
         */
        setRows: function(rows) {
          this._inputElement.setAttribute('rows', rows || 1);
        },

        /**
         * Make the textedit content return the new line breaking the word or not
         * @param {string} format - css value
         * @publicdoc
         */
        setWrapPolicy: function(format) {
          this._inputElement.toggleClass('breakword', format === 'anywhere');
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          this._setInputReadOnly(!enabled || this._notEditable);
        },

        /**
         * Set if textedit accepts TAB key
         * @param {boolean} wantTabs - true if TAB key should be accepted in the textedit
         * @publicdoc
         */
        setWantTabs: function(wantTabs) {
          this._wantTabs = wantTabs;
        },

        /**
         * Set if textedit accepts RETURN/ENTER key
         * @param {boolean} wantReturns - true if returns/enters should be accepted in the textedit
         * @publicdoc
         */
        setWantReturns: function(wantReturns) {
          this._wantReturns = wantReturns;
        },

        /**
         * Defines the scrollBars to display
         * @param {string} scrollBars - value can be 'auto', 'both', 'none', 'horizontal', 'vertical'
         */
        setScrollBars: function(scrollBars) {
          this.addClass("scrollbars-" + scrollBars);
        },

        /**
         * @inheritDoc
         */
        getValueForClipboard: function(ignoreSelection = false) {
          if (this._hasHTMLContent) {
            const txt = window.getSelectionText();
            return txt.length > 0 ? txt : null;
          }

          return $super.getValueForClipboard.call(this, ignoreSelection);
        },

        /**
         * @inheritDoc
         */
        getClipboardAuthorizedAction: function() {
          return {
            paste: true,
            copy: true,
            cut: !this._hasHTMLContent, //Too much work to cut and maintain a correct HTML
            selectAll: true
          };
        }

      };
    });
    cls.WidgetFactory.registerBuilder('TextEdit', cls.TextEditWidget);
  });
