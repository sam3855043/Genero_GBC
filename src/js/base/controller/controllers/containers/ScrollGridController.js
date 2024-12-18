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

modulum('ScrollGridController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class ScrollGridController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.ScrollGridController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.ScrollGridController.prototype */ {
        __name: "ScrollGridController",
        /** @type {?classes.ScrollGridLineController[]} */
        _lineControllers: null,
        /** @type {?boolean} */
        _isPagedScrollGrid: null,

        /** @type {function} */
        _requestFocusHandler: null,

        /**
         * @inheritdoc
         */
        constructor: function(bindings) {
          $super.constructor.call(this, bindings);

          this._requestFocusHandler = this.getWidget().when(context.constants.widgetEvents.requestFocus, this._onRequestFocus.bind(this));
        },

        /**
         * @inheritdoc
         */
        destroy: function() {
          if (this._requestFocusHandler) {
            this._requestFocusHandler();
            this._requestFocusHandler = null;
          }
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          if (this._ensureSupportedPagedScrollGrid()) {
            const isStretchable = this.getAnchorNode().attribute("wantFixedPageSize") === 0;
            this.nativeVerticalScroll = isStretchable;

            if (isStretchable) {
              this._lineControllers = [];
            }

            // These behaviors should stay added at first
            // WARNING : DO NOT ADD BEHAVIORS BEFORE
            this._addBehavior(cls.LayoutInfoVMBehavior);
            this._addBehavior(cls.StyleVMBehavior);
            // END WARNING

            // pseudo-selector behaviors
            this._addBehavior(cls.ActivePseudoSelectorBehavior);

            // vm behaviors
            this._addBehavior(cls.EnabledVMBehavior);
            this._addBehavior(cls.HiddenVMBehavior);
            this._addBehavior(cls.BackgroundColorVMBehavior);
            this._addBehavior(cls.FontFamilyVMBehavior);
            if (isStretchable) {
              this._addBehavior(cls.NativeScrollVMBehavior);
              this._addBehavior(cls.StretchableScrollGridPageSizeVMBehavior);
            } else {
              this._addBehavior(cls.ScrollVMBehavior);
            }
            if (this.isPagedScrollGrid()) {
              this._addBehavior(cls.PagedScrollGridCurrentRowVMBehavior);
            } else {
              this._addBehavior(cls.CurrentRowVMBehavior);
            }

            // 4st behaviors
            this._addBehavior(cls.Reverse4STBehavior);
            this._addBehavior(cls.RowActionTrigger4STBehavior);
            this._addBehavior(cls.Border4STBehavior);
            if (isStretchable) {
              this._addBehavior(cls.RowAspect4STBehavior);
              this._addBehavior(cls.ItemsAlignment4STBehavior);
              this._addBehavior(cls.ReduceFilter4STBehavior);
            }
            this._addBehavior(cls.Highlight4STBehavior);

            //ui behaviors
            this._addBehavior(cls.RowActionUIBehavior);
            this._addBehavior(cls.RowAndSelectionUIBehavior);
            if (this.isPagedScrollGrid()) {
              this._addBehavior(cls.OnLayoutPagedUIBehavior);
              this._addBehavior(cls.ScrollOffsetUIBehavior);
            } else if (isStretchable) {
              this._addBehavior(cls.NativeScrollUIBehavior);
              this._addBehavior(cls.OnLayoutUIBehavior);
              this._addBehavior(cls.RowBoundUIBehavior);
              this._addBehavior(cls.HaveRowActionsVMBehavior);
            } else {
              this._addBehavior(cls.ScrollUIBehavior);
            }
          }
        },

        /**
         * @inheritDoc
         */
        _createWidget: function(type) {
          let parentPageWidget = null;
          const uiWidget = this.getUINode().getController().getWidget();
          const wantFixedPageSize = this.getAnchorNode().attribute("wantFixedPageSize") !== 0;
          const widgetKind = wantFixedPageSize ? 'ScrollGrid' : 'StretchableScrollGrid';
          const parentPageNode = this.getAnchorNode().getAncestor("Page");
          if (parentPageNode) {
            parentPageWidget = parentPageNode.getController().getWidget();
          }
          return cls.WidgetFactory.createWidget(widgetKind, {
            appHash: this.getAnchorNode().getApplication().applicationHash,
            appWidget: this.getAnchorNode().getApplication().getUI().getWidget(),
            auiTag: this.getAnchorNode().getId(),
            uiWidget: uiWidget,
            folderPageWidget: parentPageWidget
          }, this.getAnchorNode());
        },

        /**
         * @inheritDoc
         */
        sendWidgetValue: function(newValue = null) {
          const ui = this.getUINode();
          const focusedNode = ui.getApplication().getNode(ui.attribute('focus'));
          const focusedWidgetController = focusedNode.getController();
          focusedWidgetController.sendWidgetValue(newValue);
        },

        /**
         * Add a ScrollGrid line controller
         * @param {classes.ScrollGridLineController} lineController
         */
        pushLineController: function(lineController) {
          this._lineControllers.push(lineController);
        },

        /**
         * Removes the last ScrollGrid line controller
         * @returns {classes.ScrollGridLineController}
         */
        popLineController: function() {
          return this._lineControllers.pop();
        },

        /**
         * @param {number} index index of the line controller
         * @returns {classes.ScrollGridLineController} the line controller
         */
        getLineController: function(index) {
          return this._lineControllers[index];
        },

        /**
         * @returns {number} the number of line controllers
         */
        getLineControllersCount: function() {
          return this._lineControllers.length;
        },

        /**
         * @returns {number} the current row of the scrollgrid node
         */
        getCurrentRow: function() {
          return this.getAnchorNode().attribute("currentRow");
        },

        getOffset: function() {
          return this.getAnchorNode().attribute("offset");
        },

        /**
         * @return {boolean} true if this is a paged ScrollGrid
         */
        isPagedScrollGrid: function() {
          if (this._isPagedScrollGrid === null && this.getAnchorNode()) {
            const anchorNode = this.getAnchorNode();
            this._isPagedScrollGrid = anchorNode._initialStyleAttributes.customWidget === "pagedScrollGrid" && anchorNode.attribute(
              "wantFixedPageSize") === 0;
          }
          return this._isPagedScrollGrid;
        },

        /**
         * @return {boolean} true if this is a paged ScrollGrid
         */
        _ensureSupportedPagedScrollGrid: function() {
          const anchorNode = this.getAnchorNode();
          if (anchorNode) {
            if (anchorNode._initialStyleAttributes.customWidget === "pagedScrollGrid" && anchorNode.attribute(
                "wantFixedPageSize") === 1) {
              const app = anchorNode && anchorNode.getApplication();
              app.dvm.onOrdersManaged(function(app) {
                if (app) {
                  app.close();
                  app.stop("Paged Scrollgrid widget not supported with a Fixed page size");
                }
              }.bind(this, app), true);
              return false;
            }
          }
          return true;
        },

        /**
         * @inheritDoc
         */
        ensureVisible: function(executeAction) {
          const widget = this.getAnchorNode().getWidget();
          widget.emit(context.constants.widgetEvents.splitViewChange, widget);
          return $super.ensureVisible.call(this, executeAction);
        },

        /**
         * Show filter in chrome bar.
         */
        showReduceFilter: function() {
          let widget = this.getWidget();
          if (widget.hasReduceFilter) {
            let showFilter = widget.hasReduceFilter();
            // show filter menu item from chrome bar
            let filterAttribute = this.getAnchorNode().attribute("filter");
            this.getUINode().getController().getWidget().showChromeBarFilterMenuItem(showFilter, filterAttribute);
          }
        },

        /**
         * Bound to the scrollgrid widget RequestFocus method
         * @param {*} event 
         */
        _onRequestFocus: function(event) {
          let currentRow = event.data[0]?.currentRow;
          if (currentRow === undefined) {
            currentRow = -1;
          }
          this.getAnchorNode().getApplication().scheduler.focusVMCommand(this.getAnchorNode(), 0, 0, currentRow);
        }
      };
    });
    cls.ControllerFactory.register("ScrollGrid", cls.ScrollGridController);

  });
