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

modulum('TableSizeVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the change of size in a table
     * @class TableSizeVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableSizeVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TableSizeVMBehavior.prototype */ {
        __name: "TableSizeVMBehavior",

        watchedAttributes: {
          table: ['size']
        },
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          if (controller?.changeWidgetKind) {
            const tableColumnNode = controller.getNodeBindings().container;
            const dialogType = tableColumnNode.attribute('dialogType');
            const active = tableColumnNode.attribute('active');
            const hasChanged = controller.changeWidgetKind(dialogType, active);
            const treeItem = controller.getNodeBindings().treeItem;
            if (treeItem) { // what is done here ?
              treeItem.applyBehaviors(null, true, true);
            }
            return hasChanged; // return true to force apply of next behaviors
          }
          return false;
        }
      };
    });
  });
