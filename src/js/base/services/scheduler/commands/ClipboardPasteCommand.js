/// FOURJS_START_COPYRIGHT(D,2019)
/// Property of Four Js*
/// (c) Copyright Four Js 2019, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ClipboardPasteCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Native back command.
     * @class ClipboardPasteCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.ClipboardPasteCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.ClipboardPasteCommand.prototype */ {
        __name: "ClipboardPasteCommand",

        /** @type String */
        _textValue: null,

        /** @type classes.WidgetBase */
        _widget: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {String} textValue text to be pasted
         * @param {classes.WidgetBase} widget
         */
        constructor: function(app, textValue, widget) {
          $super.constructor.call(this, app, null);
          this._textValue = textValue;
          this._widget = widget;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          // if widget has not the focus --> no paste
          if (!this._widget || !this._app.hasVMFocus(this._widget)) {
            return false;
          }

          if (this._widget.manageBeforeInput(this._textValue)) {
            this._widget.manageClipboardPaste(this._textValue);
            this._widget.manageInput(this._textValue);
          }

          return true;
        },

      };
    });
  }
);
