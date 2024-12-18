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

modulum('CanvasLayoutEngine', ['LeafLayoutEngine'],
  function(context, cls) {
    /**
     * @class CanvasLayoutEngine
     * @memberOf classes
     * @extends classes.LeafLayoutEngine
     */
    cls.CanvasLayoutEngine = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.CanvasLayoutEngine.prototype */ {
        __name: "CanvasLayoutEngine",

        /**
         * Calculate and set measured size
         * @protected
         */
        _setMinMax: function() {
          $super._setMinMax.call(this);
          const layoutInfo = this._widget.getLayoutInformation();
          const minSize = layoutInfo.getMinimal();
          // Set measured height as minimal height
          minSize.setHeight(Math.max(layoutInfo.getRawMeasure().getHeight(true), minSize.getHeight(true)));
        }
      };
    });
  });
