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

modulum('TimeEditWidgetBase', ['FieldWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * TimeEdit widget Base class.
     * @class TimeEditWidgetBase
     * @memberOf classes
     * @extends classes.FieldWidgetBase
     * @publicdoc Widgets
     */
    cls.TimeEditWidgetBase = context.oo.Class(cls.FieldWidgetBase, function($super) {
      return /** @lends classes.TimeEditWidgetBase.prototype */ {
        __name: 'TimeEditWidgetBase',

        /**
         * Active/disable seconds for the widget. By default, yes.
         * @type {boolean}
         */
        _useSeconds: true,

        /**
         * Redefine where the data is located
         * @type {string}
         */
        __dataContentPlaceholderSelector: '.gbc_dataContentPlaceholder',

        /**
         * Format of TIMEEDIT (hh:mm or hh:mm:ss)
         * @type {string}
         */
        _displayFormat: null,

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
            this._layoutEngine = new cls.LeafLayoutEngine(this);
            this._layoutInformation.setSingleLineContentOnly(true);

            this._layoutInformation.getSizePolicyConfig().setAllShrinkable(false);
          }
        },

        /**
         * @inheritDoc
         */
        setTextAlign: function(align) {
          $super.setTextAlign.call(this, align);
          this.setStyle('input', {
            'text-align': align
          });
        },

        /**
         * Set Default TTF color
         * @param {string} color - rgb formatted or css name
         */
        setDefaultTTFColor: function(color) {
          this.setStyle(".gbc_TimeEditWidget_arrows", {
            'color': color
          });
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
         * @inheritDoc
         */
        setTitle: function(title) {
          this._inputElement.setAttribute('title', title);
        },

        /**
         * @inheritDoc
         */
        getTitle: function() {
          return this._inputElement.getAttribute('title');
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM) {
          $super.setValue.call(this, value, fromVM);
          if (this.getValue() !== value) {
            this._setTimeAccuracy(value);
            this._inputElement.value = value;
          }
        },

        /**
         * Detect if seconds are defined in value or in format and set class variable
         * @param value
         * @protected
         */
        _setTimeAccuracy: function(value) {
          const groups = value.split(':');
          if (groups.length === 1) { // no ':'' detected, we look for varType
            this._useSeconds = !this.getDisplayFormat() || !this.getDisplayFormat().endsWith("MINUTE");
          } else {
            this._useSeconds = groups.length === 3;
          }
        },

        /**
         * @inheritDoc
         */
        getValue: function() {
          return this._inputElement.value;
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          this._setInputReadOnly(!enabled);
        },

        /**
         * @inheritDoc
         */
        setReadOnly: function(readonly) {
          $super.setReadOnly.call(this, readonly);
          this._setInputReadOnly(readonly);
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
         * Returns if max length of the widget has been reached
         * @returns {boolean} return true if max length is reached in input element
         */
        _isMaxLength: function() {
          return this._maxLength !== -1 && this._inputElement.value.length >= this._maxLength &&
            this._inputElement.selectionStart === this._inputElement.selectionEnd;
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

        /**
         * Get the timeedit format (hh:mm or hh:mm:ss)
         * @return {?string} timeedit format
         * @publicdoc
         */
        getDisplayFormat: function() {
          return this._displayFormat;
        },

        /**
         * Set timeedit format (hh:mm or hh:mm:ss)
         * @param {string} format - format
         * @publicdoc
         */
        setDisplayFormat: function(format) {
          this._displayFormat = format;
          this._setTimeAccuracy(this.getValue());
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
