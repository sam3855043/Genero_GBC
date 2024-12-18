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

modulum('UnhidableVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class UnhidableVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.UnhidableVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.UnhidableVMBehavior.prototype */ {
        __name: "UnhidableVMBehavior",

        watchedAttributes: {
          anchor: ['unhidable'],
          parent: ['unhidableColumns']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const anchorNode = controller.getAnchorNode();
          const parentNode = anchorNode.getParentNode();

          // All table set unhidableColumn: apply on tableWidget
          const unhidableColumns = parentNode.attribute('unhidableColumns') === 1;
          if (unhidableColumns) {
            const tableWidget = parentNode.getWidget();
            if (tableWidget && tableWidget.setUnhidable) {
              tableWidget.setUnhidable(unhidableColumns);
            }
          }

          // If we reach this point, the column is unhidable
          const columnWidget = controller.getWidget();
          if (columnWidget && columnWidget.setUnhidable) {
            columnWidget.setUnhidable(anchorNode.attribute('unhidable') !== 0 || parentNode.attribute('unhidableColumns') !== 0);
          }
        }
      };
    });
  });
