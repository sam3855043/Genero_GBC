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

modulum('TableDialogTypeVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TableDialogTypeVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableDialogTypeVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TableDialogTypeVMBehavior.prototype */ {
        __name: "TableDialogTypeVMBehavior",

        watchedAttributes: {
          anchor: ['dialogType']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) {
            const dialogType = controller.getAnchorNode().attribute('dialogType');
            const isInputMode = !(dialogType === "Display" || dialogType === "DisplayArray");
            const tableWidget = widget.getTableWidgetBase();
            const tableCachedDataModel = tableWidget.getCachedDataModel();
            if (tableCachedDataModel) {
              // if we are switching from display to input or vice versa, we re-init data model
              if (tableWidget.isDisplayMode && (tableWidget.isDisplayMode() === isInputMode)) {
                tableCachedDataModel.init(tableWidget.getSize());
              }
            }

            if (widget._resetItemsSelection) {
              widget._resetItemsSelection();
            }

            if (widget.setDialogType) {
              widget.setDialogType(dialogType);
            }
            if (widget.setDndItemEnabled) {
              widget.setDndItemEnabled(dialogType === "DisplayArray");
            }

          }

        }
      };
    });
  });
