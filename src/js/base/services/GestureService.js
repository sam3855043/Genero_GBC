/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('GestureService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {

    /**
     * Touch gesture management service
     * @class GestureService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.GestureService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.GestureService.prototype */ {
        __name: "GestureService",

        /** @type {Boolean} */
        _hasNativeSmoothScroll: false,
        /** @type {classes.WidgetGroupBase|classes.WidgetBase} */
        _widget: null,
        /** @type {HTMLElement} */
        _widgetContainer: null,
        /** @type {Object} */
        _swipeOpts: null,
        /** @type {HTMLElement} */
        _leftArrow: null,
        /** @type {HTMLElement} */
        _rightArrow: null,
        /** @type {HTMLElement} */
        _dots: null,
        /** @type {Number} */
        _lastDirectionSign: 0,
        /** @type {Number} */
        _lastHorizontalScrollPos: 0,
        /** @type {Function} */
        _postponedScroll: null,
        /** @type {Number} */
        _pastCleanedIndex: -1,
        /** @type {Object} */
        _scrollTimerId: null,
        /** @type {Function} */
        _focusHandler: null,
        /** @type {Function} */
        _focusRestoredHandler: null,

        /**
         * Swipe gesture service constructor
         * @param {classes.WidgetGroupBase|classes.WidgetBase} widget
         * @param {Object} swipeOptions
         * @param {Function} swipeOptions.moveCallback : custom function to execute during swipe
         * @param {boolean} swipeOptions.virtualDom : automatically add/remove hidden elements from DOM. False by default.
         * @param {string} swipeOptions.orientation : swipe direction. 'x' for horizontal, 'y' for vertical. Default is 'x'
         * @param {HTMLElement} swipeOptions.container : DOM element on which all events and css are attached. If not specified, we look for widget containerElement and element.
         * @param {boolean} swipeOptions.arrows : display arrows if true. False by default.
         * @param {boolean} swipeOptions.dots : display dots if true. False by default.
         * @param {boolean} swipeOptions.hideScrollbar : hide swipe corresponding scrollbar if true. True by default.
         * @param {boolean} swipeOptions.noSwipe : disable touch gesture if set to true. False by default
         */
        constructor: function(widget, swipeOptions) {
          $super.constructor.call(this);
          this._hasNativeSmoothScroll = this._testSupportsSmoothScroll();
          this._viewPortWidth = window.innerWidth;
          this._widget = widget;
          this._swipeOpts = swipeOptions || {};
          this._widgetContainer = this._swipeOpts.container || widget.getContainerElement() || widget.getElement();

          // defaults options
          if (!this._swipeOpts.orientation) {
            this._swipeOpts.orientation = "x";
          }
          if (typeof this._swipeOpts.hideScrollbar === 'undefined') {
            this._swipeOpts.hideScrollbar = true;
          }

          if (this._swipeOpts.arrows) {
            this.addArrows();
          }
          if (this._swipeOpts.dots) {
            this.addDots();
          }

          this.enableSwipe();

          this._focusRestoredHandler = context.SessionService.getCurrent().getCurrentApplication().focus.when(context.constants.widgetEvents
            .focusRestored, this._onFocusRestored.bind(this));
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this.disableSwipe();
          this._swipeOpts = null;
          $super.destroy.call(this);
        },

        /**
         * Disable swipe from the widget
         */
        disableSwipe: function() {
          this.removeTouch();

          this._widgetContainer.off("scroll.swipe");

          this._widgetContainer.removeClass("noswipe");
          this._widgetContainer.removeClass("swipeable");
          this._widget.removeClass("swiping");
          this._widgetContainer.removeClass(this._swipeOpts.orientation);
          this._widgetContainer.removeClass("hidden-scrollbar");

          this.removeArrows();
          this.removeDots();
          this._postponedScroll = null;

        },

        /**
         * Disable touch gestures (swipe only possible via arrows/dots)
         */
        removeTouch: function() {
          this._widgetContainer.addClass("noswipe");
          this._widgetContainer.off("touchstart.swipe");
          this._widgetContainer.off("touchend.swipe");
          this._widgetContainer.off("touchleave.swipe");
        },

        /**
         * Enable touch gestures
         */
        addTouch: function() {
          this._widgetContainer.removeClass("noswipe");
          this._widgetContainer.on("touchstart.swipe", this._onSwipeStart.bind(this));
          const swipeEnd = this._onSwipeEnd.bind(this);
          this._widgetContainer.on("touchend.swipe", swipeEnd);
          this._widgetContainer.on("touchleave.swipe", swipeEnd);
        },

        /**
         * Enable swipe
         * @returns {boolean}
         */
        enableSwipe: function() {
          if (!this._widget) {
            return;
          }

          this._widgetContainer.toggleClass("hidden-scrollbar", this._swipeOpts.orientation);
          this._widgetContainer.addClass(this._swipeOpts.orientation);
          this._widgetContainer.removeClass("visibility-hidden");
          this._widgetContainer.addClass("swipeable");

          this.removeTouch();
          if (!this._swipeOpts.noSwipe) {
            this.addTouch();
          }

          if (this._swipeOpts.virtualDom || this._swipeOpts.moveCallback) {
            this._widgetContainer.on("scroll.swipe", this._onSwipeMove.bind(this, this._swipeOpts.moveCallback));
          }

          return true;
        },

        /**
         * Handler fired on swipe start. Add siblings elements to preview in DOM
         * @private
         */
        _onSwipeStart: function() {
          this._widget.addClass("swiping");
          if (this._pagesInDomTimer && this._swipeOpts.virtualDom) {
            this._clearTimeout(this._pagesInDomTimer);
            this._cleanDom();
          }
          this._widget.emit(context.constants.widgetEvents.swipeStart);
        },

        /**
         * Handler fired during swipe. Update DOM if virtualDom option is on.
         * @param {Function} moveCallback
         * @param {object} evt
         * @private
         */
        _onSwipeMove: function(moveCallback, evt) {
          if (!this._widget.hasClass("swiping")) {
            return;
          }
          let distance = Math.round(this._widgetContainer.scrollLeft - this._lastHorizontalScrollPos);
          if (this._widget.isReversed()) { // manage RTL mode : inverse all
            distance *= -1;
          }
          const directionSign = Math.sign(distance);

          if (this._swipeOpts.virtualDom && directionSign !== this._lastDirectionSign && Math.abs(distance) > 2) {

            this._lastDirectionSign = directionSign;
            this._registerAnimationFrame(function() {
              this._updateDom(directionSign);
            }.bind(this));
          }

          if (moveCallback) {
            moveCallback.call(this._widget, null, distance, directionSign);
          }
        },

        /**
         * Handler fired on swipe end. Clean the DOM to display only current element
         * @private
         */
        _onSwipeEnd: function() {
          this._clearTimeout(this._pagesInDomTimer);

          this._pagesInDomTimer = this._registerTimeout(function() {
            this._widget.removeClass("swiping");
            const index = this._cleanDom();
            this._lastHorizontalScrollPos = this._widgetContainer.scrollLeft;
            this._lastDirectionSign = 0;
            this._widget.emit(context.constants.widgetEvents.swipeEnd, index);
          }.bind(this), 800);
        },

        /**
         * Calculate current index of child element being displayed
         * @returns {number}
         * @private
         */
        _getIndex: function() {
          let scrollRatio = 0;
          if (this._swipeOpts.orientation === "x") {
            scrollRatio = this._widgetContainer.scrollWidth > 0 ?
              Math.abs(this._widgetContainer.scrollLeft) / this._widgetContainer.scrollWidth : 0;
          } else {
            scrollRatio = this._widgetContainer.scrollHeight > 0 ?
              this._widgetContainer.scrollTop / this._widgetContainer.scrollHeight : 0;
          }

          return Math.round(scrollRatio * this._widget.getVisibleChildrenCount());
        },

        /**
         * Update sibling element during swipe process accordingly to current direction
         * @param direction -1 if going to previous sibling element. 1 if going to next sibling element.
         * @private
         */
        _updateDom: function(direction) {
          const index = this._getIndex();

          const next = this._widget.getVisibleChildren()[index + direction];
          const previous = this._widget.getVisibleChildren()[index - direction];
          if (previous && !previous.hasChildWebComponent()) {
            previous.removeFromDom();
          }
          if (next && !next.hasChildWebComponent()) {
            next.addInDom();
          }

        },

        /**
         * Remove siblings elements of the DOM to only display current displayed one
         * @returns {number}
         * @private
         */
        _cleanDom: function(index) {
          this._pagesInDomTimer = null;
          if (this._widgetContainer) {
            index = index >= 0 ? index : this._getIndex();
            if (this._pastCleanedIndex !== index) {

              if (this._swipeOpts.virtualDom) {
                for (let i = 0; i < this._widget.getVisibleChildren().length; i++) {
                  const child = this._widget.getVisibleChildren()[i];
                  if (i === index) {
                    if (!child.hasChildWebComponent()) {
                      child.addInDom();
                    }
                  } else {
                    if (!child.hasChildWebComponent()) {
                      child.removeFromDom();
                    }
                  }
                }
              }

              if (this._swipeOpts.arrows) {
                this._updateArrows(index);
              }
              if (this._swipeOpts.dots) {
                this._updateDots(index);
              }
              this._pastCleanedIndex = index;
            }
          }
          return index;
        },

        /**
         * Focus the corresponding child manually
         * @param {classes.WidgetBase} child
         * @param {Object} opts swipe options
         * @param {boolean} opts.smoothEffect internal app hash
         * @param {boolean} opts.noDelay to remove delayed scroll
         */
        swipeTo: function(child, opts) {
          // 1. check if corresponding child is in dom, otherwise add it
          opts = opts || {};
          if (child) {
            child.addInDom();
          }

          // 2. scroll with/without smooth effect
          const index = this._widget.getVisibleChildren().indexOf(child);

          if (this._postponedScroll) {
            this._postponedScroll = null;
          }
          if (this._scrollTimerId) {
            this._clearTimeout(this._scrollTimerId);
            this._scrollTimerId = null;
          }
          const schedulerService = context.SessionService.getCurrent().getCurrentApplication().scheduler;
          // check if nothing to process before scrolling (and thus focusing)
          if (schedulerService.hasNoCommandToProcess()) {
            if (opts.noDelay === true) {
              this._registerAnimationFrame(function() {
                //Need to wait the next frame to have a correct scrollWidth
                this._scroll(index, opts.smoothEffect);
              }.bind(this));
            } else {
              this._scrollTimerId = this._registerTimeout(function() {
                this._scroll(index, opts.smoothEffect);
              }.bind(this), 100);
            }
          } else {
            this._postponedScroll = this._scroll.bind(this, index, opts.smoothEffect);
          }
        },

        /**
         * Generate a scroll to the specified index
         * @param {Number} index
         * @param {boolean} smoothEffect
         * @returns {cancel}
         * @private
         */
        _scroll: function(index, smoothEffect) {
          if (!this._widgetContainer) {
            return;
          }
          if (this._swipeOpts.arrows) {
            this._updateArrows(index);
          }
          if (this._swipeOpts.dots) {
            this._updateDots(index);
          }
          let left = (this._swipeOpts.orientation === "x" ? this._widgetContainer.scrollWidth : this._widgetContainer.scrollHeight) * (index /
            this._widget.getVisibleChildren().length);
          if (this._widget.isReversed()) { // manage RTL mode
            left *= -1;
          }
          this._widgetContainer.removeClass("visibility-hidden");
          if (this._hasNativeSmoothScroll || !smoothEffect) {
            const scrollParams = {
              [this._swipeOpts.orientation === "x" ? 'left' : 'top']: left
            };
            if (smoothEffect) {
              scrollParams.behavior = 'smooth';
            }
            this._widgetContainer.scrollTo(scrollParams);
          } else { // IOS
            this._smoothScrollPolyfill(this._swipeOpts.orientation === "x" ? 'scrollLeft' : 'scrollTop', left);
          }
        },

        /**
         * Update dom & arrows/dot on focus restored or eventually execute a postponed scroll operation
         * @private
         */
        _onFocusRestored: function(notifier, event) {
          if (this._postponedScroll) {
            this._postponedScroll();
            this._postponedScroll = null;

            this._onFocus(notifier, event);
          }

          if (this._swipeOpts.arrows) {
            this.refreshArrows();
          }

          if (this._swipeOpts.dots) {
            this.refreshDots();
          }
        },
        /**
         * Update dom & arrows/dot on set focus
         * @private
         */
        _onFocus: function(notifier, event) {
          let index = -1;
          if (event && event._focusedNode) {
            let child = event._focusedNode.getController().getWidget();
            while (index === -1 && child) {
              index = this._widget.getVisibleChildren().indexOf(child);
              child = child.getParentWidget();
            }
          }
          this._registerTimeout(this._cleanDom.bind(this, index), 200);
        },

        // NAVIGATION STYLE
        /**
         * Add arrows as helper to swipe
         */
        addArrows: function() {
          this._swipeOpts.arrows = true;

          if (this._leftArrow && this._rightArrow) {
            // arrows already enabled
            return;
          }
          this._leftArrow = document.createElement("div");
          this._rightArrow = document.createElement("div");
          this._leftArrow.addClass("left_arrow");
          this._rightArrow.addClass("right_arrow");
          this._widgetContainer.parentNode.appendChild(this._leftArrow);
          this._widgetContainer.parentNode.appendChild(this._rightArrow);

          // add left/right arrows events
          this._leftArrow.on("click.LeftArrow", this._arrowHandler.bind(this, -1));
          this._rightArrow.on("click.RightArrow", this._arrowHandler.bind(this, 1));

          this._updateArrows(0);

          if (!this._focusHandler) {
            this._focusHandler = this._widget.getUserInterfaceWidget().when(context.constants.widgetEvents
              .splitViewChange, this._onFocus.bind(this));
          }
        },

        /**
         * true if arrows are enabled
         * @returns {boolean}
         */
        hasArrows: function() {
          return this._swipeOpts.arrows;
        },

        /**
         * true if dots are enabled
         * @returns {boolean}
         */
        hasDots: function() {
          return this._swipeOpts.dots;
        },

        /**
         * Remove arrows buttons
         */
        removeArrows: function() {
          this._swipeOpts.arrows = false;
          if (!this._leftArrow && !this._rightArrow) {
            // arrows already disabled
            return;
          }
          this._leftArrow.off("click.LeftArrow");
          this._rightArrow.off("click.RightArrow");
          this._widgetContainer.parentNode.removeChild(this._leftArrow);
          this._widgetContainer.parentNode.removeChild(this._rightArrow);
          this._leftArrow = null;
          this._rightArrow = null;

          if (!this._swipeOpts.dots) {
            if (this._focusRestoredHandler) {
              this._focusRestoredHandler();
              this._focusRestoredHandler = null;
            }
            if (this._focusHandler) {
              this._focusHandler();
              this._focusHandler = null;
            }
          }
        },

        /**
         * Arrows buttons
         * @param {Number} index
         * @private
         */
        _updateArrows: function(index) {
          if (this._leftArrow && this._rightArrow) {
            if (this._widget.getVisibleChildrenCount() === 1) {
              this._leftArrow.addClass("disabled");
              this._rightArrow.addClass("disabled");
            } else if (index <= 0) {
              this._leftArrow.addClass("disabled");
              this._rightArrow.removeClass("disabled");
            } else if (index >= this._widget.getVisibleChildrenCount() - 1) {
              this._rightArrow.addClass("disabled");
              this._leftArrow.removeClass("disabled");
            } else {
              this._rightArrow.removeClass("disabled");
              this._leftArrow.removeClass("disabled");
            }
          }
        },

        /**
         * Navigate to previous/next view
         * @param {Number} inc
         * @private
         */
        _arrowHandler: function(inc) {
          const newIndex = this._getIndex() + inc;
          const child = this._widget.getVisibleChildren()[newIndex];
          if (child) {
            this._onSwipeStart();
            this.swipeTo(child, {
              smoothEffect: true
            });
            this._onSwipeEnd();
          }
        },

        /**
         * Add dots as helper to swipe
         */
        addDots: function() {
          this._swipeOpts.dots = true;

          if (this._dots) {
            // dots already enabled
            return;
          }
          this._dots = document.createElement("div");

          this._dots.addClass("dots");

          this._widgetContainer.parentNode.appendChild(this._dots);

          // add dots events
          for (const element of this._widget.getVisibleChildren()) {
            this._addDot();
          }

          this._updateDots(0);

          if (!this._focusHandler) {
            this._focusHandler = this._widget.getUserInterfaceWidget().when(context.constants.widgetEvents
              .splitViewChange, this._onFocus.bind(this));
          }
        },

        removeDots: function() {
          this._swipeOpts.dots = false;
          if (!this._swipeOpts.arrows) {
            if (this._focusRestoredHandler) {
              this._focusRestoredHandler();
              this._focusRestoredHandler = null;
            }
            if (this._focusHandler) {
              this._focusHandler();
              this._focusHandler = null;
            }
          }

          if (!this._dots) {
            // dots already disabled
            return;
          }
          this._widgetContainer.parentNode.removeChild(this._dots);
          for (const element of this._dots.children) {
            element.off("click.NavigationStyleDot");
          }
          this._dots = null;
        },

        /**
         * Create a dot element and add it in the DOM
         * @private
         */
        _addDot: function() {
          const div = document.createElement("div");
          div.addClass("dot");
          div.on("click.NavigationStyleDot", this._dotHandler.bind(this, this._dots.children.length));
          // add listener
          this._dots.appendChild(div);
        },

        /**
         * Navigate to view corresponding to dot index
         * @param {Number} index
         * @private
         */
        _dotHandler: function(index) {
          const child = this._widget.getVisibleChildren()[index];
          if (child) {
            this._onSwipeStart();
            this.swipeTo(child, {
              smoothEffect: true
            });
            this._onSwipeEnd();
          }
        },

        /**
         * Update current dot status
         * @param {Number} index
         * @private
         */
        _updateDots: function(index) {
          // need to resynchronize dots with childs
          if (this._widget.getVisibleChildrenCount() !== this._dots.children.length) {
            this.removeDots();
            this.addDots();
          }
          if (this._dots) {
            for (let i = 0; i < this._dots.children.length; i++) {
              const dot = this._dots.children[i];
              if (i === index) {
                if (!dot.hasClass("current")) {
                  dot.addClass("current");
                }
              } else {
                dot.removeClass("current");
              }
            }
          }
        },

        /**
         * Test smooth scroll functionality
         * @returns {string|boolean}
         * @private
         */
        _testSupportsSmoothScroll: function() {
          let supports = false;
          try {
            let div = document.createElement('div');
            div.scrollTo({
              top: 0,
              get behavior() {
                supports = true;
                return 'smooth';
              }
            });
          } catch (err) {} // Edge throws an error
          return supports;
        },

        _easingOutQuint: function(x, t, b, c, d) {
          return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
        },

        _smoothScrollPolyfill: function(key, target) {
          const startTime = Date.now();
          const offset = this._widgetContainer[key];
          const gap = target - offset;
          const duration = 1000;
          let interrupt = false;

          const cancel = function() {
            interrupt = true;
            this._widgetContainer.removeEventListener('wheel', cancel);
            this._widgetContainer.removeEventListener('touchstart', cancel);
          }.bind(this);

          const step = function() {
            const elapsed = Date.now() - startTime;
            const percentage = elapsed / duration;

            if (interrupt) {
              return;
            }

            if (percentage > 1) {
              this._widgetContainer.removeEventListener('wheel', cancel);
              this._widgetContainer.removeEventListener('touchstart', cancel);
              return;
            }

            this._widgetContainer[key] = this._easingOutQuint(0, elapsed, offset, gap, duration);
            window.requestAnimationFrame(step);
          }.bind(this);

          this._widgetContainer.addEventListener('wheel', cancel, {
            passive: true
          });
          this._widgetContainer.addEventListener('touchstart', cancel, {
            passive: true
          });

          step();

          return cancel;
        },

        _smoothHorizontalScrolling: function(e, time, amount, start) {
          const eAmt = amount / 100;
          let curTime = 0;
          let scrollCounter = 0;
          while (curTime <= time) {
            window.setTimeout(this._SHS_B, curTime, e, scrollCounter, eAmt, start);
            curTime += time / 100;
            scrollCounter++;
          }
        },

        _SHS_B: function(e, sc, eAmt, start) {
          e.scrollLeft = (eAmt * sc) + start;
        },

        refreshDots: function() {
          this._updateDots(this._getIndex());
        },

        refreshArrows: function() {
          this._updateArrows(this._getIndex());
        }

      };

    });
    cls.ApplicationServiceFactory.register("Gesture", cls.GestureService);
  });
