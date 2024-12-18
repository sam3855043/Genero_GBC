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

modulum('FolderWidgetBase', ['WidgetGroupBase'],
  function(context, cls) {

    /**
     * Folder widget base class.
     * @class FolderWidgetBase
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc Widgets
     */
    cls.FolderWidgetBase = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.FolderWidgetBase.prototype */ {
        __name: "FolderWidgetBase",

        /** @type {boolean} */
        __virtual: true,

        /** @type {String} */
        __dataContentPlaceholderSelector: ".containerElement",

        /**
         * @type {classes.PageWidget}
         */
        _currentPage: null,
        /**
         * @type {Function}
         */
        _onLayoutUnbindHandler: null,
        /**
         * is true if folder only contains current page in DOM
         * @type {boolean}
         */
        isMinified: false,
        /**
         * @type {Boolean}
         */
        _isLateRendering: false,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this.isMinified && this._layoutEngine) {
            this._onLayoutUnbindHandler = this._layoutEngine.onLayoutApplied(this._afterLayout.bind(this));
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._onLayoutUnbindHandler) {
            this._onLayoutUnbindHandler();
            this._onLayoutUnbindHandler = null;
          }

          $super.destroy.call(this);
        },

        /**
         *  @inheritDoc
         */
        addChildWidget: function(widget, options) {
          if (!widget.isInstanceOf(cls.PageWidget)) {
            throw new Error("Only PageWidgets can be added in FolderWidgetBase");
          }
          options = options || {};
          options.noDOMInsert = options.noDOMInsert || this.isMinified;
          $super.addChildWidget.call(this, widget, options);
          /** @type classes.PageWidget */
          const pageWidget = widget;
          if (this.isMinified) {
            this.getContainerElement().appendChild(pageWidget.getReplacer());
          }

          if (this._children.length === 1) {
            // First page to be added, set it as current, false to prevent action on initial rendering
            this.setCurrentPage(pageWidget, false);
          }
        },

        /**
         * @inheritDoc
         */
        removeChildWidget: function(widget) {
          /** @type classes.PageWidget */
          const pageWidget = widget;

          let nextCurrentIndex = -1;

          if (pageWidget === this.getCurrentPage()) {
            this._currentPage = null;
            nextCurrentIndex = this._children.indexOf(pageWidget);
            if (nextCurrentIndex >= this._children.length - 1) {
              nextCurrentIndex = this._children.length - 2;
            }
          }
          if (pageWidget.getTitleWidget()) {
            pageWidget.getTitleWidget().getElement().remove();
          }

          pageWidget.getElement().remove();

          $super.removeChildWidget.call(this, pageWidget);

          if (this._children.length && nextCurrentIndex !== -1) {
            this.setCurrentPage(this._children[nextCurrentIndex], false);
          }
        },

        /**
         * Insert all folder pages in DOM
         */
        addPagesInDom: function() {
          if (!this._isLateRendering) {
            for (const page of this.getChildren()) {
              if (page !== this.getCurrentPage() && !page.hasChildWebComponent()) {
                page.addInDom();
              }
            }
            this.isMinified = false;
          }
        },

        _afterLayout: function() {
          // todo replace 3s timer with hook which listen to all Image currently being loading and remove pages from dom once all child images are loaded
          this._registerTimeout(this.removePagesFromDom.bind(this), 2000);
        },

        removePagesFromDom: function() {
          if (!this._isLateRendering) {
            if (!this.isMinified) {
              for (const page of this.getChildren()) {
                if (page !== this.getCurrentPage() && !page.hasChildWebComponent()) {
                  page.removeFromDom();
                }
              }
            }
            this.isMinified = true;
          }
        },

        /**
         *  Click on title handler.
         *  @param {classes.PageWidget} page - page corresponding to the title
         */
        onTitleClick: function(page) {
          // False parameter to prevent action (will be triggered on page click)
          if (this.setCurrentPage(page, false, true)) {
            this.emit(context.constants.widgetEvents.requestFocus);
          }
        },

        /**
         * Get the current page
         * @returns {classes.PageWidget} the current page
         * @publicdoc
         */
        getCurrentPage: function() {
          return this._currentPage;
        },

        /**
         * Defines the current displayed page
         * @param {classes.PageWidget} page - the new current page
         * @param {boolean} [executeAction] - execute action of page
         * @param {boolean} [fromUserAction] - true if page change comes from a user action (mouse click for ex)
         * @return {boolean} true if the page has changed
         * @publicdoc
         */
        setCurrentPage: function(page, executeAction = false, fromUserAction = false) {
          // TODO - ensuring not to set hidden page as current page might break huge screens
          // TODO - has to deal with VisibleIdVMBehavior order in apply behaviors
          if (this._currentPage !== page /* && !page.isHidden()*/ ) {
            for (const child of this._children) {
              child.getTitleWidget().setCurrent(child === page);
            }
            if (this._currentPage) {
              // do not remove page from dom if not measured yet or if it contains a WebComponent
              if (this.isMinified && !this._currentPage.hasChildWebComponent()) {
                this._currentPage.removeFromDom();
              }
              this._currentPage.removeClass("currentPage");
              this._currentPage.disable();
            }
            this._currentPage = page;
            if (!this._currentPage.getLayoutEngine().needMeasure()) {
              this._currentPage.addClass("currentPage");
            }
            if (this.isMinified && !this._currentPage.hasChildWebComponent()) {
              this._currentPage.addInDom();
            }

            this._currentPage.activate();
            if (page) {
              this.getLayoutEngine().invalidateAllocatedSpace();
            }

            this.emit(context.constants.widgetEvents.change, page, executeAction, fromUserAction);

            return true;
          }
          return false;
        },

        /**
         * Refresh the current page using VM focused widget or using first visible page otherwise
         * @publicdoc
         */
        updateCurrentPage: function() {
          const focusedWidget = this.getUserInterfaceWidget().getFocusedWidget();
          const focusedWidgetIsPage = Boolean(focusedWidget) && focusedWidget instanceof cls.PageWidget;
          if (focusedWidgetIsPage && !focusedWidget.isHidden()) {
            this.setCurrentPage(focusedWidget);
          } else {
            let firstVisiblePage = null;
            if (this._children) {
              for (const page of this._children) {
                if (!page.isHidden()) {
                  if (!firstVisiblePage) {
                    firstVisiblePage = page;
                  }
                  if (focusedWidget && !focusedWidgetIsPage && focusedWidget.isChildOf(page)) {
                    this.setCurrentPage(page);
                    firstVisiblePage = null;
                    break;
                  }
                }
              }
            }
            if (firstVisiblePage) {
              // false parameter to not execute action in this case
              this.setCurrentPage(firstVisiblePage, false);
            }
          }
        },

        /**
         * Returns the number of page in the folder
         * @return {number} page count
         * @publicdoc
         */
        getPageCount: function() {
          return this._children.length;
        },

        /**
         * Returns the number of visible page in the folder
         * @return {number} visible page count
         * @publicdoc
         */
        getVisiblePageCount: function() {
          let count = 0;
          for (const page of this._children) {
            if (!page.isHidden()) {
              count++;
            }
          }
          return count;
        },

        /**
         * Look for a parent page widget
         * @returns {classes.PageWidget} page widget
         * @publicdoc
         */
        getParentPage: function() {
          let result = this.getParentWidget();
          while (result) {
            if (result.isInstanceOf(gbc.classes.PageWidget)) {
              return result;
            }
            result = result.getParentWidget();
          }
          return null;
        },

        /**
         * @inheritDoc
         */
        setHidden: function(hidden) {
          if (this._hidden !== Boolean(hidden)) {
            $super.setHidden.call(this, hidden);
            const parent = this.getParentWidget();
            if (parent && parent.getGestureService && parent.getGestureService()) {
              const gestureService = parent.getGestureService();
              if (gestureService.hasDots()) {
                gestureService.refreshDots();
              }
              if (gestureService.hasArrows()) {
                gestureService.refreshArrows();
              }
            }
          }
        }

      };
    });
  });
