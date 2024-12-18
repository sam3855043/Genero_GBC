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

modulum('RSidebarWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Sidebar for responsive
     * It contains :
     *    - The applist:
     *      -- always visible on wide screen (theme-variable control)
     *      -- hiden on small/medium (theme-variable control)
     *      -- could be expanded with big list with a button (as an educational way)
     *      -- contains the settings/about buttons to free space in chromebar
     *    - The topMenu:
     *      -- if present and set to sidebar (default with mobile, theme-variable controled)
     * @class RSidebarWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.RSidebarWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.RSidebarWidget.prototype */ {
        __name: "RSidebarWidget",
        //_resizerElement: null,

        _topMenuContainer: null,
        _topMenuWidget: null,

        _appListContainer: null,
        _appListWidget: null,
        _applicationListVisible: null,
        _expanded: false,

        _menuIconElement: null,
        _appsIconElement: null,

        /**
         * @type ?number
         */
        _currentSize: null,

        _initElement: function() {
          $super._initElement.call(this);

          this._applicationListVisible = "auto"; // default value
          this._expanded = false; // default not expanded
          this.setAppListWidth(0); // hide default

          this._titleElement = this._element.getElementsByClassName("titleContainer")[0];
          this._topMenuContainer = this._element.getElementsByClassName("topmenuContainer")[0];
          this._appListContainer = this._element.getElementsByClassName("applistContainer")[0];
          this._settingsContainer = this._element.getElementsByClassName("settingsContainer")[0];

          this._sidebarToggle = this._element.getElementsByClassName("mt-sidebar-toggle")[0];

          this._element.on("transitionend.ApplicationHostSidebarWidget", this._onTransitionEnd.bind(this));
          this._element.on("oTransitionend.ApplicationHostSidebarWidget", this._onTransitionEnd.bind(this));
          this._element.on("webkitTransitionend.ApplicationHostSidebarWidget", this._onTransitionEnd.bind(this));

          this._menuIconElement = this._titleElement.querySelector(".zmdi-menu");
          this._appsIconElement = this._titleElement.querySelector(".zmdi-apps");

          this._expandElement = this._element.getElementsByClassName("arrow-expand")[0];
          window.addEventListener("resize", () => {
            this.updateResizeTimer(true);
          });

          if (window.isMobile()) {
            const root = window.document.querySelector(":root");
            root.style.setProperty('--applistWidth', 0); // default hidden
          }
          this._resizeHandler = context.HostService.onScreenResize((event) => {
            let hostSizeChanged = event.data[2];
            if (hostSizeChanged.width) {
              gbc.HostLeftSidebarService.hideSidebar();
              gbc.HostLeftSidebarService.showTopMenu(false);
              if (window.isMobile()) {
                window.document.querySelector(":root").style.setProperty('--applistWidth', 0);
              }
            }
          });

        },

        constructor: function(opts) {
          $super.constructor.call(this, opts);
          //constructor: create appList and topmenu

          this._topMenuWidget = cls.WidgetFactory.createWidget("RSidebarTopMenu", this.getBuildParameters());
          this._topMenuContainer.appendChild(this._topMenuWidget.getElement());
          this._appListWidget = cls.WidgetFactory.createWidget("RSidebarApplist", this.getBuildParameters());
          this._appListContainer.appendChild(this._appListWidget.getElement());
        },

        getTopmenu: function() {
          return this._topMenuWidget;
        },

        //show apps or topMenu
        showIcon: function(type) {
          if (type === "menu") {
            this._menuIconElement.style.display = "flex";
            this._appsIconElement.style.display = "none";
          } else {
            this._menuIconElement.style.display = "none";
            this._appsIconElement.style.display = "flex";
          }
        },

        setIcon: function(image) {
          if (!this._image) {
            this._image = cls.WidgetFactory.createWidget("ImageWidget", this.getBuildParameters());
            this._windowIcon.prependChild(this._image.getElement());
          }
          this._image.setHidden(true);
          if (image && image !== "") {
            this._image.setSrc(image);
            this._image.setHidden(false);
          }
        },

        getApplist: function() {
          return this._appListWidget;
        },

        _initLayout: function() {
          // no layout
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          // TODO
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          const target = domEvent.target;
          if (target.isElementOrChildOf(this._sidebarToggle)) {
            const displayed = gbc.HostLeftSidebarService.toggleSidebar();
            this.showTopMenu(displayed);
            if (!displayed && window.isMobile()) {
              this.setAppListWidth(0);
              return false; //stop bubbling
            }
          }
          if (target.isElementOrChildOf(this._expandElement) || target.isElementOrChildOf(this._appsIconElement)) {
            this.toggleExpand();
          } else {
            this.expand(false);
          }
          return $super.manageMouseClick.call(this, domEvent);
        },

        // Show Hide methods
        showTitle: function(show) {
          show = (show || this._applicationListVisible === "yes") && this._applicationListVisible !== "no";
          if (this._titleElement) {
            this._titleElement.toggleClass("visible", show);
          }
        },
        showAppList: function(show) {
          this._appListVisible = show;
          show = (show || this._applicationListVisible === "yes") && this._applicationListVisible !== "no";
          this._appListContainer.toggleClass("visible", show);
          gbc.HostService.getApplicationHostWidget().toggleClass("has-applist-sidebar", show);
        },

        /**
         * Set Applist mode (for 4ST api)
         * @param {String} visible could be 'yes', 'no' or 'auto'
         * @param {Number?} appCount
         */
        setApplicationListVisible: function(visible, appCount) {
          this._applicationListVisible = visible;
          if (visible === 'no') {
            this._hideApplist();
          } else if (visible === 'yes') {
            this._showApplist();
          } else { // auto / default
            if (appCount && appCount > 1 && this._appListWidget.getChildren()[0].getChildren().length > 1) {
              this._showApplist();
            } else {
              this._hideApplist();
            }
          }
        },
        /**
         * Shortcut to display applList
         * @private
         */
        _showApplist() {
          this.showAppList(true);
          const themeSideBarSize = !this.isExpanded() ? gbc.ThemeService.getValue("theme-sidebar-default-width") : gbc.ThemeService.getValue(
            "theme-sidebar-max-width");
          this.setAppListWidth(parseInt(themeSideBarSize, 10));
          this.showSettings(true);
          this.showTitle(true);
          this.removeClass(".mt-sidebar-unavailable");
        },
        /**
         *
         * Shortcut to hide applList
         * @private
         */
        _hideApplist() {
          this.showAppList(false);
          this.setAppListWidth(0);
          this.showSettings(false);
          this.showTitle(false);
          this.addClass(".mt-sidebar-unavailable");
        },

        /**
         * Check if appList is displayed
         * @return {*}
         */
        isAppListDisplayed: function() {
          return this._appListContainer.hasClass("visible");
        },

        /**
         * Show the sidebar TopMenu
         * @param {Boolean} show - true to show, false otherwise
         */
        showTopMenu: function(show) {
          this._topMenuContainer.toggleClass("visible", show);
          this._topMenuWidget.displayFirst();
        },

        renderAppTopMenu: function(appHash) {
          if (this._topMenuWidget && this._topMenuWidget.getChildren().length > 0) {
            this._topMenuWidget.renderAppTopmenu(appHash);
          } else {
            // No topmenu for this App
            gbc.HostLeftSidebarService.setHasTopMenu(false);
          }
        },

        /**
         * Show/hide the settings/expand panel at bottom
         * @param {Boolean} show - true to display, false otherwise
         */
        showSettings: function(show) {
          show = (show || this._applicationListVisible === "yes") && this._applicationListVisible !== "no";
          if (this._settingsContainer) {
            this._settingsContainer.toggleClass("visible", show);
          }
        },

        updateResizeTimer: function(onlyRelayout) {
          if (window.isMobile() && !window.isOrientationImplemented) {
            window.orientation = window.innerWidth > window.innerHeight ? 90 : 0;
          }
          // for mobiles, only relayout on screen orientation
          if (!window.isMobile() || this._screenOrientation !== window.orientation) {
            this._screenOrientation = window.orientation;
            if (this._resizeHandle) {
              this._clearTimeout(this._resizeHandle);
              this._resizeHandle = null;
            }
            this._resizeHandle = this._registerTimeout(() => {
              if (onlyRelayout) {
                this.emit(context.constants.widgetEvents.displayChanged);
                return;
              }

              this.updateResize(null, false);
            }, 100);
          }
        },

        updateResize: function(deltaX, absolute) {
          const previousSize = this._currentSize;
          this._resizeHandle = null;

          const max = cls.Size.translate(context.ThemeService.getValue("theme-sidebar-max-width"));
          if (absolute) {
            this._currentSize = deltaX;
          } else {
            this._currentSize = (Object.isNumber(this._origin) ? this._origin : this._currentSize) + (deltaX || 0);
            if (this._currentSize < 16) {
              this._currentSize = 16;
            }
          }
          if (this._currentSize > max) {
            this._currentSize = max;
          }
          if (!this.isAlwaysVisible()) {
            this.getParentWidget().setCentralContainerPosition(0);
          } else {
            this.getParentWidget().setCentralContainerPosition(this._currentSize);
          }
          // if sidebar size or visibility changed, we emit displayChanged
          if (this._currentSize !== previousSize) {
            // if sidebar size changed only, we update size
            this.setStyle({
              width: this._currentSize + "px"
            });
            // Save sidebar width into storedSettings
            gbc.StoredSettingsService.setSideBarwidth(this._currentSize);
          }
          this.emit(context.constants.widgetEvents.displayChanged);
        },
        /**
         *
         * @returns {classes.ApplicationHostWidget}
         */
        getParentWidget: function() {
          return $super.getParentWidget.call(this);
        },

        /**
         * Display sidebar
         * @param {Boolean} displayed - request display state
         * @return {Boolean} true if displayed, false otherwise
         */
        setDisplayed: function(displayed) {
          if (!this._topMenuWidget) {
            displayed = false;
          } else if (this._topMenuWidget && this._topMenuWidget.getChildren().length <= 0) {
            displayed = false;
          } else if (!displayed && this._topMenuWidget && this._topMenuWidget.getChildren().length > 0) {
            // when closed, go back to first level if not already
            if (!this._topMenuWidget.isFirstDisplayed()) {
              this._topMenuWidget.displayFirst();
            }
            displayed = false;
          }

          this.getElement().toggleClass("mt-sidebar-displayed", Boolean(displayed));

          return displayed;
        },
        isDisplayed: function() {
          return this.getElement().hasClass("mt-sidebar-displayed");
        },

        isUnavailable: function() {
          return this._unavailable;
        },
        setUnavailable: function(unavailable) {
          if (this._applicationListVisible === "yes") {
            this.getElement().removeClass("mt-sidebar-unavailable");
            return;
          }
          this._unavailable = Boolean(unavailable);
          this.getElement().toggleClass("mt-sidebar-unavailable", Boolean(unavailable));
        },

        _onTransitionEnd: function(evt) {
          if (evt.target.hasClass("mt-sidebar")) {
            const positionUpdated = this.getParentWidget().setCentralContainerPosition(!this.isAlwaysVisible() ? 0 : this
              ._currentSize);
            if (positionUpdated) {
              this.emit(context.constants.widgetEvents.displayChanged);
            }
          }
        },
        getCurrentSize: function() {
          return this._currentSize;
        },
        getTitle: function() {
          return this._titleTextElement.textContent;
        },

        /* Don't allow set title here
        setTitle: function(title) {
          this._titleTextElement.textContent = title;
        },*/

        /**https://t.co/N65YtC2QAa
         * expand the applist
         * @param expanded
         */
        expand: function(expanded) {
          if (this._expanded !== expanded) {
            this._expanded = expanded; //TODO: add this state to storedSettings

            const themeSideBarSize = parseInt(gbc.ThemeService.getValue("theme-sidebar-default-width"), 10);
            const themeExpandedSize = parseInt(gbc.ThemeService.getValue("theme-sidebar-max-width"), 10);
            const force = window.isMobile();
            this.setAppListWidth(expanded ? themeExpandedSize : themeSideBarSize, force);
            this.toggleClass("expanded", expanded);
          }
        },
        toggleExpand: function() {
          this.expand(!this._expanded);
        },

        /**
         * Check if sidebar is expanded
         * @return {boolean} true if expanded, false otherwise
         */
        isExpanded: function() {
          return this._expanded;
        },

        setAppListWidth: function(width, force) {
          if (this._currentSize === width) {
            return;
          }
          //Mobile
          if (window.isMobile()) {
            width = force ? width : 0;
          }

          // forced width since we want to make it always visible as long there is an app running
          if (this._applicationListVisible === "yes" && gbc.HostLeftSidebarService.getApplicationCount() > 0) {
            width = !this._expanded ? gbc.ThemeService.getValue("theme-sidebar-default-width") : gbc.ThemeService.getValue(
              "theme-sidebar-max-width");
          } else if (this._applicationListVisible === "no" || gbc.HostLeftSidebarService.getApplicationCount() <= 0) {
            width = 0;
          }
          this._currentSize = parseInt(width, 10);

          gbc.HostService.getApplicationHostWidget().toggleClass("has-visible-applist", this._currentSize > 0);

          window.document.querySelector(":root").style.setProperty('--applistWidth', parseInt(width, 10) + "px");
          if (this._titleElement) {
            this._titleElement.toggleClass("visible", width !== 0);
          }
          if (this._settingsContainer) {
            this._settingsContainer.toggleClass("visible", width !== 0);
          }

          gbc.HostService.syncCurrentWindow();
        },

        onDisplayChanged: function(hook) {
          return this.when(context.constants.widgetEvents.displayChanged, hook);
        },

        _onDragOver: function(evt) {
          this._pageX = evt.clientX || evt.screenX || evt.pageX;
          evt.preventCancelableDefault();
        },
        _onDragStart: function(evt) {
          document.body.on("dragover.ApplicationHostSidebarWidget", this._onDragOver.bind(this));
          this._isDragging = true;
          if (window.browserInfo.isFirefox) {
            evt.dataTransfer.setData('text', ''); // for Firefox compatibility
          }
          if (evt.dataTransfer.setDragImage) {
            evt.dataTransfer.setDragImage(this._dragHandle, 0, 0);
          }
          evt.dataTransfer.effectAllowed = "move";
          this._pageX = this._resizerDragX = evt.clientX || evt.screenX || evt.pageX;
          this._origin = this._currentSize;
        },
        _onDragEnd: function(evt) {
          document.body.off("dragover.ApplicationHostSidebarWidget");
          this._isDragging = false;
          this._origin = this._currentSize;
          // Save sidebar width into storedSettings
          gbc.StoredSettingsService.setSideBarwidth(this._currentSize);
        },
        _onDrag: function(evt) {
          if (this._isDragging) {
            const deltaX = this._pageX - this._resizerDragX;
            this.updateResize(deltaX);

          }
        },
        isAlwaysVisible: function() {
          return window.matchMedia(
            "screen and (min-width: " + context.ThemeService.getValue("theme-sidebar-always-visible-min-width") + ")"
          ).matches;
        },

        setTitleText: function(text) {
          // is empty
        },

        _onSwipe: function(evt, distance) {
          this.emit(context.constants.widgetEvents.toggleClick);
        },

        setSidebarContent: function(widget) {
          if (this._alternateContentWidget && this._alternateContentWidget.getElement() &&
            this._alternateContentWidget.getElement().parent("mt-sidebar") === this.getElement()) {
            this._alternateContentWidget.getElement().remove();
          }
          if (widget) {
            if (this._contentElement) {
              this._contentElement.style.display = "none";
            }
            this._titleElement.style.display = "none";
            if (this._sidebarContentElement) {
              this._sidebarContentElement.appendChild(widget.getElement());
            }
          } else if (this._contentElement) {
            this._contentElement.style.display = "";
            this._titleElement.style.display = "";
          }
        },

        setSidebarTopMenu: function(widget) {

        },

        getSidebarTopMenu: function() {
          return this._topMenuWidget;
        },

      };
    });
    cls.WidgetFactory.registerBuilder('RSidebar', cls.RSidebarWidget);
  });
