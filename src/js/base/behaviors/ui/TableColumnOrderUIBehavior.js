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

modulum('TableColumnOrderUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class TableColumnOrderUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.TableColumnOrderUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.TableColumnOrderUIBehavior.prototype */ {
        /** @type {string} */
        __name: "TableColumnOrderUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) {
            data.orderHandle = widget.when(gbc.constants.widgetEvents.tableOrderColumn, this._orderColumn.bind(this, controller,
              data));
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.orderHandle) {
            data.orderHandle();
            data.orderHandle = null;
          }
        },

        /**
         * Order table column (send event to VM)
         * @private
         */
        _orderColumn: function(controller, data, opt) {

          let columnNode = controller.getAnchorNode();
          let tableNode = columnNode.getParentNode();
          let order = opt.data[0];

          controller.setStoredSetting("order", order);

          let oldTabIndex = columnNode.attribute("tabIndex");
          if (oldTabIndex === 0) {
            return; // don't change tabIndex if === 0
          }

          let tableColumns = tableNode.getChildren("TableColumn");
          const tableColumnsWithoutTabIndex = tableColumns.filter(col => col.getInitialTabIndex() === 0);

          // Search the number of col without tabIndex which are placed before the column
          let ignoreColWithoutTabIndexCount = 0;
          for (const col of tableColumnsWithoutTabIndex) {
            if (col !== columnNode) {
              let colWidget = col.getController().getWidget();
              let colOrder = colWidget.getOrder();
              if (colOrder < order) {
                ignoreColWithoutTabIndexCount++;
              }
            }
          }
          const tableColumnsWithTabIndex = tableColumns.filter(col => col.getInitialTabIndex() > 0);

          let idx = order - ignoreColWithoutTabIndexCount;
          if (idx >= tableColumnsWithTabIndex.length) {
            return; // wrong order ignore and return
          }
          let newTabIndex = tableColumnsWithTabIndex[idx].getInitialTabIndex();

          if (oldTabIndex !== newTabIndex) {
            let event = new cls.VMConfigureEvent(columnNode.getId(), {
              tabIndex: newTabIndex
            });
            columnNode.getApplication().scheduler.eventVMCommand(event, columnNode);
          }
        }
      };
    });
  });
