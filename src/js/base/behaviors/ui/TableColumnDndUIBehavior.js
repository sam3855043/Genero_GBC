/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TableColumnDnDUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class TableColumnDndUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.TableColumnDndUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.TableColumnDndUIBehavior.prototype */ {
        /** @type {string} */
        __name: "TableColumnDnDUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const columnWidget = controller.getWidget();
          if (columnWidget) {
            data.dndStartHandle = columnWidget.when(gbc.constants.widgetEvents.tableDragStart, this._onTableItemDragStart.bind(this,
              controller,
              data));
            data.dndEndHandle = columnWidget.when(gbc.constants.widgetEvents.tableDragEnd, this._onTableItemDragEnd.bind(this, controller,
              data));
            data.dndEnterHandle = columnWidget.when(gbc.constants.widgetEvents.tableDragEnter, this._onDragEnterTableItem.bind(this,
              controller,
              data));
            data.dndOverHandle = columnWidget.when(gbc.constants.widgetEvents.tableDragOver, this._onDragOverTableItem.bind(this, controller,
              data));
            data.dndLeaveHandle = columnWidget.when(gbc.constants.widgetEvents.tableDragLeave, this._onDragLeaveTableItem.bind(this,
              controller,
              data));
            data.dndDropHandle = columnWidget.when(gbc.constants.widgetEvents.tableDrop, this._onDropOnTableItem.bind(this, controller,
              data));
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.dndStartHandle) {
            data.dndStartHandle();
            data.dndStartHandle = null;
          }
          if (data.dndEndHandle) {
            data.dndEndHandle();
            data.dndEndHandle = null;
          }
          if (data.dndDropHandle) {
            data.dndDropHandle();
            data.dndDropHandle = null;
          }
          if (data.dndOverHandle) {
            data.dndOverHandle();
            data.dndOverHandle = null;
          }
          if (data.dndLeaveHandle) {
            data.dndLeaveHandle();
            data.dndLeaveHandle = null;
          }
          if (data.dndEnterHandle) {
            data.dndEnterHandle();
            data.dndEnterHandle = null;
          }
        },

        /**
         * Get value node corresponding to index in the column
         * @param columnNode
         * @param index
         * @returns {*|classes.NodeBase}
         * @private
         */
        _getValueNode: function(columnNode, index) {
          const valueListNode = columnNode.getFirstChild("ValueList");
          return valueListNode && valueListNode.getChildren()[index];
        },

        /**
         * Handle tableDragStart event
         * @private
         */
        _onTableItemDragStart: function(columnController, data, event, sender, index, evt) {
          const columnNode = columnController.getAnchorNode();
          context.DndService.onTableItemDragStart(columnNode.getParentNode(), this._getValueNode(columnNode, index), evt);
        },

        /**
         * Handle tableDragEnd event
         * @private
         */
        _onTableItemDragEnd: function(columnController, data, event, sender, evt) {
          context.DndService.onTableItemDragEnd(evt);
        },

        /**
         * Handle tableDragEnter event
         * @private
         */
        _onDragEnterTableItem: function(controller, data, event, sender, index, evt) {
          // everything is handled in the dragOver
          const columnNode = controller.getAnchorNode();
          context.DndService.onDragEnterTableItem(columnNode.getParentNode(), this._getValueNode(columnNode, index), evt);
        },

        /**
         * Handle tableDragOver event
         * @private
         */
        _onDragOverTableItem: function(controller, data, event, sender, index, evt) {
          const columnNode = controller.getAnchorNode();
          context.DndService.onDragOverTableItem(columnNode.getParentNode(), this._getValueNode(columnNode, index), evt);
        },

        /**
         * Handle tableDragLeave event
         * @private
         */
        _onDragLeaveTableItem: function(controller, data, event, sender, index, evt) {
          //Everything is handled in the drag over
        },

        /**
         * Handle tableDrop event
         * @private
         */
        _onDropOnTableItem: function(controller, data, event, sender, index, evt) {
          const columnNode = controller.getAnchorNode();
          context.DndService.onDropTableItem(this._getValueNode(columnNode, index), evt);
        },
      };
    });
  });
