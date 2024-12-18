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

modulum('UserInterfaceWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * UserInterface widget.
     * @class UserInterfaceWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc Widgets
     */
    cls.UserInterfaceWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.UserInterfaceWidget.prototype */ {
        __name: "UserInterfaceWidget",

        $static: {
          startMenuPosition: 'gStartMenuPosition'
        },

        _text: "",
        _image: null,
        _topMenuContainer: null,
        /** @type {Array} **/
        _topMenus: null,
        _toolBarContainer: null,
        _toolBarWidgets: null,
        _toolBarPosition: "top",
        _startMenuWidget: null,
        _startMenuContainer: null,
        _traditionalWindowContainer: null,
        /**
         * VM Focused widget
         * @type {classes.WidgetBase}
         */
        _vmFocusedWidget: null,
        /**
         * VM Previously Focused widget
         * @type {classes.WidgetBase}
         */
        _vmPreviouslyFocusedWidget: null,

        _dbDate: "MDY4/", // default format
        _unBindLayoutHandler: null,
        _activeWindow: null,
        _errorMessageWidget: null,

        /** @type {Node} */
        _chromeBarContainer: null,
        /** @type {classes.ChromeBarWidget} */
        _chromeBar: null,

        _isBufferingKeys: null,

        _browserResizeHandler: null,

        _charLengthSemantics: null,
        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this._chromeBarContainer = this._element.getElementsByClassName("gbc_chromeBarContainer")[0];
          this._topMenuContainer = this._element.getElementsByClassName("gbc_topMenuContainer")[0];
          this._toolBarContainer = this._element.getElementsByClassName("gbc_toolBarContainer")[0];
          this._bottomToolBarContainer = this._element.getElementsByClassName("gbc_bottomToolBarContainer")[0];

          this._startMenuContainer = this._element.getElementsByClassName("gbc_startMenuContainer")[0];
          this._errorMessageWidget = cls.WidgetFactory.createWidget("Message", this.getBuildParameters());
          this._errorMessageWidget.setHidden(true);

          this._topMenus = [];

          this._toolBarWidgets = [];
          this._chromeBar = cls.WidgetFactory.createWidget("ChromeBar", this.getBuildParameters());
          const appHost = context.HostService.getApplicationHostWidget();
          this._chromeBar.when(context.constants.widgetEvents.toggleClick,
            () => gbc.HostLeftSidebarService.showSidebar());
          this.addChromeBar();

          this._browserResizeHandler = context.HostService.onScreenResize(function() {
            this.getLayoutEngine().forceMeasurement();
            this.getLayoutInformation().invalidateMeasure();
          }.bind(this));
        },
        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._browserResizeHandler) {
            this._browserResizeHandler();
            this._browserResizeHandler = null;
          }
          this._topMenuContainer = null;
          this._toolBarContainer = null;
          this._bottomToolBarContainer = null;
          this._startMenuContainer = null;
          if (this._unBindLayoutHandler) {
            this._unBindLayoutHandler();
            this._unBindLayoutHandler = null;
          }
          this._chromeBarContainer = null;
          if (this._chromeBar) {
            this._chromeBar.destroy();
            this._chromeBar = null;
          }
          this._topMenus.length = 0;
          this._toolBarWidgets = null;
          this._errorMessageWidget.destroy();
          this._errorMessageWidget = null;
          this._vmFocusedWidget = null;
          $super.destroy.call(this);
          this._startMenuWidget = null;
        },
        /**
         * @inheritDoc
         */
        _initLayout: function() {
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutEngine = new cls.UserInterfaceLayoutEngine(this);
          this._unBindLayoutHandler = this._layoutEngine.onLayoutApplied(this._onLayoutApplied.bind(this));
        },

        _onLayoutApplied: function() {
          if (this.getContainerElement().children.length > 1) {
            for (const current of this.getChildren()) {
              if (this._canBeRemoved(current)) {
                current.getElement().remove();
              }
            }
          }

          if (this._unBindLayoutHandler) {
            this._unBindLayoutHandler();
            this._unBindLayoutHandler = null;
          }
        },

        /**
         * Defines if the string length is in character or byte
         * @param {boolean} charLengthSemantics true if we count the number of char
         * @publicdoc
         */
        setCharLengthSemantics: function(charLengthSemantics) {
          this._charLengthSemantics = charLengthSemantics;
        },

        /**
         * @return {boolean} true if we count the number of char
         */
        isCharLengthSemantics: function() {
          return this._charLengthSemantics;
        },

        _canBeRemoved: function(widget) {
          const currentWindowWidget = context.HostService.getCurrentWindowWidget();
          return widget instanceof cls.WindowWidget && (currentWindowWidget && widget !== currentWindowWidget) && !widget._forceVisible;
        },

        getMessageWidget: function() {
          return this._errorMessageWidget;
        },

        /**
         * Get the chromebar widget if any
         * @return {*|null}
         */
        getChromeBarWidget: function() {
          return this._chromeBar;
        },

        /**
         *
         * @param {classes.TopMenuWidget} topMenu
         * @param order
         */
        addTopMenu: function(topMenu, order) {
          topMenu.setOrder(order);
          if (topMenu.getParentWidget() === null) {
            this.addChildWidget(topMenu, {
              noDOMInsert: true
            });
          }
          topMenu.setGlobal(order === 1); // Order 1 is global tm
          this._topMenus.push(topMenu);
          topMenu.getElement().insertAt(order, this._topMenuContainer);
        },
        /**
         * Define where top menu is rendered: 'classic' or 'sidebar' according to device
         * @param {String} desktop - desktop rendering (default to "classic")
         * @param {String} mobile - mobile rendering (default to "sidebar")
         */
        setTopmenuRendering: function(desktop = "classic", mobile = "sidebar") {
          const inSideBar = (window.isMobile() && mobile === "sidebar") || (!window.isMobile() && desktop === "sidebar");
          if (inSideBar) {
            this._topMenus.forEach((tm) => {
              tm.setRenderInSideBar();
            });
          }
        },

        /**
         * Add the chromebar to the dom
         */
        addChromeBar: function() {
          if (this._chromeBar) {
            this.addChildWidget(this._chromeBar, {
              noDOMInsert: true
            });
            this._chromeBarContainer.appendChild(this._chromeBar.getElement());
          }
        },

        addStartMenu: function(widget) {
          this._startMenuWidget = widget;
          this._startMenuContainer.appendChild(widget.getElement());
        },

        getStartMenuWidget: function() {
          return this._startMenuWidget;
        },

        /**
         * Add a global toolbar
         * @param toolBar
         * @param order
         */
        addToolBar: function(toolBar, order) {
          toolBar.setOrder(order);
          if (toolBar.getParentWidget() === null) {
            this.addChildWidget(toolBar, {
              noDOMInsert: true
            });
          }
          this._toolBarWidgets.push(toolBar);
          this._toolBarContainer.prependChild(toolBar.getElement());

        },

        removeToolBar: function(toolBar) {
          this._toolBarWidgets = this._toolBarWidgets.filter(item => item !== toolBar);
        },

        /**
         * Set the Global Toolbar position
         * @param {String} position - "top", "bottom", "none", or nothing to refresh toolbar positions
         */
        setToolBarPosition: function(position) {
          if (position) {
            this._toolBarPosition = position;
          }

          this._toolBarWidgets.forEach(toolBar => {
            let position = this._toolBarPosition;
            if (toolBar.getPosition() && toolBar.getPosition() !== "default") {
              position = toolBar.getPosition();
            }

            switch (position) {
              case "top":
                toolBar.setHidden(false);
                this._toolBarContainer.prependChild(toolBar.getElement());
                break;
              case "bottom":
                toolBar.setHidden(false);
                this._bottomToolBarContainer.prependChild(toolBar.getElement());
                break;
              case "none":
                toolBar.setHidden(true);
                break;
            }
          });
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {
          $super.setFocus.call(this, fromMouse);
          this.getElement().domFocus();
        },

        /**
         * Set focused widget
         * @param {classes.WidgetBase} widget - widget which gains focus
         */
        setFocusedWidget: function(widget) {
          this._vmPreviouslyFocusedWidget = this._vmFocusedWidget;
          if (this._vmFocusedWidget !== widget) {
            if (this._vmFocusedWidget && !this._vmFocusedWidget.isDestroyed()) {
              this._vmFocusedWidget.loseVMFocus(widget);
            }
          }

          //For buttonEdit after click on a completer the focus is on the InputWidget
          // and the _focusedWidget is a ButtonEditWidget
          //The auiTag on the input and the buttonEdit is the same
          if (this._vmFocusedWidget && this._vmFocusedWidget._auiTag !== widget._auiTag) {
            if (this._vmFocusedWidget.getElement()) {
              this._vmFocusedWidget.getElement().removeClass("gbc_Focus");
              this._vmFocusedWidget.loseFocus();
            }
          }

          if (!this._vmFocusedWidget || this._vmFocusedWidget._auiTag !== widget._auiTag) {
            this._vmFocusedWidget = widget;
            if (this._vmFocusedWidget.getElement()) {
              this._vmFocusedWidget.getElement().addClass("gbc_Focus");
            }
          }
        },

        /**
         * @returns {classes.WidgetBase} current focused widget (by VM)
         */
        getFocusedWidget: function() {
          return this._vmFocusedWidget;
        },

        /**
         * @returns {boolean} true if current focused widget changed (by VM)
         */
        hasFocusedWidgetChanged: function() {
          return this._vmFocusedWidget !== this._vmPreviouslyFocusedWidget;
        },

        /**
         * @param {string} text The window title
         */
        setText: function(text) {
          this._text = text;
        },
        /**
         * @returns {string} The window title
         */
        getText: function() {
          return this._text;
        },

        setImage: function(image) {
          this._image = image;
          this.emit(context.constants.widgetEvents.iconChanged, image);
        },

        getImage: function() {
          return this._image;
        },

        getDbDateFormat: function() {
          return this._dbDate;
        },

        setDbDateFormat: function(format) {
          this._dbDate = format;
        },

        getTraditionalWindowContainer: function() {
          if (!this._traditionalWindowContainer) {
            this._traditionalWindowContainer = cls.WidgetFactory.createWidget("TraditionalWindowContainer", this
              .getBuildParameters());
          }
          return this._traditionalWindowContainer;
        },

        removeTraditionalWindowContainer: function() {
          if (this._traditionalWindowContainer) {
            this.removeChildWidget(this._traditionalWindowContainer);
            this._traditionalWindowContainer = null;
          }
        },
        isLayoutTerminator: function() {
          return true;
        },
        activate: function(win) {
          this.emit(context.constants.widgetEvents.activate, win);
        },

        onActivate: function(hook) {
          return this.when(context.constants.widgetEvents.activate, hook);
        },
        onDisable: function(hook) {
          return this.when(context.constants.widgetEvents.disable, hook);
        },

        /**
         * @inheritDoc
         */
        setBackgroundColor: function(color) {
          $super.setBackgroundColor.call(this, color);
          this.setStyle('> .gbc_barsContainer', {
            "background-color": color && !this._ignoreBackgroundColor ? color : null
          });
        },

        /**
         * Show/hide filter item in chromebar
         * @param {boolean} visible - true if item must be visible
         * @param {String} [filterValue] - initial filter value
         */
        showChromeBarFilterMenuItem: function(visible, filterValue) {
          if (this._chromeBar) {
            this._chromeBar.showFilterMenuItem(visible, filterValue);
          }
        },
      };
    });
    cls.WidgetFactory.registerBuilder('UserInterface', cls.UserInterfaceWidget);
  });
