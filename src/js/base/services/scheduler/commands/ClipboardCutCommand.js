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

modulum('ClipboardCutCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Native back command.
     * @class ClipboardCutCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.ClipboardCutCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.ClipboardCutCommand.prototype */ {
        __name: "ClipboardCutCommand",

        /** @type classes.WidgetBase */
        _widget: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.WidgetBase} widget
         */
        constructor: function(app, widget) {
          $super.constructor.call(this, app, null);

          this._widget = widget;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          // if widget has not the focus --> no cut
          if (!this._widget || !this._app.hasVMFocus(this._widget)) {
            return false;
          }

          if (this._widget.manageBeforeInput()) {
            this._widget.manageClipboardCut();
            this._widget.manageInput();
          }

          return true;
        },

      };
    });
  }
);
