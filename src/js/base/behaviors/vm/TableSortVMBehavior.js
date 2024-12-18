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

modulum('TableSortVMBehavior', ['BehaviorBase'],
  /**
   * Manage "sortType" & "sortColumn" attribute
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * @class TableSortVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableSortVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TableSortVMBehavior.prototype */ {
        __name: "TableSortVMBehavior",

        watchedAttributes: {
          anchor: ['sortType', 'sortColumn']
        },

        /**
         * @param {classes.ControllerBase} controller
         * @param {Object} data
         */
        setup: function(controller, data) {
          data.firstApply = true;
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setSort) {
            const tableNode = controller.getAnchorNode();

            let sortType = null;
            let sortColumn = null;

            const storedSortType = data.firstApply ? controller.getStoredSetting("sortType") : null;
            const storedSortColumn = data.firstApply ? controller.getStoredSetting("sortColumn") : null;

            if (storedSortType !== null && storedSortColumn !== null) {
              sortType = storedSortType;
              sortColumn = storedSortColumn;

              // Send stored sort values to VM
              const event = new cls.VMConfigureEvent(tableNode.getId(), {
                sortColumn: sortColumn,
                sortType: sortType
              });
              tableNode.getApplication().dvm.onOrdersManaged(function() {
                tableNode.getApplication().scheduler.eventVMCommand(event, tableNode);
              }.bind(this), true);
            } else {
              sortType = tableNode.attribute('sortType');
              sortColumn = tableNode.attribute('sortColumn');
            }

            widget.setSort(sortType, sortColumn);
          }
          data.firstApply = false;
        }
      };
    });
  });
