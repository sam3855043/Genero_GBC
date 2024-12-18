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

modulum("VMSessionTabbedContainerMode", ["EventListener"],
  function(context, cls) {

    const nullRect = {
      top: null,
      left: null,
      right: null,
      bottom: null,
      width: "auto",
      height: "auto",
      "max-width": "100%",
      "max-height": "100%"
    };

    /**
     * session mode tooling when tabbed container is activated
     * @class VMSessionTabbedContainerMode
     * @memberOf classes
     * @extends classes.EventListener
     * @publicdoc Base
     */
    cls.VMSessionTabbedContainerMode = context.oo.Class(cls.EventListener, function($super) {
      return /** @lends classes.VMSessionTabbedContainerMode.prototype */ {
        __name: "VMSessionTabbedContainerMode",
        /**
         * @type {classes.VMSession}
         */
        _session: null,

        /** @type {classes.VMApplication} */
        _app: null,

        /** @type {classes.WindowNode} */
        _windowNode: null,

        /** @type {classes.TabbedContainerWidget} */
        _tabbedContainerWidget: null,

        /** @type {classes.WidgetBase[]} */
        _tabbedApplications: null,

        /** @type {classes.WidgetBase} */
        _currentTabbedWidget: null,

        _currentTabbedRect: null,

        _appIdleHook: null,

        /**
         * @inheritDoc
         * @constructs
         * @param {classes.VMSession} session session
         */
        constructor: function(session) {
          $super.constructor.call(this);

          this._session = session;
          this._tabbedApplications = [];

          this._currentTabbedRect = {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "auto",
            height: "auto"
          };
        },

        /**
         * Get the owning session
         * @returns {classes.VMSession}
         */
        getSession: function() {
          return this._session;
        },

        /**
         * @override
         */
        destroy: function() {
          this._app = null;
          this._session = null;
          this._tabbedApplications = null;
          this._currentTabbedWidget = null;
          this._tabbedContainerWidget = null;
          this._currentTabbedRect = null;
          if (this._appIdleHook) {
            this._appIdleHook();
            this._appIdleHook = null;
          }
          $super.destroy.call(this);
        },

        /**
         * get host application
         * @returns {classes.VMApplication}
         */
        getHostApplication: function() {
          return this._app;
        },

        /**
         * activate this mode
         * @param {classes.WindowNode} hostingWindowNode
         */
        activate: function(hostingWindowNode) {
          let hostingApplication = hostingWindowNode.getApplication(),
            hostingApplicationUIWidget = hostingApplication.getUI().getWidget();

          this._session.getWidget().setCurrentWidget(hostingApplicationUIWidget);
          this._app = hostingApplication;
          this._windowNode = hostingWindowNode;
          this._tabbedContainerWidget = cls.WidgetFactory.createWidget("TabbedContainer", {
            appHash: gbc.systemAppId
          });
          this._session.getWidget().setTabbedContainer(this._tabbedContainerWidget);
          const widget = hostingWindowNode.getController() && hostingWindowNode.getController().getWidget();
          if (widget) {
            this._session.getWidget().setTabbedContainerHost(hostingApplicationUIWidget);
            // 1. prepare the window
            widget.getContainerElement().empty();
            widget.when(gbc.constants.widgetEvents.unfrozen, () => {
              if (this._currentTabbedWidget && this._currentTabbedWidget._tabbedPage) {
                this._currentTabbedWidget._tabbedPage._tabbedApp.scheduler.layoutCommand({
                  resize: true
                });
              }
            });
            widget.when(context.constants.widgetEvents.destroyed, () => {
              let apps;
              while ((apps = this._session.getApplications().filter(app => !app._tabbedClosing)).length) {
                if (apps[0] !== this._app) {
                  apps[0].close();
                }
                apps[0]._tabbedClosing = true;
              }
            });
            widget.addTabbedContainer(this._tabbedContainerWidget);
            this._tabbedContainerWidget.when(context.constants.widgetEvents.change, (event, src, page) => this._onTabChange(page));

            hostingApplication.layout.afterLayout(() => this._onHostingApplicationAfterLayout());

            // 2. manage sidebar
            this._session.manageStartMenu();

            context.HostService.setTabbedHost(hostingWindowNode);

            this._app.uiNode().getDescendants("Window").map(function(w) {
              if (w?.getParentNode()?.getWidget()) {
                // Since registerClosableWindow can take an optional argument, use it to pass chromeBar to it
                context.HostService.registerClosableWindow(w, null, {
                  chromeBar: w.getParentNode().getWidget().getChromeBarWidget()
                });
              }
            });
            // 3. manage existing apps
            let apps = this._session.getApplications(),
              appslen = apps.length;
            for (let i = 0; i < appslen; i++) {
              let app = apps[i];
              if (!app.getUI().getWidget()._tabbedPage && app !== this._app) {
                this._session.addApplicationWidget(app, app.getUI().getWidget());

                // jshint ignore:start
                if (app.uiNode()) {
                  app.uiNode().getDescendants("Window").map(function(w) {
                    if (w?.getParentNode()?.getWidget()) {
                      context.HostService.registerClosableWindow(w, null, {
                        chromeBar: w.getParentNode().getWidget().getChromeBarWidget()
                      });
                    }
                  });
                }
                // jshint ignore:end

              }
            }

            context.HostService.setDisplayedWindowNode(hostingWindowNode);
          }
        },

        /**
         * on tab change handler
         * @param page
         * @private
         */
        _onTabChange: function(page) {
          if (this._currentTabbedWidget && this._currentTabbedWidget.getElement()) {
            this._currentTabbedWidget.getElement().addClass("gbc_out_of_view");
            this._currentTabbedWidget.setStyle(nullRect);
            this._currentTabbedWidget = null;
          }
          if (page && page._tabbedAppWidget) {
            this._currentTabbedWidget = page._tabbedAppWidget;
            this._currentTabbedWidget.getElement().removeClass("gbc_out_of_view");
            this._currentTabbedWidget.setStyle(this._currentTabbedRect);
            this._session.setCurrentApplication(page._tabbedApp);
            if (page._tabbedApp.layout) {
              page._tabbedApp.scheduler.layoutCommand({
                resize: true
              });
            }
            const displayedWindow = page._tabbedApp.getVMWindow(),
              displayedWindowWidget = displayedWindow && displayedWindow.getController() &&
              displayedWindow.getController().getWidget();
            if (displayedWindowWidget) {
              context.HostService.setDisplayedWindowNode(displayedWindow);
            }
          }
        },

        /**
         * Hosting application afterLayout handler
         * @private
         */
        _onHostingApplicationAfterLayout: function() {
          const rectPages = this._tabbedContainerWidget.getContainerElement().getBoundingClientRect(),
            rect = this._session._widget.getElement().getBoundingClientRect();
          this._currentTabbedRect = {
            top: "" + (rectPages.top - rect.top) + "px !important",
            left: "" + (rectPages.left - rect.left) + "px !important",
            right: "" + (rect.right - rectPages.right) + "px !important",
            bottom: "" + (rect.bottom - rectPages.bottom) + "px !important",
            width: "auto",
            height: "auto"
          };
          for (let app of this._tabbedApplications) {
            let appWidget = app.getUI().getWidget();
            if (appWidget._tabbedPage === this._tabbedContainerWidget.getCurrentPage()) {
              appWidget.setStyle(this._currentTabbedRect);
            } else {
              appWidget.setStyle(nullRect);
            }
            if (!appWidget.getElement().hasClass("gbc_out_of_view") &&
              appWidget._tabbedPage.getElement().parent("gbc_ApplicationWidget") && app.layout) {
              app.layout.refreshLayout({
                resize: true
              });
            }
          }
          this._registerAnimationFrame(() => {
            if (this._tabbedContainerWidget && this._tabbedContainerWidget.updateScrollersVisibility) {
              this._tabbedContainerWidget.updateScrollersVisibility();
            }
          });
        },
        /**
         * add application
         * @param {classes.VMApplication} app
         * @param {classes.ApplicationWidget} appWidget
         */
        addApplicationWidget: function(app, appWidget) {
          if (this._windowNode) {
            this._tabbedApplications.push(app);
            appWidget.getElement().addClass("gbc_out_of_view");
            appWidget.setStyle(nullRect);
            const tabbedContainerPage = cls.WidgetFactory.createWidget("Page", {
              appHash: gbc.systemAppId
            });

            const win = app.getVMWindow() && app.getVMWindow().getController().getWidget();
            tabbedContainerPage.setText(win ? (win.getText() || win.getUserInterfaceWidget().getText()) : "");
            tabbedContainerPage.setImage(win ? (win.getImage() || win.getUserInterfaceWidget().getImage()) : "");
            appWidget._tabbedPage = tabbedContainerPage;
            tabbedContainerPage._tabbedApp = app;
            tabbedContainerPage._tabbedAppWidget = appWidget;

            this._session.getWidget().addChildWidget(appWidget, {
              noDOMInsert: false
            });
            appWidget.when(context.constants.widgetEvents.destroyed, function() {
              this._tabbedApplications.remove(app);
              this._tabbedContainerWidget.removeChildWidget(appWidget._tabbedPage);
              appWidget._tabbedPage = null;
              tabbedContainerPage._tabbedApp = null;
              tabbedContainerPage._tabbedAppWidget = null;
              this._registerAnimationFrame(function() {
                if (this._tabbedContainerWidget && this._tabbedContainerWidget.updateScrollersVisibility) {
                  this._tabbedContainerWidget.updateScrollersVisibility();
                }
              }.bind(this));
            }.bind(this));
            this._tabbedContainerWidget.addChildWidget(tabbedContainerPage);
            this._registerAnimationFrame(function() {
              if (this._tabbedContainerWidget && this._tabbedContainerWidget.updateScrollersVisibility) {
                this._tabbedContainerWidget.updateScrollersVisibility();
              }
            }.bind(this));
          }
        },

        /**
         * idle hoor management
         */
        freeIdleHook: function() {
          if (this._appIdleHook) {
            this._appIdleHook();
          }
        },

        /**
         * layout concern
         * @returns {classes.VMApplication}
         */
        triggerDisplayChanged: function() {
          let host = this._tabbedContainerWidget && this._tabbedContainerWidget.getParentWidget();
          if (host) {
            host.getLayoutEngine().forceMeasurement();
            host.getLayoutEngine().invalidateAllocatedSpace();
            host.getLayoutInformation().invalidateMeasure();
          }
          return this._app;
        },

        /**
         * test if start menu can be managed
         * @param startMenuNode
         * @returns {boolean}
         */
        willManageStartMenu: function(startMenuNode) {
          return this._windowNode && (!startMenuNode ||
            this._windowNode.getAncestor("UserInterface") === startMenuNode.getAncestor("UserInterface"));
        },

        /**
         * manage start menu
         * @param startMenuNode
         * @param widget
         */
        manageStartMenu: function(startMenuNode, widget) {
          if (this._windowNode && (!startMenuNode ||
              this._windowNode.getAncestor("UserInterface") === startMenuNode.getAncestor("UserInterface"))) {
            switch (this._windowNode.getStyleAttribute("startMenuPosition")) {
              case "menu":
                context.HostLeftSidebarService.enableSidebar(false);
                break;
              case "tree":
                context.HostLeftSidebarService.enableSidebar(true);
                const startMenuWidget = widget || this._windowNode.getParentNode() &&
                  this._windowNode.getParentNode().getController() &&
                  this._windowNode.getParentNode().getController().getWidget().getStartMenuWidget();
                if (this._app) {
                  this._appIdleHook = this._app.dvm.onIdleChanged(function() {
                    startMenuWidget.setProcessing(this._app && !this._app.isIdle());
                  }.bind(this));
                }
                context.HostLeftSidebarService.setContent(startMenuWidget);
                break;
              default:
                context.HostLeftSidebarService.enableSidebar(false);
                break;
            }
          }
        }
      };
    });
  });
