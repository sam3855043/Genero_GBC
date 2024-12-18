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

modulum('CanvasArcParametersVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's Menu
     * @class CanvasArcParametersVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.CanvasArcParametersVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.CanvasArcParametersVMBehavior.prototype */ {
        __name: "CanvasArcParametersVMBehavior",

        watchedAttributes: {
          anchor: ['startX', 'startY', 'diameter', 'startDegrees', 'extentDegrees']
        },
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller.getAnchorNode();
          const startX = node.attribute('startX');
          const startY = node.attribute('startY');
          const diameter = node.attribute('diameter');
          const startDegrees = node.attribute('startDegrees');
          const extentDegrees = node.attribute('extentDegrees');

          const startAngle = (extentDegrees >= 0 ? startDegrees : startDegrees + extentDegrees) * Math.PI / 180;
          const endAngle = (extentDegrees >= 0 ? startDegrees + extentDegrees : startDegrees) * Math.PI / 180;

          const d2 = diameter / 2;
          const r = Math.abs(d2);
          const cx = startX + d2;
          const xy = startY - d2;

          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cx + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cx + r * Math.sin(endAngle);

          const largeArcFlag = Math.abs(extentDegrees) < 180 ? 0 : 1;
          const sweepFlag = largeArcFlag === 0 ? 1 : 0;

          controller.getWidget().setParameters(startX, startY, diameter, startDegrees, extentDegrees);
        }
      };
    });
  });
