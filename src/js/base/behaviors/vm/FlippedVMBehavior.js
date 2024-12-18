/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('FlippedVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class FlippedVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.FlippedVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.FlippedVMBehavior.prototype */ {
        __name: "FlippedVMBehavior",

        watchedAttributes: {
          anchor: ['flipped']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget?.setViewType && !widget.isTreeView()) {
            let flipped = controller.getNodeBindings().anchor.attribute('flipped') === 1;
            widget.setViewType(flipped ? "flipped" : "classic", true);
          }
        }
      };
    });
  });
