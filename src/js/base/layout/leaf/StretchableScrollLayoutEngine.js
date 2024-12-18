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

modulum('StretchableScrollLayoutEngine', ['LayoutEngineBase'],
  function(context, cls) {
    /**
     * @class StretchableScrollLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.StretchableScrollLayoutEngine = context.oo.Class(cls.LayoutEngineBase, function($super) {
      return /** @lends classes.StretchableScrollLayoutEngine.prototype */ {
        __name: "StretchableScrollLayoutEngine",

        /**
         * @inheritDoc
         */
        measureDecoration: function() {
          $super.measureDecoration.call(this);
          const paginationWidget = this._widget.getPaginationWidget ? this._widget.getPaginationWidget() : null;
          const paginationHeight = paginationWidget ? paginationWidget.getElement().getBoundingClientRect().height : 0;
          const layoutInfo = this._widget.getLayoutInformation();
          layoutInfo.setDecorating(window.scrollBarSize, paginationHeight + window.scrollBarSize);
        },

        /**
         * @inheritDoc
         */
        DOMMeasure: function() {
          const layoutInfo = this._widget.getLayoutInformation(),
            element = this._widget.getContainerElement(),
            elemRects = element.getBoundingClientRect();

          layoutInfo.setRawMeasure(elemRects.width, elemRects.height);
        },

        /**
         * @inheritDoc
         */
        measure: function() {
          $super.measure.call(this);

          if (!this._widget._firstPageSize) {
            this._widget._firstPageSize = this._widget._pageSize;
          }
        },

        invalidateMeasure: function(invalidation) {
          $super.measure.call(this, invalidation);
          this._widget.resetRowHeight();
        },

        /**
         * @inheritDoc
         */
        adjustMeasure: function() {
          let layoutInfo = this._widget.getLayoutInformation();
          let children = this.getRenderableChildren();
          let decorationHeight = layoutInfo.getDecorating().getHeight(true);

          if (children.length > 0) {
            let childMinimal = children[0].getLayoutInformation().getMinimal(); // take row margin into consideration
            let rowMargin = parseFloat(context.ThemeService.getValue("gbc-ScrollGridWidget-margin-ratio"), 10);
            let rowHeight = childMinimal.getHeight() + rowMargin;

            let preferredPageSize = this._widget._firstPageSize ?
              Math.max(this._widget._firstPageSize, 1) : 1;

            // we calculate preferred height based on row height and current page size
            let preferredHeight = preferredPageSize * rowHeight;
            layoutInfo.getMinimal().setHeight(rowHeight);
            layoutInfo.getPreferred().setHeight(preferredHeight);

            layoutInfo.getMinimal().setWidth(
              Math.max(
                layoutInfo.getMinimal().getWidth(true),
                childMinimal.getWidth(true) + layoutInfo.getDecorating().getWidth()
              )
            );

          } else {
            layoutInfo.setMinimal(0, decorationHeight);
          }

          let sizeX = layoutInfo.isXStretched() ?
            layoutInfo.getAvailable().getWidth() - layoutInfo.getDecorating().getWidth() :
            layoutInfo.getMinimal().getWidth(true);

          // biggest value between preferred and minimal is our measured height
          let sizeY = Math.max(layoutInfo.getMinimal().getHeight(true), layoutInfo.getPreferred().getHeight(true));

          layoutInfo.setMeasured(sizeX, sizeY);
          layoutInfo.setPreferred(sizeX, sizeY);
          layoutInfo.setAllocated(sizeX, sizeY);

          if (!(this._widget instanceof cls.PagedScrollGridWidget)) {
            children.forEach((w) => {
              w.getLayoutInformation().getAvailable().setWidth(sizeX);
              w.getLayoutInformation().getAllocated().setWidth(sizeX);
            });
          }
        }

      };
    });
  });
