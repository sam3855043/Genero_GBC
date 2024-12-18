/// FOURJS_START_COPYRIGHT(D,2016)
/// Property of Four Js*
/// (c) Copyright Four Js 2016, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TableClickOnContainerUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class TableClickOnContainerUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.TableClickOnContainerUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.TableClickOnContainerUIBehavior.prototype */ {
        /** @type {string} */
        __name: "TableClickOnContainerUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          let widget = controller.getWidget();
          if (widget) {
            data.clickHandle = widget.when(gbc.constants.widgetEvents.tableClickOnContainer, this._onClick.bind(this,
              controller,
              data));
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.clickHandle) {
            data.clickHandle();
            data.clickHandle = null;
          }
        },

        /**
         *
         * @param {classes.ControllerBase} controller
         * @param {Object} data
         * @param eventData
         * @private
         */
        _onClick: function(controller, data, eventData) {
          let tableNode = controller.getAnchorNode();
          let app = tableNode.getApplication();
          let originWidgetNode = app.getFocusedVMNodeAndValue(true);

          if (originWidgetNode && originWidgetNode !== tableNode) {
            let originWidgetController = originWidgetNode.getController();

            // check if controller exists. In come case we could have a MenuAction node which doesn't have a controller
            if (originWidgetController) {
              originWidgetController.sendWidgetValue();
            }
          }

          if (tableNode.attribute('dialogType') === "DisplayArray") {
            app.scheduler.focusVMCommand(tableNode); // only set the focus on the table
            return; // Nothing to do
          }

          let tableWidget = controller.getWidget();
          let columns = tableWidget.getOrderedColumns();
          let columnIndex = eventData.data[0];
          let firstLoop = true;
          let allColumnTested = false;
          while (!allColumnTested) {
            let columnWidget = columns[columnIndex];
            let columnNode = tableNode.getChildren()[columnWidget.getColumnIndex()];
            if (columnNode.attribute('noEntry') === 1 || columnNode.attribute('active') === 0) {
              // Select Next Column
              columnIndex = firstLoop ? 0 : columnIndex + 1;
              allColumnTested = columnIndex === columns.length;
              firstLoop = false;
            } else {
              // send current value node value of the table if not already done before requesting focus change
              controller.sendWidgetValue();

              let rowIndex = tableNode.attribute("size");

              let event = new cls.VMConfigureEvent(tableNode.getId(), {
                currentColumn: columnIndex,
                currentRow: rowIndex
              });

              app.scheduler.eventVMCommand(event, columnNode);
              return;
            }
          }
        }
      };
    });
  });
