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

modulum('NoSwipeVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class NoSwipeVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.NoSwipeVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.NoSwipeVMBehavior.prototype */ {
        __name: "NoSwipeVMBehavior",

        watchedAttributes: {
          anchor: ['noswipe']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setNoSwipe) {
            const anchorNode = controller.getNodeBindings().anchor;
            widget.setNoSwipe(anchorNode.isAttributeSetByVM("noswipe") && anchorNode.attribute("noswipe") === 1);
          }
        }
      };
    });
  });
