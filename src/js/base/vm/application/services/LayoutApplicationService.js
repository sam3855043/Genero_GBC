/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('LayoutApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory', 'LayoutInvalidationService'],
  function(context, cls) {
    /**
     * @class LayoutApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.LayoutApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.LayoutApplicationService.prototype */ {
        __name: "LayoutApplicationService",

        /**
         * flag to identify layout from resizing
         * @type {boolean}
         */
        _resizing: false,

        /**
         * flag to detect if document is visible (and not running layout computing if not)
         * @type {boolean}
         */
        _documentIsVisible: true,

        /**
         * invalidation number
         * index to compare to measure and allocated space invalidations
         * Used to filter and optimize layout traversal.
         * @type {number}
         */
        _lastInvalidated: 0,

        /**
         * Handle to watch document visibility changes.
         * @type {HandleRegistration}
         */
        _visibilityChangeHandler: null,

        /**
         * flag to know if layout is currently idle.
         * @type {boolean}
         */
        _idle: true,

        /**
         * flag to know if a bonus (adjustMeasure - adjustStretchability - prepareApplyLayout) is needed
         * @type {boolean}
         */
        _backLayout: false,

        /**
         * Only in gbc.qaMode, count the number of layout
         * @type {number}
         */
        _qaLayoutCount: 0,

        /**
         * @inheritDoc
         */
        constructor: function(app) {
          $super.constructor.call(this, app);
          this._updateDocumentVisibility();
          this._visibilityChangeHandler = context.InitService.when(
            context.constants.widgetEvents.visibilityChange,
            this._updateDocumentVisibility.bind(this)
          );
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._visibilityChangeHandler) {
            this._visibilityChangeHandler();
            this._visibilityChangeHandler = null;
          }
          $super.destroy.call(this);
        },

        /**
         * update document visibility info and run layout if needed
         * @private
         */
        _updateDocumentVisibility: function() {
          this._documentIsVisible = !document.hidden;
          if (this._documentIsVisible && this._application.scheduler) {
            this._application.scheduler.layoutCommand();
          }
        },

        /**
         * reset all layout and rerun it
         */
        reset: function() {
          this._application.getUI().getWidget().getLayoutEngine().reset(true);
          this._registerAnimationFrame(function() {
            this._updateDocumentVisibility();
          }.bind(this));
        },

        /**
         * request a layout refresh
         * @param {Object} [options] options to pass
         * @param {boolean} [options.resize] true if invoked by window resize
         * @param {boolean} [options.noLayout] true if layout must not be done
         */
        refreshLayout: function(options) {
          options = options || {};
          this._idle = false;
          this._resizing = Boolean(options.resize);
          if (this._resizing && this._application && this._application.getUI()) {
            this._application.getUI().getWidget().getLayoutEngine().invalidateAllocatedSpace();
          }

          if (this._application) {
            this._executeLayout(Boolean(options.noLayout));
          }
        },

        /**
         * get a list of all children of the given widget that will be renderable
         * @param {classes.WidgetBase} widget the widget
         * @return {classes.WidgetBase[]} a list of renderable children
         */
        _internalChildrenSelector: function(widget) {
          let result = [];
          if (widget && !widget.isHidden()) {
            result = widget.getLayoutEngine() && widget.getLayoutEngine().getRenderableChildren() || [];
          }
          return result;
        },

        /**
         * run the whole layout algorithm
         * @param {boolean} noLayout if true the layout is not executed but the signals are sent
         * @private
         */
        _executeLayout: function(noLayout) {
          let documentConsideredAsVisible = this._documentIsVisible;
          gbc.LogService.ui.log("LayoutApplicationService - execute layout - noLayout=" + noLayout);

          // DocumentVisibility API seems not to be well implemented on android webview, this should do the trick
          if (!documentConsideredAsVisible && (window.gbcWrapper.isGMA())) {
            const appUI = this._application.getUI();
            const appDimensions = appUI.getWidget().getElement().getBoundingClientRect();
            if (appDimensions.width > 0 && appDimensions.height > 0) {
              gbc.LogService.ui.log(
                "DocumentVisibility API override, consider as visible as we are hosted by GMA and application's widget has a size");
              documentConsideredAsVisible = true;
            }
          }
          if (!documentConsideredAsVisible) {
            return;
          }
          const app = this._application, // we only get application if document is visible
            node = app?.model?.getNode(0),
            ctrl = node?.getController(),
            widget = ctrl?.getWidget();
          let traversal = null;

          if (widget && document.body.contains(widget.getElement()) && this._application.getUI().isLayoutable()) {
            if (ctrl && noLayout === false) {
              context.styler.bufferize();
              const measureInfo = {
                needMeasureSwitching: false,
                needMeasureWidgets: []
              };

              /// Here we declare the whole scenario to compute Genero layout on the whole application tree
              traversal = new window.Throu(widget);

              /// 1. set a default traversal function to run through the widget tree
              traversal.setChildrenSelector(this._internalChildrenSelector.bind(this));

              /// 2. beforeLayout can be defined on each layout engine
              ///    here is to adapt or initiate layout information
              traversal.pass(this.beforeLayout.bind(this));

              /// 3. walk the whole tree to update layouting information (hidden state, need measure switching)
              traversal.pass(this._refreshLayoutPassHidden.bind(this, measureInfo), false, this._hasChildrenFunction);

              /// 4. switch g_measured to g_measuring css class if needed
              traversal.unique(this._switchMeasuring.bind(this, true, measureInfo));

              /// 5. walk the whole tree (from children to parents) to prepare DOM/values to futures measures
              traversal.pass(this.prepareMeasure.bind(this), true);

              /// 6. walk the whole tree (from children to parents) to measure DOM / set values from DOM measures
              traversal.pass(this.measure.bind(this), true);

              /// 7. walk the whole tree (from children to parents) to adjust measures from children information
              traversal.pass(this.adjustMeasure.bind(this), true);

              /// 8. walk the whole tree (from children to parents) to adjust stretchability indices from children information
              traversal.pass(this.adjustStretchability.bind(this), true);

              /// 9. walk the whole tree (from children to parents) to re-adjust measures from children information
              ///    needed for example to manage auto overflow (change shrink rules if form must overflow in all cases)
              traversal.pass(this.reAdjustMeasure.bind(this), true);

              /// 10. walk the whole tree (from children to parents) to re-adjust stretchability indices from children information
              traversal.pass(this.reAdjustStretchability.bind(this), true);

              /// 11. walk the whole tree to compute space to loss/gain and distsribute it amongst the children
              traversal.pass(this.prepareApplyLayout.bind(this));

              // ### this pass is only done if stack layout has autoscaled image widgets
              ///    12. walk the whole tree (from children to parents) to adjust measures from children information
              traversal.passIf(this.isBackLayoutActivated.bind(this), this.adjustMeasure.bind(this), true);

              ///    13. walk the whole tree (from children to parents) to adjust stretchability indices from children information
              traversal.passIf(this.isBackLayoutActivated.bind(this), this.adjustStretchability.bind(this), true);

              ///    14. walk the whole tree to compute space to loss/gain and distribute it amongst the children
              traversal.passIf(this.isBackLayoutActivated.bind(this), this.prepareApplyLayout.bind(this));
              // ###

              /// 15. walk the whole tree to apply computed sizes to elements
              traversal.pass(this.applyLayout.bind(this));

              /// 16. switch g_measuring to g_measured css class if needed
              traversal.unique(this._switchMeasuring.bind(this, false, measureInfo));

              /// 17. walk the whole tree to notify listeners of g_layoutApplied
              traversal.pass(this.notifyLayoutApplied.bind(this));

              /// 18. update invalidation indices
              traversal.unique(this._updateInvalidation.bind(this));

              // run the declared passes
              traversal.run();

              if (gbc.qaMode) {
                this._qaLayoutCount++;
              }

              context.styler.flush();
              this._resizing = false;
            }

            if (traversal) {
              traversal.destroy();
            }
            this._idle = true;

            this.emit(context.constants.widgetEvents.afterLayout, this._resizing);
          }
        },

        /**
         * update invalidation indice
         * @private
         */
        _updateInvalidation: function() {
          this._lastInvalidated = context.LayoutInvalidationService.nextInvalidation();
        },

        /**
         * get list of children of given widget
         * @param {classes.WidgetBase|classes.WidgetGroupBase} widget the widget
         * @return {null|classes.WidgetBase[]}
         * @private
         */
        _hasChildrenFunction: function(widget) {
          return widget && widget.getChildren && widget.getChildren();
        },

        /**
         * toggle css classes to measure DOM elements
         * @param {boolean} measuring true if measuring
         * @param {{needMeasureSwitching: boolean}} measureInfo data bag
         * @private
         */
        _switchMeasuring: function(measuring, measureInfo) {
          if (measureInfo.needMeasureSwitching && !(
              !measureInfo.needMeasureWidgets.length ||
              (measureInfo.needMeasureWidgets.length === 1 && measureInfo.needMeasureWidgets[0].isInstanceOf(cls.FormWidget))
            )) {
            const rootElement = this._application.getUI().getWidget().getElement();
            if (measuring) {
              rootElement.addClass("g_measuring").removeClass("g_measured");
            } else {
              rootElement.addClass("g_measured").removeClass("g_measuring");
            }
          }
          this._backLayout = false;
        },

        /**
         * call beforeLayout of widget's layout engine
         * @param {classes.WidgetBase} widget the widget
         */
        beforeLayout: function(widget) {
          if (widget?.getLayoutEngine()) {
            widget.getLayoutEngine().beforeLayout();
          }
        },

        /**
         * update layouting information (hidden state, need measure switching)
         * @param {{needMeasureSwitching: boolean}} measureInfo data bag
         * @param {classes.WidgetBase} widget the widget
         * @param {classes.WidgetBase} parentWidget the parent widget
         * @param {Object} traversal
         * @private
         */
        _refreshLayoutPassHidden: function(measureInfo, widget, parentWidget, traversal) { //TODO if only form, no measureSwitching
          const itemLayoutInformation = widget && widget.getLayoutInformation(),
            itemLayoutEngine = widget && widget.getLayoutEngine(),
            parentLayoutInformation = parentWidget && parentWidget.getLayoutInformation();
          if (itemLayoutInformation && itemLayoutEngine && parentLayoutInformation) {
            itemLayoutInformation.__layoutPassHidden = parentLayoutInformation.__layoutPassHidden || !widget.isVisible();
            itemLayoutInformation.__ignoreMeasureInvalidation =
              (parentLayoutInformation.__ignoreMeasureInvalidation) || itemLayoutEngine.ignoreMeasureInvalidation();

            if (
              (!itemLayoutInformation.__ignoreMeasureInvalidation &&
                (itemLayoutEngine.isInvalidatedMeasure(this._lastInvalidated) && itemLayoutEngine.needMeasureSwitching()))
            ) {
              measureInfo.needMeasureWidgets.push(widget);
              measureInfo.needMeasureSwitching = true;
            }
          }
        },

        /**
         * call prepareMeasure of widget's layout engine
         * @param {classes.WidgetBase} widget the widget
         */
        prepareMeasure: function(widget) {
          const layoutEngine = widget.getLayoutEngine();
          if (layoutEngine && layoutEngine.isInvalidatedMeasure(this._lastInvalidated)) {
            layoutEngine.prepareMeasure();
          }
        },

        /**
         * call different measure steps of widget's layout engine
         * @param {classes.WidgetBase} widget the widget
         */
        measure: function(widget) {
          const layoutEngine = widget.getLayoutEngine();
          if (layoutEngine) {
            if (layoutEngine.isInvalidatedMeasure(this._lastInvalidated) && widget.getElement().isInDOM()) {
              layoutEngine.resetSizes(this._lastInvalidated, this);

              if (!widget.ignoreLayout()) {
                layoutEngine.measureChar();
              }
              layoutEngine.DOMMeasure();
              layoutEngine.measureDecoration(this._lastInvalidated, this);
              layoutEngine.measure(this._lastInvalidated, this);
              layoutEngine.afterMeasure(this._lastInvalidated, this);
            }
            if (layoutEngine.isInvalidated(this._lastInvalidated)) {
              layoutEngine.prepareAdjustments();
            }
          }
        },

        /**
         * call adjustMeasure of widget's layout engine
         * @param {classes.WidgetBase} widget
         */
        adjustMeasure: function(widget) {
          const layoutEngine = widget.getLayoutEngine();
          if (layoutEngine && layoutEngine.isInvalidated(this._lastInvalidated)) {
            layoutEngine.adjustMeasure(this._lastInvalidated);
            layoutEngine.afterAdjustMeasure(this._lastInvalidated);
          }
        },

        /**
         * call adjustStretchability of widget's layout engine
         * @param {classes.WidgetBase} widget the widget
         */
        adjustStretchability: function(widget) {
          const layoutEngine = widget.getLayoutEngine();
          if (layoutEngine && layoutEngine.isInvalidated(this._lastInvalidated)) {
            layoutEngine.adjustStretchability(this._lastInvalidated);
          }
        },

        /**
         * call adjustMeasure of widget's layout engine if auto overflow is activated
         * @param {classes.WidgetBase} widget the widget
         */
        reAdjustMeasure: function(widget) {
          if (this.isAutoOverflowActivated(widget)) {
            this.adjustMeasure(widget);
          }
        },

        /**
         * call adjustStretchability of widget's layout engine if auto overflow is activated
         * @param {classes.WidgetBase} widget the widget
         */
        reAdjustStretchability: function(widget) {
          if (this.isAutoOverflowActivated(widget)) {
            this.adjustStretchability(widget);
          }
        },

        /**
         * Check if auto overflow is activated
         * @param {classes.WidgetBase} widget the widget
         * @returns {boolean} if auto overflow is activated on the parent form
         */
        isAutoOverflowActivated: function(widget) {
          const form = widget.getFormWidget();
          const formLayoutEngine = form && form.getLayoutEngine();
          return (!form || !formLayoutEngine ||
            (formLayoutEngine.isAutoOverflowActivated && formLayoutEngine.isAutoOverflowActivated()));
        },

        /**
         * call prepareApplyLayout of widget's layout engine
         * @param {classes.WidgetBase} widget the widget
         */
        prepareApplyLayout: function(widget) {
          const layoutEngine = widget.getLayoutEngine();
          if (layoutEngine && layoutEngine.isInvalidated(this._lastInvalidated)) {
            layoutEngine.prepareApplyLayout(this);
          }
        },

        /**
         * call applyLayout of widget's layout engine
         * @param {classes.WidgetBase} widget the widget
         */
        applyLayout: function(widget) {
          const layoutEngine = widget.getLayoutEngine();
          //Only element in DOM are measured
          if (layoutEngine && layoutEngine.isInvalidated(this._lastInvalidated) &&
            (widget.getElement().isInDOM() || widget.ignoreLayout())) {
            layoutEngine.applyLayout();
            layoutEngine.updateInvalidated(this._lastInvalidated);
          }
        },

        /**
         * call notifyLayoutApplied of widget's layout engine
         * @param {classes.WidgetBase} widget the widget
         */
        notifyLayoutApplied: function(widget) {
          const layoutEngine = widget.getLayoutEngine();
          if (layoutEngine) {
            layoutEngine.notifyLayoutApplied();
          }
        },

        /**
         * activate back layout
         */
        activateBackLayout: function() {
          this._backLayout = true;
        },

        /**
         * return true if back layout is activated
         * @return {boolean} true if back layout is activated
         */
        isBackLayoutActivated: function() {
          return this._backLayout;
        },

        /**
         * return true if layout is not running
         * @return {boolean} true if layout is not running
         */
        isIdle: function() {
          return this._idle;
        },

        /**
         * attach to afterLayout event
         * @param {Function} hook the hook
         * @param {boolean} [once] true to free handle after first call
         * @return {HandleRegistration} the event handle
         */
        afterLayout: function(hook, once) {
          return this.when(context.constants.widgetEvents.afterLayout, hook, once);
        }
      };
    });
    cls.ApplicationServiceFactory.register("Layout", cls.LayoutApplicationService);
  });
