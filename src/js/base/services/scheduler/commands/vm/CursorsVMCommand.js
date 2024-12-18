/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('CursorsVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Cursors VM command
     * This class updates the cursors of a widget
     * @class CursorsVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.CursorsVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.CursorsVMCommand.prototype */ {
        __name: "CursorsVMCommand",

        /** @type {?number} */
        _cursor: null,
        /** @type {?number} */
        _cursor2: null,
        /** @type {number} */
        _valueLength: 0,
        /** @type {boolean} */
        _canBeExecuted: true,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.NodeBase} node - target node
         * @param {number} cursor1 - current starting cursor of the node
         * @param {number} [cursor2] - current ending cursor of the node
         * @param {number} valueLength - node value length
         * @param {boolean} [canBeExecuted] - true if the current command can be executed, false otherwise
         */
        constructor: function(app, node, cursor1, cursor2, valueLength, canBeExecuted) {
          $super.constructor.call(this, app, node);
          this._cursor = cursor1;
          if (cursor2 !== undefined) {
            this._cursor2 = cursor2;
          }
          if (valueLength !== undefined) {
            this._valueLength = valueLength;
          }
          this._canBeExecuted = canBeExecuted;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          const ctrl = this._node.getController();
          let event = null;
          if (ctrl) {
            const node = this._node.isInTable() || this._node.isInMatrix() ? this._node.getParentNode().getParentNode() : this._node;
            let vmCursor = node.attribute('cursor');
            if (vmCursor === -1) {
              vmCursor = this._valueLength;
            }
            let vmCursor2 = node.attribute('cursor2');
            if (vmCursor2 === -1) {
              vmCursor2 = this._valueLength;
            }
            const cursorData = {};
            let hasData = false;
            // Sending only modified cursors to the VM.
            if (vmCursor !== this._cursor) {
              cursorData.cursor = this._cursor;
              hasData = true;
            }
            if (hasData || (this._cursor2 !== null && vmCursor2 !== this._cursor2)) {
              cursorData.cursor2 = this._cursor2;
              hasData = true;
            }
            if (hasData) {
              event = new cls.VMConfigureEvent(node.getId(), cursorData);
              this._vmEvents = [event];
            }
          }
          return this._vmEvents && this._vmEvents.length > 0;
        },

        /**
         * @inheritDoc
         */
        canBeExecuted: function() {
          return this._canBeExecuted;
        }
      };
    });
  }
);
