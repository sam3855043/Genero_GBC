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

modulum('TableResetToDefaultUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class TableResetToDefaultUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.TableResetToDefaultUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.TableResetToDefaultUIBehavior.prototype */ {
        /** @type {string} */
        __name: "TableResetToDefaultUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) {
            data.clickHandle = widget.when(gbc.constants.widgetEvents.tableResetToDefault, this._resetToDefault.bind(this,
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
         * Reset table settings
         * @private
         */
        _resetToDefault: function(controller, data, opt) {
          controller.resetStoredSetting();

          let tableNode = controller.getAnchorNode();
          let tableNodeColumns = tableNode.getChildren("TableColumn");

          let i = 0;
          for (const columnNode of tableNodeColumns) {
            let controller = columnNode.getController();
            let widget = controller.getWidget();

            // will reset order: ordering by AUI tree position
            widget.setOrder(i);

            //will reset size on each column
            widget.resetWidth();

            //will reset visible/hidden columns
            widget.emit(gbc.constants.widgetEvents.tableShowHideCol, controller.isInitiallyHidden() ? "hide" : "show");

            i++;
          }

          i = 0;
          for (const columnNode of tableNodeColumns) {
            let widget = columnNode.getController().getWidget();

            // emit tableOrderColumn to send tabIndex to VM
            // must be done after all widgets have the right order
            widget.emit(context.constants.widgetEvents.tableOrderColumn, i);
            i++;
          }

          let tableWidget = tableNode.getController().getWidget();

          //will reset sort
          tableWidget.emit(context.constants.widgetEvents.tableHeaderSort, -1);
        }
      };
    });
  });
