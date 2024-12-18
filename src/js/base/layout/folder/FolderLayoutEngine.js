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

modulum('FolderLayoutEngine', ['LayoutEngineBase'],
  function(context, cls) {
    /**
     * @class FolderLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.FolderLayoutEngine = context.oo.Class(cls.LayoutEngineBase, function($super) {
      return /** @lends classes.FolderLayoutEngine.prototype */ {
        __name: "FolderLayoutEngine",
        /**
         * stylesheet id
         */
        _styleSheetId: null,
        /**
         * padding to add on folder viewport (px)
         * @type {Number}
         */
        _padding: 8,

        /**
         * @inheritDoc
         * @constructs
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);
          this._styleSheetId = "folderLayout_" + widget.getUniqueIdentifier();
        },

        /**
         * @inheritDoc
         */
        reset: function(recursive) {
          $super.reset.call(this, recursive);
          if (this._widget) {
            this._widget.addPagesInDom();
          }
        },

        /**
         * @inheritDoc
         */
        resetSizes: function() {
          $super.resetSizes.call(this);
          this._getLayoutInfo().setPreferred(0, 0);
        },

        /**
         * Returns only already layouted + new current page when lateRendering to true, otherwise returns all children
         */
        getRenderableChildren: function() {
          let renderable = $super.getRenderableChildren.call(this);
          if (this._widget._isLateRendering) {
            const alreadyRendered = renderable.filter(function(page) {
              return page.getLayoutEngine().isLayouted();
            });
            if (!alreadyRendered.contains(this._widget.getCurrentPage())) {
              alreadyRendered.push(this._widget.getCurrentPage());
            }
            renderable = alreadyRendered;
          }
          return renderable;
        },

        /**
         * @inheritDoc
         */
        DOMMeasure: function() {
          $super.DOMMeasure.call(this);
          if (this._widget.getTabsTitlesHostElement) {
            const info = this._getLayoutInfo(),
              container = this._widget.getTabsTitlesHostElement().getBoundingClientRect();
            info.setTitlesContainerDeltaWidth(info.getRawMeasure().getWidth() - container.width);
            info.setTitlesContainerDeltaHeight(info.getRawMeasure().getHeight() - container.height);
          }
        },
        /**
         * @inheritDoc
         */
        measureDecoration: function() {
          const containerMargin = parseFloat(context.ThemeService.getValue("mt-tab-items-container-margin")) * 2;
          // We can't do element - containerElement because the containerElement does not grow when there are too many tabs (GBC-4069)
          // We add the containerElement's margin to avoid some unwanted overflow (GBC-4363, GBC-4392)
          const decorateX = this._widget.getElement().getBoundingClientRect().width - this._widget.getScroller().getTabsHost()
            .getBoundingClientRect().width + containerMargin;

          this._getLayoutInfo().setDecorating(
            decorateX,
            this._widget.getElement().clientHeight - this._widget.getContainerElement().clientHeight
          );
          this._getLayoutInfo().setDecoratingOffset(
            this._widget.getContainerElement().offsetLeft - this._widget.getElement().offsetLeft,
            this._widget.getContainerElement().offsetTop - this._widget.getElement().offsetTop
          );
        },

        /**
         * @inheritDoc
         */
        adjustMeasure: function() {
          const layoutInfo = this._getLayoutInfo();
          let measureX = 0,
            measureY = 0,
            minX = 0,
            minY = 0,
            maxX = 0,
            maxY = 0;
          const decorateX = layoutInfo.getDecorating().getWidth(),
            decorateY = layoutInfo.getDecorating().getHeight();
          let preferredX = 0,
            preferredY = 0;

          const children = this._widget.getChildren();
          for (const element of children) {
            if (!element.isHidden()) {
              const widgetInfo = this._getLayoutInfo(element);
              measureX = Math.max(measureX, widgetInfo.getMeasured().getWidth());
              measureY = Math.max(measureY, widgetInfo.getMeasured().getHeight());
              minX = Math.max(minX, widgetInfo.getMinimal().getWidth());
              minY = Math.max(minY, widgetInfo.getMinimal().getHeight());
              maxX = Math.max(maxX, widgetInfo.getMaximal().getWidth());
              maxY = Math.max(maxY, widgetInfo.getMaximal().getHeight());
              preferredX = Math.max(preferredX, widgetInfo.getPreferred().getWidth());
              preferredY = Math.max(preferredY, widgetInfo.getPreferred().getHeight());
            }
          }
          layoutInfo.setMeasured(measureX + decorateX, measureY + decorateY);
          layoutInfo.setPreferred(Math.max(preferredX, measureX + decorateX), Math.max(preferredY, measureY + decorateY));
          layoutInfo.setMinimal(minX + decorateX, minY + decorateY);
          layoutInfo.setMaximal(maxX + decorateX, cls.Size.maximal);
        },

        /**
         * @inheritDoc
         */
        adjustStretchability: function() {
          const layoutInfo = this._getLayoutInfo(),
            children = this._widget.getChildren();
          for (const element of children) {
            const widgetInfo = this._getLayoutInfo(element);
            if (widgetInfo.isXStretched() || widgetInfo.isChildrenXStretched()) {
              layoutInfo.addChildrenStretchX(widgetInfo);
            }
            if (widgetInfo.isYStretched() || widgetInfo.isChildrenYStretched()) {
              layoutInfo.addChildrenStretchY(widgetInfo);
            }
          }
        },

        /**
         * @inheritDoc
         */
        prepareApplyLayout: function() {
          const layoutInfo = this._getLayoutInfo(),
            decorateX = layoutInfo.getDecorating().getWidth() + this._padding,
            decorateY = layoutInfo.getDecorating().getHeight(),
            children = this._widget.getChildren(),
            minx = Math.max(layoutInfo.getAvailable().getWidth(), layoutInfo.getMinimal().getWidth()),
            miny = Math.max(layoutInfo.getAvailable().getHeight(), layoutInfo.getMinimal().getHeight());
          for (const element of children) {
            if (!element.isHidden()) {
              const widgetInfo = this._getLayoutInfo(element);
              widgetInfo.setAvailable(
                minx - decorateX,
                miny - decorateY
              );
              widgetInfo.setAllocated(minx - decorateX, miny - decorateY);
            }
          }
          layoutInfo.setAllocated(minx, miny);
          this._styleRules[".g_measured #w_" + this._widget.getUniqueIdentifier() + ".g_measureable"] = {
            height: layoutInfo.getAllocated().getHeight() + "px",
            width: layoutInfo.getAllocated().getWidth() + "px"
          };
          this._styleRules[".g_measured #w_" + this._widget.getUniqueIdentifier() + ".g_measureable>.containerElement"] = {
            height: (layoutInfo.getAllocated().getHeight() - decorateY) + "px",
            width: (layoutInfo.getAllocated().getWidth() - decorateX) + "px"
          };
        },

        /**
         * @inheritDoc
         */
        applyLayout: function() {
          context.styler.appendStyleSheet(this._styleRules, this._styleSheetId, true, this.getLayoutSheetId());
        }
      };
    });
  });
