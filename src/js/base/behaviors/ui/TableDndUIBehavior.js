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

modulum('TableDndUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class TableDndUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.TableDndUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.TableDndUIBehavior.prototype */ {
        /** @type {string} */
        __name: "TableDndUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const tableWidget = controller.getWidget();
          if (tableWidget) {
            data.dndEnterHandle = tableWidget.when(gbc.constants.widgetEvents.tableDragEnter, this._onTableDragEnter.bind(this,
              controller,
              data));
            data.dndOverHandle = tableWidget.when(gbc.constants.widgetEvents.tableDragOver, this._onTableDragOver.bind(this, controller,
              data));
            data.dndLeaveHandle = tableWidget.when(gbc.constants.widgetEvents.tableDragLeave, this._onTableDragLeave.bind(this,
              controller,
              data));
            data.dndDropHandle = tableWidget.when(gbc.constants.widgetEvents.tableDrop, this._onTableDrop.bind(this, controller, data));
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.dndEnterHandle) {
            data.dndEnterHandle();
            data.dndEnterHandle = null;
          }
          if (data.dndOverHandle) {
            data.dndOverHandle();
            data.dndOverHandle = null;
          }
          if (data.dndLeaveHandle) {
            data.dndLeaveHandle();
            data.dndLeaveHandle = null;
          }
          if (data.dndDropHandle) {
            data.dndDropHandle();
            data.dndDropHandle = null;
          }
        },

        /**
         * @private
         */
        _onTableDragEnter: function(controller, data, event, sender) {
          const tableNode = controller.getAnchorNode();
          context.DndService.onEnterContainerNode(tableNode);
        },

        /**
         * @private
         */
        _onTableDragOver: function(controller, data, event, sender) {},

        /**
         * Notify the VM that we leaved the table
         * @private
         */
        _onTableDragLeave: function(controller, data, event, sender) {
          const tableNode = controller.getAnchorNode();
          context.DndService.onLeaveContainerNode(tableNode);
        },

        /**
         * Simulate a drop on the first column using the visible row index given in parameter
         * @private
         */
        _onTableDrop: function(controller, data, event, sender) {},
      };
    });
  });
