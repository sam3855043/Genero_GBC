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

modulum('GridLayoutEngineX',
  function(context, cls) {
    /**
     * Manage X dimension (columns)
     * @class GridLayoutEngineX
     * @memberOf classes
     */
    cls.GridLayoutEngineX = context.oo.Class(
      /** @lends classes.GridLayoutEngineX.prototype */
      {
        __name: "GridLayoutEngineX",
        /**
         * @type {classes.WidgetBase}
         */
        _widget: null,

        /**
         * @type classes.GridDimensionManager
         */
        dimensionManager: null,

        /**
         *
         * @param {classes.WidgetBase} widget
         */
        constructor: function(widget) {
          this._widget = widget;
          this.dimensionManager = new cls.GridDimensionManager(true, 'X');
        },
        destroy: function() {
          this.dimensionManager.destroy();
          this.dimensionManager = null;
          this._widget = null;
        },

        /**
         *
         * @param {classes.GridDimensionSlot} slot
         * @returns {classes.GridDimensionSlot} the same slot
         */
        registerSlot: function(slot) {
          this.dimensionManager.addSlot(slot);
          return slot;
        },

        /**
         *
         * @param {classes.GridDimensionSlot} slot
         */
        unregisterSlot: function(slot) {
          return this.dimensionManager.removeSlot(slot);
        },

        setStretchable: function(stretchable) {
          this.dimensionManager.setStretchable(stretchable);
        },

        /**
         *
         * @param {number} widthToDistribute
         * @returns {boolean}
         */
        doStretch: function(widthToDistribute) {
          return this.dimensionManager.updateBonusSize(widthToDistribute);
        },

        /**
         *
         * @param {number} widthToRemove
         * @returns {boolean}
         */
        doShrink: function(widthToRemove) {
          return this.dimensionManager.updateMalusSize(widthToRemove);
        },

        /**
         *
         * @returns {number} the calculated size
         */
        adjustMeasure: function() {
          this.dimensionManager.updateGaps();
          this.dimensionManager.updateIntrinsicSizes();
          return this.dimensionManager.getCalculatedSize();
        },

        adjustStretchability: function() {
          this.dimensionManager.updateMaxSizes();
          this.dimensionManager.updateStretchability();
        },

        getHintSize: function() {
          return this.dimensionManager.getHintSize(null, null, true, true);
        },

        getMaxSize: function() {
          return this.dimensionManager.getMaxSize(null, null, true, true);
        },
        getMinSize: function() {
          return this.dimensionManager.getMinSize(null, null, true, true);
        },

        getCalculatedSize: function() {
          return this.dimensionManager.getCalculatedSize();
        },
        /**
         *
         * @param {classes.GridDimensionSlot} slot
         */
        adjustAvailableMeasure: function(slot) {
          return this.dimensionManager.getCalculatedSize(slot.getPosition(), slot.getLastPosition(), false, false);
        },

        applyStyles: function(styleRules, prefix) {
          const rendering = this.dimensionManager.render();
          this.applyRegularStyles(rendering, styleRules, prefix);
        },

        applyRegularStyles: function(rendering, styleRules, prefix) {
          for (const position of rendering.regularPositions) {
            const positionInfo = rendering.regular[position];

            const pxPos = cls.Size.cachedPxImportant(positionInfo.position);
            const pxPosWithGap = cls.Size.cachedPxImportant(positionInfo.position + positionInfo.beforeGap);

            const selector = prefix + "x_" + position;
            const selectorGrid = prefix + "x_" + position + ".g_gridChildrenInParent";
            const selectorGridChildOf = prefix + "x_" + position + ".g_childOfGridWithGridChildrenInParent";
            const selectorElem = prefix + "x_" + position + ".g_decoratingElement";
            const selectorGridChild = prefix + "x_" + position + ".g_gridChildrenInParentChild";

            styleRules[selector] = {};
            styleRules[selectorGrid] = {};
            styleRules[selectorElem] = {};
            styleRules[selectorGridChild] = {};
            styleRules[selectorGridChildOf] = {};
            styleRules[selector][this._widget.getStart()] = pxPos;
            styleRules[selectorGrid][this._widget.getStart()] = pxPos;
            styleRules[selectorElem][this._widget.getStart()] = pxPosWithGap;
            styleRules[selectorGridChild][this._widget.getStart()] = pxPosWithGap;
            styleRules[selectorGridChildOf][this._widget.getStart()] = pxPos;

            for (const length of positionInfo.regularLengths) {
              const size = positionInfo.lengths[length];
              styleRules[prefix + "w_" + position + "_" + length] = {
                width: cls.Size.cachedPxImportant(size)
              };
              styleRules[prefix + "w_" + position + "_" + length + ".g_gridChildrenInParent"] = {
                width: cls.Size.cachedPxImportant(positionInfo.lengthsWithGaps[length])
              };
              styleRules[prefix + "w_" + position + "_" + length + ".g_childOfGridWithGridChildrenInParent"] = {
                width: cls.Size.cachedPxImportant(positionInfo.lengthsWithGaps[length])
              };
              styleRules[prefix + "w_" + position + "_" + length + ".g_decoratingElement"] = {
                width: cls.Size.cachedPxImportant(positionInfo.lengthsWithGaps[length])
              };
              styleRules[prefix + "w_" + position + "_" + length + ".g_gridChildrenInParentChild"] = {
                width: cls.Size.cachedPxImportant(positionInfo.lengths[length])
              };
            }
          }
        }
      });
  });
