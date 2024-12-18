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

modulum('InputTextStateComponent', ['WidgetComponentBase'],
  function(context, cls) {

    /**
     * Text state of input element
     * @class InputTextStateComponent
     * @memberOf classes
     * @extends classes.WidgetComponentBase
     * @publicdoc
     */
    cls.InputTextStateComponent = context.oo.Class(cls.WidgetComponentBase, function($super) {
      return /** @lends classes.InputTextStateComponent.prototype */ {
        __name: "InputTextStateComponent",

        /**
         * text selection start
         * @type {number}
         */
        _selectionStart: 0,
        /**
         * text selection end
         * @type {number}
         */
        _selectionEnd: 0,
        /**
         * true if the value was restored
         * @type {boolean}
         */
        _isRestored: false,
        /**
         * widget value
         * @type {string}
         */
        _text: '',
        /**
         * Input element
         * @type {HTMLInputElement}
         */
        _inputElement: null,

        /**
         * @inheritDoc
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);

          // the widget must be a field widget base
          this._inputElement = ( /** @type {classes.FieldWidgetBase} */ widget).getInputElement();
        },

        /**
         * @inheritdoc
         */
        destroy: function() {
          this._inputElement = null;

          $super.destroy.call(this);
        },

        /**
         * Backup current input element state (Text + cursors)
         */
        backup: function() {
          try {
            this._selectionStart = this._inputElement.selectionStart;
            this._selectionEnd = this._inputElement.selectionEnd;
          } catch (e) {}
          this._text = this._inputElement.value;
          this._isRestored = false;
        },

        /**
         * Restore from last backup only input element cursors
         */
        restoreCursors: function() {
          try {
            this._inputElement.selectionStart = this._selectionStart;
            this._inputElement.selectionEnd = this._selectionEnd;
          } catch (e) {}
        },

        /**
         * Restore end cursor from backup and start cursor from backup end - length
         * @param {number} length
         */
        restoreFromEndCursors: function(length) {
          try {
            this._inputElement.selectionStart = this._selectionEnd - length;
            this._inputElement.selectionEnd = this._selectionEnd;
          } catch (e) {}
        },

        /**
         * Restore from last backup input element state (Text + cursors)
         * @param {string} partToAdd - Text to add
         */
        restore: function(partToAdd) {
          const partToAddLength = partToAdd.length;
          try {
            this._inputElement.value = this._text.substring(0, this._selectionStart) + partToAdd +
              this._text.substring(this._selectionEnd);
            this._inputElement.selectionStart = this._selectionStart + partToAddLength;
            this._inputElement.selectionEnd = this._selectionStart + partToAddLength;
          } catch (e) {}
          this._isRestored = true;
        },

        /**
         * True if the value was restored
         * @return {boolean}
         */
        isRestored: function() {
          return this._isRestored;
        },

        /**
         * Set the restored value
         * @param {boolean} restored - true if the value is restored
         */
        setRestored: function(restored) {
          this._isRestored = restored;
        },

        /**
         * Get the new text part since the last backup
         * @param {string} text new value
         * @return {string} new text part
         */
        newPart: function(text) {
          const diff = text.length - this._text.length;

          if (diff > 0 || this._selectionStart !== this._selectionEnd) {
            return text.substring(this._selectionStart, this._selectionEnd + diff);
          }

          return '';
        },

        /**
         * Get the backup text without the selected part
         * @return {string}
         */
        getBackupTextWithoutSelected: function() {
          return this._text === null ? null : this._text.substring(0, this._selectionStart) + this._text.substring(this._selectionEnd);
        },

        /**
         * Get the backup text.
         * @return {string}
         */
        getBackupText: function() {
          return this._text;
        }
      };
    });
  });
