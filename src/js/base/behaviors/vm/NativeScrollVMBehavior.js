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

modulum('NativeScrollVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class NativeScrollVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.NativeScrollVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.NativeScrollVMBehavior.prototype */ {
        __name: "NativeScrollVMBehavior",

        watchedAttributes: {
          anchor: ['offset', 'size', 'pageSize', 'active']
        },
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller.getAnchorNode();
          const widget = controller.getWidget();

          if (!widget?.setVerticalScroll) {
            return;
          }

          controller.requestOffsetPending = false;
          const active = node.attribute('active');
          const pageSize = node.attribute('pageSize');
          // If the container isn't active, consider it as empty.
          // The DVM doesn't set size and offset to 0 when exiting the current dialog (DISPLAY ARRAY or INPUT ARRAY)
          // This avoids the container to remain scrollable on inactive Tables and ScrollGrids
          const size = active ? node.attribute('size') : 0;
          const offset = active ? node.attribute('offset') : 0;
          const bufferSize = active ? node.attribute('bufferSize') : 0;

          /** @type {classes.RTableWidget} */
          const tableWidget = widget.getTableWidgetBase();

          if (tableWidget && !controller.isListView()) {
            // we are in a table
            if (!node.getApplication().scheduler.hasPendingScrollCommands()) {

              const tableWidgetLayout = /** @type classes.RTableLayoutEngine */ tableWidget.getLayoutEngine();

              tableWidget.setSize(size);
              tableWidget.setPageSize(pageSize);

              if (size !== null && tableWidgetLayout.isLayoutDone()) {
                node.getApplication().dvm.onOrdersManaged(function() {
                  tableWidget.setVerticalScroll(offset);
                  tableWidget.setScrolling(false, false);
                }.bind(this), true);
              }

              const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();

              const tableCachedDataModel = tableWidget.getCachedDataModel();
              if (tableCachedDataModel) {
                // flag all visible rows as VM validated to avoid future blur on them
                tableCachedDataModel.vmFlagRows(offset, bufferSize);
                node.getApplication().dvm.onOrdersManaged(function() {
                  // sync current offset of the data model with value list values (valueNodes)
                  tableCachedDataModel.syncModel(offset, bufferSize);
                  if (isAnticipateScrollingEnabled) {
                    // sync model data with table items
                    widget.applyDataFromModel(false);
                  }
                }.bind(this), true);
              }
            }
          } else if (tableWidget && controller.isListView()) {
            // listview
            tableWidget.setSize(size);
            tableWidget.setPageSize(pageSize);
            tableWidget.setVerticalScroll(offset);
          } else {
            // we are in a scroll grid
            widget.setVerticalScroll(size, pageSize, offset);
          }
        }
      };
    });
  });
