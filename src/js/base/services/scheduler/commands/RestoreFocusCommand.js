/// FOURJS_START_COPYRIGHT(D,2023)
/// Property of Four Js*
/// (c) Copyright Four Js 2023, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('RestoreFocusCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Restore focus command.
     * Restore the focus at the correct position (according to AUI Tree)
     * @class RestoreFocusCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.RestoreFocusCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.RestoreFocusCommand.prototype */ {
        __name: "RestoreFocusCommand",

        _restoreDOMFocus: false,
        /**
         * @param {classes.VMApplication} app owner
         * @param {boolean} restoreDOMFocus
         */
        constructor: function(app, restoreDOMFocus) {
          $super.constructor.call(this, app, null);
          this._restoreDOMFocus = restoreDOMFocus;
          this._executeImmediately = false;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          this._app.focus.restoreVMFocus(this._restoreDOMFocus);
          return true;
        },

        /**
         * @inheritDoc
         */
        merge: function(command) {
          if (command instanceof cls.RestoreFocusCommand) {
            this._restoreDOMFocus = this._restoreDOMFocus || command._restoreDOMFocus;
            return true;
          }
          return false;
        }

      };
    });
  }
);
