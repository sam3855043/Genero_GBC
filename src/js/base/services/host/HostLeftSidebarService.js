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

modulum('HostLeftSidebarService', ['InitService', 'HostService', 'DebugService', 'EventListener'],
  function(context, cls) {

    /**
     * GBC Sidebar service
     * @namespace gbc.HostLeftSidebarService
     * @gbcService
     */
    context.HostLeftSidebarService = context.oo.StaticClass( /** @lends gbc.HostLeftSidebarService */ {
      __name: "HostLeftSidebarService",
      /** @type {classes.ApplicationHostSidebarWidget} */
      _sidebar: null,

      /** @type {WeakSet<classes.VMSession>} */
      _sessions: null,

      /** @type {classes.ApplicationHostSidebarBackdropWidget} */
      _sidebarBackdrop: null,

      _tabbedContainerMode: false,

      _enabled: false,
      _visibility: false,
      _visible: false,
      _applicationCount: 0,
      _applicationListVisible: null,

      init: function() {
        this._sessions = new WeakSet();
      },

      preStart: function() {
        this._sidebar = cls.WidgetFactory.createWidget('RSidebar', {
          appHash: gbc.systemAppId
        });
        this._sidebarBackdrop = cls.WidgetFactory.createWidget('ApplicationHostSidebarBackdrop', {
          appHash: gbc.systemAppId
        });
        const hostWidget = context.HostService.getApplicationHostWidget(),
          hostElement = hostWidget.getElement();
        hostElement.prependChild(this._sidebar.getElement());
        hostElement.appendChild(this._sidebarBackdrop.getElement());
        this._sidebar.setParentWidget(hostWidget);
        this._sidebarBackdrop.setParentWidget(hostWidget);
        this._sidebar.onDisplayChanged(() =>
          context.HostService.updateDisplay());
        this._sidebar.when(context.constants.widgetEvents.toggleClick, () => gbc.HostLeftSidebarService.hideSidebar());
        this._sidebarBackdrop.onClick(() => {
          gbc.HostLeftSidebarService.hideSidebar();
          gbc.HostLeftSidebarService.showTopMenu(false);
        });
      },

      destroy: function() {
        this._sessions = null;
        this._sidebar.destroy();
        this._sidebarBackdrop.destroy();
      },

      /**
       *
       * @return {classes.ApplicationHostSidebarWidget}
       */
      getSidebar: function() {
        return this._sidebar;
      },

      setTitle: function(title) {
        this._sidebar.setTitleText(title);
      },

      setContent: function(content) {
        this._sidebar.setSidebarContent(content);
      },

      getSidebarWidth: function() {
        if (this._sidebar && !this._sidebar.isUnavailable() && this._sidebar.isAlwaysVisible()) {
          return this._sidebar.getCurrentSize();
        }
        return 0;
      },

      setTabbedContainerMode: function(tabbedMode) {
        this._tabbedContainerMode = tabbedMode;
        if (tabbedMode) {
          this.hideSidebar();
          this.showAppList(false);
          this.showSettings(false);
          this.showTitle(false);
          window.document.querySelector(":root").style.setProperty('--applistWidth', 0);
        }
      },

      showSidebar: function() {
        let status = this._sidebar.setDisplayed(true);
        this._sidebarBackdrop.setDisplayed(status);
        //Save it to the stored settings
        gbc.StoredSettingsService.setSideBarVisible(false); // force false, we don't want topmenu
      },

      hideSidebar: function() {
        let status = this._sidebar.setDisplayed(false);
        this._sidebarBackdrop.setDisplayed(status);
        //Save it to the stored settings
        gbc.StoredSettingsService.setSideBarVisible(status);
      },

      toggleSidebar: function() {
        if (this._sidebar.isDisplayed()) {
          this.hideSidebar();
        } else {
          this.showSidebar();
        }
        return this._sidebar.isDisplayed();
      },

      enableSidebar: function(enable) {
        this._enabled = Boolean(enable);
      },

      // Show Hide methods on sidebar
      showTitle: function(show) {
        show = this._tabbedContainerMode ? false : show;
        this._sidebar.showTitle(show);
      },
      showAppList: function(show) {
        show = this._tabbedContainerMode ? false : show;
        this._sidebar.showAppList(show);
        this.showSettings(show);
      },
      /**
       * Set Applist mode (for 4ST api)
       * @param {String} visible could be 'yes', 'no' or 'auto'
       */
      setApplicationListVisible: function(visible) {
        visible = visible ? visible : 'auto';
        if (!this._applicationListVisible) { // if not set yet set it, else ignore
          this._applicationListVisible = visible;
        }
        this._sidebar.setApplicationListVisible(this._applicationListVisible, this._applicationCount);

      },
      showTopMenu: function(show) {
        this._sidebar.showTopMenu(show);
        if (!show && window.isMobile()) {
          this._sidebar.setAppListWidth(0);
        }
        if (show) {
          this.showSidebar();
          if (window.isMobile()) {
            const themeSideBarSize = parseInt(gbc.ThemeService.getValue("theme-sidebar-default-width"), 10);
            this._sidebar.setAppListWidth(themeSideBarSize);
          }
        } else {
          this.hideSidebar();
          if (window.isMobile()) {
            this._sidebar.setAppListWidth(0);
          }
        }
      },
      renderAppTopMenu: function(appHash) {
        this._sidebar.renderAppTopMenu(appHash);
      },
      showSettings: function(show) {
        show = this._tabbedContainerMode ? false : show;
        this._sidebar.showSettings(show);
      },

      setHasTopMenu: function(hasTopMenu, inSidebar) {
        gbc.HostService.getApplicationHostWidget().toggleClass("has-topmenu-sidebar", hasTopMenu && inSidebar);
      },
      hasTopMenu: function() {
        return gbc.HostService.getApplicationHostWidget().hasClass("has-topmenu-sidebar");
      },
      // Only in mobile case
      toggleTopMenu: function() {
        if (this.hasTopMenu()) {
          this.showTopMenu(true);
        }
        if (this._applicationCount > 1) {
          const themeSideBarSize = !this._sidebar.isExpanded() ? gbc.ThemeService.getValue("theme-sidebar-default-width") : gbc.ThemeService
            .getValue("theme-sidebar-max-width");
          this._sidebar.setAppListWidth(parseInt(themeSideBarSize, 10), true);
        }
      },

      _updateApplicationListVisibility: function() {
        if (context.SessionService.getCurrent().isInTabbedContainerMode()) {
          this._visible = false; // no sidebar in tabbed Container
        } else if (this._applicationListVisible === 'auto') {
          this._visible = this._applicationCount > 1;
        } else if (typeof(this._visibility) === "boolean") {
          this._visible = this._visibility;
        }

        if (this._visible) {
          const themeSideBarSize = !this._sidebar.isExpanded() ? gbc.ThemeService.getValue("theme-sidebar-default-width") : gbc.ThemeService
            .getValue("theme-sidebar-max-width");
          this._sidebar.setAppListWidth(themeSideBarSize);
        } else {
          this._sidebar.setAppListWidth(0);
        }

      },

      updateApplicationCount: function(count) {
        this._applicationCount += count;
        this._updateApplicationListVisibility();
        this.showTopMenu(false); // if number of app changes, hide topmenu
        if (this._applicationCount <= 1) {
          this.showAppList(false);
        }
      },

      /**
       * Get number of current running app
       * @return {number}
       */
      getApplicationCount: function() {
        return this._applicationCount;
      },

      /**
       *
       * @param {classes.VMSession} session
       */
      addSession: function(session) {
        if (this._sessions.has(session)) {
          return;
        }

        this._sidebar.getApplist().addChildWidget(session.getNavigationManager().getWidget());
        this._sessions.add(session);
      },

      /**
       *
       * @param {classes.VMSession} session
       */
      removeSession: function(session) {
        if (this._sessions.has(session)) {
          this._sidebar.removeChildWidget(session.getNavigationManager().getWidget());
          this._sessions.delete(session);
        }
      },

      /**
       * Create link to the topmenu and the responsive one
       * @param {classes.TopMenuWidget} menuWidget
       */
      addResponsiveMenu: function(menuWidget) {
        this._sidebar.setSidebarTopMenu(menuWidget);
      },

      /**
       * Get the responsive menu associated to topmenu
       * @return {classes.RSidebarTopMenuWidget}
       */
      getResponsiveMenu: function() {
        return this._sidebar.getSidebarTopMenu();
      },

      setApplicationListVisibility: function(visibility) {
        // only if changed
        if (this._visibility !== visibility) {
          this._visibility = visibility;
          this._updateApplicationListVisibility();
        }
      },

      setWindowListVisibility: function(visibility) {
        context.SessionService.getCurrent().getNavigationManager().getChromeBarTitleWidget().setListingVisibility(visibility);
      }
    });
    context.InitService.register(context.HostLeftSidebarService);
  });
