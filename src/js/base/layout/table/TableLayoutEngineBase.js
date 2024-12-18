/// FOURJS_START_COPYRIGHT(D,2019)
/// Property of Four Js*
/// (c) Copyright Four Js 2019, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TableLayoutEngineBase', ['LeafLayoutEngine'],
  function(context, cls) {
    /**
     * Base code for RTable, FLIPPED RTable and FLIPPED RTable displayed as list
     * @class TableLayoutEngineBase
     * @memberOf classes
     * @extends classes.LeafLayoutEngine
     */
    cls.TableLayoutEngineBase = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.TableLayoutEngineBase.prototype */ {
        __name: "TableLayoutEngineBase",

        /** @type {boolean} */
        _layoutDone: false,

        /** @type {number} */
        _minPageSize: 1,
        /** @type {number} */
        _minWidth: 60,
        /** @type {boolean} */
        _initialPreferredSize: false,

        _visibleColumnsWidth: null,
        _visibleItemsInRowHeight: null,
        _totalColumnsWidth: 0,
        _totalDetachedWidth: 0,
        _computedMinWidth: 0,
        _computedMaxWidth: 0,

        /**
         * @inheritDoc
         */
        reset: function(recursive) {
          $super.reset.call(this, recursive);
          this._initialPreferredSize = false;
        },

        /**
         * Returns if layout has been done at least one time
         * @return {boolean} layout done ?
         */
        isLayoutDone: function() {
          return this._layoutDone;
        },

        /**
         * @inheritDoc
         */
        resetLayout: function() {
          this._layoutDone = false;
          this._widget.getElement().style.setProperty("--gridTemplateColumns", null);
        },

        /**
         * @inheritDoc
         */
        invalidateAllocatedSpace: function(invalidation) {
          this._invalidatedAllocatedSpace = invalidation || context.LayoutInvalidationService.nextInvalidation();
        },

        // TODO check if this override is necessary
        /**
         * @inheritDoc
         */
        setHint: function(widthHint, heightHint) {
          this._widget.getLayoutInformation().setSizeHint(
            ((typeof(widthHint) === "undefined") || widthHint === null || widthHint === "") ? 0 : widthHint,
            ((typeof(heightHint) === "undefined") || heightHint === null || heightHint === "") ? 0 : heightHint
          );
        },

        /**
         * @inheritDoc
         */
        needMeasureSwitching: function() {
          return this._widget.isVisibleRecursively();
        },

        /**
         * Translate table height into number of rows
         * @param {number} height - table height (ex: 10, 10 row, 10 em, ...)
         * @param {number} charHeight - height of a char (pixels)
         * @param {number} rowHeight - height of table rows (pixels)
         * @return {number} number of rows
         */
        _convertHeightToRowCount: function(height, charHeight, rowHeight) {
          if (!height) {
            return 0;
          }
          if (Object.isNumber(height)) {
            return height;
          }

          const result = cls.Size.valueRE.exec(height);
          if (!result) {
            return 0;
          }

          let rowResult = 0;
          const numeric = +result[1];
          const unit = result[2];
          switch (unit) {
            case "ln":
            case "row":
              rowResult = numeric;
              break;
            case "ch":
            case "em": {
              const fontSizeRatio = parseFloat(context.ThemeService.getValue("theme-font-size-ratio"));
              charHeight = +charHeight || (16 * fontSizeRatio);
              rowResult = Object.isNumber(rowHeight) && rowHeight ? Math.ceil((numeric * charHeight) / rowHeight) : 0;
              break;
            }
            case "px":
              rowResult = Object.isNumber(rowHeight) && rowHeight ? Math.ceil(numeric / rowHeight) : 0;
              break;
            default:
              rowResult = numeric;
              break;
          }

          return rowResult;
        },

        /**
         * @inheritDoc
         */
        measureDecoration: function() {},

        /**
         * @inheritDoc
         */
        adjustMeasure: function() {
          $super.adjustMeasure.call(this);
          const layoutInfo = this._widget.getLayoutInformation();
          const rowHeight = this._widget.getRowHeight();
          const formWidget = this._widget.getFormWidget();

          // default minimum height
          let minHeight = this.getMinPageSize() * rowHeight + layoutInfo.getDecorating().getHeight();

          // we don't want to override the min height if we are in auto overflow mode
          // because this min height has been computed in the first adjustMeasure pass.
          if (!(formWidget && formWidget.getLayoutEngine().isAutoOverflowActivated())) {
            layoutInfo.getMinimal().setHeight(minHeight);
          }
          // default minimum width
          const minWidth = this.getMinWidth() + layoutInfo.getDecorating().getWidth();
          layoutInfo.getMinimal().setWidth(minWidth);

          // if fixedPageSize or window sizable=false --> height of table must be fixed
          if (this._widget.isFixedPageSize()) {
            const preferredPageSize = this._widget._firstPageSize ? Math.max(this._widget._firstPageSize, 1) : 1;
            minHeight = preferredPageSize * rowHeight + layoutInfo.getDecorating().getHeight();
            layoutInfo.getMinimal().setHeight(minHeight);
            layoutInfo.getMeasured().setHeight(minHeight);
            layoutInfo.getMaximal().setHeight(minHeight);
          } else {
            layoutInfo.getMeasured().setHeight(Math.max(layoutInfo.getMinimal().getHeight(true), layoutInfo.getPreferred().getHeight(
              true)));
          }

          // Set measured width
          layoutInfo.getMeasured().setWidth(Math.max(layoutInfo.getMinimal().getWidth(true), layoutInfo.getPreferred().getWidth(
            true)) + layoutInfo.getDecorating().getWidth());
        },

        /**
         * @inheritDoc
         */
        prepareApplyLayout: function() {
          $super.prepareApplyLayout.call(this);
          // need to fix allocated height as late as possible to avoid current row not being visible (GBC-1606)
          if (this._widget.isFixedPageSize()) {
            // Fix height when page size is fixed
            const layoutInfo = this._widget.getLayoutInformation();
            layoutInfo.getAllocated().setHeight(layoutInfo.getMinimal().getHeight());

            this._widget.setStyle({
              preSelector: ".g_measured ",
              selector: ".g_measureable",
              appliesOnRoot: true
            }, {
              height: this._getLayoutInfo().getAllocated().getHeight() + "px"
            });
          }
        },

        /**
         * @inheritDoc
         */
        applyLayout: function() {
          // set correct width of the table when measuring to avoid reset of horizontal scrollbar
          $super.applyLayout.call(this);
          this._widget.setStyle({
            preSelector: ".g_measuring ",
            selector: ".g_measureable",
            appliesOnRoot: true
          }, {
            width: `${this._getLayoutInfo().getAllocated().getWidth()}px !important`,
          });
        },

        /**
         * Returns minimum page size
         * @return {number} min page size
         */
        getMinPageSize: function() {
          return this._minPageSize;
        },

        /**
         * Sets minimum page size
         * @param {number} minPageSize - min page size
         */
        setMinPageSize: function(minPageSize) {
          this._minPageSize = minPageSize;
        },

        /**
         * Returns minimum width (pixels)
         * @return {number} min width
         */
        getMinWidth: function() {
          return this._minWidth;
        },

        /**
         * Sets minimum width (pixels)
         * @param {number} minWidth - min width
         */
        setMinWidth: function(minWidth) {
          this._minWidth = minWidth;
        },

        /**
         * Compute the rowbound width depending on the parent widget rowbound actions
         * @returns The Rowbound Width in pixel
         */
        _getRowBoundWidth: function() {
          let width = window.isTouchDevice() ? 48 : 32;
          return this._widget.haveRowBoundActions() ? width : 0;
        }
      };
    });
  });
