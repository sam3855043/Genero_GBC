/// FOURJS_START_COPYRIGHT(D,2020)
/// Property of Four Js*
/// (c) Copyright Four Js 2020, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('PageSizeVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * PageSize VM command.
     * @class PageSizeVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.PageSizeVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.PageSizeVMCommand.prototype */ {
        __name: "PageSizeVMCommand",

        /** @type number */
        _pageSize: 0,
        /** @type number */
        _bufferSize: 0,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.NodeBase} node scroll target
         * @param {number} pageSize new pageSize
         * @param {number} bufferSize new bufferSize
         */
        constructor: function(app, node, pageSize, bufferSize) {
          $super.constructor.call(this, app, node);
          this._pageSize = pageSize;
          this._bufferSize = bufferSize;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          const pageSize = this._node.attribute('pageSize');
          const bufferSize = this._node.attribute('bufferSize');

          if (pageSize !== this._pageSize || bufferSize !== this._bufferSize) {
            const event = new cls.VMConfigureEvent(this._node.getId(), {
              pageSize: this._pageSize,
              bufferSize: this._bufferSize
            });

            this._vmEvents = [event];
          }

          return this._vmEvents && this._vmEvents.length > 0;
        },

      };
    });
  }
);
