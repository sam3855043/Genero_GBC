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

modulum('MultiRowSelectionVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class MultiRowSelectionVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.MultiRowSelectionVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.MultiRowSelectionVMBehavior.prototype */ {
        __name: "MultiRowSelectionVMBehavior",

        watchedAttributes: {
          anchor: ['multiRowSelection']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const tableWidget = controller.getWidget();
          if (tableWidget && tableWidget.setMultiRowSelectionEnabled) {
            const anchorNode = controller.getAnchorNode();
            tableWidget.setMultiRowSelectionEnabled(anchorNode.attribute('multiRowSelection') !== 0);
          }
        }
      };
    });
  });
