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

modulum('HaveRowActionsVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class HaveRowActionsVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.HaveRowActionsVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.HaveRowActionsVMBehavior.prototype */ {
        __name: "HaveRowActionsVMBehavior",

        watchedAttributes: {
          anchor: ['haveRowActions', 'dialogType', 'active']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();

          if (widget.setHaveRowBoundActions) {
            let node = controller.getAnchorNode();
            let dialogType = node.attribute("dialogType");

            widget.setHaveRowBoundActions(
              dialogType !== "Construct" &&
              node.attribute("active") !== 0 &&
              node.attribute("haveRowActions") === 1
            );
          }
        },
      };
    });
  });
