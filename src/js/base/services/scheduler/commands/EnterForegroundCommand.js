/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('EnterForegroundCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Native Enterforeground command.
     * @class EnterForegroundCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.EnterForegroundCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.EnterForegroundCommand.prototype */ {
        __name: "EnterForegroundCommand",

        /**
         * @param {classes.VMApplication} app owner
         * @param {String[]} actionList list of actions to execute
         */
        constructor: function(app, actionList) {
          $super.constructor.call(this, app, null);
          this._actionList = actionList;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          // Tell the VM to execute the action
          this._app.action.executeActionByName("enterforeground");
          return true;
        },

      };
    });
  }
);
