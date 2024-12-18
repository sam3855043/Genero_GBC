/// FOURJS_START_COPYRIGHT(D,2017)
/// Property of Four Js*
/// (c) Copyright Four Js 2017, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('FieldWidgetBase', ['TextWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Base class for genero formfield widgets
     * @class FieldWidgetBase
     * @memberOf classes
     * @publicdoc Widgets
     * @extends classes.TextWidgetBase
     */
    cls.FieldWidgetBase = context.oo.Class(cls.TextWidgetBase, function($super) {
      return /** @lends classes.FieldWidgetBase.prototype */ {
        __name: "FieldWidgetBase",
        /**
         * Flag for augmentedFace
         * @type {boolean}
         */
        __virtual: true,

        /**
         * List of values through time
         * @type {Array}
         */
        _valueStack: null,

        /**
         * Flag to know if the placeholder contain the real one (it could be the comment)
         * @type {boolean}
         */
        _isFakePlaceholder: true,

        /**
         * true if widget has pending changes
         * @type {boolean}
         */
        _editing: false,

        /**
         * true if widget is readOnly and can't be edited nor focused
         * @type {boolean}
         * */
        _isReadOnly: false,

        /**
         * The input element. This variable is not instantiated in this class
         * @protected
         * @type {HTMLInputElement}
         */
        _inputElement: null,

        /***
         * Time of the last widget modification
         * @type {number}
         */
        _editingTime: 0,

        /**
         * Position of the current value in the stack
         * @type {Number}
         */
        _valueStackCursor: -1,

        /**
         * Old value, last value received from VM
         * @type {?string}
         */
        _oldValue: null,

        /**
         * true if widget should not be editable but navigation is possible
         * @type {boolean}
         */
        _notEditable: false,

        /**
         * true if widget requires a value
         * @type {boolean}
         */
        _required: false,

        /**
         * true if widget is set as not Null
         * @type {boolean}
         */
        _notNull: false,

        /**
         * List of possible values for the widget
         * @type {?Array}
         */
        _include: null,

        /**
         * Flag to check if the mouse button is currently pressed
         * @type {boolean}
         */
        _isMousePressed: false,

        /**
         * Input element text state component
         * @type {classes.InputTextStateComponent}
         */
        _inputTextState: null,

        /**
         * Scroll attribute value
         * @type {?boolean}
         */
        _scroll: null,

        /**
         * true if must ignore the scroll attribute (equivalent to scroll = 0)
         * @type {boolean}
         */
        _dataTypeWithNoScroll: false,

        /**
         * Maximum number of characters allowed. By default, 0 indicates no limit.
         * @type {number}
         */
        _maxLength: 0,

        /**
         * widget VM width
         * @type {number}
         */
        _vmWidth: 0,

        /**
         * AutoNext activated ?
         * @type {boolean}
         */
        _autoNext: false,

        /**
         * true if we are between a key down and key yp event
         * @type {?boolean}
         */
        _processingKeyEvent: null,

        /**
         * Input picture component
         * @type {classes.InputPictureWidgetComponent}
         */
        _pictureComponent: null,

        /**
         * @constructs
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this.setEnabled(false, true);
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this._valueStack = [];
          if (window.isMobile()) {
            const inputElement = this._element.getElementsByTagName('input')[0];
            if (inputElement) {
              // Track the focus and mouse down/up events on mobile devices to handle the virtual keyboard's TAB key
              inputElement.on('focus.FieldWidgetBase', this._onMobileFocus.bind(this));
            }
          }

          this._processingKeyEvent = false;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);

          this._valueStack = null;
          this._oldValue = null;

          if (this._pictureComponent) {
            this._pictureComponent.destroy();
            this._pictureComponent = null;
          }

          if (this._inputElement && this.isNotEditable()) {
            this._inputElement.off('drop.FieldWidgetBase_notEditable');
          }

          if (this._inputElement && window.isMobile()) {
            this._inputElement.off('focus.FieldWidgetBase');
          }

          this._inputElement = null;

          if (this._inputTextState) {
            this._inputTextState.destroy();
            this._inputTextState = null;
          }
        },

        /**
         * Get the input part of the widget
         * @return {HTMLElement} the input part of the widget
         * @publicdoc
         */
        getInputElement: function() {
          return this._inputElement;
        },

        /**
         * Check if the widget has an input element
         * @return {boolean} true if widget has an input element
         * @publicdoc
         */
        hasInputElement: function() {
          return Boolean(this.getInputElement());
        },

        /**
         * Trigger valueChanged event if necessary
         * @param {string|number} newValue - new value of the widget // TODO newValue should be always a string
         * @param {boolean} [sendValue] - if true new value must be sent to VM
         */
        triggerValueChangedEvent: function(newValue, sendValue = true) {
          if (sendValue === false || newValue?.toString() !== this._oldValue) {
            this.emit(context.constants.widgetEvents.valueChanged, newValue, sendValue);
          }
        },

        /**
         * Set the value of widget
         * @param {string|number} value - sets the value to display
         * @param {boolean} [fromVM] - true if value comes from the VM
         * @param {?number} [cursorPosition] - set the cursor to this position
         * @publicdoc
         */
        setValue: function(value, fromVM = false, cursorPosition = null) {
          if (this.hasCursors() && !fromVM) { // only widgets with cursors manage undo/redo
            this._valueStack.push(value);
            this._valueStackCursor++;
          }

          if (fromVM) {
            if (this.getValue() !== value) {
              this._valueStack = [value];
              this._valueStackCursor = 0;
            } else {
              this._valueStack.push(value);
              this._valueStackCursor++;
            }
            this._oldValue = value;
          }

          if (this._valueStack.length > 30) {
            this._valueStack.shift();
            this._valueStackCursor--;
          }
        },

        /**
         * Internal setValue to change value without any event emitted
         * @param {string} value - the value
         * @private
         */
        _setValue: function(value) {
          if (this.hasInputElement()) {
            this.getInputElement().value = value;
          }
        },

        /**
         * Internal getValue to get simply the string value of input element
         * @return {?string} the value
         * @private
         */
        _getInputElementValue: function() {
          if (this.hasInputElement()) {
            return ( /** @type {HTMLInputElement} */ this.getInputElement()).value;
          }
          return null;
        },

        /**
         * Executed on a mouse down event
         */
        manageMouseDown: function(domEvent) {
          if (window.isMobile()) {
            const inputElement = this._element.getElementsByTagName('input')[0];
            if (inputElement) {
              this._onMobileMouseDown.call(this, domEvent);
            }
          }
          return true;
        },

        /**
         * Executed on a mouse up event
         */
        manageMouseUp: function(domEvent) {
          if (window.isMobile()) {
            const inputElement = this._element.getElementsByTagName('input')[0];
            if (inputElement) {
              this._onMobileMouseUp.call(this, domEvent);
            }
          }
          return true;
        },

        /**
         * @inheritDoc
         */
        manageBeforeInput: function(dataString = "", event = null) {
          // backup current text just before input
          this.getInputTextState().backup();

          return true;
        },

        /**
         * @inheritDoc
         */
        manageInput: function(dataString = "", event = null) {
          // Prevent input event
          // 1. Not editable
          // 2. Android: it has no VM focus
          const preventInput = this.isNotEditable() || (window.isAndroid() && !this.hasFocus());
          if (preventInput) {
            this.getInputTextState().restore("");
            return;
          }

          this._pictureComponent?.manageInput(dataString, event);

          this._editingTime = Date.now();
          this.setEditing(this.isEditing() || this.getValue() !== this._oldValue);
          if (this.isEditing() && this._textTransform !== 'none' && this.hasInputElement()) {
            // TODO what is the purpose of this code ?
            const start = this._inputElement.selectionStart;
            const end = this._inputElement.selectionEnd;
            this._inputElement.value = this.getValue();
            this._inputElement.setCursorPosition(start, end);
          }
        },

        /**
         * Handle drop event
         * @param evt
         * @private
         */
        _onDrop: function(evt) {
          if (this.isNotEditable()) {
            evt.preventCancelableDefault();
          }
        },

        /**
         * NotEditable allows cursor moving, but not a value change
         * @param {boolean} notEditable - true to set the edit part as read-only
         */
        setNotEditable: function(notEditable) {
          this._notEditable = notEditable;
          if (this._inputElement) {
            if (notEditable) {
              this._inputElement.on('drop.FieldWidgetBase_notEditable', this._onDrop.bind(this));
            } else {
              this._inputElement.off('drop.FieldWidgetBase_notEditable');
            }
          }
        },

        /**
         * NotEditable allows cursor moving, but not a value change
         * @return {boolean} true if the edit part is not editable
         */
        isNotEditable: function() {
          return this._notEditable;
        },

        /**
         * Set the widget validation to 'required'
         * @param {boolean} required - true if a value is required
         */
        setRequired: function(required) {
          this._required = required;
          this.toggleClass("gbc_Required", required);
        },

        /**
         * Verify if the widget value is required
         * @return {boolean} true if a value is required
         */
        isRequired: function() {
          return this._required;
        },

        /**
         * Verify if the placeholder is the real one
         * @return {boolean} true if it is a fake placeholder
         */
        isFakePlaceholder: function() {
          return this._isFakePlaceholder;
        },

        /**
         * Set the widget validation to noNull
         * @param {boolean} notNull - false if the widget value can be null, true otherwise
         */
        setNotNull: function(notNull) {
          this._notNull = notNull;
          this.toggleClass("gbc_NotNull", notNull);
        },

        /**
         * Verify if the widget can be null
         * @return {boolean} false if the widget value can be null, true otherwise
         */
        isNotNull: function() {
          return this._notNull;
        },

        /**
         * Get the list of allowed values defined by INCLUDE list
         * @param {Array|null} include - list of allowed values or null if not defined
         */
        setAllowedValues: function(include) {
          this._include = include;
        },

        /**
         * Get the list of allowed values defined by INCLUDE list
         * @return {Array|null} list of allowed values or null if not defined
         */
        getAllowedValues: function() {
          return this._include;
        },

        /**
         * Prevent value change but allow navigation
         * @param {Event} evt the browser event
         * @param {string} keyString the string representation of the key sequence
         * @private
         */
        _preventEditAllowNavigation: function(evt, keyString) {
          let prevent = ["ctrl+x", "ctrl+v", "meta+x", "meta+v"].contains(keyString); // CTRL+X & CTRL+V forbidden
          prevent = prevent || (["tab", "home", "end", "left", "right", "up", "down", "shift+left", "shift+right", "ctrl+c",
            "ctrl+a",
            "meta+c", "meta+a"
          ].contains(
            keyString) === false);

          if (prevent) {
            evt.preventCancelableDefault();
            this.flash();
          }
        },

        /**
         * Get the value of the widget
         * @returns {?string|number} the value
         * @publicdoc
         */
        getValue: function() {
          return null;
        },

        /**
         * @inheritDoc
         */
        getValueForClipboard: function(ignoreSelection = false) {
          if (ignoreSelection) {
            return this.getValue();
          }

          return this.getInputElement()?.getSelectionText();
        },

        /**
         * Manage data to be copied to the clipboard
         * @inheritDoc
         */
        manageClipboardCopy: function(copiedText) {
          // Do whatever with text data you want to be added to the clipboard when copy
          return copiedText;
        },

        /**
         * Manage clipboard on paste data to the widget
         * @param {string} text
         * @inheritDoc
         */
        manageClipboardPaste: function(text) {
          const {
            start,
            end
          } = this.getCursors();

          if (this._enabled) {
            const currentVal = this._getInputElementValue();
            if (currentVal !== null) {
              this._setValue(currentVal.splice(start, end - start, text));
              this.getInputElement()?.setCursorPosition(start + text.length);
            }
          }
        },

        /**
         * Remove characters between start and end
         * @param {string} str - Input string
         * @param {number} start - Begin index
         * @param {number} end - End index
         * @return {string} The new string
         * @inheritDoc
         */
        removeCharacters: function(str, start, end) {
          if (start === end) {
            return str;
          }
          return str.slice(0, start) + str.slice(end);
        },

        /**
         * @inheritDoc
         */
        manageClipboardCut: function() {
          const {
            start,
            end
          } = this.getCursors();

          const oldValue = this.getValue().toString();

          if (this._enabled) {
            gbc.ClipboardService.setClipboardData(this.getValueForClipboard());
            this.setValue(this.removeCharacters(oldValue, start, end), false, start);
          }
        },

        /**
         * Define the widget as readonly or not
         * @param {boolean} readonly - true to set the widget as readonly without possibility of edition, false otherwise
         * @publicdoc
         */
        setReadOnly: function(readonly) {
          this._isReadOnly = readonly;
        },

        /**
         * Check if the widget is readonly or not
         * @returns {boolean} true if the widget is readonly, false otherwise
         * @publicdoc
         */
        isReadOnly: function() {
          return this._isReadOnly;
        },

        /**
         * Define the maximum number of characters allowed
         * @param {number} maxLength - maximum number of characters allowed in the field
         * @publicdoc
         */
        setMaxLength: function(maxLength) {
          this._maxLength = maxLength;
        },

        /**
         * Get the widget max length
         * @returns {number} max length value, 0 for no limit
         * @publicdoc
         */
        getMaxLength: function() {
          return this._maxLength;
        },

        /**
         * Define if autoNext is activated
         * @param {boolean} autoNext - true to activate autoNext
         * @publicdoc
         */
        setAutoNext: function(autoNext) {
          this._autoNext = autoNext;
        },

        /**
         * Returns if autoNext is activated
         * @returns {boolean} true if autoNext is activated
         * @publicdoc
         */
        hasAutoNext: function() {
          return this._autoNext && this._dialogType !== "Construct";
        },

        /**
         * @returns {number} time of the last widget modification
         */
        getEditingTime: function() {
          return this._editingTime;
        },

        /**
         * Check if widget is currently edited
         * It means that the widget have pending value changes
         * @return {boolean}
         */
        isEditing: function() {
          return this._editing;
        },

        /**
         * Flag or unflag widget as having pending value changes
         * @param editing {boolean} the new editing state
         * @publicdoc
         */
        setEditing: function(editing) {
          this._editing = editing;
          if (this.getElement()) {
            this.getElement().toggleClass("editing", Boolean(editing));
          }
        },

        /**
         * Returns if the widget is focusable
         * @return {boolean} State of focusable
         * @publicdoc
         */
        isFocusable: function() {
          return this.hasInputElement() || $super.isFocusable.call(this);
        },

        /**
         * Tests if the widget has really the DOM focus (check document.activeElement)
         * @returns {boolean} true if the widget has the DOM focus
         * @publicdoc
         */
        hasDOMFocus: function() {
          return (this.hasInputElement() && this.getInputElement() === document.activeElement) ||
            $super.hasDOMFocus.call(this);
        },

        /**
         * Defines the enabled status of the widget
         * @param {boolean} enabled - true if the widget allows user interaction, false otherwise.
         * @param {boolean} noSelectionUpdate - don't update selection
         * @publicdoc
         */
        setEnabled: function(enabled, noSelectionUpdate) {
          if (this._enabled !== Boolean(enabled)) {
            this._enabled = Boolean(enabled);
            if (this._enabled) {
              this.removeClass("disabled");
              if (this.hasInputElement() && !this.isReadOnly()) {
                this.getInputElement().removeAttribute("readonly");
              }
            } else {
              this.addClass("disabled");
              if (!noSelectionUpdate) {
                if (this.hasCursors()) {
                  this.setCursors(0);
                  const selection = window.getSelection();
                  if (selection) {
                    const hasTextSelection = selection.focusNode === this._element;
                    if (hasTextSelection) {
                      selection.removeAllRanges();
                    }
                  }
                }
              }
              if (this.hasInputElement()) {
                this.getInputElement().setAttribute("readonly", "readonly");
              }
            }
          }
        },

        /**
         * @inheritDoc
         */
        loseVMFocus: function(vmNewFocusedWidget = null) {
          $super.loseVMFocus.call(this, vmNewFocusedWidget);
          this.setEditing(false);
        },

        /**
         * @inheritDoc
         */
        loseFocus: function() {
          $super.loseFocus.call(this);
          this.setEditing(false);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isEnabled() && this.hasCursors()) {
            if (keyString === "home") {
              this.setCursors(0);
              keyProcessed = true;
            } else if (keyString === "end") {
              this.setCursors(this.getValue() && this.getValue().toString().length || 0);
              keyProcessed = true;
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
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          this._processingKeyEvent = true;
          let keyProcessed = false;

          if (this.isEnabled() && !this.isReadOnly()) {

            if (keyString === "ctrl+z" || keyString === 'meta+z') {
              this.undo();
              keyProcessed = true;
            } else if (keyString === "ctrl+shift+z" || keyString === 'meta+shift+z') {
              this.redo();
              keyProcessed = true;
            }

            // prevents typed char to appear in input fields if not focused (case occurs if user press mouse down and begins to type chars before releasing mouse cf gbc-3914 or if user clicks in a readonly edit)
            // in other words only prevent default on vm unfocused (but browser focused) editable fields
            if (!this.hasDOMFocus()) {
              const currentActiveWidget = context.WidgetService.getWidgetFromElement(document.activeElement);
              if (currentActiveWidget && currentActiveWidget.isEnabled && currentActiveWidget.isEnabled() && currentActiveWidget.isReadOnly &&
                !currentActiveWidget.isReadOnly()) {
                // cancel default browser behavior if active browser element isn't current vm focused element and is editable
                // let readonly edit accept default browser behaviors (ex: click & ctrl+a in a readonly edit)
                domKeyEvent.preventCancelableDefault();
              }
            }

            if (this.isNotEditable()) {
              this._preventEditAllowNavigation(domKeyEvent, keyString);
            }

            if (!keyProcessed && this._pictureComponent) {
              keyProcessed = this._pictureComponent.manageKeyDown(keyString, domKeyEvent);
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.manageKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * @inheritDoc
         */
        manageKeyUp: function(keyString, domKeyEvent) {
          $super.manageKeyUp.call(this, keyString, domKeyEvent);
          this._processingKeyEvent = false;
        },

        /**
         * Cancel the last value
         */
        undo: function() {
          if (this.hasCursors()) { // only widgets with cursors manage undo/redo
            const cursors = this.getCursors();
            const prevValue = this.getValue();
            //go back but store the current as last known value
            if (this._valueStackCursor === this._valueStack.length - 1 && this._valueStack[this._valueStack.length - 1] !==
              this.getValue()) {
              this.setValue(this.getValue());
            }
            this._valueStackCursor--;
            this._valueStackCursor = this._valueStackCursor < 0 ? 0 : this._valueStackCursor;

            this.afterDomMutator(function() {
              const val = this._valueStack[this._valueStackCursor];
              if (typeof val === "string" && this.hasInputElement()) {
                this._setValue(val);
                const diff = prevValue.length - val.length;
                this.setCursors(cursors.start - diff);
              }
            }.bind(this));
          }
        },

        /**
         * Restore the last value
         */
        redo: function() {
          if (this.hasCursors()) { // only widgets with cursors manage undo/redo
            const cursors = this.getCursors();
            const prevValue = this.getValue();
            if (this._valueStackCursor < this._valueStack.length - 1) {
              this._valueStackCursor++;
            }
            this.afterDomMutator(function() {
              const val = this._valueStack[this._valueStackCursor];
              if (typeof val === "string" && this.hasInputElement()) {
                this._setValue(val);
                const diff = prevValue.length - val.length;
                this.setCursors(cursors.start - diff);
              }
            }.bind(this));
          }
        },

        /**
         * @inheritDoc
         */
        buildExtraContextMenuActions: function(contextMenu) {
          $super.buildExtraContextMenuActions.call(this, contextMenu);
          const authAction = this.getContextMenuAuthorizedActions();

          if (authAction.selectAll && this.isEnabled() && !this.isInTable()) {

            const value = this.getValue();
            const selectAllAllowed = isNaN(value) ? (value.length > 0) : (value !== null);

            contextMenu.addAction("selectAll", i18next.t("gwc.contextMenu.selectAll"), "font:FontAwesome.ttf:f0ea", "Ctrl+A", {
              clickCallback: function() {
                contextMenu.hide();
                this.setFocus();
                this.selectAllInputText();
              }.bind(this),
              disabled: !selectAllAllowed
            }, true);
          }
        },

        /**
         * Select all the text in the input element
         * @publicdoc
         */
        selectAllInputText: function() {
          if (this.hasInputElement()) {
            const value = this.getValue().toString(); //For SpinEdit value is a number
            const cursor2 = value && value.length || 0;
            this._inputElement.setCursorPosition(0, cursor2);
          }
        },

        /**
         * Defines a placeholder text
         * @param {string} placeholder - placeholder text
         * @param {boolean} fake - true if placeholder come from another attribute
         * @publicdoc
         */
        setPlaceHolder: function(placeholder, fake) {
          if (this.hasInputElement()) {
            this._isFakePlaceholder = fake;
            if (placeholder) {
              this._inputElement.setAttribute('placeholder', placeholder);
            } else {
              this._inputElement.removeAttribute('placeholder');
            }
          }
        },

        /**
         * Method used to validate or not the value, this trigger a rollback if not valid when sending
         * the value to the VM
         * @return {boolean} - true if valid, false otherwise
         */
        validateValue: function() {
          // Implement your own method on widgets
          return true;
        },

        /**
         * This function requests the VM focus if this focus event hasn't been triggered
         * by a mouse or touch event.
         * This happens when the user presses the TAB key of a mobile's virtual keyboard.
         * - TAB generates only a focus event
         * - A tap or click generates a mousedown, focus and mouseup events
         * @param {FocusEvent} event HTML focus event
         * @private
         */
        _onMobileFocus: function(event) {
          if (!this._isMousePressed) {
            this._onRequestFocus(event);
            event.stopPropagation();
          }
        },

        /**
         * @param {MouseEvent} event HTML mouse event
         * @private
         */
        _onMobileMouseDown: function(event) {
          this._isMousePressed = true;
        },

        /**
         * @param {MouseEvent} event HTML mouse event
         * @private
         */
        _onMobileMouseUp: function(event) {
          this._isMousePressed = false;
        },

        /**
         * Fix the char full/half char size according to the widget field width
         * @param {string} text - widget value
         * @param {string} newTextPart - new text part to verify
         * @return {string} a valid newTextPart
         */
        checkValueDisplayWidth: function(text, newTextPart) {
          if (newTextPart.length === 0 || (this._maxLength <= 0 && this._vmWidth <= 0)) {
            return newTextPart;
          }

          const displayWidth = this._vmWidth;
          const maxLength = this.getUserInterfaceWidget().isCharLengthSemantics() ? this._maxLength : -1;

          let fullText = text + newTextPart;
          const textLength = Array.from(text).length;
          let res = newTextPart;
          const codepoints = Array.from(newTextPart);

          while (fullText.displayWidth() > displayWidth || (maxLength > 0 && (textLength + codepoints.length) > maxLength)) {
            codepoints.pop();
            res = codepoints.join('');
            fullText = text + res;
          }

          return res;
        },

        /**
         * Fix the newTextPart according to the requested byte length
         * @param {string} text - old part of the widget value
         * @param {string} newTextPart - new text part to verify
         * @param {number} bytes - requested max bytes length
         * @return {string} a valid newTextPart
         */
        checkValueByteCount: function(text, newTextPart, bytes) {
          const fullText = text + newTextPart;

          if (fullText.length === 0 || fullText.countBytes() <= bytes) {
            return newTextPart;
          }

          if (String.isSingleByteEncoding()) {
            return newTextPart.substring(0, this._maxLength - text.length);
          }

          const codepoints = Array.from(newTextPart);
          const textLength = text.countBytes();
          let res = '';
          do {
            codepoints.pop();
            res = codepoints.join('');
          } while (codepoints.length > 0 && (textLength + res.countBytes()) > bytes);

          return res;
        },

        /**
         * Set to true if we must ignore the scroll attribute
         * @param {boolean} dataTypeWithNoScroll
         */
        setDataTypeWithNoScroll: function(dataTypeWithNoScroll) {
          this._dataTypeWithNoScroll = dataTypeWithNoScroll;
        },

        /**
         * Widget VM width
         * @param {number} width
         */
        setVMWidth: function(width) {
          this._vmWidth = width;
        },

        /**
         * Defines if we can take more char than the widget width
         * @param {boolean} scroll true if the widget can 'scroll' his content (take more char than the widget width)
         * @publicdoc
         */
        setScroll: function(scroll) {
          this._scroll = scroll;
        },

        /**
         * Set the picture
         * @param {string} picture
         */
        setPicture: function(picture) {
          if (this.hasInputElement()) {
            if (this._pictureComponent === null) {
              this._pictureComponent = new cls.InputPictureWidgetComponent(this);
            }
            this._pictureComponent.setPicture(picture);
          }
        },

        /**
         * True if a picture is defined on this field
         * @return {boolean}
         */
        isPictureDefined: function() {
          return this._pictureComponent !== null;
        },

        /**
         * Get the input element text state component
         * @return {classes.InputTextStateComponent}
         */
        getInputTextState: function() {
          if (this._inputTextState === null && this.hasInputElement()) {
            this._inputTextState = new cls.InputTextStateComponent(this);
          }
          return this._inputTextState;
        },

        /**
         * @inheritDoc
         */
        getContextMenuAuthorizedActions: function() {
          const editable = this.isEnabled() && !this.isReadOnly() && this.hasInputElement();
          return {
            paste: editable,
            copy: true,
            cut: editable,
            selectAll: this.hasInputElement()
          };
        },

        /**
         * Open the associated drop-down if it exists
         */
        openDropDown: function() {
          // each widget must implement this function to open his specific drop down.
        },

        /**
         * Can we trigger autonext event
         * @return {boolean} true if we can trigger autonext event
         */
        canAutoNext: function() {
          return false;
        },

        /**
         * Control the display width, the max length and the encoding according to the char/byte length semantics,
         * the width/max length of the widget and vm encoding
         * @param {KeyboardEvent | InputEvent} domEvent
         */
        controlValueLength: function(domEvent) {
          //Manage display char (full/half) and length semantics constraints
          const widgetText = this.getInputTextState().getBackupTextWithoutSelected();
          const inputValue = this._inputElement.value;

          const newPart = this.getInputTextState().newPart(inputValue);
          //If you need to make some char replacement do something like:
          //newPart = newPart.replace(....)
          let res = '';
          //On mobile isComposing=1 even for regular char
          if (!window.isMobile() && domEvent?.isComposing) {
            //When composing we can use invalid char to create a valid one
            //No need to verify autonext
            return;
          } else {
            res = this._checkValue(widgetText, newPart.removeUnknownChar());
          }

          if (res !== newPart) {
            this.getInputTextState().restore(res);
          }
        },

        /**
         * Fix the newTextPart according to byte/char length and display width
         * @param  {string} text - widget valid value
         * @param {string} newTextPart - new text part
         * @return {string} a valid newTextPart
         * @private
         */
        _checkValue: function(text, newTextPart) {
          return newTextPart;
        },
      };
    });
  });
