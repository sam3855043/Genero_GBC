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

modulum('FocusVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Focus VM comand.
     * @class FocusVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.FocusVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.FocusVMCommand.prototype */ {
        __name: "FocusVMCommand",

        /** @type {number} */
        _cursor: 0,
        /** @type {number} */
        _cursor2: 0,

        /** @type {number} */
        _currentRowToValidate: -1,
        /** @type {number} */
        _currentColumnToValidate: -1,
        /** @type {number} */
        _rowIndex: -1,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.NodeBase} node that should have the focus
         * @param {number} cursor1 - current starting cursor of the node
         * @param {number} cursor2 - current ending cursor of the node
         * @param {number} rowIndex - hint for row index requested by the focus
         */
        constructor: function(app, node, cursor1, cursor2, rowIndex) {
          $super.constructor.call(this, app, node);
          this._cursor = cursor1 || 0;
          this._cursor2 = cursor2 || 0;
          this._rowIndex = rowIndex;

          this._needsVmSync = true;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          const controller = this._node.getController();
          let events = [];
          if (controller) {
            if (this._node.isInTable()) {
              events = this._requestTableCellFocus();
            } else if (this._node.isInMatrix() || this._node.isInScrollGrid()) {
              // if in scrollgrid we should have matrix as direct childs except for static image which are direct child of scrollgrid
              events = this._requestMatrixCellFocus();
            } else if (this._node.getTag() === "Table") {
              events = this._requestTableFocus();
            } else if (this._node.getTag() === "ScrollGrid") {
              events = this._requestScrollGridFocus();
            } else {
              events = this._requestFieldFocus();
            }
          }

          this._vmEvents = events;
          return this._vmEvents.length > 0;
        },

        /**
         * @inheritDoc
         */
        validate: function() {
          const controller = this._node.getController();
          if (!controller) { // controller may be null if it has been destroyed during process
            return false;
          }
          if (this._node.isInTable()) {
            return this._validateTableCellFocus();
          } else if (this._node.isInMatrix() || this._node.isInScrollGrid()) {
            return this._validateMatrixCellFocus();
          } else if (this._node.getTag() === "ScrollGrid") {
            return this._validateScrollGridFocus();
          } else {
            return this._validateFocus();
          }
        },

        /**
         * Request focus on a form field
         * @returns {classes.VMEventBase[]} the event to send to the VM.
         * @private
         */
        _requestFieldFocus: function() {
          if (this._node.attribute('active') === 0) {
            // Do not request any focus if not active to not cancel selection of text during this operation (needed to CTRL-C)
            // https://agile.strasbourg.4js.com/jira/browse/GBC-669
            return [];
          }
          const ui = this._app.uiNode();

          if (ui.attribute('focus') !== this._node.getId()) {
            // special for webcomp
            const originWidgetNode = this._app.getFocusedVMNode();
            const originWidgetController = originWidgetNode.getController();
            const originWidget = originWidgetController.getWidget();
            if (originWidget && originWidget.flushWebcomponentData) {
              originWidget.flushWebcomponentData();
            }

            const event = new cls.VMConfigureEvent(this._node.getId(), {
              cursor: this._cursor,
              cursor2: this._cursor2
            });
            return [event];
          }
          return [];
        },

        /**
         * Requests the focus on a Table
         * @returns {classes.VMEventBase[]} the event to send to the VM.
         * @private
         */
        _requestTableFocus: function() {
          const tableNode = this._node;

          // if table is not active or if it has already the focus
          if (tableNode.attribute('active') === 0 || this._app.getFocusedVMNode() === tableNode) {
            return []; // Nothing to do
          }

          // ask focus for first active table column index sorted by tabindex
          let columnIndex = 0;
          const columnNodes = tableNode.getTabIndexSortedChildren('TableColumn');
          for (const col of columnNodes) {
            if (col.attribute('noEntry') === 0 && col.attribute('active') === 1) {
              columnIndex = col.getIndex("TableColumn");
              break;
            }
          }
          const rowIndex = tableNode.attribute("currentRow");

          const event = new cls.VMConfigureEvent(tableNode.getId(), {
            currentColumn: columnIndex,
            currentRow: rowIndex
          });

          return [event];
        },

        /**
         * Requests the focus on a Scrollgrid
         * @returns {classes.VMEventBase[]} the event to send to the VM.
         * @private
         */
        _requestScrollGridFocus: function() {
          const scrollGridNode = this._node;
          let currentRow = this._rowIndex;
          const vmCurrentRow = scrollGridNode.attribute('currentRow');

          if (currentRow === -1) {
            currentRow = scrollGridNode.getController().getCurrentRow();
          }
          const offset = scrollGridNode.getController().getOffset();
          currentRow = currentRow + offset;
          this._currentRowToValidate = currentRow;

          if (scrollGridNode.attribute('active') === 0) {
            // Restore the focus to its previous location
            return [];
          }
          if (currentRow !== vmCurrentRow || !scrollGridNode.hasVMFocus()) {
            let eventData = {
              currentRow: currentRow,
            };

            let events = [];
            events.push(new cls.VMConfigureEvent(scrollGridNode.getId(), eventData));
            return events;
          }
          return [];
        },

        /**
         * Request focus on a matrix field
         * @returns {classes.VMEventBase[]} the event to send to the VM.
         * @private
         */
        _requestMatrixCellFocus: function() {
          const containerNode = this._node.isInMatrix() ? this._node.getAncestor("Matrix") : this._node.getAncestor("ScrollGrid");
          const ui = this._app.uiNode();
          // try to retrieve index of node from rowIndex if specified, or using generic method otherwise
          const valueNodeIndex = this._rowIndex > -1 ? this._rowIndex : this._node.getIndex();
          const offset = containerNode.attribute('offset');
          const vmCurrentRow = containerNode.attribute('currentRow');
          const currentRow = valueNodeIndex + offset;
          const isSameCurrentRow = currentRow === vmCurrentRow;

          const dialogType = containerNode.attribute('dialogType');
          // if no dialogtype, then we miss Matrix parent and may be a direct child of ScrollGrid. We consider we are in display.
          const displayDialog = !dialogType || dialogType === "Display" || dialogType === "DisplayArray";

          this._currentRowToValidate = currentRow;
          const scrollGridNode = this._node.getAncestor("ScrollGrid");
          const isPagedScrollGrid = scrollGridNode && scrollGridNode.getController().isPagedScrollGrid();

          if (containerNode.attribute('active') === 0) {
            // Restore the focus to its previous location
            return [];
          }
          if (ui.attribute('focus') !== containerNode.getId() || !isSameCurrentRow) {
            const eventData = {
              currentRow: currentRow,
            };
            if (!displayDialog) {
              eventData.cursor = this._cursor;
              eventData.cursor2 = this._cursor2;
            }

            const events = [];
            events.push(new cls.VMConfigureEvent(containerNode.getId(), eventData));
            if (isPagedScrollGrid) {
              events.push(new cls.VMConfigureEvent(containerNode.getId(), {
                offset: offset
              }));
            }
            return events;
          }
          return [];
        },

        /**
         * Request focus on a table cell
         * @returns {classes.VMEventBase[]} the event to send to the VM.
         * @private
         */
        _requestTableCellFocus: function() {
          const containerNode = this._node.getParentNode().getParentNode();
          const tableNode = containerNode.getParentNode();
          const ui = this._app.uiNode();

          const eventParams = {};
          const valueNodeIndex = this._node.getIndex();
          const offset = tableNode.attribute('offset');
          eventParams.currentRow = valueNodeIndex + offset;

          this._currentRowToValidate = eventParams.currentRow;

          let needFocus = ui.attribute('focus') !== tableNode.getId() ||
            eventParams.currentRow !== tableNode.attribute('currentRow');

          const dialogType = containerNode.attribute('dialogType');
          const displayDialog = dialogType === "Display" || dialogType === "DisplayArray";
          const isActiveColumn = (containerNode.attribute('active') === 1);

          const focusOnField = tableNode.attribute('focusOnField') === 1;
          if (!displayDialog || focusOnField) { // Input, InputArray, Construct or FocusOnField attribute set
            eventParams.currentColumn = containerNode.getIndex('TableColumn');
            needFocus = needFocus || !tableNode.isAttributeSetByVM('currentColumn') || eventParams.currentColumn !== tableNode
              .attribute(
                'currentColumn');
            if (isActiveColumn) { // we check column on validation only if column is active
              this._currentColumnToValidate = eventParams.currentColumn;
            }
          }

          if (needFocus) {
            const event = new cls.VMConfigureEvent(tableNode.getId(), eventParams);
            let events = [event];
            if (!displayDialog) {
              const event2 = new cls.VMConfigureEvent(containerNode.getId(), {
                cursor: this._cursor,
                cursor2: this._cursor2
              });
              events = events.concat(event2);
            }
            return events;
          }
          return [];
        },

        /**
         * Checks that the appropriate scrollgrid line has the focus
         * @returns {boolean} true if the focus is set properly, false otherwise
         * @private
         */
        _validateScrollGridFocus: function() {
          const currentRow = this._node.attribute('currentRow');
          return this._currentRowToValidate === currentRow;
        },

        /**
         * Checks that the appropriate matrix cell has the focus
         * @returns {boolean} true if the focus is set properly, false otherwise
         * @private
         */
        _validateMatrixCellFocus: function() {
          const containerNode = this._node.isInMatrix() ? this._node.getAncestor("Matrix") : this._node.getAncestor("ScrollGrid");
          const ui = this._app.uiNode();
          const dialogType = containerNode.attribute('dialogType');
          // if no dialogtype, then we miss Matrix parent and may be a direct child of ScrollGrid. We consider we are in display.
          const displayDialog = !dialogType || dialogType === "Display" || dialogType === "DisplayArray";

          // validate focused column only in input/input array mode
          if (!displayDialog && ui.attribute("focus") !== containerNode.getId()) {
            return false;
          }

          const currentRow = containerNode.attribute('currentRow');
          return (this._currentRowToValidate === currentRow);
        },

        /**
         * Checks that the appropriate table cell has the focus
         * @returns {boolean} true if the focus is set properly, false otherwise
         * @private
         */
        _validateTableCellFocus: function() {
          const containerNode = this._node.getParentNode().getParentNode();
          const tableNode = containerNode.getParentNode();

          const ui = this._app.uiNode();
          if (ui.attribute("focus") !== tableNode.getId()) {
            return false;
          }

          const currentRow = tableNode.attribute('currentRow');

          let valid = (this._currentRowToValidate === currentRow);

          if (this._currentColumnToValidate >= 0) {
            const currentColumn = tableNode.attribute('currentColumn');
            valid = valid && (this._currentColumnToValidate === currentColumn);
          }

          return valid;
        },

        /**
         * Checks that the appropriate widget has the focus
         * @returns {boolean} true if the focus is set properly, false otherwise
         * @private
         */
        _validateFocus: function() {
          const ui = this._app.uiNode();
          return ui.attribute("focus") === this._node.getId();
        },

      };
    });
  }
);
