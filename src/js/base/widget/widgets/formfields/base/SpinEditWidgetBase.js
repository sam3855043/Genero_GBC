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

modulum('SpinEditWidgetBase', ['FieldWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * SpinEdit widget Base class.
     * @class SpinEditWidgetBase
     * @memberOf classes
     * @extends classes.FieldWidgetBase
     * @publicdoc Widgets
     */
    cls.SpinEditWidgetBase = context.oo.Class(cls.FieldWidgetBase, function($super) {
      return /** @lends classes.SpinEditWidgetBase.prototype */ {
        __name: 'SpinEditWidgetBase',

        /**
         * Redefine where the data is located
         * @type {string}
         */
        __dataContentPlaceholderSelector: '.gbc_dataContentPlaceholder',

        /**
         * Up arrow element
         * @type {Element}
         */
        _upArrow: null,

        /**
         * Down arrow element
         * @type {Element}
         */
        _downArrow: null,

        /**
         * Step of value increment/decrement.
         * @type {number}
         */
        _step: 1,

        /**
         * Minimum value of the spinedit
         * @type {?number}
         */
        _min: null,

        /**
         * Maximum value of the spinedit
         * @type {?number}
         */
        _max: null,

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this._ignoreLayout) {
            this._layoutInformation = new cls.LayoutInformation(this);
            this._layoutEngine = new cls.LeafLayoutEngine(this);
            this._layoutInformation.setSingleLineContentOnly(true);

            this._layoutInformation.getSizePolicyConfig().setAllShrinkable(false);
          }
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this._inputElement = this._element.getElementsByTagName('input')[0];
          this._upArrow = this._element.getElementsByClassName('up')[0];
          this._downArrow = this._element.getElementsByClassName('down')[0];
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
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

          const target = domEvent.target;
          if (target.isElementOrChildOf(this._upArrow)) {
            this._onUpIcon(domEvent);
          } else if (target.isElementOrChildOf(this._downArrow)) {
            this._onDownIcon(domEvent);
          }

          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM = false, cursorPosition = null) {
          $super.setValue.call(this, value, fromVM);
          //GDC behaviour
          if (!this.validateValue(value)) {
            if (Object.isNumber(this._min) && Object.isNumber(this._max)) {
              if (this._max < 0) {
                this._oldValue = this._max;
              } else {
                this._oldValue = this._min;
              }
            } else if (Object.isNumber(this._min)) {
              this._oldValue = this._min;
            } else if (Object.isNumber(this._max)) {
              this._oldValue = this._max;
            }
          }
          // TODO: why not set value with oldvalue ?
          this._inputElement.value = value;
          this.setAriaAttribute("valuenow", value);
        },

        /**
         * @inheritDoc
         */
        getValue: function() {
          const value = parseInt(this._inputElement.value, 10);
          const isDefined = Object.isNumber(value) && !Object.isNaN(value);
          return isDefined ? value : '';
        },

        /**
         * Handler called when arrow up icon has been touched/click
         * @param {UIEvent} evt - DOM event
         */
        _onUpIcon: function(evt) {
          if (this.isEnabled() && !this.isReadOnly()) {
            const newVal = this._increase();
            this.triggerValueChangedEvent(newVal);
          }
        },

        /**
         * Handler called when arrow down icon has been touched/click
         * @param {UIEvent} evt - DOM event
         */
        _onDownIcon: function(evt) {
          if (this.isEnabled() && !this.isReadOnly()) {
            const newVal = this._decrease();
            this.triggerValueChangedEvent(newVal);
          }
        },

        /**
         * Update value
         * @param {number} factor - value to add
         */
        _updateValue: function(factor) {
          if (factor > 0) {
            this._increase(factor);
          } else if (factor < 0) {
            this._decrease(Math.abs(factor));
          }
        },

        /**
         * Method used to validate or not the value of the widget or pass as parameter
         * @param {string|number} [value] - sets the value to display
         * @return {boolean} - true if valid, false otherwise
         */
        validateValue: function(value) {
          let cur = value ? value : this.getValue();
          if (Object.isNumber(this._min) && cur < this._min) {
            return false;
          }
          return !(Object.isNumber(this._max) && cur > this._max);
        },

        /**
         * Increase value
         * @param {number} [factor=1] - value to add (default is 1)
         */
        _increase: function(factor) {
          const curVal = parseInt(this._getWidgetValidValue(), 10);
          let newVal = (this._step * (factor && Object.isNumber(factor) ? factor : 1));
          newVal = curVal ? newVal + curVal : newVal;
          if (Object.isNumber(this._max) && newVal > this._max) {
            newVal = this._max;
          }
          this.setEditing(this._oldValue !== newVal);
          if (this.hasFocus()) {
            this.setValue(newVal);
            this.setCursors(0, -1); // highlight value and avoid an unwanted autonext
          }
          return newVal;
        },

        /**
         * Decrease value
         * @param {number} [factor=1] - value to remove (default is 1)
         */
        _decrease: function(factor) {
          const curVal = parseInt(this._getWidgetValidValue(), 10);
          let newVal = (this._step * (factor && Object.isNumber(factor) ? factor : 1));
          newVal = curVal ? curVal - newVal : -newVal;
          if (Object.isNumber(this._min) && newVal < this._min) {
            newVal = this._min;
          }
          this.setEditing(this._oldValue !== newVal);
          if (this.hasFocus()) {
            this.setValue(newVal);
            this.setCursors(0, -1); // highlight value and avoid an unwanted autonext
          }
          return newVal;
        },

        /**
         * Define the minimum possible value
         * @param {number} min - the minimum value
         * @publicdoc
         */
        setMin: function(min) {
          if (Object.isNumber(min)) {
            this._min = min;
          }
          this.setAriaAttribute("valuemin", min);
        },

        /**
         * Get minimum possible value
         * @returns {?number} the minimum value
         * @publicdoc
         */
        getMin: function() {
          return this._min;
        },

        /**
         * Define the maximum possible value
         * @param {number} max - the maximum value
         * @publicdoc
         */
        setMax: function(max) {
          if (Object.isNumber(max)) {
            this._max = max;
          }
          this.setAriaAttribute("valuemax", max);
        },

        /**
         * Get maximum possible value
         * @returns {?number} the maximum value
         * @publicdoc
         */
        getMax: function() {
          return this._max;
        },

        /**
         * Define the spinedit step when increasing or decreasing value
         * @param {number} step - the step value
         * @publicdoc
         */
        setStep: function(step) {
          let s = step && parseInt(step, 10);
          if (!s || Number.isNaN(s)) {
            s = 1;
          }
          this._step = s;
        },

        /**
         * Get spinedit step when increasing or decreasing value
         * @returns {number} the step value
         * @publicdoc
         */
        getStep: function() {
          return this._step;
        },

        /**
         * @inheritDoc
         */
        setReadOnly: function(readonly) {
          if (this._isReadOnly !== readonly) {
            $super.setReadOnly.call(this, readonly);
            this._setInputReadOnly(readonly || this._notEditable || !this._enabled);
          }
        },

        /**
         * Set input readonly attribute if it doesn't have focus or is noentry.
         * @param {boolean} readonly - true to set the edit part as read-only, false otherwise
         */
        _setInputReadOnly: function(readonly) {
          if (readonly) {
            this._inputElement.setAttribute('readonly', 'readonly');
          } else {
            this._inputElement.removeAttribute('readonly');
          }
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {
          $super.setFocus.call(this, fromMouse);
          this._inputElement.domFocus();
        },

        /**
         * @inheritDoc
         */
        setTitle: function(title) {
          $super.setTitle.call(this, title);
          this._inputElement.setAttribute('title', title);
        },

        /**
         * @inheritDoc
         */
        getTitle: function() {
          return this._inputElement.getAttribute('title');
        },

        /** Place the cursor at the given position,
         * @param {number} cursor - first cursor position
         * @param {number=} cursor2 - second cursor position
         * @publicdoc
         */
        setCursors: function(cursor, cursor2) {
          if (!cursor2) {
            cursor2 = cursor;
          }
          if (cursor2 && cursor2 < 0) {
            cursor2 = ('' + this.getValue()).length;
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
        setEnabled: function(enabled) {
          const oldEnabled = this._enabled;
          const bEnabled = Boolean(enabled);

          $super.setEnabled.call(this, enabled);
          this._setInputReadOnly(!enabled);
        },

        /**
         * @inheritDoc
         */
        setFontWeight: function(weight) {
          this.setStyle('input', {
            'font-weight': weight
          });
        },

        /**
         * @inheritDoc
         */
        getFontWeight: function() {
          return this.getStyle('input', 'font-weight');
        },

        /**
         * @inheritDoc
         */
        setFontStyle: function(style) {
          this.setStyle('input', {
            'font-style': style
          });
        },

        /**
         * @inheritDoc
         */
        getFontStyle: function() {
          return this.getStyle('input', 'font-style');
        },

        /**
         * @inheritDoc
         */
        setTextAlign: function(align) {
          this.setStyle('input', {
            'text-align': align
          });
        },

        /**
         * Set Default TTF color
         * @param {string} color - rgb formatted or css name
         */
        setDefaultTTFColor: function(color) {
          this.setStyle(".gbc_SpinEditWidget_arrows", {
            'color': color
          });
        },

        /**
         * @inheritDoc
         */
        getTextAlign: function() {
          return this.getStyle('input', 'text-align');
        },

        /**
         * @inheritDoc
         */
        getTextDecoration: function() {
          return this.getStyle('input', 'text-decoration');
        },

        /**
         * @inheritDoc
         */
        setTextDecoration: function(decoration) {
          this.setStyle('input', {
            'text-decoration': decoration
          });
        },

        /**
         * overrided since aria-required is not valid on spinbutton role
         * @inheritDoc
         */
        setRequired: function(required) {
          $super.setRequired.call(this, required);
          this.setAriaAttribute("required", null);
        },

        /**
         * @inheritDoc
         */
        canAutoNext: function() {
          const text = this.getValue().toString();
          const size = text ? text.length : 0;

          if (size > 0) {
            const cursors = this.getCursors();
            const endReached = cursors.start === cursors.end && cursors.start + 1 > size;
            const isLastCharNumeric = cls.KeyboardHelper.isNumeric(text[text.length - 1]);

            if (endReached && isLastCharNumeric) {
              if (this._maxLength > 0) {
                return text.length >= this._maxLength;
              }
            }
          }

          return false;
        },

        /**
         * @inheritDoc
         */
        manageBeforeInput: function(dataString = "", event = null) {

          const isConstruct = this.getDialogType() === "Construct";

          if (!isConstruct && dataString && !(event?.isComposing)) { // composition event cannot be canceled
            const isDecimalChar = cls.KeyboardHelper.isDecimal(dataString);
            const isStringInteger = Math.isStringInteger(dataString);

            if (!isStringInteger && !isDecimalChar) {
              return false;
            }
          }

          return $super.manageBeforeInput.call(this, dataString, event);
        },

        /**
         * @inheritDoc
         */
        manageInput: function(dataString = "", event = null) {
          $super.manageInput.call(this, dataString, event);

          this.controlValueLength(event);
          if (!this.getInputTextState().isRestored()) {
            this.triggerValueChangedEvent(this.getValue(), false);
          }
        },

        /**
         * @inheritDoc
         */
        _checkValue: function(text, newTextPart) {
          if (this._dialogType !== 'Input' && this._dialogType !== 'InputArray') {
            return newTextPart;
          }

          newTextPart = this.checkValueDisplayWidth(text, newTextPart);

          return newTextPart;
        },

        /**
         * Return a valid value (the current widget value or the last valid)
         * @return {?string|number}
         * @private
         */
        _getWidgetValidValue: function() {
          if (!this.validateValue()) {
            this.setValue(this._oldValue);
          }

          return this.getValue();
        },

        /**
         * @inheritDoc
         */
        getValueForClipboard: function(ignoreSelection = false) {
          if (ignoreSelection) {
            return this.getValue();
          }

          const txt = window.getSelectionText();

          return txt.length > 0 ? txt : null;
        }
      };
    });
  });
