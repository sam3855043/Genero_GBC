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

modulum('NativeBackCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Native back command.
     * @class NativeBackCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.NativeBackCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.NativeBackCommand.prototype */ {
        __name: "NativeBackCommand",

        /** @type String[] */
        _actionList: null,

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
          let found = false,
            list = this._actionList,
            len = list && list.length;
          const actionService = this._app.action;
          for (let i = 0; i < len; i++) {
            if (actionService.getAction(list[i])) {
              found = true;
              const options = {};
              options.sendValue = true; // send value of the current field before execute action
              actionService.executeActionByName(list[i], options);
              break;
            }
          }
          if (!found) {
            context.__wrapper.nativeCall(context.__wrapper.param({
              name: "noBackAction"
            }, this.application));
          }

          return true;
        },

      };
    });
  }
);
