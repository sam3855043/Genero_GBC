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

modulum('FolderWidget', ['FolderWidgetBase'],
  function(context, cls) {

    /**
     * Folder widget.
     * @class FolderWidget
     * @memberOf classes
     * @extends classes.FolderWidgetBase
     * @publicdoc Widgets
     */
    cls.FolderWidget = context.oo.Class(cls.FolderWidgetBase, function($super) {
      return /** @lends classes.FolderWidget.prototype */ {
        __name: "FolderWidget",

        /** @type {Element} */
        _tabsTitlesHostElement: null,
        /** @type {Element} */
        _tabsTitlesElement: null,
        /** @type {Element} */
        _tabsItemsContainer: null,
        /** @type {String} */
        _tabsPosition: "top",
        /** @type {classes.ScrollTabDecorator} */
        _scroller: null,
        /** @type {classes.GestureService} */
        _gesture: null,
        /** @type {Element} */
        _tabIndicator: null,
        /** @type {Function} */
        _swipeEndHandler: null,
        /** @type {Number} */
        _lastPos: 0,
        /** @type {?Boolean} */
        _noSwipe: null,
        /** @type {Boolean} */
        _navigationArrows: false,
        /** @type {Boolean} */
        _navigationDots: false,
        /** @type {Number} */
        _lastIndex: null,

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          this._layoutInformation = new cls.FolderLayoutInformation(this);
          this._layoutEngine = new cls.FolderLayoutEngine(this);

          $super._initLayout.call(this);
        },

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);
          this._tabsTitlesHostElement = this._element.getElementsByClassName("mt-tab-titles")[0];
          this._tabsTitlesElement = this._element.getElementsByClassName("mt-tab-titles-container")[0];
          this._tabsItemsContainer = this._element.getElementsByClassName("mt-tab-items-container")[0];
          this._tabIndicator = this._element.getElementsByClassName("tab-current-indicator")[0];

          this._scroller = new cls.ScrollTabDecorator(this);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._noSwipe = null;
          if (this._swipeEndHandler) {
            this._swipeEndHandler();
            this._swipeEndHandler = null;
          }
          if (this._onParentActivationHandler) {
            this._onParentActivationHandler();
            this._onParentActivationHandler = null;
          }
          if (this._gesture) {
            this._gesture.destroy();
            this._gesture = null;
          }

          if (this._scroller) {
            this._scroller.destroy();
            this._scroller = null;
          }
          if (this._tabsTitlesHostElement) {
            this._tabsTitlesHostElement = null;
          }
          if (this._tabsTitlesElement) {
            this._tabsTitlesElement = null;
          }
          if (this._tabIndicator) {
            this._tabIndicator = null;
          }
          this._lastPos = 0;
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {
          /** @type classes.PageWidget */
          const pageWidget = widget;

          const titleWidget = pageWidget.getTitleWidget();
          this._tabsTitlesElement.appendChild(titleWidget.getElement());

          $super.addChildWidget.call(this, pageWidget, options);
        },

        /**
         * @inheritDoc
         */
        _afterLayout: function() {
          $super._afterLayout.call(this);
          // update page title underline indicator
          this._updateCurrentTabIndicator(this.getCurrentPage().getTitleWidget());
          if (this._gesture) {
            // scroll to corresponding page without any delay
            this._gesture.swipeTo(this.getCurrentPage(), {
              smoothEffect: false,
              noDelay: true
            });
          }
        },

        /**
         * @inheritDoc
         */
        removeChildWidget: function(widget) {
          const oldPage = this.getCurrentPage();
          $super.removeChildWidget.call(this, widget);
          // Update indicator when current page doesn't change or when there is no more page.
          // In all cases indicator has already been updated during new page being set
          if (!this._children.length) { // no more page and indicator to display
            this._updateCurrentTabIndicator(null);
          } else if (this.getCurrentPage() === oldPage) { // current page didn't change but its position did so does the indicator
            this._updateCurrentTabIndicator(this.getCurrentPage().getTitleWidget());
          }
        },

        /**
         * @inheritDoc
         */
        manageLocalAction: function(localActionName) {

          let newPageIndex = null;
          if (localActionName === "prevtab") {
            newPageIndex = this._lastIndex > 0 ? this._lastIndex - 1 : null;
          } else if (localActionName === "nexttab") {
            newPageIndex = this._lastIndex < this.getVisibleChildren().length - 1 ? this._lastIndex + 1 : null;
          }

          if (newPageIndex !== null) {
            const newPage = /** @type {classes.PageWidget} */ this.getVisibleChildren()[newPageIndex];
            this.onTitleClick(newPage);
          }
        },

        /**
         * @inheritDoc
         */
        setCurrentPage: function(page, executeAction, fromUserAction = false) {
          const modified = $super.setCurrentPage.call(this, page, executeAction, fromUserAction);
          if (modified) {
            this.scrollTo(this._currentPage);

            this._lastIndex = page.getPageIndex();
            // update page title underline indicator
            this._updateCurrentTabIndicator(page.getTitleWidget());

            if (this._gesture) {
              // scroll to corresponding page
              this._gesture.swipeTo(page, {
                smoothEffect: false
              });
            }
          }

          return modified;
        },

        /**
         * Gets the tabs titles host element
         * @returns {Element} the element
         */
        getTabsTitlesHostElement: function() {
          return this._tabsTitlesHostElement;
        },

        /**
         * Get tabs position
         * @return {string} tabs pos: top, right, bottom, left
         * @publicdoc
         */
        getTabsPosition: function() {
          return this._tabsPosition;
        },

        /**
         * Gets the tab scroller
         * @returns {classes.ScrollTabDecorator} the element
         */
        getScroller: function() {
          return this._scroller;
        },

        /**
         * Set the tabs position
         * @param {string} position - could be top, right, bottom or left
         * @publicdoc
         */
        setTabPosition: function(position) {
          if (["top", "bottom", "left", "right"].indexOf(position) < 0) {
            position = "top";
          }
          this._element.setAttribute("__FolderWidget", position);
          this._scroller.updatePosition("__FolderWidget", position);

          this._tabsPosition = position;
        },

        /**
         * Go to the given page
         * @param {classes.PageWidget} page - page to navigate to
         * @publicdoc
         */
        scrollTo: function(page) {
          const title = page && page.getTitleWidget();
          if (title) {
            this._scroller.scrollTo(title.getElement());
          }
          this._scroller.refreshScrollers();
        },

        /**
         * Update visibility of scrollers
         */
        updateScrollersVisibility: function() {
          const isVertical = ["left", "right"].indexOf(this._tabsPosition) >= 0;
          const isHorizontal = ["top", "bottom"].indexOf(this._tabsPosition) >= 0;
          const sizeAttr = isVertical ? "height" : isHorizontal ? "width" : false;
          const info = this.getLayoutInformation();

          if (sizeAttr && this._scroller) {
            // Check if there is space enough to display the full bar or need scrolling
            const tabsTitlesSize = this.getChildren().map(function(item) {
              return item.isHidden() ? 0 :
                item.getLayoutInformation()[isHorizontal ? "getTitleMeasureWidth" : "getTitleMeasureHeight"]();
            }).reduce(function(next, prev) {
              return next + prev;
            }, 0);
            const tabsTitlesHostSize = this._getAllocatedSize(isHorizontal) -
              info[isHorizontal ? "getTitlesContainerDeltaWidth" : "getTitlesContainerDeltaHeight"]();

            if (tabsTitlesHostSize <= tabsTitlesSize) {
              this._scroller.showScroller(true);
            } else {
              this._scroller.showScroller(false);
            }
          }
        },

        /**
         * get the corrent allocated size
         * @param isHorizontal is horizontal
         * @returns {number}
         * @protected
         */
        _getAllocatedSize: function(isHorizontal) {
          const info = this.getLayoutInformation();
          return info.getAllocated()[isHorizontal ? "getWidth" : "getHeight"]();
        },

        /**
         * Update current page title underline indicator
         * @param pageTitle
         * @param distance
         * @param index
         * @private
         */
        _updateCurrentTabIndicator: function(pageTitle, distance, index) {
          if (this._tabIndicator) {
            this.afterDomMutator(function(pageTitle, distance, index) {
              if (this._tabIndicator) {
                if ((!pageTitle && distance === undefined) || !this.getVisibleChildren().length || !this.getCurrentPage()) {
                  this._tabIndicator.style.setProperty("--height", 'auto');
                  this._tabIndicator.style.setProperty("--width", 'auto');
                } else {
                  let scrollRatio = distance / this.getContainerElement().offsetWidth;
                  if (this.isReversed()) { // manage RTL mode
                    scrollRatio *= -1;
                  }
                  let nextTitleToFocus = null;
                  let startingPos = null;
                  let nextPos = null;

                  const nextPageTryingToFocus = this.getVisibleChildren()[this.getCurrentPage().getPageIndex() + index];
                  if (nextPageTryingToFocus) {
                    nextTitleToFocus = nextPageTryingToFocus.getTitleWidget();
                  }

                  if (this.getTabsPosition() === "left" || this.getTabsPosition() === "right") {
                    if (pageTitle) { // update indicator position according to new focused page title
                      this._tabIndicator.style.setProperty("--top", pageTitle.getElement().offsetTop + 'px');
                      this._tabIndicator.style.setProperty("--height", pageTitle.getElement().offsetHeight + 'px');
                      this._tabIndicator.style.setProperty("--left", 'auto');
                      this._tabIndicator.style.setProperty("--width", '2px');
                    } else { // update indicator position depending of scroll ratio (updated during scroll)
                      if (nextTitleToFocus) {
                        startingPos = this.getCurrentPage().getTitleWidget().getElement().offsetTop;
                        nextPos = Math.round(startingPos + (scrollRatio * Math.abs(startingPos - nextTitleToFocus.getElement()
                          .offsetTop)));
                        if (this._lastPos !== nextPos) {
                          this._tabIndicator.style.setProperty("--top", nextPos + 'px');
                          this._lastPos = nextPos;
                        }
                      }
                    }
                  } else {
                    if (pageTitle) { // update indicator position according to new focused page title
                      this._tabIndicator.style.setProperty("--top", 'auto');
                      this._tabIndicator.style.setProperty("--height", '2px');
                      this._tabIndicator.style.setProperty("--width", pageTitle.getElement().offsetWidth + 'px');
                      this._tabIndicator.style.setProperty("--left", pageTitle.getElement().offsetLeft + 'px');
                    } else { // update indicator position depending of scroll ratio (updated during scroll)
                      if (nextTitleToFocus) {
                        startingPos = this.getCurrentPage().getTitleWidget().getElement().offsetLeft;
                        nextPos = Math.round(startingPos + (scrollRatio * Math.abs(startingPos - nextTitleToFocus.getElement()
                          .offsetLeft)));
                        if (this._lastPos !== nextPos) {
                          this._tabIndicator.style.setProperty("--left", nextPos + 'px');
                          this._lastPos = nextPos;
                        }
                      }
                    }
                  }
                }
              }
            }.bind(this, pageTitle, distance, index));
          }
        },

        // SWIPE

        /**
         * Set NoSwipe attribute value and enable/disable swipe gestures
         * @param noSwipe
         */
        setNoSwipe: function(noSwipe) {
          if (this._noSwipe !== noSwipe) {
            this._noSwipe = noSwipe;
            const canSwipe = this.isSwipeable();
            if (this._gesture && !canSwipe) {
              this._gesture.removeTouch();
            } else {
              this.enableSwipe();
            }
          }
        },

        /**
         * Enable/disable navigation Arrows 4ST attribute
         * @param active
         */
        setNavigationArrows: function(active) {
          this._navigationArrows = active;
          if (this._gesture) {
            if (active) {
              this._gesture.addArrows();
            } else {
              this._gesture.removeArrows();
            }
          }
        },

        /**
         * Enable/disable navigation dots 4ST attribute
         * @param active
         */
        setNavigationDots: function(active) {
          this._navigationDots = active;
          if (this._gesture) {
            if (active) {
              this._gesture.addDots();
            } else {
              this._gesture.removeDots();
            }
          }
        },

        /**
         * Determine if swipe gestures are supported on current device
         * @returns {*}
         */
        isSwipeable: function() {
          return window.isTouchDevice() && !this._noSwipe;
        },

        /**
         * Enable swipe functionality on folder pages
         */
        enableSwipe: function() {
          if (!this._gesture) {
            this._parentPage = this.getParentPage();
            if (this._parentPage) {
              this._onParentActivationHandler = this._parentPage.onActivate(this._initSwipe.bind(this));
            } else {
              this._initSwipe();
            }

            this._swipeEndHandler = this.when(context.constants.widgetEvents.swipeEnd, function(event, domEvent, index) {
              if (this._lastIndex !== index) {
                const newPage = this.getVisibleChildren()[index];
                newPage.emit(context.constants.widgetEvents.click, event);

                this.onTitleClick(newPage);

              }
            }.bind(this));
          } else {
            this._gesture.addTouch();
          }
        },

        /**
         * Disable swipe functionality on folder pages
         */
        disableSwipe: function() {
          if (this._gesture) {
            this._gesture.removeTouch();
          }
        },

        /**
         * Create a new swipe instance using GestureService
         * @private
         */
        _initSwipe: function() {
          if (this._onParentActivationHandler) {
            this._onParentActivationHandler();
            this._onParentActivationHandler = null;
          }
          const params = {
            noSwipe: !this.isSwipeable(),
            arrows: this._navigationArrows,
            dots: this._navigationDots,
            virtualDom: true,
            moveCallback: this._updateCurrentTabIndicator
          };
          this._gesture = new cls.GestureService(this, params);
        },

        /**
         * Set rendering mode.
         * By default, we load and measure all folder pages.
         * If lateRendering is true then we only load and measure current page.
         * @param lateRendering
         */
        setLateRendering: function(lateRendering) {
          this._isLateRendering = lateRendering;
          if (this._isLateRendering) {
            this.isMinified = true;
          }
        },

        /**
         * Get the widget gesture service
         * @return {classes.GestureService}
         */
        getGestureService: function() {
          return this._gesture;
        }

      };
    });
    cls.WidgetFactory.registerBuilder('Folder', cls.FolderWidget);
  });
