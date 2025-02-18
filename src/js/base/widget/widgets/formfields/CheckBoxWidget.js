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

modulum('CheckBoxWidget', ['FieldWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Checkbox widget.
     * @class CheckBoxWidget
     * @memberOf classes
     * @extends classes.FieldWidgetBase
     * @publicdoc Widgets
     */
    cls.CheckBoxWidget = context.oo.Class(cls.FieldWidgetBase, function($super) {
      return /** @lends classes.CheckBoxWidget.prototype */ {
        __name: 'CheckBoxWidget',
        __dataContentPlaceholderSelector: cls.WidgetBase.selfDataContent,
        /**
         * @type HTMLElement
         */
        _checkboxElement: null,
        /**
         * @type HTMLElement
         */
        _labelElement: null,
        /**
         * @type {*}
         */
        _checkedValue: true,
        /**
         * @type {*}
         */
        _uncheckedValue: false,
        /**
         * @type {*}
         */
        _value: false,
        /**
         * the value of the intermediate state
         * @type {?string}
         */
        _indeterminateValue: null,
        /**
         * @type {boolean}
         */
        _notNull: true,
        /**
         * @type {boolean}
         */
        _allowNullValue: false,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this.setFocusable(true);
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this._ignoreLayout) {
            this._layoutInformation = new cls.LayoutInformation(this);
            this._layoutEngine = new cls.LeafDynamicHeightLayoutEngine(this);
            this._layoutInformation.getSizePolicyConfig().initial = cls.SizePolicy.Dynamic();

            this._layoutInformation.getSizePolicyConfig().setAllShrinkable(false);
          }
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this._checkboxElement = this._element.getElementsByClassName('zmdi')[0];
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._checkboxElement = null;
          this._labelElement = null;
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (!this.isEnabled() && !this.isInTable() && !this.isInMatrix()) {
            return true; // if check disabled and not in matrix not in table --> nothing to do
          }

          this._onRequestFocus(domEvent); // request focus

          if (this.isEnabled()) {
            this._sendNextValue();
          }
          this.emit(context.constants.widgetEvents.click, domEvent);

          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isEnabled()) {
            if (keyString === "space" && !repeat) {
              keyProcessed = this._sendNextValue();
            }
          }
          //Catch arrow keys to prevent propagation when in a folder widget
          if (keyString === "right" || keyString === "left") {
            keyProcessed = true;
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.manageKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * Calculate next value and send it to behavior. Update visually the widget value if focused and ready
         * @returns {boolean}
         * @private
         */
        _sendNextValue: function() {
          this.setEditing(true);
          const newValue = this.getNextValue();
          if (this.hasFocus()) { // concerns mouse click
            this.setValue(newValue);
          }
          this.triggerValueChangedEvent(newValue);
          return true;
        },

        /**
         * Set widget mode. Useful when widget have peculiar behavior in certain mode
         * @param {string} mode the widget mode
         * @param {boolean} active the active state
         */
        setWidgetMode: function(mode, active) {
          this._allowNullValue = mode === "Construct";
        },

        /**
         * Defines a third state
         * @param {*} indeterminateValue value corresponding to the 'intermediate' state
         * @publicdoc
         */
        setIndeterminateValue: function(indeterminateValue) {
          const old = this._indeterminateValue;
          this._indeterminateValue = indeterminateValue;
          if (this.getValue() === old) {
            this.setValue(indeterminateValue);
          }
        },

        /**
         * Get the third state value
         * @returns {*} value corresponding to the 'third' state
         * @publicdoc
         */
        getIndeterminateValue: function() {
          return this._indeterminateValue;
        },

        /**
         * @returns {*} the next value in the cycle
         * @private
         */
        getNextValue: function() {
          const current = this._value;
          if (current === this._indeterminateValue ||
            ((this._notNull && !this._allowNullValue) && current === this._uncheckedValue)) {
            return this._checkedValue;
          } else if (current === this._checkedValue) {
            return this._uncheckedValue;
          } else {
            if (this._allowNullValue || !this.notNull) {
              return this._indeterminateValue;
            }
          }
        },

        /**
         * Get the text of this checkbox
         * @returns {string} the text displayed next to the button
         * @publicdoc
         */
        getText: function() {
          if (this._labelElement) {
            return this._labelElement.textContent;
          }
          return '';
        },

        /**
         * Set the text of the checkbox
         * @param {string} text - the text displayed next to the button
         * @publicdoc
         */
        setText: function(text) {
          text = text ? text : ''; // fix for ie & edge

          if (this._labelElement === null && text !== '') {
            this._labelElement = document.createElement('div');
            this._labelElement.addClass('label');
            this._element.getElementsByClassName('content')[0].appendChild(this._labelElement);
          }
          if (this._labelElement) {
            this.domAttributesMutator(function() {
              this._labelElement.toggleClass('notext', !text);
              this._labelElement.textContent = text;
            }.bind(this));
            if (this.getLayoutEngine()) {
              this.getLayoutEngine().forceMeasurement();
              this.getLayoutEngine().invalidateMeasure();
            }
          }
        },

        /**
         * Set the checked value
         * @param {*} checkedValue - value corresponding to the 'checked' state
         * @publicdoc
         */
        setCheckedValue: function(checkedValue) {
          const old = this._checkedValue;
          this._checkedValue = checkedValue;
          if (this.getValue() === old) {
            this.setValue(checkedValue);
          }
        },

        /**
         * Get the checked value
         * @returns {*} value corresponding to the 'checked' state
         * @publicdoc
         */
        getCheckedValue: function() {
          return this._checkedValue;
        },

        /**
         * Set unchecked value
         * @param {*} uncheckedValue - value corresponding to the 'checked' state
         * @publicdoc
         */
        setUncheckedValue: function(uncheckedValue) {
          const old = this._uncheckedValue;
          this._uncheckedValue = uncheckedValue;
          if (this.getValue() === old) {
            this.setValue(uncheckedValue);
          }
        },

        /**
         * Get unchecked value
         * @returns {*} value corresponding to the 'checked' state
         * @publicdoc
         */
        getUncheckedValue: function() {
          return this._uncheckedValue;
        },

        /**
         * @inheritDoc
         */
        getValue: function() {
          if (this._checkboxElement.hasClass('indeterminate')) {
            return this._indeterminateValue;
          } else if (this._checkboxElement.hasClass('checked')) {
            return this._checkedValue;
          } else {
            return this._uncheckedValue;
          }
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM = false, cursorPosition = null) {
          $super.setValue.call(this, value, fromVM, cursorPosition);
          this._value = value;
          this._checkboxElement.toggleClass('indeterminate', value === this._indeterminateValue);
          this._checkboxElement.toggleClass('checked', value === this._checkedValue);
          this._checkboxElement.toggleClass('unchecked', value !== this._checkedValue && value !== this._indeterminateValue);
          if (value === this._indeterminateValue) {
            this.setAriaAttribute("checked", "mixed");
          } else {
            this.setAriaAttribute("checked", (value === this._checkedValue).toString());
          }
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {
          this._element.domFocus();
          $super.setFocus.call(this, fromMouse);
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          this._checkboxElement.toggleClass('disabled', !enabled);
        },

        /**
         * @inheritDoc
         */
        getValueForClipboard: function(ignoreSelection = false) {
          let valueForCB = null;
          if (!ignoreSelection) {
            valueForCB = window.getSelectionText();
            valueForCB = valueForCB.length > 0 ? valueForCB : null;
          }
          if (valueForCB === null) {
            if (this._checkboxElement.hasClass('checked')) {
              valueForCB = this.getText();
            } else {
              valueForCB = "";
            }
          }

          return valueForCB;
        },

        /**
         * @inheritDoc
         */
        getContextMenuAuthorizedActions: function() {
          return {
            paste: false,
            copy: true,
            cut: false,
            selectAll: false
          };
        }
      };
    });
    cls.WidgetFactory.registerBuilder('CheckBox', cls.CheckBoxWidget);
    cls.WidgetFactory.registerBuilder('CheckBoxWidget', cls.CheckBoxWidget);
  });
