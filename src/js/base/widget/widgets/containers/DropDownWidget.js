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

modulum('DropDownWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * DropDown widget.
     * @class DropDownWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc
     */
    cls.DropDownWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.DropDownWidget.prototype */ {
        __name: "DropDownWidget",

        $static: {
          widgetEvents: {
            dropDownBeforeOpen: "dropDownBeforeOpen",
            dropDownOpen: "dropDownOpen",
            dropDownClose: "dropDownClose"
          },
          /**
           * Static list of current dropdowns instances being displayed
           * @type {Array}
           */
          displayedDropDowns: [],
          /**
           * Returns true if at least one dropdown is being displayed
           * @returns {boolean}
           * @publicdoc
           */
          hasAnyVisible: function() {
            return cls.DropDownWidget.displayedDropDowns.length > 0;
          },
          /**
           * Return active dropdowns
           * @returns {classes.DropDownWidget}
           * @publicdoc
           */
          getActiveDropDowns: function() {
            return cls.DropDownWidget.displayedDropDowns;
          },
          /**
           * Hide and remove all active dropdowns from DOM
           * @param {HTMLElement} elementToExclude - exclude dropdowns containing specified element from being hidden
           */
          hideAll: function(elementToExclude) {
            while (cls.DropDownWidget.displayedDropDowns.length) {
              if (!cls.DropDownWidget.displayedDropDowns.last().getElement().contains(elementToExclude)) {
                cls.DropDownWidget.displayedDropDowns.pop().remove();
              } else {
                // all remaining dropdowns are part of elementToExclude
                return;
              }
            }
          },
          /**
           * Returns true if targeted element is contained in one of the current displayed dropdowns
           * @param {HTMLElement} targetElement
           * @returns {boolean}
           * @publicdoc
           */
          isChildOfDropDown: function(targetElement) {
            let inDropDown = false;
            for (const dropdown of cls.DropDownWidget.displayedDropDowns) {
              if (dropdown.getElement().contains(targetElement) || !dropdown.shouldClose(targetElement)) {
                inDropDown = true;
                break;
              }
            }
            return inDropDown;
          },
          /**
           * Returns true if targeted element is contained in one of the current displayed dropdowns or is dropdown associated widget element
           * @param {HTMLElement} targetElement
           * @returns {boolean}
           * @publicdoc
           */
          isChildOrParentOfDropDown: function(targetElement) {
            for (const dropdown of cls.DropDownWidget.displayedDropDowns) {
              const parentWidget = dropdown.getParentWidget();
              const grandParentWidget = parentWidget.getParentWidget();

              if (dropdown.getElement().contains(targetElement) || parentWidget.getElement().contains(targetElement) ||
                (grandParentWidget instanceof cls.ButtonEditWidget && grandParentWidget.getElement().contains(targetElement)) ||
                !dropdown.shouldClose(targetElement)) {
                return true;
              }
            }

            return false;
          }
        },
        /**
         * Flag to indicate if dropdown should size accordingly to its parent element (parent element width aligned) with a maximum allowed height (afterward dropdown is vertically scrollable)
         * By default no.
         * @type {boolean}
         * @publicdoc
         */
        autoSize: false,
        /**
         * Default min width of the dropdown
         * @type {number}
         */
        _defaultMinWidth: 0,
        /**
         * Default max height of the dropdown
         * @type {number}
         */
        _defaultMaxHeight: 0,
        /**
         * Flag to position dropdown using right-to-left basis (ex: arabic).
         * Take note that to have a full right-to-left mode the parent widget need to be set as reversed using setReverse method
         * By default its left-to-right positioned.
         * @type {boolean}
         * @publicdoc
         */
        reverseX: false,
        /**
         * Flag to position dropdown below its corresponding widget or above it.
         * By default, it's positioned below it.
         * @type {boolean}
         * @publicdoc
         */
        reverseY: false,
        /**
         * If true, the DropDown right border will be aligned with the invoker right border,
         * else, the DropDown left border will be aligned with the invoker left border
         * @default
         * @type {boolean}
         * @private
         */
        _rightAligned: false,
        /**
         * If true, the DropDown will be positioned above the invoker,
         * else, the DropDown will be positioned under the invoker
         * false by default
         * @default
         * @type {boolean}
         * @private
         */
        _positionedAbove: false,
        /**
         * Horizontal absolute position.
         * It replace default widget relative positioning if not null.
         * @type {?number}
         * @publicdoc
         */
        x: null,
        /**
         * Vertical absolute position of the dropdown.
         * It replaces default widget relative positioning if not null.
         * @type {?number}
         * @publicdoc
         */
        y: null,
        /**
         * Set no height
         */
        _fullHeight: false,
        /**
         * Minimum width of the dropdown to use if not null.
         * @type {?number}
         * @publicdoc
         */
        minWidth: null,
        /**
         * Maximum width of the dropdown to use if not null.
         * @type {?number}
         * @publicdoc
         */
        maxWidth: null,
        /**
         * Maximum height of the dropdown to use if not null.
         * @type {?number}
         * @publicdoc
         */
        maxHeight: null,
        /**
         * Parent element to use to measure and position DropDown instead of default one (default one is parent widget element).
         * @type {HTMLElement}
         * @publicdoc
         */
        parentElement: null,
        /**
         * Custom rendering function to use instead of integrated one to measure and render the dropdown.
         * The function is null by default.
         * @type {Function}
         * @publicdoc
         */
        renderFunction: null,
        /**
         * Dropdown open/close bound handlers
         * @function
         */
        _handlers: null,

        /**
         * Dropdown container
         * @type {HTMLElement}
         */
        _container: null,

        /**
         * Flags current class as being a dropdown. Can be useful to know if a parent widget is dropdown
         * @type {boolean}
         * @publicdoc
         */
        isDropDown: true,

        /**
         * True if the dropdown can overlay the widget
         * @type {boolean}
         */
        _widgetOverlay: true,

        /** @type {boolean} */
        _isVisible: false,

        _stylingContext: "widget",

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this._defaultMinWidth = parseFloat(window.gbc.ThemeService.getValue("gbc-DropDownWidget-min-width"));
          this._defaultMaxHeight = parseFloat(window.gbc.ThemeService.getValue("gbc-DropDownWidget-max-height"));
        },

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);

          this._handlers = [];
          this._widgetOverlay = true;

          this._container = context.HostService.getDropDownContainer();

          // on window close we emit dropdown close event
          this._handlers.push(this.when(context.constants.widgetEvents.close, this.closeRequest.bind(this)));

          // update aria selection on dropdown open/close
          this.onOpen(function() {
            this.setAriaSelection();
          }.bind(this));

          this.onClose(function() {
            this._parentWidget.setAriaSelection();
          }.bind(this));
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this.hide();

          if (this._handlers) {
            for (const element of this._handlers) {
              element();
            }
            this._handlers.length = 0;
          }
          this.unbindListeners();

          if (this._parentWidget && this._parentWidget.removeChildWidget) {
            this._parentWidget.removeChildWidget(this);
          }
          this._parentWidget = null;
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;
          if (this.isVisible()) {
            // if dropdown is open, all keys are prevented (no accelerator can be executed during dropdown display)
            switch (keyString) {
              case "enter":
              case "return":
              case "esc":
                this.hide();
                keyProcessed = true;
                break;

            }
          }

          return keyProcessed;
        },

        /**
         * Bind a handler executed when dropdown is displayed
         * @param {Hook} hook the hook to fire
         * @returns {HandleRegistration} return handler to unbind reference
         */
        onOpen: function(hook) {
          this._handlers.push(this.when(cls.DropDownWidget.widgetEvents.dropDownOpen, hook));
          return this._handlers[this._handlers.length - 1];
        },

        /**
         * Bind a handler executed before dropdown is displayed
         * @param {Hook} hook the hook to fire
         * @returns {HandleRegistration} return handler to unbind reference
         */
        onBeforeOpen: function(hook) {
          this._handlers.push(this.when(cls.DropDownWidget.widgetEvents.dropDownBeforeOpen, hook));
          return this._handlers[this._handlers.length - 1];
        },

        /**
         * Bind a handler executed when dropdown is closed
         * @param {Hook} hook the hook to fire
         * @returns {HandleRegistration} return handler to unbind reference
         */
        onClose: function(hook) {
          this._handlers.push(this.when(cls.DropDownWidget.widgetEvents.dropDownClose, hook));
          return this._handlers[this._handlers.length - 1];
        },

        beforeOpenRequest: function() {
          this.emit(cls.DropDownWidget.widgetEvents.dropDownBeforeOpen);
        },

        openRequest: function() {
          this.emit(cls.DropDownWidget.widgetEvents.dropDownOpen);
        },

        closeRequest: function() {
          this.emit(cls.DropDownWidget.widgetEvents.dropDownClose);
        },

        /**
         * Let dropdown hide on click (if outside of dropdown and widget), scroll events or dragAndDrop events.
         * Setting this method to null will cancel auto hide of the dropdown
         * @publicdoc
         */
        bindListeners: function() {

          if (this._hideHandler) {
            this._hideHandler(); // removeEventListener
            this._hideHandler = null;
          }
          if (!window.isMobile()) {
            this._hideHandler = context.HostService.onScreenResize(this.hide.bind(this));
          } else {
            this._hideHandler = context.HostService.onOrientationChange(this.hide.bind(this));
          }
        },

        /**
         * Unbind events and listeneners used to auto hide dropdown
         * @publicdoc
         */
        unbindListeners: function() {
          if (this._hideHandler && !cls.DropDownWidget.hasAnyVisible()) {
            this._hideHandler(); // removeEventListener
            this._hideHandler = null;
          }
        },

        /**
         * Hide all displayed dropdowns
         * @publicdoc
         */
        hide: function() {
          cls.DropDownWidget.hideAll();
        },

        /**
         * Remove current dropdown from DOM. Use hide method to close dropdown instead as much as possible
         */
        remove: function() {
          // first thing to do is update active dropdowns list which is checked and used in following methods
          cls.DropDownWidget.displayedDropDowns.remove(this);
          this._setVisible(false);

          // unbind handlers & remove overlay when no more dropdowns are visible
          if (!cls.DropDownWidget.hasAnyVisible()) {
            context.OverlayService.disable("dropdown");
            this.unbindListeners();
          }

          this.removeDropDown();
          this.closeRequest();

          // update widget with current dropdown being activated
          const activeDropDown = cls.DropDownWidget.getActiveDropDowns().last();
          const session = context.SessionService.getCurrent();
          if (session) {
            const app = session.getCurrentApplication();
            if (app) {
              app.focus.setActiveDropDownWidget(activeDropDown ? activeDropDown.getParentWidget() : null);
            }
          }
          this.getParentWidget().emit(context.constants.widgetEvents.close);
        },

        /**
         * Show the widget dropdown
         * @param {boolean} [multiple] - if true we do not hide previous displayed dropdowns (ex: sub menus).
         * @publicdoc
         */
        show: function(multiple = false) {
          if (!this.isVisible()) {
            if (!multiple) {
              this.hide();
            }
            // set visible (remove parent class hidden) before dropdown measuring
            this._setVisible(true);

            // bind handlers & add overlay on first dropdown display
            if (!cls.DropDownWidget.hasAnyVisible()) {
              const currentWindow = context.HostService.getCurrentWindowWidget();
              const windowContainer = currentWindow ? currentWindow.getWindowMiddleContainer() : null;
              context.OverlayService.enable("dropdown", windowContainer);
              this.bindListeners();
            }
            // dropdown rendering (measure & positioning method)
            this.beforeOpenRequest();
            this.addDropDown();
            this.openRequest();

            cls.DropDownWidget.displayedDropDowns.push(this);

            // update widget with current dropdown being activated
            const session = context.SessionService.getCurrent();
            if (session) {
              const app = session.getCurrentApplication();
              if (app) {
                app.focus.setActiveDropDownWidget(this.getParentWidget());
              }
            }
          }
        },

        /**
         * Toggle dropdown display
         * @param {boolean} show - force display if set to true, hide if set to false
         * @returns {boolean} returns dropdown visibility
         * @publicdoc
         */
        toggle: function(show) {
          if (this.isVisible() || show === false) {
            this.hide();
          } else if (!this.isVisible() || show === true) {
            this.show();
          }
        },

        /**
         * Check & update main dropdown container visibility on dropdown display/hide
         * @param {boolean} visible - wanted visibility
         * @private
         */
        _setVisible: function(visible) {
          if (this._container) {
            if (visible) {
              if (this._container.hasClass("hidden")) {
                this._container.removeClass("hidden");
              }
            } else {
              // only hide dropdowns container is we removed last dropdown child from it
              if (!cls.DropDownWidget.hasAnyVisible() && !this._container.hasClass("hidden")) {
                this._container.addClass("hidden");
              }
            }
          }
          this._isVisible = visible;
          // flag widget as expanded for aria attribute
          this.getParentWidget().setAriaAttribute("expanded", visible.toString());
          // emit a visibility change notification on the dropdown
          this.emit(context.constants.widgetEvents.visibilityChange, visible);
          gbc.LogService.ui.log("DropDown open", visible, this.__name, this);
        },

        /**
         * Indicate if dropdown is currently visible or not
         * @returns {boolean} true if dropdown is currently visible
         * @publicdoc
         */
        isVisible: function() {
          return this._isVisible;
        },

        /**
         * Explicitly focus dropdown element
         * @publicdoc
         */
        focus: function() {
          this._element.focus();
        },

        /**
         * Set content of the dropdown
         * @param {HTMLElement} content - element to add in the dropdown
         * @param {WidgetBase} parentWidget - if defined, set the widget as parent widget of the dropdown (optional)
         * @publicdoc
         */
        setContent: function(content, parentWidget) {
          this.getElement().appendChild(content);
          if (parentWidget) {
            this.setParentWidget(parentWidget);
          }
        },

        /**
         * Override this method if you want a custom check during dropdown hiding.
         * This method is executed when you click on corresponding dropdown widget (usually parent widget of dropdown) and determines if it should close dropdown in that case.
         * By default, it's set to yes.
         * @param {HTMLElement} targetElement - source element which raise blur event
         * @returns {boolean} if false we cancel dropdown closing
         */
        shouldClose: function(targetElement) {
          return true;
        },

        /**
         * Remove the content of the dropdown
         * @param {HTMLElement} content - element to remove from the dropdown
         * @publicdoc
         */
        removeContent: function(content) {
          this.getElement().removeChild(content);
        },

        /**
         * Enable or disable/hide the dropdown.
         * @param {boolean} enabled - true if dropdown is active
         * @publicdoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          this.hide();
        },

        /**
         * Force the dropdown to take full height
         */
        setFullHeight: function() {
          this._fullHeight = true;
        },

        /**
         * Remove the dropdown from the DOM
         * @publicdoc
         */
        removeDropDown: function() {
          this.getElement().remove();
          this._container.removeClass("dd_" + this.getParentWidget().getName());
        },

        /**
         * Add dropdown in DOM and set its position & size
         * @publicdoc
         */
        addDropDown: function() {
          this._container.addClass("dd_" + this.getParentWidget().getName());
          // we insert dropdown in DOM before measuring it to be able to get its generated height
          this._container.appendChild(this.getElement());

          // measure and render dropdown
          // if  custom rendering function is defined we use it else use default one
          if (this.renderFunction && typeof this.renderFunction === "function") {
            this.renderFunction();
          } else {
            this.updateDropDownRect();
          }
        },

        /**
         * Render the dropdown. Measure its width, height and calculate its top and left position and sets them.
         * By default, dropdown will :
         *  - take width of its corresponding widget.
         *  - be positioned right under the corresponding widget and left aligned with it.
         * @publicdoc
         */
        updateDropDownRect: function() {
          // 0 - Initialization
          // need parent widget size + sidebar size in our measure process
          const parentBoundingRect = (this.parentElement ? this.parentElement : this.getParentWidget().getElement()).getBoundingClientRect();
          const sidebarWidth = context.HostLeftSidebarService.getSidebarWidth();

          const dropDownRect = {};
          // Flags used to reverse dropdown position if case of overflow measurements.
          // These flags can be updated in next methods.
          this._rightAligned = false;
          this._positionedAbove = false;

          // 1 - Min & max width calculation
          const ddWidth = this._measureWidth(parentBoundingRect, sidebarWidth);
          // typeof is string if value is "unset"
          dropDownRect["min-width"] = dropDownRect["max-width"] = this._getSizeUnit(ddWidth);

          // 2 - Horizontal positioning
          const x = this._measureHorizontalPosition(ddWidth, parentBoundingRect, sidebarWidth);
          dropDownRect[this._rightAligned ? "right" : "left"] = this._getSizeUnit(x);
          dropDownRect[this._rightAligned ? "left" : "right"] = "unset"; // reset other flag which could have been used before

          // 3 - Vertical positioning
          const y = this._measureVerticalPosition(parentBoundingRect);
          dropDownRect[this._positionedAbove ? "bottom" : "top"] = this._getSizeUnit(y);
          dropDownRect[this._positionedAbove ? "top" : "bottom"] = this._fullHeight ? 0 :
            "unset"; // reset other flag which could have been used before

          // 4 - Max height calculation
          const ddHeight = this._measureMaxHeight(y);
          dropDownRect["max-height"] = this._fullHeight ? "inherit" : this._getSizeUnit(ddHeight);

          this.setStyle(dropDownRect);

          this._rightAligned = false;
          this._positionedAbove = false;
        },

        /**
         * Return value with its corresponding unit
         * @param value
         * @returns {string} value
         * @private
         */
        _getSizeUnit: function(value) {
          if (value === "unset") {
            return null;
          }
          return typeof value === "string" ? value : (value + "px");
        },

        /**
         * We calculate horizontal position (by default using left attribute) of the dropdown depending on its width and client width
         * @param {number} dropDownWidth - dropDown calculated width
         * @param {ClientRect} parentSize - corresponding widget size
         * @param {number} sidebarWidth - sidebar width
         * @returns {number} left (or right if reversed) position in pixels
         * @private
         */
        _measureHorizontalPosition: function(dropDownWidth, parentSize, sidebarWidth) {
          let x = 0;

          if (this.getParentWidget().isReversed()) {
            this.addClass("reverse");
          }

          this._rightAligned = this.reverseX || this.getParentWidget().isReversed();
          // if dropDownWidth is "unset" we take scrollWidth
          const ddWidth = dropDownWidth === "unset" ? this._element.scrollWidth : dropDownWidth;

          // 1. Get X positioning depending on provided attributes
          if (this.x) { // widget knows left location to use
            // CENTER means middle of the current window
            x = (this.x === "CENTER" ? (window.innerWidth - ddWidth + sidebarWidth) / 2 : this.x);
          } else if (!this._rightAligned) {
            x = Math.max(0, (parentSize.left + document.body.scrollLeft), sidebarWidth);
          }

          // 2. Adjust X positioning if horizontally overflowed
          // 2.1 dropdown is going to be overflowed by screen size limit, we flag it as reverse to inverse positioning
          if (!this._rightAligned && (x + ddWidth > document.body.clientWidth)) {
            this._rightAligned = true;
          }

          // 2.2 substract provided X or parentElement right position to clientWidth
          if (this._rightAligned) {
            if (this.x) {
              // if dropdown width can be fully visible on screen we position dropdown to the left of the filled x coordinate.
              // Otherwise, if dropdown width is higher and is going to be overflowed, we position it at the maximum right position of the screen.
              //x = x > ddWidth ? Math.max(0, document.body.clientWidth - x) : 0;
              x = x > ddWidth ? Math.max(0, document.body.clientWidth - x + parentSize.width) : 0;
              // screen too small for a reversed display as well: dropdown aligned with screen left limit
            } else {
              x = Math.max(0, (document.body.clientWidth - document.body.scrollLeft - parentSize.right));
            }
            if ((x + ddWidth) > document.body.clientWidth) {
              this._rightAligned = false;
              x = 0;
            }
          }

          return x;
        },

        /**
         * Calculate the top position of the dropdown depending on the display mode
         * @param {ClientRect} parentSize - corresponding widget size
         * @returns {number} top (or bottom if reversed) position in pixels
         * @private
         */
        _measureVerticalPosition: function(parentSize) {
          if (this._widgetOverlay) {
            return this._measureComboVerticalPosition(parentSize);
          }

          return this._measureCompleterVerticalPosition(parentSize);
        },

        /**
         * Completer : the widget must stay visible so the dropdown must below or above the input widget
         * @param {ClientRect} parentSize - corresponding widget size
         * @returns {number} top (or bottom if reversed) position in pixels
         * @private
         */
        _measureCompleterVerticalPosition: function(parentSize) {
          const bottomAbsPos = Math.max(0, parentSize.bottom + window.scrollY);
          const centralContainerRect = document.getElementsByClassName("mt-centralcontainer")[0].getBoundingClientRect();
          // Taking care of container position (case of customization sample demo)
          const formHeight = centralContainerRect.height + centralContainerRect.top + (document.body.getBoundingClientRect().height -
            centralContainerRect.bottom);

          //Below space > Above space
          if (formHeight - bottomAbsPos > parentSize.top) {
            //Put the dropdown below the input widget
            return parentSize.bottom + window.scrollY;
          } else {
            //Put the dropdown above the input widget
            //var dropDownheight = this.maxHeight ? this.maxHeight : this._defaultMaxHeight;
            this._positionedAbove = true;
            return formHeight - parentSize.top - window.scrollY + 1;
          }
        },

        /**
         * We calculate vertical position (by default using top attribute) of the dropdown depending on its height and client height
         * @param {ClientRect} parentSize - corresponding widget size
         * @returns {number} top (or bottom if reversed) position in pixels
         * @private
         */
        _measureComboVerticalPosition: function(parentSize) {
          let y = 0;
          this._positionedAbove = this.reverseY;
          // 1. Get Y positioning depending on provided attributes
          if (this.y) { // widget knowns top location to use
            // CENTER means middle of the current window
            y = (this.y === "CENTER" ? (window.innerHeight - this._element.scrollHeight) / 2 : this.y);
          } else {
            // Try to position dropdown right under widget if enough space available otherwise position dropdown below it
            y = Math.max(0, (parentSize.bottom + document.body.scrollTop));
          }

          // 2. Adjust dropdown Y positioning by comparing dropdown height with remaining viewport height
          const height = this.maxHeight ? this.maxHeight : Math.min(this._element.scrollHeight, this._defaultMaxHeight);
          // screen size limit : we need to adjust vertical position
          if (y + height > document.body.clientHeight) { // unsufficiant size below widget, check to position dropdown above it
            // try to position dropdown using above widget
            // 2px for box-shadow
            y = Math.max(0, document.body.clientHeight - (this.y ? this.y : parentSize.top) - document.body.scrollTop + 2);
            // if no space available either to position dropdown above widget, we place it at the top of the screen
            if (y + height > document.body.clientHeight) { // place dropdown at top of the screen
              y = 2;
            } else { // place above widget (usage of bottom attribute)
              this._positionedAbove = true;
            }
          }
          return y;
        },

        /**
         * We calculate width of the dropdown. We take in consideration sidebar and menu panel which can overflow widget content (scrollbars may then appear)
         * @param {ClientRect} parentSize - corresponding widget size
         * @param {number} sidebarWidth - sidebar width
         * @returns {string|number} width to use as a number or "unset" string if no width is required
         * @private
         */
        _measureWidth: function(parentSize, sidebarWidth) {
          let w = "unset";
          if (this.autoSize) {
            // Take larger width between parent widget, dropdown content and default min width.
            // Check if visible area is smaller that this width (dropdown or parent widget overflowed by horizontal scrollbars) and take visible area as width if it's the case
            w = Math.max(parentSize.width, (this.width ? this.width : 0), this._defaultMinWidth);
            w = Math.min(w, this._measureVisibleAreaWidth(parentSize, sidebarWidth));
          } else if (this.getElement().scrollWidth > document.body.clientWidth - 2) {
            // if element is larger than available screen width we limit dropdown width to screen width
            w = document.body.clientWidth - 2;
          }
          return w;
        },

        /**
         * Calculate width of the middle visible area (we subtract menu panel and sidebar from clientWidth)
         * @param {ClientRect} parentSize - corresponding widget size
         * @param {number} sidebarWidth - sidebar width
         * @returns {number} returns width of the middle visible area (we subtract menu panel and sidebar from clientWidth)
         * @private
         * @todo : This might be interesting to move this kind of method as a method in current application, 
         * so any widget can ask the current application what is the available width to display things.
         */
        _measureVisibleAreaWidth: function(parentSize, sidebarWidth) {
          let w = document.body.clientWidth;
          if (this.autoSize) {
            // horizontal scrollbars & overflow issue with right action panel in case of too large dropdown widget
            // we need to subtract the overflowed width of the dropdown
            // possible overflow are sidebar & right menu panel
            const currentWindow = this.getWindowWidget();
            if (currentWindow) {
              const menuRightWidth = currentWindow.getWindowMenuContainerRight().getBoundingClientRect();
              if ((menuRightWidth.width > 0 || sidebarWidth > 0) && parentSize.width > 0) {
                w = menuRightWidth.left - Math.max(0, parentSize.left, sidebarWidth);
              }
            }
          }
          return w;
        },

        /**
         * The dropdown can overlay the widget
         * @param {boolean} canOverlay true : the dropdown can overlay the widget
         */
        setCanOverlay: function(canOverlay) {
          this._widgetOverlay = canOverlay;
        },

        /**
         * Calculate the max height depending on the display mode
         * @param {number} ddVerticalPosition - vertical (y) position of the dropdown. Basically top position.
         * @returns {number} max height to use in pixels
         * @private
         */
        _measureMaxHeight: function(ddVerticalPosition) {
          if (this._widgetOverlay) {
            return this._measureComboMaxHeight(ddVerticalPosition);
          }

          return this._measureCompleterMaxHeight(ddVerticalPosition);
        },

        /**
         * Completer : The dropdown must not overlay the input widget
         * @param {number} ddVerticalPosition - vertical (y) position of the dropdown. Basically top position.
         * @returns {number} max height to use in pixels
         * @private
         */
        _measureCompleterMaxHeight: function(ddVerticalPosition) {
          const parentElement = this.parentElement ? this.parentElement : this.getParentWidget().getElement();
          const parentSize = parentElement.getBoundingClientRect();
          const belowWidget = Math.max(0, (parentSize.bottom + window.scrollY));
          const formHeight = document.getElementsByClassName("mt-centralcontainer")[0].getBoundingClientRect().height;

          let h = 0;
          if (this.maxHeight) {
            h = this.maxHeight;
          } else if (this.autoSize) {
            h = this._defaultMaxHeight;
          } else { // by default fit content height
            h = this._element.scrollHeight + 3; // 3 for border
          }

          //Below space > Above space
          if (formHeight - belowWidget > belowWidget - parentSize.height) {
            return Math.min(document.body.clientHeight - ddVerticalPosition, h) - 3; // 3 To not touch the browser border
          } else {
            return Math.min(parentSize.top - 3, h);
          }
        },

        /**
         * We calculate max height of the dropdown. Then vertical scrollbars will be added in dropdown.
         * @param {number} ddVerticalPosition - vertical (y) position of the dropdown. Basically top position.
         * @returns {number} max height to use in pixels
         * @private
         */
        _measureComboMaxHeight: function(ddVerticalPosition) {
          let h = 0;
          if (this.maxHeight) {
            h = this.maxHeight;
          } else if (this.autoSize) {
            h = this._defaultMaxHeight;
          } else { // by default fit content height
            h = this._element.scrollHeight + 3; // 3 for border
          }
          // case when screen height is smaller that dropdown height
          if (Math.min(h, this._defaultMaxHeight) > document.body.clientHeight) { // dropdown take whole screen height
            h = document.body.clientHeight - 5;
          } else if ((h + ddVerticalPosition) > document.body.clientHeight) {
            // case when dropdown has big height and is being overflowed by screen
            h = document.body.clientHeight - ddVerticalPosition - 5;
          }
          return h;
        }

      };
    });
    cls.WidgetFactory.registerBuilder('DropDown', cls.DropDownWidget);
  });
