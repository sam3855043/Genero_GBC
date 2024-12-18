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

modulum('LeafLayoutEngine', ['LayoutEngineBase'],
  function(context, cls) {

    /**
     * @class LeafLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.LeafLayoutEngine = context.oo.Class(cls.LayoutEngineBase, function($super) {
      return /** @lends classes.LeafLayoutEngine.prototype */ {
        __name: "LeafLayoutEngine",
        /**
         * data content placeholder is the DOM element that contains what is defined as widget's value
         * @type HTMLElement
         */
        _dataContentPlaceholder: null,
        /**
         * data content measure element is the DOM element that contains widget's value as text for measuring purpose
         * @type HTMLElement
         */
        _dataContentMeasure: null,
        /**
         * text sample, used in measure
         * @type {?string}
         */
        _textSample: null,
        /**
         * text sample width (in characters)
         * @type {number}
         */
        _sampleWidth: 0,
        /**
         * text sample height (in characters)
         * @type {number}
         */
        _sampleHeight: 0,
        /**
         * value content natural width (to deal with images for example)
         * @type {number}
         */
        _naturalWidth: 0,
        /**
         * value content natural height (to deal with images for example)
         * @type {number}
         */
        _naturalHeight: 0,

        /**
         * minimum content width if stretchmin attribute is used
         * @type {number}
         */
        _stretchMinWidth: 0,

        /**
         * @inheritDoc
         * @constructs
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);
          this.invalidateDataContentSelector(widget);
        },

        /**
         * set natural size
         * @param {number} width the width
         * @param {number} height the height
         */
        setNaturalSize: function(width, height) {
          this._naturalWidth = width;
          this._naturalHeight = height;
        },

        /**
         * test if this layout has a natural size
         * @return {boolean} true if this layout has a natural size
         */
        hasNaturalSize: function() {
          return Boolean(this._naturalWidth) && Boolean(this._naturalHeight);
        },
        /**
         * set hint size
         * @param {number} widthHint the width
         * @param {number} heightHint the height
         */
        setHint: function(widthHint, heightHint) {
          this._widget.getLayoutInformation().setSizeHint(
            ((typeof(widthHint) === "undefined") || widthHint === null || widthHint === "") ? 1 : widthHint,
            ((typeof(heightHint) === "undefined") || heightHint === null || heightHint === "") ? 1 : heightHint
          );
        },

        /**
         * @inheritDoc
         */
        reset: function(recursive) {
          $super.reset.call(this, recursive);
          this._widget.resetLayout();
        },

        /**
         * @inheritDoc
         */
        resetSizes: function() {
          $super.resetSizes.call(this);

          const layoutInfo = this._widget.getLayoutInformation();
          layoutInfo.hasBeenFixed = false;
        },

        /**
         * invalidate data content selector, creates it if needed
         * @param {classes.WidgetBase} widget this widget
         */
        invalidateDataContentSelector: function(widget) {
          if (widget.__dataContentPlaceholderSelector) {
            const element = this._widget.getElement();
            this._dataContentPlaceholder = widget.__dataContentPlaceholderSelector === cls.WidgetBase.selfDataContent ? element :
              element.getElementsByClassName(widget.__dataContentPlaceholderSelector.replace(".", ""))[0];
            if (this._dataContentPlaceholder) {
              this._dataContentPlaceholder.addClass("gbc_staticMeasure");
              this._dataContentPlaceholder.removeClass("gbc_dynamicMeasure");

              this._dataContentMeasure = this._dataContentPlaceholder.getElementsByClassName("gbc_dataContentMeasure")[0];
              if (!this._dataContentMeasure && !widget.ignoreLayout()) {
                this._dataContentMeasure = context.TemplateService.renderDOM("LeafLayoutMeasureElement");
                this._dataContentPlaceholder.appendChild(this._dataContentMeasure);
              }
            }
          }
        },

        /**
         * Returns Element containing the data to be measured
         * @returns {HTMLElement} element containing the data to be measured
         */
        getDataContentMeasureElement: function() {
          return this._dataContentMeasure;
        },

        /**
         * @inheritDoc
         */
        invalidateMeasure: function(invalidation) {
          const layoutInfo = this._getLayoutInfo(),
            currentSizePolicy = layoutInfo.getCurrentSizePolicy();
          if (!this._statuses.layouted || !currentSizePolicy.isFixed()) {
            $super.invalidateMeasure.call(this, invalidation);
            this._getLayoutInfo().invalidateMeasure();
          }
          layoutInfo.hasBeenFixed = false;
        },

        /**
         * sets measure as fixed measure
         * @private
         */
        _setFixedMeasure: function() {
          const layoutInfo = this._widget.getLayoutInformation();

          layoutInfo.setMeasured(
            layoutInfo.getPreferred().getWidth() + layoutInfo.getDecorating().getWidth(true),
            layoutInfo.getPreferred().getHeight() + layoutInfo.getDecorating().getHeight(true));
        },

        /**
         * @inheritDoc
         */
        beforeLayout: function() {
          $super.beforeLayout.call(this);
          // widgets contained in tables should not have a max height defined
          if (this._widget.isInTable()) {
            this._shouldFillHeight = true;
          }
        },

        /**
         * @inheritDoc
         */
        prepareMeasure: function() {
          if (this._dataContentMeasure) {
            const layoutInfo = this._widget.getLayoutInformation();
            const sizeHintWidth = layoutInfo.getSizeHint().getWidth();
            let width = (!layoutInfo.hasRawGridWidth() && cls.Size.isCols(sizeHintWidth)) ? parseInt(sizeHintWidth, 10) :
              layoutInfo.getGridWidth();

            // if a grid is present gridWidth send by VM add the reservedDecorationSpace automatically
            // so, we need to remove it to correctly measure the widget
            if (layoutInfo.hasRawGridWidth() && width > layoutInfo.getReservedDecorationSpace()) {
              width -= layoutInfo.getReservedDecorationSpace();
            }
            if (width !== this._sampleWidth || layoutInfo.getGridHeight() !== this._sampleHeight) {

              if (layoutInfo.isXStretched()) {
                //Measure min stretch size
                let minWidth = layoutInfo.getRawInformation().getStretchMin();
                if (minWidth > 0) {
                  this._dataContentMeasure.textContent = cls.Measurement.getTextSample(minWidth, layoutInfo.hasSingleLineContentOnly() ? 1 :
                    layoutInfo
                    .getGridHeight());
                  this._stretchMinWidth = this._widget.getElement().getBoundingClientRect().width;
                }
              }

              const sample = cls.Measurement.getTextSample(width, layoutInfo.hasSingleLineContentOnly() ? 1 : layoutInfo
                .getGridHeight());
              this._sampleWidth = width;
              this._sampleHeight = layoutInfo.getGridHeight();
              this._textSample = sample;
              this._dataContentMeasure.textContent = sample;
            }
          }
          this.prepareDynamicMeasure();
        },

        /**
         * prepare widget for dynamic measure
         */
        prepareDynamicMeasure: function() {
          if (this._dataContentPlaceholder) {
            const layoutInfo = this._widget.getLayoutInformation();
            let isDynamic = layoutInfo._needValuedMeasure || layoutInfo.getCurrentSizePolicy().isDynamic();

            this._dataContentPlaceholder.toggleClass("gbc_staticMeasure", !isDynamic);
            this._dataContentPlaceholder.toggleClass("gbc_dynamicMeasure", isDynamic);
          }
        },

        /**
         * @inheritDoc
         */
        measureDecoration: function() {
          const layoutInfo = this._widget.getLayoutInformation();
          const currentSizePolicy = layoutInfo.getCurrentSizePolicy();

          if (currentSizePolicy.isFixed()) {
            this._measureDecoration();
          }
        },

        /**
         * Measure decoration
         * @protected
         */
        _measureDecoration: function() {
          if (this._widget.isLayoutMeasureable(true) && this._dataContentPlaceholder) {
            const layoutInfo = this._widget.getLayoutInformation();
            const element = this._widget.getElement();
            const container = this._dataContentPlaceholder.hasClass("gbc_dynamicMeasure") ?
              this._widget.getElement().querySelector(".gbc-label-text-container") || this._dataContentMeasure :
              this._dataContentMeasure;

            const containerRects = container.getBoundingClientRect();
            this._getLayoutInfo().setDecorating(
              layoutInfo.getRawMeasure().getWidth(true) - containerRects.width,
              layoutInfo.getRawMeasure().getHeight(true) - containerRects.height
            );
            this._getLayoutInfo().setDecoratingOffset(
              container.offsetLeft - element.offsetLeft,
              container.offsetTop - element.offsetTop
            );
          }
        },

        /**
         * If we can override the min width
         * @return {boolean}
         */
        canOverrideMinWidth: function() {
          let layoutInfo = this._widget.getLayoutInformation(),
            minWidth = layoutInfo.getRawInformation().getStretchMin();

          return minWidth > 0 && layoutInfo.isXStretched();
        },

        /**
         * @inheritDoc
         */
        measure: function() {
          const layoutInfo = this._widget.getLayoutInformation();

          if (this._widget.isLayoutMeasureable(true)) {
            // 1. Set Measured
            this._measure();
            // 2. Set Min/Max
            this._setMinMax();
          } else {
            layoutInfo.setMeasured(0, 0);
            layoutInfo.setMinimal(0, 0);
            layoutInfo.setMaximal(0, 0);
          }
        },

        /**
         * Calculate and set measured size
         * @protected
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
          } else if (currentSizePolicy.isDynamic() || (layoutInfo._widget.isVisible() && layoutInfo.needMeasure())) {
            const width = this._naturalWidth || rawMeasure.getWidth(true); // NATURAL FOR IMAGE
            const height = this._naturalHeight || rawMeasure.getHeight(true);
            layoutInfo.setMeasured(width, height);
          }
        },

        /**
         * Define Min and Max sizes
         * @protected
         */
        _setMinMax: function() {
          const layoutInfo = this._widget.getLayoutInformation();
          const currentSizePolicy = layoutInfo.getCurrentSizePolicy();
          const minSize = layoutInfo.getMinimal();
          const maxSize = layoutInfo.getMaximal();
          const measured = layoutInfo.getMeasured();
          if (layoutInfo.getCurrentSizePolicy().isDynamic()) {
            layoutInfo.setMinimal(measured.getWidth(), measured.getHeight());
          } else {
            // min size is identified with capacity of the widget to stretch and its basic natural width (natural width can be preferred width if sizepolicy fixed, or natural content width if sizepolicy dynamic)
            // so if the widget can shrink and has a sizepolicy mode allowing it to shrink (initial or dynamic), then set min size to very small value.
            // Otherwise, if it can't shrink and can't stretch, its measured size if its min size (widget size isn't supposed to change. ex: stretch=none + sizepolicy=fixed)
            if (layoutInfo.isXStretched() && currentSizePolicy.canShrink()) {
              minSize.setWidth(layoutInfo.forcedMinimalWidth);
            } else {
              minSize.setWidth(measured.getWidth());
            }
            if (layoutInfo.isYStretched() && currentSizePolicy.canShrink()) {
              minSize.setHeight(layoutInfo.forcedMinimalHeight);
            } else {
              minSize.setHeight(measured.getHeight());
            }
          }
          if (layoutInfo.isXStretched()) {
            maxSize.setWidth(cls.Size.maximal);
            let minWidth = layoutInfo.getRawInformation().getStretchMin();
            if (minWidth > 0) {
              if (this._dataContentMeasure) {
                // Use the sample text to measure the min size via DOM
                // Set in prepareMeasure
                minSize.setWidth(this._stretchMinWidth);
              } else {
                // Manually calculate the min size (no added html space like padding and border)
                // i.e. Radiogroup doesn't use any data placeholder
                let charSize = layoutInfo.getCharSize();
                minSize.setWidth(cls.CharSize.translate(minWidth, charSize.getWidthM(), charSize.getWidth0()));
              }
            }
          } else {
            maxSize.setWidth(measured.getWidth());
          }
          if (layoutInfo.isYStretched()) {
            maxSize.setHeight(cls.Size.maximal);
          } else {
            maxSize.setHeight(measured.getHeight());
          }
        },

        /**
         * @inheritDoc
         */
        adjustStretchability: function() {
          const formWidget = this._widget.getFormWidget();
          const layoutInfo = this._widget.getLayoutInformation(),
            maxSize = layoutInfo.getMaximal(),
            measured = layoutInfo.getMeasured();

          if (layoutInfo.isXStretched()) {
            maxSize.setWidth(cls.Size.maximal);
          } else {
            maxSize.setWidth(measured.getWidth());
          }
          if (layoutInfo.isYStretched()) {
            maxSize.setHeight(cls.Size.maximal);
          } else {
            maxSize.setHeight(measured.getHeight());
          }
          if (formWidget && formWidget.getLayoutEngine().isAutoOverflowActivated()) {
            if (layoutInfo.isYStretched()) {
              layoutInfo.getMinimal().setHeight(Math.max(layoutInfo.getPreferred().getHeight(true), layoutInfo.getMeasured()
                .getHeight(
                  true)));
            }
          }
        },

        /**
         * @inheritDoc
         */
        prepareApplyLayout: function() {
          if (this._getLayoutInfo().isXStretched()) {
            this._widget.setStyle({
              preSelector: ".g_measured ",
              selector: ".g_measureable",
              appliesOnRoot: true
            }, {
              width: this._getLayoutInfo().getAvailable().getWidth() + "px"
            });
          } else {
            this._widget.setStyle({
              preSelector: ".g_measured ",
              selector: ".g_measureable",
              appliesOnRoot: true
            }, {
              width: "inherit"
            });
          }
          if (this._getLayoutInfo().isYStretched()) {
            this._widget.setStyle({
              preSelector: ".g_measured ",
              selector: ".g_measureable",
              appliesOnRoot: true
            }, {
              height: this._getLayoutInfo().getAvailable().getHeight() + "px"
            });
          } else if (this._getLayoutInfo().getMaximal().getHeight(true) && !this._shouldFillHeight) {
            this._widget.setStyle({
              preSelector: ".g_measured ",
              selector: ".g_measureable",
              appliesOnRoot: true
            }, {
              "max-height": this._getLayoutInfo().getMaximal().getHeight(true) + "px"
            });
          }
        },

        /**
         * @inheritDoc
         */
        getRenderableChildren: function() {
          return [];
        }
      };
    });
  });
