/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('CanvasArcWidget', ['CanvasAbstractWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * CanvasArc widget.
     * @class CanvasArcWidget
     * @memberOf classes
     * @extends classes.CanvasAbstractWidget
     */
    cls.CanvasArcWidget = context.oo.Class(cls.CanvasAbstractWidget, function($super) {
      return /** @lends classes.CanvasArcWidget.prototype */ {
        __name: "CanvasArcWidget",

        _initElement: function() {
          this._element = document.createElementNS("http://www.w3.org/2000/svg", "path");
          $super._initElement.call(this);
        },

        setParameters: function(startX, startY, diameter, startDegrees, extentDegrees) {
          const startAngle = (extentDegrees >= 0 ? startDegrees : startDegrees + extentDegrees) * Math.PI / 180;
          const endAngle = (extentDegrees >= 0 ? startDegrees + extentDegrees : startDegrees) * Math.PI / 180;

          const d2 = diameter / 2;
          const r = Math.abs(d2);
          const cx = startX + d2;
          const cy = startY - d2;

          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);

          const largeArcFlag = Math.abs(extentDegrees) < 180 ? 0 : 1;

          const d = "M " + cx + " " + cy + " " +
            "L " + x1 + " " + y1 + " " +
            "A " + r + " " + r + " 0 " + largeArcFlag + " 1 " + x2 + " " + y2 + " " +
            "Z";

          this._element.setAttribute('d', d);
        }
      };
    });
    cls.WidgetFactory.registerBuilder('CanvasArc', cls.CanvasArcWidget);
  }
);
