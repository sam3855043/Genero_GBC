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

modulum('TableSortUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class TableSortUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.TableSortUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.TableSortUIBehavior.prototype */ {
        /** @type {string} */
        __name: "TableSortUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          let widget = controller.getWidget();
          if (widget) {
            data.clickHandle = widget.when(gbc.constants.widgetEvents.tableHeaderSort, this._sortColumn.bind(this, controller,
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
         * Sort table column (send event to VM)
         * @private
         */
        _sortColumn: function(controller, data, opt) {
          let tableNode = controller.getAnchorNode();
          let columnIndex = opt.data[0]; // -1 means reset sort

          let sortType = "";
          if (columnIndex > -1) {
            if (columnIndex === tableNode.attribute('sortColumn')) {
              sortType = tableNode.attribute('sortType') === "asc" ? "desc" : "asc";
            } else { // if sorting a new column, always start with ascending
              sortType = "asc";
            }
          }

          let event = new cls.VMConfigureEvent(tableNode.getId(), {
            sortColumn: columnIndex,
            sortType: sortType
          });
          tableNode.getApplication().scheduler.eventVMCommand(event, tableNode);

          if (columnIndex === -1) {
            tableNode.getController().removeStoredSetting("sortColumn");
          } else {
            tableNode.getController().setStoredSetting("sortColumn", columnIndex);
          }

          if (sortType === "") {
            tableNode.getController().removeStoredSetting("sortType");
          } else {
            tableNode.getController().setStoredSetting("sortType", sortType);
          }
        }
      };
    });
  });
