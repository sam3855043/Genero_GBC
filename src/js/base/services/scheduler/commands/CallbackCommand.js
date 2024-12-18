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

modulum('CallbackCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Command callback.
     * @class CallbackCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.CallbackCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.CallbackCommand.prototype */ {
        __name: "CallbackCommand",

        /**
         * Function to execute
         * @function
         */
        _callback: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {function} callback
         */
        constructor: function(app, callback) {
          $super.constructor.call(this, app, null);
          this._callback = callback;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          if (this._callback) {
            this._callback();
            return true;
          }
          return false;
        },

      };
    });
  }
);
