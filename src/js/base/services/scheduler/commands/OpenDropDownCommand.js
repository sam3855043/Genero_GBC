/// FOURJS_START_COPYRIGHT(D,2024)
/// Property of Four Js*
/// (c) Copyright Four Js 2024, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('OpenDropDownCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Open drop down command.
     * @class OpenDropDownCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.OpenDropDownCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.OpenDropDownCommand.prototype */ {
        __name: "OpenDropDownCommand",

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.NodeBase} node node on which open drop down
         */
        constructor: function(app, node) {
          $super.constructor.call(this, app, node);
          this._executeImmediately = true;
        },

        /**
         * @inheritDoc
         */
        execute: function() {

          const focusedVMNode = this._app.getFocusedVMNodeAndValue();

          // open drop down only if node has the focus
          if (focusedVMNode === this._node) {
            const widget = /** @type classes.FieldWidgetBase */ this._node.getWidget();
            widget.openDropDown();
          }

          return true;
        }
      };
    });
  }
);
