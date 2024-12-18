/// FOURJS_START_COPYRIGHT(D,2022)
/// Property of Four Js*
/// (c) Copyright Four Js 2022, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('CurrentRowVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class CurrentRowVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.CurrentRowVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.CurrentRowVMBehavior.prototype */ {
        __name: "CurrentRowVMBehavior",

        watchedAttributes: {
          anchor: ['currentRow']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          if (!controller.getCurrentRow || !controller.getOffset) {
            return;
          }
          const widget = controller.getWidget();
          if (!widget?.setCurrentRow) {
            return;
          }

          let newCurrentRow = controller.getCurrentRow() - controller.getOffset();
          widget.setCurrentRow(newCurrentRow);
        }
      };
    });
  });
