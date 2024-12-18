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

modulum('RowActionUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * Handling row action (double-click on table/scrollgrid)
     * @class RowActionUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.RowActionUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.RowActionUIBehavior.prototype */ {
        /** @type {string} */
        __name: "RowActionUIBehavior",

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          if (controller?.getWidget()) {
            data.rowActionHandle = controller.getWidget().when(gbc.constants.widgetEvents.rowAction, this._onRowAction.bind(
              this, controller, data));
          }
        },

        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.rowActionHandle) {
            data.rowActionHandle();
            data.rowActionHandle = null;
          }
        },

        /**
         * Creates an action event and sends it to the VM
         * @param controller
         * @param data
         * @param opt index of table column (if necessary)
         * @private
         */
        _onRowAction: function(controller, data, opt) {
          let anchorNode = controller.getAnchorNode();
          const actionService = anchorNode.getApplication().action;

          // Table case
          if (anchorNode.getTag().startsWith('Table')) {
            const tableNode = anchorNode.getTag() === 'Table' ? anchorNode : anchorNode.getParentNode();
            const colIndex = opt.data.length > 0 && opt.data[0];
            if (colIndex) {
              // if there is a colIndex must check attributes on TableColumnNode
              let tableColumnNode = tableNode.getChildren()[colIndex];
              anchorNode = tableColumnNode || anchorNode;
            }
            const active = tableNode.attribute('actionActive');
            const tableWidget = tableNode.getController().getWidget();
            const noEntry = anchorNode.attribute('noEntry');
            const doubleClickEnable = tableNode.attribute('doubleClick').length > 0 || tableWidget.isDisplayMode();

            if (tableWidget && active && doubleClickEnable && (tableWidget.isDisplayMode() || noEntry === 1)) {
              actionService.executeAction(tableNode);
            }
          }
          // Scrollgrid case
          else if (anchorNode.getTag() === 'ScrollGrid') {
            if (anchorNode.isAttributeSetByVM("doubleClick")) {
              actionService.executeAction(anchorNode);
            } else {
              const matrix = anchorNode.getFirstChild('Matrix');
              if (matrix && matrix.attribute('dialogType').indexOf('Display') !== -1) {
                const acceptAction = actionService.getActiveDialogActionForName("accept");
                actionService.executeAction(acceptAction);
              }
            }
          }
        }
      };
    });
  });
