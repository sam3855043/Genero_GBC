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

modulum('SplitVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class SplitVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.SplitVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.SplitVMBehavior.prototype */ {
        __name: "SplitVMBehavior",

        watchedAttributes: {
          anchor: ['split']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.getOrientation && widget
            .setSplit) { // only horizontal boxes can be split at the moment
            const anchorNode = controller.getNodeBindings().anchor;
            widget.setSplit(anchorNode.isAttributeSetByVM("split") && anchorNode.attribute("split") === 1);
          }
        }
      };
    });
  });
