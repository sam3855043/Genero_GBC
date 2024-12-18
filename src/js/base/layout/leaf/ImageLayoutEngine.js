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

modulum('ImageLayoutEngine', ['LeafLayoutEngine'],
  function(context, cls) {
    /**
     * @class ImageLayoutEngine
     * @memberOf classes
     * @extends classes.LeafLayoutEngine
     */
    cls.ImageLayoutEngine = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.ImageLayoutEngine.prototype */ {
        __name: "ImageLayoutEngine",

        /**
         * set natural size
         * @param {number} width the width
         * @param {number} height the height
         */
        setNaturalSize: function(width, height) {
          $super.setNaturalSize.call(this, width, height);
          const layoutInfo = this._widget.getLayoutInformation(),
            rawMeasure = layoutInfo.getRawMeasure(),
            measure = layoutInfo.getMeasured();
          if (!rawMeasure.hasWidth()) {
            rawMeasure.setWidth(width);
          }
          if (!rawMeasure.hasHeight()) {
            rawMeasure.setHeight(height);
          }
          if (!measure.hasWidth()) {
            measure.setWidth(width);
          }
          if (!measure.hasHeight()) {
            measure.setHeight(height);
          }
          const parentWidget = this._widget && this._widget.getParentWidget(),
            parentLayoutEngine = parentWidget && parentWidget.getLayoutEngine();
          if (parentLayoutEngine) {
            parentLayoutEngine.invalidateAllocatedSpace();
          }
        },

        /**
         * @inheritDoc
         */
        invalidateMeasure: function(invalidation) {
          const layoutInfo = this._getLayoutInfo(),
            currentSizePolicy = layoutInfo.getCurrentSizePolicy();
          if (!this._statuses.layouted || (!this._widget.isFontImage() && !currentSizePolicy.isFixed())) {
            this._invalidateMeasure(invalidation);
            this._getLayoutInfo().invalidateMeasure();
          }
          layoutInfo.hasBeenFixed = false;
        },

        /**
         * @inheritDoc
         */
        measureDecoration: function() {
          const layoutInfo = this._widget.getLayoutInformation(),
            currentSizePolicy = layoutInfo.getCurrentSizePolicy();

          if (this._widget.isFontImage() || currentSizePolicy.isFixed()) {
            this._measureDecoration();
          }
        },

        /**
         * @inheritDoc
         */
        _measure: function() {
          const layoutInfo = this._widget.getLayoutInformation();
          if (this._widget.isFontImage()) {
            if (!layoutInfo.hasBeenFixed) {
              this._setFixedMeasure();
              layoutInfo.hasBeenFixed = true;
            }
          } else {
            $super._measure.call(this);
          }
        }
      };
    });
  });
