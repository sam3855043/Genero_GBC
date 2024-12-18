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

modulum('NativeCloseCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Native close command.
     * @class NativeCloseCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.NativeCloseCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.NativeCloseCommand.prototype */ {
        __name: "NativeCloseCommand",

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
          context.HostService.tryCloseButtonClick();

          return true;
        },

      };
    });
  }
);
