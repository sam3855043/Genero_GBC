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

modulum('EnterBackgroundCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * EnterBackground command.
     * @class EnterBackgroundCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.EnterBackgroundCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.EnterBackgroundCommand.prototype */ {
        __name: "EnterBackgroundCommand",

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
          this._app.action.executeActionByName("enterbackground");

          return true;
        },

      };
    });
  }
);
