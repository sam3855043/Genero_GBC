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

modulum('LeafDynamicHeightLayoutEngine', ['LeafLayoutEngine'],
  function(context, cls) {

    /**
     * @class LeafDynamicHeightLayoutEngine
     * @memberOf classes
     * @extends classes.LeafLayoutEngine
     */
    cls.LeafDynamicHeightLayoutEngine = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.LeafDynamicHeightLayoutEngine.prototype */ {
        __name: "LeafDynamicHeightLayoutEngine",

        /**
         * prepare widget for dynamic measure
         */
        prepareDynamicMeasure: function() {
          if (this._widget.isInTable() && this._dataContentPlaceholder) {
            //Need to simulate dynamic sizepolicy to be compliant with the 1.00.57 layout
            this._dataContentPlaceholder.toggleClass("gbc_staticMeasure", false);
            this._dataContentPlaceholder.toggleClass("gbc_dynamicMeasure", true);
          } else {
            $super.prepareDynamicMeasure.call(this);
          }
        },

        /**
         * sets measure as fixed measure
         * @private
         */
        _setFixedMeasure: function() {
          const layoutInfo = this._widget.getLayoutInformation();
          const rawMeasure = layoutInfo.getRawMeasure();
          //the height never depends on the size policy
          layoutInfo.setMeasured(
            layoutInfo.getPreferred().getWidth() + layoutInfo.getDecorating().getWidth(true),
            this._naturalHeight || rawMeasure.getHeight(true)
          );
        }
      };
    });
  });
