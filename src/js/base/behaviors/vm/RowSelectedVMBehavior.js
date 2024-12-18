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

modulum('RowSelectedVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class RowSelectedVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.RowSelectedVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.RowSelectedVMBehavior.prototype */ {
        __name: "RowSelectedVMBehavior",

        watchedAttributes: {
          anchor: ['selected'],
          table: ['multiRowSelection']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const bindings = controller.getNodeBindings();
          const anchorNode = bindings.anchor;

          const tableWidget = bindings.table.getController().getWidget();
          if (tableWidget && tableWidget.setRowSelected) {

            const multiRowSelection = bindings.table.attribute('multiRowSelection');
            const selected = multiRowSelection && bindings.anchor.attribute('selected');

            // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
            const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
            if (isAnticipateScrollingEnabled) {
              const tableCachedDataModel = tableWidget.getCachedDataModel();

              const tableOffset = bindings.table.attribute('offset');
              const rowIndex = bindings.anchor.getIndex() + tableOffset;
              tableCachedDataModel.updateRowData(rowIndex, tableOffset, "selected", selected === 1);

              const tableNode = anchorNode.getAncestor("Table");
              if (anchorNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode)) {
                // if there are some scroll commands to process, widget update will be done in the NativeScrollVMBehavior
                return;
              }
            }

            tableWidget.setRowSelected(bindings.anchor.getIndex(), selected === 1);
          }
        }
      };
    });
  });
