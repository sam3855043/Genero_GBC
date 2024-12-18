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

modulum('ScrollVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Scroll VM command.
     * @class ScrollVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.ScrollVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.ScrollVMCommand.prototype */ {
        __name: "ScrollVMCommand",

        /** @type number */
        _offset: 0,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.NodeBase} node scroll target
         * @param {number} offset new scroll offset
         */
        constructor: function(app, node, offset) {
          $super.constructor.call(this, app, node);
          this._offset = offset;
          this._needsVmSync = true;
        },

        /**
         * @inheritDoc
         */
        needsRefreshLayout: function() {
          return false;
        },

        /**
         * @inheritDoc
         */
        execute: function() {

          const vmOffset = this._node.attribute("offset");

          if (this._offset !== vmOffset) {
            const event = new cls.VMConfigureEvent(this._node.getId(), {
              offset: this._offset
            });
            this._vmEvents = [event];
          }
          return this._vmEvents && this._vmEvents.length > 0;
        },

        /**
         * @inheritDoc
         */
        merge: function(command) {
          if (command instanceof cls.ScrollVMCommand) {
            if (command._node === this._node) {
              this._offset = command._offset;
              return true;
            }
          }
          return false;
        }
      };
    });
  }
);
