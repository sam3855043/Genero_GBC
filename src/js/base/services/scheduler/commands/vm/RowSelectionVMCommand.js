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

modulum('RowSelectionVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * RowSelection VM command.
     * @class RowSelectionVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.RowSelectionVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.RowSelectionVMCommand.prototype */ {
        __name: "RowSelectionVMCommand",

        $static: /** @lends classes.RowSelectionVMCommand */ {
          currentRow: 1,
          toggle: 2,
          selectAll: 3,
        },

        /** @type boolean */
        _ctrlKey: false,

        /** @type boolean */
        _shiftKey: false,

        /** @type number */
        _type: 1,

        /** @type String */
        _actionName: null,

        /**
         *
         * @param {classes.VMApplication} app owner
         * @param {classes.TableNode} node
         * @param {boolean} ctrlKey - ctrl key pressed
         * @param {boolean} shiftKey - shift key pressed
         * @param {number} type - type of row selection (currentRow, toggle, selectAll)
         * @param {string} [actionName] - actionName used to change current row
         */
        constructor: function(app, node, ctrlKey, shiftKey, type, actionName) {
          $super.constructor.call(this, app, node);
          this._ctrlKey = ctrlKey;
          this._shiftKey = shiftKey;
          this._type = type;
          this._actionName = actionName ? actionName : null;
        },

        /**
         * Build row selection event
         * @param {number} row - base row to compute selection
         * @returns {classes.VMRowSelectionEvent} row selection event
         */
        buildRowSelectionEvent: function(row) {

          const controller = this._node.getController();
          let startIndex = row;
          let endIndex = row;
          let mode = "set";

          if (this._shiftKey) {
            if (controller.multiRowSelectionRoot === -1) {
              controller.multiRowSelectionRoot = this._node.attribute('currentRow');
            }

            startIndex = controller.multiRowSelectionRoot;
            endIndex = row;
            mode = this._ctrlKey ? "exset" : "set";

            controller.updateMultiRowSelectionRoot = false;
          } else if (this._ctrlKey) {
            const children = this._node.getChildren();
            const rowInfoListNode = children[children.length - 1];
            const rowInfoNode = rowInfoListNode.getChildren()[row - this._node.attribute('offset')];

            mode = rowInfoNode && rowInfoNode.attribute('selected') === 1 ? "unset" : "exset";
          }

          return new cls.VMRowSelectionEvent(this._node.getId(), {
            startIndex: startIndex,
            endIndex: endIndex,
            selectionMode: mode
          });
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          const events = [];

          if (this._type === cls.RowSelectionVMCommand.currentRow && this._actionName) {
            const newCurrentRow = cls.CurrentRowVMCommand.computeNewRowFromAction(this._node, this._actionName, this._node.attribute(
              "currentRow"), false);
            events.push(this.buildRowSelectionEvent(newCurrentRow));
          } else if (this._type === cls.RowSelectionVMCommand.toggle) { // toggle selection of currentRow
            events.push(this.buildRowSelectionEvent(this._node.attribute("currentRow")));
          } else if (this._type === cls.RowSelectionVMCommand.selectAll) { // select all
            events.push(new cls.VMRowSelectionEvent(this._node.getId(), {
              startIndex: 0,
              endIndex: this._node.attribute('size') - 1,
              selectionMode: "set"
            }));
          }
          this._vmEvents = events;
          return this._vmEvents.length > 0;
        }
      };
    });
  }
);
