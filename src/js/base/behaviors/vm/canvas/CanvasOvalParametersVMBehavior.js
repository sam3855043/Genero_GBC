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

modulum('CanvasOvalParametersVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's Menu
     * @class CanvasOvalParametersVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.CanvasOvalParametersVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.CanvasOvalParametersVMBehavior.prototype */ {
        __name: "CanvasOvalParametersVMBehavior",

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

          const cx = (startX + endX) / 2;
          const cy = (startY + endY) / 2;
          const rx = Math.abs(endX - startX) / 2;
          const ry = Math.abs(endY - startY) / 2;
          controller.getWidget().setParameters(cx, cy, rx, ry);
        }
      };
    });
  });
