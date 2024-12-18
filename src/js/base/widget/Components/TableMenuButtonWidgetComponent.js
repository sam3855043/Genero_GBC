/// FOURJS_START_COPYRIGHT(D,2024)
/// Property of Four Js*
/// (c) Copyright Four Js 2024, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TableMenuButtonWidgetComponent', ['WidgetComponentBase'],
  function(context, cls) {

    /**
     * Highlight Widget Component.
     * Manage the highlight css classes and variables
     * @class TableMenuButtonWidgetComponent
     * @memberOf classes
     * @extends classes.WidgetComponentBase
     * @publicdoc
     */
    cls.TableMenuButtonWidgetComponent = context.oo.Class(cls.WidgetComponentBase, function($super) {

      return /** @lends classes.TableMenuButtonWidgetComponent.prototype */ {
        __name: "TableMenuButtonWidgetComponent",

        $static: /** @lends classes.TableMenuButtonWidgetComponent */ {
          /** @static */
          _elementCssClass: 'gbc_TableMenuButton',

          /** @static */
          _inViewCssClass: 'visible',

          /**
           * in milliseconds
           * @static
           * @type {number}
           */
          _defaultDelay: 2500,

          /**
           * in milliseconds
           * @static
           * @type {number}
           */
          _postHoverDelay: 650,
        },

        /**
         * The DOM element to show/hide
         * @type {HTMLElement}
         */
        _element: null,

        /**
         * The timer id, to handle the timer destruction
         * @type {number}
         */
        _timerId: -1,

        /**
         * Used to know if the button should be frozen in place
         * For exemple when the menu is open
         * @type {boolean}
         */
        _isFrozen: false,

        /**
         * @inheritdoc
         * @param {boolean} visibleAtStartup Should the button visible at startup (for a delay of default * 2)
         */
        constructor: function(widget, visibleAtStartup = false) {
          $super.constructor.call(this, widget);

          this._isFrozen = false;

          this.getElement().on("transitionend.TableMenuButtonWidgetComponent", this.hide.bind(this, cls.TableMenuButtonWidgetComponent
            ._defaultDelay));
          this.getElement().on("mouseover.TableMenuButtonWidgetComponent", this._clearTimeout.bind(this));
          this.getElement().on("mouseout.TableMenuButtonWidgetComponent", this.hide.bind(this, cls.TableMenuButtonWidgetComponent
            ._postHoverDelay));

          if (visibleAtStartup) {
            /* Make the button visible at start. As the transitionend event might not be triggered by the CSS/JS engine,
             * the hide timer will be forced to initialize
             */
            this.show(cls.TableMenuButtonWidgetComponent._defaultDelay * 2);
            this.hide(cls.TableMenuButtonWidgetComponent._defaultDelay * 2);
          }
        },

        /**
         * @inheritdoc
         */
        destroy: function() {
          this._clearTimeout();

          if (this._element) {
            this._element.off("transitionend.TableMenuButtonWidgetComponent");
            this._element.off("mouseover.TableMenuButtonWidgetComponent");
            this._element.off("mouseout.TableMenuButtonWidgetComponent");
            this._element = null;
          }

          $super.destroy.call(this);
        },

        /**
         * Returns the Table Menu Icon DOM Element
         * @returns {HTMLElement} header group DOM Element
         */
        getElement: function() {
          if (!this._element) {
            this._element = this.getWidget().getElement().getElementsByClassName(cls.TableMenuButtonWidgetComponent._elementCssClass)[0];
          }
          return this._element;
        },

        /**
         * @returns {boolean} True if the menu icon is in the view 
         */
        isVisible: function() {
          return this.getElement().hasClass(cls.TableMenuButtonWidgetComponent._inViewCssClass);
        },

        /**
         * Show the menu button if not in view,
         * else restart the timer
         */
        show: function(delay, evt) {
          if (this._isFrozen) {
            return;
          }

          if (this.isVisible()) {
            this.hide(delay);
          } else {
            this.getElement().addClass(cls.TableMenuButtonWidgetComponent._inViewCssClass);
          }
        },

        /**
         * Trigger a timer to hide the menu after a dedicated time
         * if the button is not frozen
         * @param {number} delay Time to wait before hiding the menu
         * @param {TransitionEvent|null} [evt] The transition end event
         */
        hide: function(delay, evt = null) {
          if (this._isFrozen || !this.isVisible()) {
            return;
          }

          // Clear the previous timeout before making a new one
          this._clearTimeout();
          this._timerId = setTimeout(function(thisArg) {
            thisArg.getElement().removeClass(cls.TableMenuButtonWidgetComponent._inViewCssClass);
            thisArg._timerId = -1;
          }, delay, this);
        },

        /**
         * Freeze the button in place if it's visible 
         */
        freeze: function() {
          if (this.isVisible()) {
            this._isFrozen = true;
            this._clearTimeout();
          }
        },

        /**
         * Unfreeze and hide the menu button even if it was frozen.
         * @param {number} delay in milliseconds
         */
        unfreezeAndHide: function(delay) {
          this._isFrozen = false;
          this.hide(delay);
        },

        /**
         * Clear the current timeout if any
         * and reset the timer id
         * @private
         */
        _clearTimeout() {
          if (this._timerId !== -1) {
            clearTimeout(this._timerId);
          }
          this._timerId = -1;
        }
      };
    });
  }
);
