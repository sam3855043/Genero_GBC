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

modulum('EditLayoutEngine', ['LeafLayoutEngine'],
  function(context, cls) {

    /**
     * @class EditLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.EditLayoutEngine = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.EditLayoutEngine.prototype */ {
        __name: "EditLayoutEngine",

        /**
         * @inheritDoc
         */
        invalidateMeasure: function(invalidation) {
          // always invalidate for EDIT
          const layoutInfo = this._getLayoutInfo();
          this._invalidateMeasure(invalidation);
          this._getLayoutInfo().invalidateMeasure();
          layoutInfo.hasBeenFixed = false;
        },

        /**
         * @inheritDoc
         */
        measureDecoration: function() {},

        /**
         * @inheritDoc
         */
        _measure: function() {
          const layoutInfo = this._widget.getLayoutInformation();
          const currentSizePolicy = layoutInfo.getCurrentSizePolicy();
          const rawMeasure = layoutInfo.getRawMeasure();

          if (currentSizePolicy.isDynamic() || (layoutInfo._widget.isVisible() && layoutInfo.needMeasure())) {
            if (!currentSizePolicy.isFixed() || !layoutInfo.hasBeenFixed) {
              layoutInfo.setMeasured(rawMeasure.getWidth(true), rawMeasure.getHeight(true));
              layoutInfo.hasBeenFixed = currentSizePolicy.isFixed();
            }
          }
        }

      };
    });
  });
