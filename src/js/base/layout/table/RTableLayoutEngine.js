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

modulum('RTableLayoutEngine', ['TableLayoutEngineBase'],
  function(context, cls) {
    /**
     * @class RTableLayoutEngine
     * @memberOf classes
     * @extends classes.TableLayoutEngineBase
     */
    cls.RTableLayoutEngine = context.oo.Class(cls.TableLayoutEngineBase, function($super) {
      return /** @lends classes.TableLayoutEngine.prototype */ {
        __name: "RTableLayoutEngine",

        /**
         * @inheritDoc
         */
        reset: function(recursive) {
          $super.reset.call(this, recursive);

          this._visibleColumnsWidth = null;
          this._visibleItemsInRowHeight = null;
          this._totalColumnsWidth = 0;
          this._totalDetachedWidth = 0;
          this._computedMinWidth = 0;
          this._computedMaxWidth = 0;

          // Reset column first item width layout
          if (!this._widget) {
            return;
          }

          let rows = this._widget.getRows();
          if (rows.length === 0) {
            return;
          }

          let firstRowTableItemWidgets = rows[0].getChildren();
          for (const tableItemWidget of firstRowTableItemWidgets) {
            let widget = tableItemWidget.getChildren()[0];
            if (widget) {
              widget._layoutInformation.reset(true);
              widget._layoutEngine.reset(true);
            }
          }
        },

        //#region Measures

        /**
         * @inheritDoc
         */
        prepareMeasure: function() {
          $super.prepareMeasure.call(this);

          if (this.isLayoutDone()) {
            return;
          }

          // Add all visible columns in DOM before layout
          // TODO GBC-4154 : adapt code here to only add columns on first row
          let columns = this._getWidget().getColumns();
          for (const col of columns) {
            if (!col.isHidden() && col.isDetachedFromDom()) {
              col.attachItemsToDom();
            }
          }

          // Set size policy mode as fixed on first row item widgets
          let rows = this._widget.getRows();
          if (rows.length === 0) {
            return;
          }
          let firstRowTableItemWidgets = rows[0].getChildren();

          for (const tableItemWidget of firstRowTableItemWidgets) {
            let itemWidget = tableItemWidget.getChildren()[0];
            if (itemWidget) {
              if (!(itemWidget instanceof cls.RadioGroupWidget || itemWidget instanceof cls.ComboBoxWidget)) {
                itemWidget.getLayoutInformation().setSizePolicyMode("fixed");
              }
              let charSize = this._widget.getLayoutInformation().getCharSize();
              itemWidget.getLayoutInformation().setCharSize(charSize.getWidthM(), charSize.getWidth0(), charSize.getHeight());
            }
          }
        },

        /**
         * @inheritDoc
         */
        measure: function() {

          $super.measure.call(this);

          if (this.isLayoutDone()) {
            return;
          }

          const layoutInfo = this._widget.getLayoutInformation();

          const rows = this._widget.getRows();
          if (rows.length === 0) {
            // if there is no row, set a minimal row height to be sure after layout
            // a new pageSize will be sent to DVM (fix for GBC-3317)
            layoutInfo.setRowHeight(Math.max(context.ThemeService.getTableMinimalRowHeight(), layoutInfo.getRowHeight()));
            return;
          }

          // Set some layout information on column widget
          let sumColumnsWidth = 0,
            columnsWidth = [];
          const firstRowTableItemWidgets = rows[0].getChildren();

          for (const tableItemWidget of firstRowTableItemWidgets) {
            const widget = tableItemWidget.getChildren()[0];
            if (!widget) {
              return;
            }
            let column = tableItemWidget.getColumnWidget(),
              widgetLayoutInfo = widget.getLayoutInformation(),
              colLayoutInfo = column.getLayoutInformation();

            let widgetCharSize = this._widget.getLayoutInformation().getCharSize();
            colLayoutInfo.setCharSize(widgetCharSize.getWidthM(), widgetCharSize.getWidth0(), widgetCharSize.getHeight());

            // Get DOM measure of column first item widget and set it as measure on column layout
            const measuredWidth = widgetLayoutInfo.getMeasured().getWidth(),
              preferredWidth = widgetLayoutInfo.getPreferred().getWidth(),
              stretchMinWidth = this._pixelToCharWidth(widgetLayoutInfo.getRawInformation().getStretchMin(), layoutInfo.getCharSize()),
              measuredHeight = widgetLayoutInfo.getMeasured().getHeight(),
              preferredHeight = widgetLayoutInfo.getPreferred().getHeight(),
              // take biggest value between measured width and .PER width (preferred or stretchmin width)
              width = Math.max(measuredWidth, preferredWidth, stretchMinWidth);

            colLayoutInfo.setPreferred(width, preferredHeight);
            colLayoutInfo.setMeasured(width, measuredHeight);

            // get STRETCH values of first item widget and set it to column layout
            colLayoutInfo.setXStretched(widgetLayoutInfo.isXStretched());
            colLayoutInfo.getRawInformation().setStretchMin(widgetLayoutInfo.getRawInformation().getStretchMin());
            colLayoutInfo.getRawInformation().setStretchMax(widgetLayoutInfo.getRawInformation().getStretchMax());

            if (!column.isHidden()) {
              columnsWidth.push(width);
              sumColumnsWidth += width;
            }
          }

          // only compute rows during layout because columns will be measured after layout
          this._layoutDone = this.computeRowsColsCss(true, false, true);

          if (!this.isLayoutDone()) {
            return;
          }

          // Compute preferred size
          const rowHeight = layoutInfo.getDecoratedRowHeight();
          const sizeHint = layoutInfo.getSizeHint();

          if (!sizeHint.getWidth()) {
            layoutInfo.getPreferred().setWidth(sumColumnsWidth);
          } else if (cls.Size.isCols(sizeHint.getWidth())) {
            let count = parseInt(sizeHint.getWidth(), 10),
              colsLen = columnsWidth.slice(0, count).reduce(function(pv, cv) {
                return pv + cv;
              }, 0);
            layoutInfo.getPreferred().setWidth(Math.round(colsLen));
          }

          if (sizeHint.getHeight()) {
            // translate height into number of rows
            this._widget._firstPageSize = Math.max(this._convertHeightToRowCount(sizeHint.getHeight(), layoutInfo.getCharSize().getHeight(),
              rowHeight), 1);
          }

          let h = (this._widget._firstPageSize ? this._widget._firstPageSize : 1) * rowHeight;
          layoutInfo.getPreferred().setHeight(Math.round(h + layoutInfo.getDecorating().getHeight()));
        },

        /**
         * Compute CSS rules (grid template) for rows height and col widths
         * @param {boolean} measureRows - compute rows height
         * @param {boolean} measureCols - compute cols width
         * @param {boolean} force - force measure
         * @return {boolean} true if layout has been correctly computed
         */
        computeRowsColsCss: function(measureRows, measureCols, force = false) {

          if ((!this.isLayoutDone() && !force) || (!measureCols && !measureRows)) {
            return false;
          }

          // If the table is flipped, we need to compute both as it's used in the CSS template
          if (this._getWidget().isFlipped()) {
            measureRows = true;
            measureCols = true;
          }

          let measureDone = false;
          this._visibleColumnsWidth = [];
          this._visibleItemsInRowHeight = [];
          let minWidth = 99999;

          // go through all columns
          this._totalColumnsWidth = 0;
          this._totalDetachedWidth = 0;
          let foundScrollableColumn = false;

          let maxCharSize = 0;
          for (const columnWidget of this._widget.getOrderedColumns()) {
            if (columnWidget.isHidden()) {
              continue;
            }
            const layoutInfo = columnWidget.getLayoutInformation();

            // width
            if (measureCols) {
              let width = columnWidget.getUserWidth();
              if (width === null) {
                width = layoutInfo.getMeasured().getWidth();
                if (layoutInfo.isXStretched()) {
                  const rawStretchMin = layoutInfo.getRawInformation().getStretchMin();
                  if (rawStretchMin !== 0) {
                    const stretchMin = this._pixelToCharWidth(rawStretchMin, layoutInfo.getCharSize());
                    width = stretchMin > width ? stretchMin : width;
                  }
                }
              }
              minWidth = Math.min(minWidth, width);

              // generate grid template for each visible column on current screen viewport
              if (!columnWidget.isDetachedFromDom()) {
                if (!columnWidget.isFrozen()) { // detected our first column which can be scrolled
                  foundScrollableColumn = true;
                }
                let columnWidthData = {
                  width: width,
                  stretchX: layoutInfo.isXStretched(),
                  stretchMin: layoutInfo.getRawInformation().getStretchMin(),
                  stretchMax: layoutInfo.getRawInformation().getStretchMax(),
                  charSize: layoutInfo.getCharSize()
                };
                maxCharSize = Math.max(maxCharSize, layoutInfo.getCharSize());
                this._visibleColumnsWidth.push(columnWidthData);
              } else if (!foundScrollableColumn) {
                // build our scroll left value which will be consumed by our spacer "margin" css grid column
                this._totalDetachedWidth += width;
              }
              this._totalColumnsWidth += width;
            }

            // height
            if (measureRows && !columnWidget.isHidden()) {
              let height = layoutInfo.getMeasured().getHeight();
              this._visibleItemsInRowHeight.push(height);
            }

            measureDone = true;
          }

          // If table fills empty space, set last column to fill it
          if (this._widget.isResizeFillsEmptySpace() && this._visibleColumnsWidth.last()) {
            this._visibleColumnsWidth.last().fillEmptySpace = true;
          }

          const rbWidth = this._getRowBoundWidth();
          const rowboundColumnWidthData = {
            width: rbWidth,
            stretchX: false,
            stretchMin: 0,
            stretchMax: rbWidth,
            charSize: maxCharSize
          };
          this._visibleColumnsWidth.push(rowboundColumnWidthData);
          this._totalColumnsWidth += rowboundColumnWidthData.width;

          if (this._getWidget().getLayoutInformation().setRowBoundWidth) {
            this._getWidget().getLayoutInformation().setRowBoundWidth(rbWidth);
          }

          this._applyCss(measureRows, measureCols);

          return measureDone;
        },

        /**
         * @inheritDoc
         */
        measureDecoration: function() {
          let layoutInfo = this._widget.getLayoutInformation();
          let scrollAreaElementWidth = this._widget.getScrollableArea().offsetWidth;
          let scrollAreaElementHeight = this._widget.getScrollableArea().offsetHeight;
          let decorateWidth = this._widget.getElement().offsetWidth - scrollAreaElementWidth;
          let decorateHeight = this._widget.getElement().offsetHeight - scrollAreaElementHeight;

          decorateWidth += window.scrollBarSize;
          let rowDecorationHeight = 0;
          if (this._getWidget().isFlipped()) {
            // Store row decoration height for flipped table
            // Add the row decoration from row element
            const rows = this._getWidget().getRows();
            if (rows.length > 0) {
              const rowPaddingTop = parseInt(window.getComputedStyle(rows[0].getElement())["padding-top"], 10);
              const rowPaddingBottom = parseInt(window.getComputedStyle(rows[0].getElement())["padding-bottom"], 10);
              const rowMarginBottom = parseInt(window.getComputedStyle(rows[0].getElement())["margin-bottom"], 10);
              rowDecorationHeight = rowPaddingTop + rowPaddingBottom + rowMarginBottom;
            }
          } else {
            decorateHeight += window.scrollBarSize;
          }
          this._getWidget().setRowDecorationHeight(rowDecorationHeight);
          layoutInfo.setDecorating(decorateWidth, decorateHeight);
        },

        //#endregion

        //#region CSS

        /**
         * Filter which CSS to build and apply depending on the table configuration
         * @param {boolean} measureRows Should we build and apply the CSS for rows
         * @param {boolean} measureCols Should we build and apply the CSS for columns
         * @private
         */
        _applyCss: function(measureRows, measureCols) {
          // Else apply the CSS
          this._widget.setStyle({
            "--visibleColumnCount": this._visibleColumnsWidth.length
          });

          if (this._widget.getViewType() === "listview") {
            let rowHeight = this._visibleItemsInRowHeight[0];
            if (this._visibleItemsInRowHeight.length > 1) {
              rowHeight += this._visibleItemsInRowHeight[1];
            }
            if (this._visibleItemsInRowHeight.length > 2) {
              rowHeight = Math.max(rowHeight, this._visibleItemsInRowHeight[2]);
            }
            this._widget.setRowHeight(rowHeight);
          } else if (this._getWidget().isFlipped()) {
            this._applyFlippedTableCss();
          } else {
            this._applyClassicTableCss(measureRows, measureCols);
          }
        },

        /**
         * Build the css template for classic table
         * @param {boolean} measureRows Should we build and apply the CSS for rows
         * @param {boolean} measureCols Should we build and apply the CSS for columns
         * @private
         */
        _applyClassicTableCss: function(measureRows, measureCols) {
          // set grid-template-columns (columns width)
          if (measureCols) {
            let strTemplateColumns = "";

            let isAnyColumnStretchX = false;
            for (let i = 0; i < this._visibleColumnsWidth.length; i++) {
              let colWidth;
              const widthObj = this._visibleColumnsWidth[i];
              const widthCss = `${widthObj.width}px`;

              // add scroll left spacer grid template after visible left frozen columns to avoid glitch with frozen columns during scrolling
              const totalLeftFrozenCols = this._widget.getTotalVisibleLeftFrozenColumns();
              if (totalLeftFrozenCols !== this._visibleColumnsWidth.length && i === totalLeftFrozenCols) {
                strTemplateColumns += ` ${this._totalDetachedWidth}px`;
              }

              if (widthObj.stretchX) {
                isAnyColumnStretchX = true;
                // if stretchMin === 0 min is the form width
                // if stretchMax === 0 max is infinity
                // (minWidth || 1) to avoid division by 0 which returns NaN
                const stretchMin = widthObj.stretchMin === 0 ? widthCss :
                  `${this._pixelToCharWidth(widthObj.stretchMin, widthObj.charSize)}px`;
                const stretchMax = widthObj.stretchMax === 0 ? `${widthObj.width / (this._computedMinWidth || 1)}fr` : `${this._pixelToCharWidth(widthObj
                  .stretchMax,
                  widthObj.charSize)}px`;
                colWidth = ` minmax(${stretchMin}, ${stretchMax})`;
              } else if (widthObj.fillEmptySpace && !isAnyColumnStretchX) {
                colWidth = " auto"; // auto in CSS grid will take the available space
              } else {
                colWidth = ` ${widthCss}`;
              }
              strTemplateColumns += colWidth;
            }

            // if we have frozen columns only, add 0 for the left spacer located after the frozen columns
            // this is needed to respect the grid css template order
            if (this._widget.getTotalVisibleLeftFrozenColumns() === this._visibleColumnsWidth.length) {
              strTemplateColumns += " 0";
            }

            // set 1px horizontal div total width to create the scroll as if all columns went in DOM
            this._widget.getElement().style.setProperty("--scrollWidth", `${this._totalColumnsWidth}px`);

            // set/update css grid template computed on each visible columns (based on columns orders).
            this._widget.getElement().style.setProperty("--gridTemplateColumns", strTemplateColumns);
          }

          if (measureRows) {
            this._visibleItemsInRowHeight.push(context.ThemeService.getTableMinimalRowHeight());
            const rowHeight = Math.max(...this._visibleItemsInRowHeight);
            this._widget.setRowHeight(rowHeight);
          }
        },

        //#endregion

        /**
         * @inheritDoc
         */
        getRenderableChildren: function() {
          let children = [];
          if (this._widget && !this.isLayoutDone()) {
            let rows = this._widget.getRows();
            if (rows.length > 0) {
              let firstRowTableItemWidgets = rows[0].getChildren();
              for (const tableItemWidget of firstRowTableItemWidgets) {
                const widget = tableItemWidget.getChildren()[0];
                if (widget) {
                  children.push(widget);
                }
              }
            }
          }
          return children;
        },

        /**
         * Build the CSS template for flipped tables
         * @private
         */
        _applyFlippedTableCss: function() {
          let rowHeight = this._visibleItemsInRowHeight.reduce((accumulator, height) => accumulator + height, 0);
          rowHeight = Math.ceil(rowHeight);
          this._getWidget().setRowHeight(rowHeight);
          this._getWidget().setStyle({
            "--rowBoundWidth": `${this._getWidget().getLayoutInformation().getRowBoundWidth()}px`
          });
        },

        /**
         * helper function to compute width in pixels according to a number of char
         * @returns The width in pixels
         * @private
         */
        _pixelToCharWidth: function(nbChar, charSize) {
          return cls.CharSize.translate(nbChar, charSize.getWidthM(), charSize.getWidth0());
        }
      };
    });
  });
