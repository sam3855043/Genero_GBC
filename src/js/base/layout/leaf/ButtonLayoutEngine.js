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

modulum('ButtonLayoutEngine', ['LeafLayoutEngine'],
  function(context, cls) {
    /**
     * @class ButtonLayoutEngine
     * @memberOf classes
     * @extends classes.LeafLayoutEngine
     */
    cls.ButtonLayoutEngine = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.ButtonLayoutEngine.prototype */ {
        __name: "ButtonLayoutEngine",

        /**
         * sets measure as fixed measure
         * @private
         */
        _setFixedMeasure: function() {
          const layoutInfo = this._widget.getLayoutInformation();
          const rawMeasure = layoutInfo.getRawMeasure();
          //the height never depend on the size policy
          layoutInfo.setMeasured(
            layoutInfo.getPreferred().getWidth() + layoutInfo.getDecorating().getWidth(true),
            this._naturalHeight || rawMeasure.getHeight(true)
          );
        },

        /**
         * @inheritDoc
         */
        measureDecoration: function() {
          $super.measureDecoration.call(this);

          const layoutInfo = this._widget.getLayoutInformation(),
            currentSizePolicy = layoutInfo.getCurrentSizePolicy();
          if (this._widget.isLayoutMeasureable(true) && currentSizePolicy.isFixed()) {
            if (this._widget._image && !this._widget.getText()) {
              const containerRect = this._widget._image._element.getBoundingClientRect();
              const decorating = this._getLayoutInfo().getDecorating();
              this._getLayoutInfo().setDecorating(
                layoutInfo.getRawMeasure().getWidth(true) - containerRect.width + (
                  decorating.hasWidth() ? decorating.getWidth() : 0),
                layoutInfo.getRawMeasure().getHeight(true) - containerRect.height + (
                  decorating.hasHeight() ? decorating.getHeight() : 0)
              );
            }
          }
        },

        /**
         * @inheritDoc
         */
        measure: function() {
          $super.measure.call(this);

          const layoutInfo = this._widget.getLayoutInformation();
          const preferedWidth = layoutInfo.getPreferred().getWidth() + layoutInfo.getDecorating().getWidth(true);
          const minSize = layoutInfo.getMinimal();
          const maxSize = layoutInfo.getMaximal();
          const measuredSize = layoutInfo.getMeasured();

          if (this._widget._buttonType !== 'link' && !layoutInfo.getCurrentSizePolicy().isFixed()) {
            const sizePolicy = layoutInfo.getSizePolicyConfig().mode;
            if (sizePolicy === "initial") {
              const width = preferedWidth > measuredSize.getWidth(true) ? preferedWidth : measuredSize.getWidth(true);
              if (!this.canOverrideMinWidth()) {
                minSize.setWidth(width);
              }
              measuredSize.setWidth(width);
              maxSize.setWidth(width);
            }
          }
        }
      };
    });
  });
