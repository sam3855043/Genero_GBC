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

modulum('WindowWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Base class for widgets.
     * @class WindowWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc
     */
    cls.WindowWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.WindowWidget.prototype */ {
        __name: "WindowWidget",
        /**
         * @type {classes.ModalWidget}
         */
        _modalWidget: null,
        /**
         * title
         * @type {?string}
         */
        _text: null,
        /**
         * window icon
         * @type {?string}
         */
        _image: null,
        _topMenus: null,
        /** @type {classes.TopMenuWidget} */
        _activeTopMenuWidget: null,
        /** @type {classes.MenuWidget} */
        _menuWidget: null,
        /** @type {classes.TabbedContainerWidget} */
        _tabbedContainerWidget: null,

        /**
         * List of toolbar widgets
         * @type {Array}
         */
        _toolBarWidgets: null,
        _closeHostMenuOnClickHandler: null,
        _menuContainerTop: null,
        _menuContainerBottom: null,
        _menuContainerLeft: null,
        _menuContainerRight: null,
        _menuContainerMiddle: null,
        _toolBarContainer: null,
        _topMenuContainer: null,
        _windowContent: null,
        _toolBarPosition: "top",
        _toolBarInWindow: false, // define if the toolbar is directly in the window or if it is in the global toolbar
        _startMenuType: null,
        _actionsEnabled: false,
        _disabled: false,
        _position: null,
        _positionClass: "gbc_WindowWidget_position_default",
        _processing: false,
        _messageWidget: null,

        /** @type {Boolean} **/
        _isClosable: true,

        /**
         * @type {boolean}
         */
        isModal: false,

        /**
         * @type {classes.ChromeBarWidget}
         */
        _chromeBar: null,

        /** @type {boolean}  */
        _forceDefaultSettings: false,

        /**
         * @constructs
         * @param {Object} opts - Options passed to the constructor
         * @publicdoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this._menuContainerTop = this._element.getElementsByClassName("gbc_WindowMenuContainerTop")[0];

          this._menuContainerBottom = this._element.getElementsByClassName("gbc_WindowMenuContainerBottom")[0];
          this._menuContainerLeft = this._element.getElementsByClassName("gbc_WindowMenuContainerLeft")[0];
          this._menuContainerRight = this._element.getElementsByClassName("gbc_WindowMenuContainerRight")[0];
          this._menuContainerMiddle = this._element.getElementsByClassName("gbc_WindowMenuContainerMiddle")[0];

          this._toolBarContainer = this._element.getElementsByClassName("gbc_WindowToolBarContainer")[0];
          this._bottomToolBarContainer = this._element.getElementsByClassName("gbc_WindowBottomToolBarContainer")[0];

          this._topMenuContainer = this._element.getElementsByClassName("gbc_WindowTopMenuContainer")[0];
          this._windowContent = this._element.getElementsByClassName("gbc_WindowContent")[0];

          this._messageWidget = cls.WidgetFactory.createWidget("Message", this.getBuildParameters());
          this._messageWidget.setHidden(true);

          this._topMenus = [];

          this._toolBarWidgets = [];
          this._chromeBar = opts.chromeBar;
          this.setClosable(false); //default
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._position = null;
          if (context.HostService.getCurrentWindowWidget() === this) {
            context.HostService.unsetCurrentWindowNode();
          }
          if (this.getParentWidget() && this.getParentWidget()._activeWindow === this) {
            this.getParentWidget()._activeWindow = null;
          }
          if (this._modalWidget) {
            this._modalWidget.hide();
            this._modalWidget.destroy();
            this._modalWidget = null;
          }

          this._menuContainerTop = null;
          this._menuContainerBottom = null;
          this._menuContainerLeft = null;
          this._menuContainerRight = null;
          this._menuContainerMiddle = null;
          this._toolBarContainer = null;
          this._topMenuContainer = null;
          this._windowContent = null;
          this._messageWidget.destroy();
          this._messageWidget = null;
          this._topMenus.length = 0;
          this._activeTopMenuWidget = null;
          this._menuWidget = null;
          this._toolBarWidgets = null;

          if (this._tabbedContainerWidget) {
            this.removeChildWidget(this._tabbedContainerWidget);
            this._tabbedContainerWidget = null;
          }

          $super.destroy.call(this);

          gbc.InitService.emit(gbc.constants.widgetEvents.onBeforeUnload); // Store stored settings before leaving
        },

        /**
         * emit window close event
         */
        _emitClose: function() {
          if (!this._processing) {
            this.emit(context.constants.widgetEvents.close);
          }
        },

        /**
         * Set Default TTF color
         * @param {string} color - rgb formatted or css name
         */
        setDefaultTTFColor: function(color) {
          if (this._chromeBar) {
            this._chromeBar.setDefaultTTFColor(color);
          }
        },

        /**
         * set the window title
         * @param {string} text window title
         * @publicdoc
         */
        setText: function(text) {
          this._text = text;
          if (this._modalWidget) {
            this._modalWidget.setHeader(text);
          }
        },

        /**
         * get the window title
         * @publicdoc
         * @returns {string} window title
         */
        getText: function() {
          return this._text;
        },

        /**
         * set the window icon
         * @publicdoc
         * @param {string} image the image to set
         */
        setImage: function(image) {
          this._image = image;
          if (this._modalWidget) {
            this._modalWidget.setImage(image);
          }
          this.emit(context.constants.widgetEvents.iconChanged, image);
        },

        /**
         * get the window icon
         * @publicdoc
         * @return {?string} the icon
         */
        getImage: function() {
          return this._image;
        },

        /**
         * get the window's message widget
         * @publicdoc
         * @return {classes.MessageWidget} the window's message widget
         */
        getMessageWidget: function() {
          return this._messageWidget;
        },

        /**
         * enable window contents
         */
        unfreeze: function() {
          this._disabled = false;
          this.enableActions();
          if (this._modalWidget) {
            this._modalWidget._element.removeClass("hidden");
          }
          this.emit(gbc.constants.widgetEvents.unfrozen);
        },
        /**
         * disable window contents
         */
        freeze: function(isNewWindowModal) {
          this._disabled = !isNewWindowModal;
          this.disableActions();
          if (this._modalWidget) {
            this._modalWidget._element.addClass("hidden");
          }
          this.emit(gbc.constants.widgetEvents.frozen);
        },

        /**
         *
         * @param hidden {boolean} true if the widget is hidden, false otherwise
         */
        setHidden: function(hidden) {
          if (this._modalWidget) {
            this._modalWidget.hide();
          }
          if (this._activeTopMenuWidget) {
            this._activeTopMenuWidget.setHidden(hidden);
          }
          if (this._toolBarWidgets?.length > 0) {
            this._toolBarWidgets.forEach(toolBar => {
              toolBar.setHidden(hidden || this._toolBarPosition === "none");
            });
          }
          this.getLayoutEngine().changeHidden(hidden);
        },

        /**
         * Defines the menu to be displayed as a modal one
         * @param {Object?} opt - options to pass to the new modal
         * @private
         */
        setAsModal: function(opt) {
          if (!this._modalWidget) {
            const buildParameters = this.getBuildParameters();
            buildParameters.storedSettingsKey = opt.storedSettingsKey;
            this._modalWidget = cls.WidgetFactory.createWidget("Modal", buildParameters);
            this._modalWidget.setReverse(this.isReversed());
            this._modalWidget.addClass('gbc_ModalWindowDialog');
            this._modalWidget.addClass('g_needLayout');
            this.getParentWidget().getContainerElement().appendChild(this._modalWidget.getElement());
            this._modalWidget.when(gbc.constants.widgetEvents.close, this._emitClose.bind(this));
            this._modalWidget.setClosable(false);
          }
          this._modalWidget.setHeader(this.getText());
          this._modalWidget.setImage(this.getImage());
          this._modalWidget.setContent(this.getElement());
          this._modalWidget.setBackgroundColor(this._backgroundColor);
          this.isModal = true;

          this._modalWidget.show();
          return this._modalWidget;
        },

        /**
         *
         * @return {classes.ModalWidget}
         */
        getModal: function() {
          return this._modalWidget;
        },
        /**
         * Right window menu container
         * @return {Element}
         */
        getWindowMenuContainerRight: function() {
          return this._menuContainerRight;
        },
        /**
         * Main window container which holds menus + forms
         * @return {Element}
         */
        getWindowMiddleContainer: function() {
          return this._menuContainerMiddle;
        },
        /**
         * Main window container which holds forms
         * @return {Element}
         */
        getWindowContentContainer: function() {
          return this._windowContent;
        },
        /**
         *
         * @private
         * @param rtl
         */
        setReverse: function(rtl) {
          $super.setReverse.call(this, rtl);
          if (this._modalWidget) {
            this._modalWidget.setReverse(rtl);
          }
        },

        /**
         * Set position of the window based on position 4ST attribute.
         * At the moment, only a modal window will be affected by this attribute, a normal window is always displayed full screen.
         * For the modal window, by default it's centered. If 4ST is set to 'field', pos parameter is referent widget.
         * @private
         * @param pos {string|classes.WidgetBase}
         */
        setPosition: function(pos) {
          const isPosString = typeof(pos) === "string";
          const isPosField = pos && pos.isInstanceOf && pos.isInstanceOf(cls.WidgetBase);
          this._element.removeClass(this._positionClass);
          this._positionClass = "gbc_WindowWidget_position_" + (isPosString ? pos : "center");
          this._element.addClass(this._positionClass);
          // setting position to field without having windowType to modal makes no sense,
          // it's considered as modal by GDC but not by HTMLv1.
          if (isPosField && this._modalWidget) {
            const rect = pos.getElement().getBoundingClientRect(),
              appRect = pos.getApplicationWidget().getElement().getBoundingClientRect(),
              chromeBar = pos.getApplicationWidget().getUserInterfaceWidget().getChromeBarWidget(),
              chromeBarRect = chromeBar && chromeBar.getElement()
              .getBoundingClientRect(); // Taking care of chromebar height in placement if any

            this._modalWidget.setPosition(
              this.isReversed() ? appRect.right - rect.right : rect.left - appRect.left,
              rect.top + rect.height - appRect.top - (chromeBarRect ? chromeBarRect.height : 0)
            );
          }
        },

        /**
         * @inheritDoc
         */
        setNoBorder: function(noBorder) {
          $super.setNoBorder.call(this, noBorder);
          if (this._modalWidget) {
            this._modalWidget.setHeaderHidden(noBorder);
          }
        },

        /**
         * @returns {boolean} true if the widget is hidden, false otherwise
         */
        isHidden: function() {
          return !this._element;
        },
        /**
         * @private
         * @param hook
         */
        onClose: function(hook) {
          this.when(gbc.constants.widgetEvents.close, hook);
        },
        /**
         * @private
         * @param closable
         */
        setClosable: function(closable) {
          this._isClosable = closable;
          if (this.isModal && this._modalWidget) {
            this._modalWidget.setClosable(Boolean(closable));
            context.HostService.setClosableWindowActionActive(this, false);
          } else {
            context.HostService.setClosableWindowActionActive(this, closable);
            if (this._chromeBar && this._chromeBar._closeMenuItem) {
              this._chromeBar._closeMenuItem.setHidden(!closable);
            }
          }
        },

        /**
         * Is window closable?
         * @return {Boolean}
         */
        isClosable: function() {
          return this._isClosable;
        },

        /**
         * Enable actions of the window
         */
        enableActions: function() {
          context.HostService.setClosableWindowActionHidden(this, false);
          this._actionsEnabled = true;
        },

        /**
         * Disable actions of the window
         */
        disableActions: function() {
          context.HostService.setClosableWindowActionHidden(this, true);
          this._actionsEnabled = false;
        },

        /**
         *
         * @private
         * @param path
         */
        setBackgroundImage: function(path) {
          if (path) {
            this.setStyle({
              "background-image": "url('" + path + "')"
            });
          } else {
            this.setStyle({
              "background-image": null
            });
          }
        },

        /**
         * @inheritDoc
         */
        setBackgroundColor: function(color) {
          $super.setBackgroundColor.call(this, color);
          if (this._modalWidget) {
            this._modalWidget.setBackgroundColor(color);
          }
        },

        /**
         * @param {classes.TabbedContainerWidget} tabbedContainer
         */
        addTabbedContainer: function(tabbedContainer) {
          this._tabbedContainerWidget = tabbedContainer;
          this.addChildWidget(tabbedContainer);
        },

        /**
         * @private
         * @param {classes.TopMenuWidget} topMenu
         * @param order
         * @param topMenuContainer
         */
        addTopMenu: function(topMenu, order, topMenuContainer) {
          this.addChildWidget(topMenu, {
            noDOMInsert: true
          });
          if (this._activeTopMenuWidget) {
            this._activeTopMenuWidget.setHidden(true);
          }
          this._topMenus.push(topMenu);
          this._activeTopMenuWidget = topMenu;
          if (topMenuContainer !== this) {
            topMenuContainer.addTopMenu(this._activeTopMenuWidget, order);
          } else {
            this._topMenuContainer.appendChild(this._activeTopMenuWidget.getElement());
          }
          this._activeTopMenuWidget.setHidden(false);
        },

        /**
         *
         * @private
         * @param topMenu
         */
        removeTopMenu: function(topMenu) {
          this._topMenus.remove(topMenu);
          if (this._activeTopMenuWidget === topMenu) {
            this._activeTopMenuWidget.setHidden(true);
            this._activeTopMenuWidget = this._topMenus.length ? this._topMenus[this._topMenus.length - 1] : null;
            if (this._activeTopMenuWidget) {
              this._activeTopMenuWidget.setHidden(false);
            }

          }
        },

        /**
         *
         * @private
         * @param container
         * @return {null}
         */
        getMenuContainer: function(container) {
          switch (container) {
            case "top":
              return this._menuContainerTop;
            case "bottom":
              return this._menuContainerBottom;
            case "left":
              return this._menuContainerLeft;
            case "right":
              return this._menuContainerRight;
            default:
              return null;
          }
        },

        /**
         * Add a toolbar to the window
         * @private
         * @param toolBar
         * @param order
         */
        addToolBar: function(toolBar, order) {
          toolBar.setOrder(order);
          this.addChildWidget(toolBar, {
            noDOMInsert: true
          });
          this._toolBarWidgets.push(toolBar);
          this._toolBarContainer.prependChild(toolBar.getElement());
        },

        /**
         *
         * @return {null}
         */
        getMenuContainers: function() {
          return {
            top: this._menuContainerTop,
            bottom: this._menuContainerBottom,
            left: this._menuContainerLeft,
            right: this._menuContainerRight
          };
        },

        /**
         * @param toolBar
         */
        removeToolBar: function(toolBar) {
          this._toolBarWidgets = this._toolBarWidgets.filter(item => item !== toolBar);
        },

        /**
         * Add a menu to the window
         * @private
         * @param widget
         */
        addMenu: function(widget) {
          this._menuWidget = widget;
          this.addChildWidget(widget, {
            noDOMInsert: true
          });
        },

        /**
         * Get window menu widget
         */
        getMenuWidget: function() {
          return this._menuWidget;
        },

        /**
         * Set the Window Toolbar position
         * @param {String} position - "top", "bottom", "none", or nothing to refresh toolbar positions
         */
        setToolBarPosition: function(position) {
          if (position) {
            this._toolBarPosition = position;
            // Mirror the setting to the user interface
            this.getUserInterfaceWidget().setToolBarPosition(position);
          }

          this._toolBarWidgets.forEach(toolBar => {
            let position = this._toolBarPosition;
            if (toolBar.getPosition() && toolBar.getPosition() !== "default") {
              position = toolBar.getPosition();
            }
            toolBar.setHidden(false);

            switch (position) {
              case "top":
                this._toolBarContainer.prependChild(toolBar.getElement());
                break;
              case "bottom":
                this._bottomToolBarContainer.prependChild(toolBar.getElement());
                break;
              case "none":
                toolBar.setHidden(true);
                break;
            }
          });
        },

        /**
         * Get the Window Toolbar position
         * @return {String} could be "top", "bottom", "none" or "chrome"
         */
        getToolBarPosition: function() {
          return this._toolBarPosition;
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
         * @private
         * @param type
         */
        setStartMenuType: function(type) {
          this._startMenuType = type;
        },

        /**
         * @private
         */
        getStartMenuType: function() {
          return this._startMenuType;
        },

        /**
         *
         * @param processing
         * @private
         */
        _setProcessingStyle: function(processing) {
          this._processing = processing;
          context.HostService.setClosableWindowActionProcessing(this, processing);
        },

        /**
         * Ignore stored Settings (for position and size)
         * @param {Boolean} forceDefaultSettings
         */
        setForceDefaultSettings: function(forceDefaultSettings) {
          this._forceDefaultSettings = forceDefaultSettings;
          if (this._modalWidget) {
            this._modalWidget.setForceDefaultSettings(forceDefaultSettings);
          }
        }

      };
    });
    cls.WidgetFactory.registerBuilder('Window', cls.WindowWidget);
  });
