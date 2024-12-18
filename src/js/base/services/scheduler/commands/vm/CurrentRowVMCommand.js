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

modulum('CurrentRowVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * CurrentRow VM command.
     * @class CurrentRowVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.CurrentRowVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.CurrentRowVMCommand.prototype */ {
        $static: /** @lends classes.CurrentRowVMCommand */ {
          /**
           * Compute new row according to an action
           * @param {classes.MatrixNode|classes.TableNode} containerNode
           * @param {string} actionName
           * @param {number} row - Reference current row
           * @param {boolean} [canAddExtraRow] - can add extra row by doing down key after last row
           * @returns {number|null}
           */
          computeNewRowFromAction: function(containerNode, actionName, row, canAddExtraRow) {

            if (!cls.ActionNode.isTableNavigationAction(actionName)) {
              return null;
            }
            const pageSize = containerNode.attribute('pageSize');
            const size = containerNode.attribute('size');

            let newCurrentRow = null;

            if (actionName === 'nextrow') {
              newCurrentRow = cls.CurrentRowVMCommand._computeNewRowFromDelta(containerNode, 1, row);
            } else if (actionName === 'prevrow') {
              newCurrentRow = cls.CurrentRowVMCommand._computeNewRowFromDelta(containerNode, -1, row);
            } else if (actionName === 'nextpage') {
              newCurrentRow = cls.CurrentRowVMCommand._computeNewRowFromDelta(containerNode, pageSize, row);
            } else if (actionName === 'prevpage') {
              newCurrentRow = cls.CurrentRowVMCommand._computeNewRowFromDelta(containerNode, -pageSize, row);
            } else if (actionName === 'firstrow') {
              newCurrentRow = 0;
            } else if (actionName === 'lastrow') {
              newCurrentRow = size - 1;
            }

            // check that new row is in the correct size range [0...size]
            if (newCurrentRow >= size) {
              if (!canAddExtraRow || actionName !== "nextrow") { // only exception is in Input mode when the action is "nextrow"
                newCurrentRow = size - 1;
              }
            } else if (newCurrentRow < 0) {
              newCurrentRow = 0;
            }

            return newCurrentRow;
          },

          /**
           * Compute new row according to a delta value
           * @param {classes.MatrixNode|classes.TableNode} node
           * @param {number} delta
           * @param {number} currentRow - Reference current row
           * @returns {number}
           * @private
           */
          _computeNewRowFromDelta: function(node, delta, currentRow) {

            const size = node.attribute('size');

            const offset = node.attribute('offset');
            const pageSize = node.attribute('pageSize');

            let newCurrentRow = null;

            if (pageSize === 1) {
              newCurrentRow = currentRow + delta;
            } else {
              // handle step = +-/ pageSize behavior (like Explorer)
              if (delta === pageSize) {

                const isVerticalScrollAtEnd = node.getController().getWidget() && node.getController().getWidget().isVerticalScrollAtEnd ?
                  node
                  .getController().getWidget()
                  .isVerticalScrollAtEnd() :
                  false;
                if (offset + pageSize >= size || isVerticalScrollAtEnd) {
                  newCurrentRow = size;
                } else if (currentRow >= offset + pageSize - 1) {
                  //we are on the last row
                  newCurrentRow = currentRow + pageSize;
                } else {
                  //we move to the next page
                  newCurrentRow = offset + pageSize - 1;
                }
              } else if (delta === -(pageSize)) {
                if (currentRow < offset) {
                  newCurrentRow = Math.max(0, currentRow - pageSize + 1);
                } else if (currentRow === offset) {
                  newCurrentRow = offset - pageSize;
                } else {
                  newCurrentRow = offset;
                }
              } else {
                newCurrentRow = currentRow + delta;
              }
            }

            return newCurrentRow;
          }
        },
        __name: "CurrentRowVMCommand",

        /** @type String */
        _actionName: null,

        /** @type {number} */
        _currentRowToValidate: -1,

        /** @type {boolean} */
        _ctrlKey: false,

        /** @type {boolean} */
        _shiftKey: false,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.TableNode|classes.MatrixNode} node
         * @param {string} actionName - actionName used to change current row
         * @param {boolean} [ctrlKey] - ctrlKey pressed during command creation
         * @param {boolean} [shiftKey] - shiftKey pressed during command creation
         */
        constructor: function(app, node, actionName, ctrlKey, shiftKey) {
          $super.constructor.call(this, app, node);
          this._actionName = actionName;
          this._ctrlKey = ctrlKey ? ctrlKey : false;
          this._shiftKey = shiftKey ? shiftKey : false;

          this._needsVmSync = true;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          const oldCurrentRow = this._node.attribute("currentRow");
          const dialogType = this._node.attribute('dialogType');
          const canAddExtraRow = this._node.getTag() === "Table" && !(dialogType === "Display" || dialogType === "DisplayArray");

          const newCurrentRow = cls.CurrentRowVMCommand.computeNewRowFromAction(this._node, this._actionName, this._node.attribute(
            "currentRow"), canAddExtraRow);
          if (newCurrentRow !== null && (oldCurrentRow !== newCurrentRow)) {
            this._currentRowToValidate = newCurrentRow;
            const events = [];
            // if mrs and one modifier is pressed, we must not send ActionEvent but ConfigureEvent with currentRow
            const forceConfigureEvent = (this._ctrlKey || this._shiftKey) && (this._node.attribute('multiRowSelection') !== 0);
            const actionNode = this._app.action.getAction(this._actionName);
            if (actionNode && !forceConfigureEvent) {
              events.push(new cls.VMActionEvent(actionNode.getId()));
            } else {
              events.push(new cls.VMConfigureEvent(this._node.getId(), {
                currentRow: newCurrentRow
              }));
            }

            // Paged ScrollGrids need to compute the offset in the client to keep it in sync properly
            const scrollGridNode = this._node.getTag() === "ScrollGrid" ? this._node : null;
            if (scrollGridNode && scrollGridNode.getController().isPagedScrollGrid()) {
              let offset = scrollGridNode.attribute('offset');
              const pageSize = scrollGridNode.attribute('pageSize');
              const size = scrollGridNode.attribute('pageSize');
              if (newCurrentRow < offset || newCurrentRow >= offset + pageSize || newCurrentRow > size - pageSize) {
                offset = Math.floor(newCurrentRow / pageSize) * pageSize;
                events.push(new cls.VMConfigureEvent(this._node.getId(), {
                  offset: offset
                }));
              }
            }
            this._vmEvents = events;
          }
          return this._vmEvents && this._vmEvents.length > 0;
        },

        /**
         * @inheritDoc
         */
        validate: function() {
          const currentRow = this._node.attribute('currentRow');
          return this._currentRowToValidate === currentRow;
        },

        /**
         * @returns {classes.NodeBase} the node to be focused
         */
        getNode: function() {
          return this._node;
        },

      };
    });
  }
);
