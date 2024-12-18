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

modulum('NativeNotificationSelectedCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Native notificationselected command.
     * @class NativeNotificationPushedCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.NativeNotificationSelectedCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.NativeNotificationPushedCommand.prototype */ {
        __name: "NativeNotificationSelectedCommand",

        /**
         * @param {classes.VMApplication} app owner
         */
        constructor: function(app) {
          $super.constructor.call(this, app, null);
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          $super.execute.call(this);
          const inducedCmd = this._app.action.executeActionByName("notificationselected");
          if (inducedCmd === null) {
            return false;
          }
          // TODO review the concept of induced commands, is it really necessary ?
          this.getInducedCommands().push(inducedCmd);
          return this.getInducedCommands().reduce((canBeExecuted, cmd) => canBeExecuted && cmd.canBeExecuted(), true);
        },

        /**
         * @inheritDoc
         */
        isUnique: function() {
          return true;
        },

        /**
         * @inheritdoc
         */
        retryIfFailed: function() {
          return true;
        }
      };
    });
  }
);
