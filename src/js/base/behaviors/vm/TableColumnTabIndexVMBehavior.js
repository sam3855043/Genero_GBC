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

modulum('TableColumnTabIndexVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TableColumnTabIndexVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableColumnTabIndexVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TableColumnTabIndexVMBehavior.prototype */ {
        __name: "TableColumnTabIndexVMBehavior",

        watchedAttributes: {
          anchor: ['tabIndex']
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
          let widget = controller.getWidget();
          if (widget?.setOrder) {

            if (data.firstApply) {

              // first time we receive tabIndex we load visual index from stored settings and resent new index to VM
              let storedOrder = controller.getStoredSetting("order");
              storedOrder = storedOrder === false ? 0 : storedOrder; // HACK bug stored settings "false" means "0"
              if (storedOrder !== null && storedOrder >= 0) {
                widget.setOrder(storedOrder);

                // use request animation frame to be sure all setOrder of all columns are done
                // before send tableOrderColumn signal
                window.requestAnimationFrame(function() {
                  widget.emit(context.constants.widgetEvents.tableOrderColumn,
                    storedOrder); // Emit an event to send the col tabIndex to VM
                }.bind(this));
              }
            }
          }
          data.firstApply = false;
        }
      };
    });
  });
