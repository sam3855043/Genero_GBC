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

modulum('TextEditLayoutEngine', ['LeafLayoutEngine'],
  function(context, cls) {

    /**
     * @class TextEditLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.TextEditLayoutEngine = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.TextEditLayoutEngine.prototype */ {
        __name: "TextEditLayoutEngine",

        /**
         * @inheritDoc
         */
        _measure: function() {
          const layoutInfo = this._widget.getLayoutInformation();
          const currentSizePolicy = layoutInfo.getCurrentSizePolicy();
          const rawMeasure = layoutInfo.getRawMeasure();

          if (currentSizePolicy.isFixed()) {
            if (!layoutInfo.hasBeenFixed) {
              this._setFixedMeasure();
              layoutInfo.hasBeenFixed = true;
            }
          } else if (layoutInfo._widget.isVisible() && layoutInfo.needMeasure()) {
            const width = Math.max(layoutInfo.getPreferred().getWidth(true), rawMeasure.getWidth(true));
            const height = Math.max(layoutInfo.getPreferred().getHeight(true), rawMeasure.getHeight(true));
            layoutInfo.setMeasured(width, height);
          }
        }

      };
    });
  });
