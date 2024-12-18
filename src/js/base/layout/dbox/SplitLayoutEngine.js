/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('SplitLayoutEngine', ['LayoutEngineBase'],
  function(context, cls) {
    /**
     * @class SplitLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.SplitLayoutEngine = context.oo.Class(cls.LayoutEngineBase, function($super) {
      return /** @lends classes.SplitLayoutEngine.prototype */ {
        __name: "SplitLayoutEngine",
        /**
         * registered children widgets
         * @type {classes.WidgetBase[]}
         * @protected
         */
        _registeredWidgets: null,
        /**
         * stylesheet id
         * @protected
         */
        _styleSheetId: null,
        /**
         * @inheritDoc
         * @constructs
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);
          this._styleSheetId = "boxLayout_" + widget.getUniqueIdentifier();
          this._registeredWidgets = [];
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          for (let i = this._registeredWidgets.length - 1; i > -1; i--) {
            const wi = this._registeredWidgets[i];
            wi.destroy();
            this.unregisterChild(wi);
          }
          this._registeredWidgets.length = 0;
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        resetSizes: function() {
          $super.resetSizes.call(this);
          this._getLayoutInfo().setPreferred(0, 0);
        },

        /**
         * Refresh the child widgets layout
         */
        refreshLayout: function() {
          const session = context.SessionService.getCurrent();
          let app = session && session.getCurrentApplication();
          if (app && app.layout) {
            app.scheduler.layoutCommand({
              resize: true
            });
          }
        },

        /**
         * @inheritDoc
         */
        registerChild: function(widget) {
          if (!(widget instanceof cls.SplitterWidget)) {
            if (this._registeredWidgets.indexOf(widget) === -1) {
              this._registeredWidgets.push(widget);
            }
          }
        },

        /**
         * @inheritDoc
         */
        unregisterChild: function(widget) {
          this._registeredWidgets.remove(widget);
        },

        /**
         * Get list of all registered widget being a SplitView item
         * @returns {classes.WidgetBase[]}
         */
        getRegisteredWidgets: function() {
          return this._registeredWidgets;
        },

        /**
         * @inheritDoc
         */
        adjustMeasure: function() {
          const layoutInfo = this._getLayoutInfo();
          const availWidth = layoutInfo.getAvailable().getWidth();
          const availHeight = layoutInfo.getAvailable().getHeight();
          const decoratingWidth = layoutInfo.getDecorating().getWidth();
          const decoratingHeight = layoutInfo.getDecorating().getHeight();
          const width = availWidth - decoratingWidth;
          const height = availHeight - decoratingHeight;

          for (const element of this._registeredWidgets) {
            const widgetInfo = this._getLayoutInfo(element);
            widgetInfo.setAvailable(width, height);
            widgetInfo.setAllocated(width, height);
          }
          layoutInfo.setAllocated(width, height);
        },

        /**
         * @inheritDoc
         */
        prepareApplyLayout: function() {
          const layoutInfo = this._getLayoutInfo();

          this._styleRules[".g_measured #w_" + this._widget.getUniqueIdentifier() + ".g_measureable>.splitViewContent"] = {
            height: layoutInfo.getAllocated().getHeight() + "px",
            width: layoutInfo.getAllocated().getWidth() + "px",
            top: layoutInfo.getDecoratingOffset().getHeight() + "px",
            left: layoutInfo.getDecoratingOffset().getWidth() + "px"
          };
          this._styleRules[".g_measured #w_" + this._widget.getUniqueIdentifier() +
            ".g_measureable>.splitViewContent>.containerElement"] = {
            height: layoutInfo.getAllocated().getHeight() + "px",
            width: layoutInfo.getAllocated().getWidth() + "px"
          };
        },

        /**
         * @inheritDoc
         */
        applyLayout: function() {
          context.styler.appendStyleSheet(this._styleRules, this._styleSheetId, true, this.getLayoutSheetId());
        },
      };
    });
  });
