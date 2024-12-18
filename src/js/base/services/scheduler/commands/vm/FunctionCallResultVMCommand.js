/// FOURJS_START_COPYRIGHT(D,2014)
/// Property of Four Js*
/// (c) Copyright Four Js 2014, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('FunctionCallResultVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * FunctionCallResult VM event command
     * @class FunctionCallResultVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.FunctionCallResultVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.FunctionCallResultVMCommand.prototype */ {
        __name: "FunctionCallResultVMCommand",

        _status: null,
        _message: null,
        _values: null,

        /**
         * @param app {classes.VMApplication} app owner
         * @param status front call result status
         * @param message front call result status message
         * @param values front call result values
         */
        constructor: function(app, status, message, values) {
          $super.constructor.call(this, app, null);
          this._status = status;
          this._message = message;
          this._values = values;
          this._needsVmSync = true;
          this._executeImmediately = true;
          // Got the function call result, so functioncall is not processing anymore
          context.FrontCallService.setFunctionCallProcessing(false);
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          const event = new cls.VMFunctionCallEvent(this._status, this._message, this._values);
          this._vmEvents = [event];
          return true;
        }
      };
    });
  }
);
