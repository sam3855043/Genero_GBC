/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('HVBoxLayoutEngine', ['DBoxLayoutEngine'],
  function(context, cls) {
    /**
     * @class HVBoxLayoutEngine
     * @memberOf classes
     * @extends classes.DBoxLayoutEngine
     */
    cls.HVBoxLayoutEngine = context.oo.Class(cls.DBoxLayoutEngine, function($super) {
      return /** @lends classes.HVBoxLayoutEngine.prototype */ {
        __name: "HVBoxLayoutEngine",

        // Default accessors
        _orientation: "vertical",
        _mainSizeGetter: "getHeight",
        _mainSizeSetter: "setHeight",
        _mainHasSizeGetter: "hasHeight",
        _mainStretch: "Y",
        _oppositeSizeGetter: "getWidth",
        _oppositeSizeSetter: "setWidth",
        _oppositeHasSizeGetter: "hasWidth",
        _oppositeStretch: "X",
        _boxClassSelector: ".gbc_VBoxWidget",

        /**
         * @inheritDoc
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);
          this._splitHints = {
            "vertical": [],
            "horizontal": []
          };
          this._referenceSplitHints = {
            "vertical": [],
            "horizontal": []
          };
        },

        /**
         * Change layout orientation
         * @param {String} orientation - "horizontal" or "vertical"
         * @param {Boolean} force - force relayout
         */
        setOrientation: function(orientation, force) {
          //check if changed to avoid relayout
          if (!force && this._orientation === orientation) {
            return;
          }

          this._orientation = orientation;
          // Changing default accessors
          this._mainSizeGetter = this._isVertical() ? "getHeight" : "getWidth";
          this._mainSizeSetter = this._isVertical() ? "setHeight" : "setWidth";
          this._mainHasSizeGetter = this._isVertical() ? "hasHeight" : "hasWidth";
          this._mainStretch = this._isVertical() ? "Y" : "X";
          this._oppositeSizeGetter = this._isVertical() ? "getWidth" : "getHeight";
          this._oppositeSizeSetter = this._isVertical() ? "setWidth" : "setHeight";
          this._oppositeHasSizeGetter = this._isVertical() ? "hasWidth" : "hasHeight";
          this._oppositeStretch = this._isVertical() ? "X" : "Y";
          this._boxClassSelector = this._isVertical() ? ".gbc_VBoxWidget" : ".gbc_HBoxWidget";

          this._widget.removeClass(this._isVertical() ? "gbc_HBoxWidget" : "gbc_VBoxWidget");
          this._widget.removeClass(this._isVertical() ? "g_HBoxLayoutEngine" : "g_VBoxLayoutEngine");
          this._widget.addClass(this._isVertical() ? "g_VBoxLayoutEngine" : "g_HBoxLayoutEngine");
          this._widget.addClass(this._isVertical() ? "gbc_VBoxWidget" : "gbc_HBoxWidget");

          // Handle splitters
          this._setSplitHints(this._getReferenceSplitHints().slice());

          // Reset layout for child widgets and HBox/VBox
          this._registeredWidgets.forEach(w => w.getLayoutInformation().getAvailable().reset());
          this._getLayoutInfo().getAvailable().reset();
          this._getLayoutInfo().getAllocated().reset();
          this._getLayoutInfo().resetChildrenStretch();
          this.invalidateMeasure();
          this.invalidateAllocatedSpace();
        },

        /**
         * @inheritDoc
         */
        initSplitHints: function(initial) {
          initial = initial || {
            "horizontal": [],
            "vertical": []
          };
          const refHorizontal = (initial.horizontal || []).map(function(item) {
            return isNaN(item) ? 0 : item;
          });
          const refVertical = (initial.vertical || []).map(function(item) {
            return isNaN(item) ? 0 : item;
          });
          this._referenceSplitHints = {
            horizontal: refHorizontal,
            vertical: refVertical,
          };
        },

        /**
         * Check if orientation is vertical
         * @return {boolean} true if vertical, false otherwise
         * @private
         */
        _isVertical: function() {
          return this._orientation === "vertical";
        },

        /**
         * Get hints, orientation dependant
         * @param {Number?} idx - index of the split part to get
         * @return {*} either a specific splitHints if idx given, or all Array
         * @private
         */
        _getSplitHints(idx) {
          if (typeof idx === "undefined") {
            return this._splitHints[this._orientation];
          } else {
            return this._splitHints[this._orientation][idx];
          }
        },

        /**
         * Set hints, orientation dependant
         * @param {Number?} idx - index of the split part to get
         * @param {*} value - either an array or a specific value
         * @private
         */
        _setSplitHints(idx, value) {
          if (typeof value === "undefined") {
            this._splitHints[this._orientation] = idx;
          } else {
            this._splitHints[this._orientation][idx] = value;
          }
        },

        /**
         * Get reference hints, orientation dependant
         * @param {Number?} idx - index of the split part to get
         * @return {*} either a specific refSplitHints if idx given, or all Array
         * @private
         */
        _getReferenceSplitHints(idx) {
          if (typeof idx === "undefined") {
            return this._referenceSplitHints[this._orientation];
          } else {
            return this._referenceSplitHints[this._orientation][idx];
          }
        },

        /**
         * Set reference hints, orientation dependant
         * @param {Number?} idx - index of the split part to get
         * @param {*} value - either an array or a specific value
         * @private
         */
        _setReferenceSplitHints(idx, value) {
          if (typeof value === "undefined") {
            this._referenceSplitHints[this._orientation] = idx;
          } else {
            this._referenceSplitHints[this._orientation][idx] = value;
          }
        },

        /**
         * @inheritDoc
         */
        _setItemClass: function(position, start, size) {
          // Vbox rule
          if (this._isVertical()) {
            this._styleRules[".g_measured .gbc_VBoxWidget" + this._widget._getCssSelector() +
              ">div>.containerElement>.g_BoxElement:nth-of-type(" + (
                position + 1) +
              ")"] = {
              top: cls.Size.cachedPxImportant(start),
              height: cls.Size.cachedPxImportant(size)
            };
          } else {
            //HBOX rule
            const selector = ".g_measured .gbc_HBoxWidget" + this._widget._getCssSelector() +
              ">div>.containerElement>.g_BoxElement:nth-of-type(" + (position +
                1) + ")";
            const pos = cls.Size.cachedPxImportant(start);
            this._styleRules[selector] = {};
            this._styleRules[selector][this._widget.getStart()] = pos;
            this._styleRules[selector].width = cls.Size.cachedPxImportant(size);
          }
        },

        /**
         * @inheritDoc
         */
        _setItemOppositeClass: function(position) {
          if (this._isVertical()) {
            // VBox rules
            const vBoxSelector = ".g_measured .gbc_VBoxWidget" + this._widget._getCssSelector() +
              ">div>.containerElement>.g_BoxElement:nth-of-type(" + (
                position + 1) +
              ")";
            this._styleRules[vBoxSelector].width = cls.Size.cachedPxImportant(this._getLayoutInfo().getAllocated().getWidth());
          } else {
            // HBox rules
            const hBoxSelector = ".g_measured .gbc_HBoxWidget" + this._widget._getCssSelector() +
              ">div>.containerElement>.g_BoxElement:nth-of-type(" + (
                position + 1) +
              ")";
            this._styleRules[hBoxSelector].height = cls.Size.cachedPxImportant(this._getLayoutInfo().getAllocated().getHeight());
          }

        },

        /**
         * @inheritDoc
         */
        _applyMeasure: function(mainSize, oppositeSize) {
          this._styleRules[`.g_measured #w_${this._widget.getUniqueIdentifier()}.g_measureable`] = {
            height: (this._isVertical() ? mainSize : oppositeSize) + "px",
            width: (this._isVertical() ? oppositeSize : mainSize) + "px"
          };
          if (this._isVertical()) {
            this._getLayoutInfo().setMeasured(oppositeSize, mainSize);
          } else {
            this._getLayoutInfo().setMeasured(mainSize, oppositeSize);
          }
        },

        /**
         * @inheritDoc
         */
        _isStretched: function(widget) {
          if (this._isVertical()) {
            return widget.getLayoutEngine().isYStretched();
          } else {
            return widget.getLayoutEngine().isXStretched();
          }
        },

        /**
         * @inheritDoc
         */
        _setOppositeMaximalSize: function(widget, size) {
          let isSelfWidgetChildrenStretched;

          if (this._isVertical()) {
            isSelfWidgetChildrenStretched = widget === this._widget && this._widget.getLayoutInformation().isChildrenXStretched();
          } else {
            isSelfWidgetChildrenStretched = widget === this._widget && this._widget.getLayoutInformation().isChildrenYStretched();
          }

          return $super._setOppositeMaximalSize.call(this, widget, isSelfWidgetChildrenStretched ? cls.Size.maximal : size);
        }

      };
    });
  });
