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

modulum('CanvasLineParametersVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's Menu
     * @class CanvasLineParametersVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.CanvasLineParametersVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.CanvasLineParametersVMBehavior.prototype */ {
        __name: "CanvasLineParametersVMBehavior",

        watchedAttributes: {
          anchor: ['startX', 'startY', 'endX', 'endY']
        },
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller.getAnchorNode();
          const startX = node.attribute('startX');
          const startY = node.attribute('startY');
          const endX = node.attribute('endX');
          const endY = node.attribute('endY');

          controller.getWidget().setParameters(startX, startY, endX, endY);
        }
      };
    });
  });
