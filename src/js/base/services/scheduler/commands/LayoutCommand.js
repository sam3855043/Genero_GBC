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

modulum('LayoutCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Layout command.
     * @class LayoutCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.LayoutCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.LayoutCommand.prototype */ {
        __name: "LayoutCommand",

        /** @type Object */
        _options: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {Object} opts
         */
        constructor: function(app, opts = {}) {
          $super.constructor.call(this, app, null);
          this._options = opts;
          this._executeImmediately = false;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          this._app.layout.refreshLayout(this._options);
          return true;
        },

        /**
         * @inheritDoc
         */
        merge: function(command) {
          if (command instanceof cls.LayoutCommand) {
            const layoutCommand = /** @type classes.LayoutCommand */ command;
            this._options.resize = this._options.resize || layoutCommand._options.resize;
            this._options.noLayout = this._options.noLayout || layoutCommand._options.noLayout;
            return true;
          }
          return false;
        }

      };
    });
  }
);
