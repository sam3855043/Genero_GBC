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

modulum("VMSessionNavigationManager", ["EventListener"],
  function(context, cls) {
    const Wevents = context.constants.widgetEvents;
    /**
     * session mode tooling when tabbed container is activated
     * @class VMSessionNavigationManager
     * @memberOf classes
     * @extends classes.EventListener
     * @publicdoc Base
     */
    cls.VMSessionNavigationManager = context.oo.Class(cls.EventListener, function($super) {
      return /** @lends classes.VMSessionNavigationManager.prototype */ {
        __name: "VMSessionNavigationManager",
        /** @type {classes.VMSession} */
        _session: null,

        /** @type {classes.VMApplication} */
        _currentApplication: null,

        /** @type {classes.SessionSidebarWidget} */
        _sidebarWidget: null,

        /** @type {classes.ChromeBarTitleWidget} */
        _chromeBarTitleWidget: null,

        /** @type {classes.ChromeBarWidget} */
        _currentChromeBarWidget: null,
        _stackCurrentApplication: null,
        /**
         * @type {Map<classes.VMApplication, classes.SessionSidebarApplicationItemWidget>}
         */
        _applicationItems: null,

        /**
         * @type {Map<classes.WindowNode, classes.SessionSidebarWindowItemWidget>}
         */
        _windowItems: null,

        /**
         * @type {WeakMap<classes.WindowNode|classes.VMApplication, {nameHandle:HandleRegistration, iconHandle:HandleRegistration}>}
         */
        _handles: null,

        /** @type {Map<string, classes.SessionSidebarApplicationStackItemWidget>} */
        _applicationStackRootWidgets: null,

        /** @type {Map<string, classes.SessionSidebarApplicationStackListWidget>} */
        _applicationStackWidgets: null,

        /** @type {Map<string, Array<string>>} */
        _applicationStacks: null,

        /** @type {Map<string, Array<classes.WindowNode>>} */
        _windowStacks: null,

        /** @type {Map<string, string>} */
        _rootStackLookup: null,

        /** @type {Map<string, classes.VMApplication>} */
        _applicationLookupByProcId: null,

        /** @type {Map<string, string>} */
        _applicationParentLookup: null,

        /** @type {WeakMap<classes.VMApplication, string>} */
        _applicationProcIds: null,

        _currentStackItem: null,

        /** @type {Map<string, Object>} */
        _lastActiveWindow: null,

        /**
         * @inheritDoc
         * @constructs
         * @param {classes.VMSession} session session
         */
        constructor: function(session) {
          $super.constructor.call(this);
          this._session = session;
          this._sidebarWidget = cls.WidgetFactory.createWidget("SessionSidebar", {
            appHash: gbc.systemAppId
          });

          this._chromeBarTitleWidget = cls.WidgetFactory.createWidget("ChromeBarTitle", {
            appHash: gbc.systemAppId
          });

          this._chromeBarTitleWidget.onDropDownBeforeOpen(() => {
            const appId = this._applicationProcIds.get(this._currentApplication),
              rootProcId = this._rootStackLookup.get(appId),
              dropDownContent = this._applicationStackWidgets.get(rootProcId);
            this._chromeBarTitleWidget.setDropDownContent(dropDownContent);
          });

          this._chromeBarTitleWidget.onDropDownClose(() => {
            this._chromeBarTitleWidget.setDropDownContent(null);
          });

          this._applicationItems = new Map();
          this._windowItems = new Map();
          this._handles = new WeakMap();

          this._stackCurrentApplication = new Map();
          this._applicationStackWidgets = new Map();
          this._applicationStackRootWidgets = new Map();
          this._applicationStacks = new Map();
          this._windowStacks = new Map();
          this._rootStackLookup = new Map();

          this._applicationLookupByProcId = new Map();
          this._applicationParentLookup = new Map();

          this._applicationProcIds = new WeakMap();
          this._lastActiveWindow = new Map();
        },

        /**
         * @override
         */
        destroy: function() {
          this._applicationItems = null;
          this._windowItems = null;
          this._handles = null;

          for (const rootWidget of this._applicationStackRootWidgets.values()) {
            this._sidebarWidget.removeChildWidget(rootWidget);
          }

          this._applicationStackRootWidgets = null;
          this._applicationStackWidgets = null;
          this._applicationStacks = null;
          this._rootStackLookup = null;

          this._applicationLookupByProcId = null;
          this._applicationParentLookup = null;

          this._sidebarWidget.destroy();
          this._sidebarWidget = null;
          this._chromeBarTitleWidget.destroy();
          this._chromeBarTitleWidget = null;

          this._session = null;
          this._lastActiveWindow.clear();
          this._lastActiveWindow = null;

          $super.destroy.call(this);
        },

        /**
         * Get the owning session
         * @returns {classes.VMSession}
         */
        getSession: function() {
          return this._session;
        },

        /**
         *
         * @returns {classes.ChromeBarTitleWidget}
         */
        getChromeBarTitleWidget: function() {
          return this._chromeBarTitleWidget;
        },

        /**
         * @returns {classes.SessionSidebarWidget}
         */
        getWidget: function() {
          return this._sidebarWidget;
        },

        /**
         *
         * @param {classes.WindowNode} windowNode
         */
        setCurrentWindow: function(windowNode) {
          const app = windowNode.getApplication(),
            appId = this._applicationProcIds.get(app);
          this._currentApplication = app;
          this._currentWindow = windowNode;
          const rootProcId = this._rootStackLookup.get(appId);
          this._stackCurrentApplication.set(rootProcId, appId);
          if (windowNode.getTitle()) {
            windowNode.setTitle(windowNode.getTitle()); // force title sync if any
          }
        },

        getCurrentWindow: function() {
          return this._currentWindow;
        },

        /**
         * Adding an app in Manager
         * @param {classes.VMApplication} application
         * @returns {?classes.WidgetBase}
         */
        addApplication: function(application) {
          if (this._applicationItems.has(application)) {
            console.warn("Application already added");
            return;
          }
          // TODO what is the meaning of this widget ? it seems to be not used anymore... refactor task GBC-4368
          // TODO The widget displayed in the sidebar is "SessionSidebarApplication**Stack**Item"
          const applicationSidebarWidget = cls.WidgetFactory.createWidget("SessionSidebarApplicationItem",
            application.getUI().getWidget().getBuildParameters());
          this._applicationItems.set(application, applicationSidebarWidget);
          this._handles.set(application, {
            /**
             * Handler when *application* title changed
             */
            nameHandle: application.when(Wevents.titleChanged, (evt, src, title) => {
              this.syncHost();
              applicationSidebarWidget.setApplicationName(title);
              const appInfo = application.applicationInfo.connectionInfo,
                rootWidget = this._applicationStackRootWidgets.get(appInfo && appInfo.procId);
              if (rootWidget) {
                // Root widget are parent apps
                rootWidget.setApplicationTitle(title);
              } else if (gbc.ThemeService.getValue("theme-sidebar-show-child-name")) {
                // application is not a root app, but a child app: if theme says to display child name: do it here
                this._currentStackItem.setApplicationTitle(application.getTitle());
              }
            }),
            iconHandle: application.when(Wevents.iconChanged, (evt, src, icon) => {
              this.syncHost();
              applicationSidebarWidget.setApplicationIcon(icon);
              const appInfo = application.applicationInfo.connectionInfo,
                rootWidget = this._applicationStackRootWidgets.get(appInfo && appInfo.procId);
              if (rootWidget) {
                rootWidget.setIcon(icon);
              }
            }),
            clickHandle: applicationSidebarWidget.when(Wevents.click, () => {
              const ui = application.getUI();
              ui.syncCurrentWindow();
              if (gbc.StoredSettingsService.isSideBarVisible()) {
                context.HostLeftSidebarService.hideSidebar();
              }
            })
          });

          application.dvm.onOrdersManaged(() => {
            applicationSidebarWidget.setApplicationName(application.getTitle());
            applicationSidebarWidget.setApplicationIcon(application.getImage());
          }, true);

          gbc.HostService.updateDisplay(); // re-align everything in window

          return applicationSidebarWidget;
        },

        updateApplicationInformation: function(application) {
          const appInfo = application.applicationInfo.connectionInfo;
          let procId = null,
            procIdParent = null,
            procIdWaiting = null;
          if (appInfo) {
            procId = appInfo.procId;
            procIdParent = appInfo.procIdParent || null;
            procIdWaiting = Boolean(appInfo.procIdWaiting);
            this._applicationLookupByProcId.set(procId, application);
            this._applicationParentLookup.set(procId, procIdParent);
            this._applicationProcIds.set(application, procId);
          }
          if (procId) {
            if (!procIdParent || !procIdWaiting || !this._rootStackLookup.get(procIdParent)) {
              if (!this._applicationStackRootWidgets.has(procId)) {
                const rootWidget = cls.WidgetFactory.createWidget("SessionSidebarApplicationStackItem", {
                  ...(application.getUI().getWidget().getBuildParameters()),
                  appHash: gbc.systemAppId
                });
                rootWidget.setApplicationTitle(application.getTitle());
                rootWidget.setIcon(application.getImage());
                rootWidget.when(context.constants.widgetEvents.click, () => {
                  let app = this._applicationLookupByProcId.get(this._stackCurrentApplication.get(procId));
                  if (!app) {
                    const stack = this._applicationStacks.get(procId);
                    app = this._applicationLookupByProcId.get(stack[stack.length - 1]);
                  }
                  const ui = app.getUI();
                  ui.syncCurrentWindow();

                  // Hide left topmenu if any
                  context.HostLeftSidebarService.showTopMenu(false); // hide + fast
                  context.TopmenuService.syncTopMenus(app.applicationHash);

                  if (gbc.StoredSettingsService.isSideBarVisible()) {
                    context.HostLeftSidebarService.hideSidebar();
                  }
                });
                const listWidget = cls.WidgetFactory.createWidget("SessionSidebarApplicationStackList", {
                  ...(application.getUI().getWidget().getBuildParameters()),
                  appHash: gbc.systemAppId
                });
                this._applicationStackRootWidgets.set(procId, rootWidget);
                this._applicationStackWidgets.set(procId, listWidget);
                this._applicationStacks.set(procId, [procId]);
                this._windowStacks.set(procId, []);
                this._rootStackLookup.set(procId, procId);
                listWidget.addChildWidget(this._applicationItems.get(application));
                this._sidebarWidget.addChildWidget(rootWidget);
                this.emit(context.constants.VMSessionNavigationManagerEvents.addSessionSidebarApplicationStackItem,
                  application, rootWidget);

              }
            } else {
              const rootProcId = this._rootStackLookup.get(procIdParent),
                stack = this._applicationStacks.get(rootProcId),
                listWidget = this._applicationStackWidgets.get(rootProcId);
              stack.push(procId);
              listWidget.addChildWidget(this._applicationItems.get(application));
              this._rootStackLookup.set(procId, rootProcId);
            }
            context.HostLeftSidebarService.updateApplicationCount(1);
          }
        },

        removeApplication: function(application) {
          context.HostLeftSidebarService.updateApplicationCount(-1);

          const {
            nameHandle,
            iconHandle,
            clickHandle
          } = this._handles.get(application);
          nameHandle();
          iconHandle();
          clickHandle();
          this._handles.delete(application);
          const applicationSidebarWidget = this._applicationItems.get(application),
            parentWidget = applicationSidebarWidget.getParentWidget();

          if (parentWidget) {
            parentWidget.removeChildWidget(applicationSidebarWidget);
          }
          applicationSidebarWidget.destroy();
          this._applicationItems.delete(application);

          if (this._applicationProcIds.has(application)) {
            const procId = this._applicationProcIds.get(application);
            this._applicationProcIds.delete(application);
            this._applicationLookupByProcId.delete(procId);
          }
          const appInfo = application.applicationInfo.connectionInfo,
            procId = appInfo.procId,
            rootProcId = this._rootStackLookup.get(procId),
            stack = this._applicationStacks.get(rootProcId);
          stack.remove(procId);
          if (!stack.length) {
            this._applicationStacks.delete(rootProcId);
            this._sidebarWidget.removeChildWidget(this._applicationStackRootWidgets.get(rootProcId));
            if (this._currentStackItem === this._applicationStackRootWidgets.get(rootProcId)) {
              this._currentStackItem = null;
            }

            this.emit(context.constants.VMSessionNavigationManagerEvents.removeSessionSidebarApplicationStackItem,
              application, this._applicationStackRootWidgets.get(rootProcId));

            this._applicationStackRootWidgets.get(rootProcId).destroy();
            this._applicationStackRootWidgets.delete(rootProcId);
            [...this._rootStackLookup.keys()].filter(k => this._rootStackLookup[k] === rootProcId)
              .forEach(k => {
                this._rootStackLookup.delete(k);
                this._applicationParentLookup.delete(k);
              });
            this._sidebarWidget.removeChildWidget(this._applicationStackWidgets.get(rootProcId));
          } else {
            // App has been removed from list! restore original parent name
            const parentApp = this._applicationLookupByProcId.get(application.getParentProcId());
            const stackItem = this._applicationStackRootWidgets.get(application.getParentProcId());
            stackItem?.setApplicationTitle(parentApp.getTitle());
          }
        },

        setApplicationProcessing: function(application, processing) {
          this._applicationItems.get(application).setProcessing(processing);
        },

        freezeApplication: function(application) {
          const item = this._applicationItems.get(application);
          if (item) {
            item.freeze();
          }
        },

        unfreezeApplication: function(application) {
          const item = this._applicationItems.get(application);
          if (item) {
            item.unfreeze();
          }
        },

        /**
         *
         * @param {classes.WindowNode} windowNode
         * @returns {?classes.WidgetBase}
         */
        addWindow: function(windowNode) {
          if (this._windowItems.has(windowNode)) {
            console.warn("Window already added");
            return;
          }

          const application = windowNode.getApplication();
          windowNode.whenControllerCreated(() => {
            const windowSidebarWidget = cls.WidgetFactory.createWidget("SessionSidebarWindowItem",
              windowNode.getWidget().getBuildParameters());

            if (!windowNode.isModal()) {
              this._applicationItems.get(application).addChildWidget(windowSidebarWidget);
            }

            this._windowItems.set(windowNode, windowSidebarWidget);
            const windowList = this._windowStacks.get(this._getRootProcId(application));
            if (!windowNode.isModal()) {
              windowList.add(windowNode);
              windowSidebarWidget.setWindowName(windowNode.attribute("text") || windowNode.attribute("name"));
              windowSidebarWidget.setWindowIcon(windowNode.getWidget().getImage());
            }

            this._handles.set(windowNode, {
              nameHandle: windowNode.when(Wevents.titleChanged, (evt, src, title) => {
                if (!windowNode.isModal()) {
                  this.syncHost();
                  windowSidebarWidget.setWindowName(title);
                }
              }),
              iconHandle: windowNode.when(Wevents.iconChanged, (evt, src, icon) => {
                if (!windowNode.isModal()) {
                  this.syncHost();
                  windowSidebarWidget.setWindowIcon(icon);
                }
              }),
              clickHandle: windowSidebarWidget.when(Wevents.click, () => {
                if (!windowNode.isModal()) {

                  const ui = application.getUI();
                  const uiWidget = ui.getWidget();
                  ui.syncCurrentWindow();
                  ui.setCurrentWindow(windowNode.getId());

                  const infoLastWindow = this._lastActiveWindow.get(this.getRootWaitingApplication(application).getProcId());

                  if (ui !== infoLastWindow.ui || windowNode.getId() !== infoLastWindow.windowId) {
                    uiWidget.domAttributesMutator(() => uiWidget.addClass("inactiveWindow"));
                  } else {
                    uiWidget.domAttributesMutator(() => uiWidget.removeClass("inactiveWindow"));
                  }

                  if (gbc.StoredSettingsService.isSideBarVisible()) {
                    context.HostLeftSidebarService.hideSidebar();
                  }
                }
              })
            });

            this.emit(context.constants.VMSessionNavigationManagerEvents.addSessionSidebarWindowItem,
              application, windowSidebarWidget);

            return windowSidebarWidget;
          }, true);
        },
        /**
         *
         * @param {classes.WindowNode} windowNode
         */
        removeWindow: function(windowNode) {
          const {
            nameHandle,
            iconHandle,
            clickHandle
          } = this._handles.get(windowNode);
          nameHandle();
          iconHandle();
          clickHandle();
          this._handles.delete(windowNode);
          const windowSidebarWidget = this._windowItems.get(windowNode);
          const application = windowNode.getApplication();

          this.emit(context.constants.VMSessionNavigationManagerEvents.removeSessionSidebarWindowItem,
            application, windowSidebarWidget);

          this._applicationItems.get(windowNode.getApplication()).removeChildWidget(windowSidebarWidget);
          windowSidebarWidget.destroy();
          this._windowItems.delete(windowNode);

          const windowList = this._windowStacks.get(this._getRootProcId(application));

          windowList.remove(windowNode);
          this.syncHost();
        },

        /**
         * @param {classes.WindowNode} windowNode
         * @param {boolean} isNextModal
         */
        freezeWindow: function(windowNode, isNextModal) {
          const windowWidget = windowNode && windowNode.getWidget();
          if (windowWidget) {
            windowWidget.freeze(isNextModal);
          }
          if (windowNode) {
            this._windowItems.get(windowNode).setFrozen(true);
          }
        },

        unfreezeWindow: function(windowNode) {
          const windowWidget = windowNode && windowNode.getWidget();
          if (windowWidget) {
            windowWidget.unfreeze();
          }
          if (windowNode) {
            this._windowItems.get(windowNode).setFrozen(false);
          }
          //Sync top menu if any
          context.TopmenuService.syncTopMenus(windowWidget.getApplicationIdentifier());
        },

        /**
         *
         * @param {classes.WindowNode} currentWindowNode
         */
        updateItemsStatuses: function(currentWindowNode) {
          if (currentWindowNode && !currentWindowNode.isModal()) {
            const currentApp = currentWindowNode && currentWindowNode.getApplication(),
              currentSession = currentApp && currentApp.getSession(),
              rootProcId = this._rootStackLookup.get(this._applicationProcIds.get(currentApp)),
              applicationStackItemWidget = this._applicationStackRootWidgets.get(rootProcId);

            if (this._session) {
              if (currentWindowNode) {
                if (currentSession && (!currentSession.isInTabbedContainerMode() || currentSession.getHostApplication() === currentApp)) {
                  const chromeBarWidget = currentApp && currentApp.getChromeBar();

                  const windowList = this._windowStacks.get(this._getRootProcId(currentApp));
                  this._applicationStackRootWidgets.get(this._getRootProcId(currentApp));
                  this._chromeBarTitleWidget.setListingVisible(windowList.length > 1);
                  if (currentWindowNode.getTitle()) {
                    this._chromeBarTitleWidget.setWindowTitle(currentWindowNode.getTitle(), currentApp);
                  }
                  this._chromeBarTitleWidget.setIcon(currentWindowNode.getIcon());
                  if (this._currentChromeBarWidget !== chromeBarWidget) {
                    if (this._currentChromeBarWidget) {
                      this._currentChromeBarWidget.setTitle();
                      this._currentChromeBarWidget = null;
                    }
                    if (chromeBarWidget) {
                      chromeBarWidget.setTitle(this._chromeBarTitleWidget, currentApp);
                      this._currentChromeBarWidget = chromeBarWidget;
                    }
                  }
                }
                if (this._currentStackItem) {
                  this._currentStackItem.setVisible(false);
                  this._currentStackItem = null;
                }
                if (applicationStackItemWidget) {
                  this._currentStackItem = applicationStackItemWidget;
                  applicationStackItemWidget.setVisible(true);
                }
              }
              this._session.getApplications().forEach(app => {
                const appItem = this._applicationItems.get(app);
                if (appItem) {
                  appItem.toggleClass("activeWindow", app === currentApp);
                  app.model.getNodesByTag("Window").forEach(win => {
                    const winItem = this._windowItems.get(win);
                    if (winItem) {
                      winItem.toggleClass("activeWindow", app.getVMWindow() === win);
                      winItem.toggleClass("visibleWindow", win === currentWindowNode);
                    }
                  });
                }
              });
            }
          } else if (currentWindowNode && currentWindowNode.isModal()) {
            const currentApp = currentWindowNode && currentWindowNode.getApplication(),
              currentSession = currentApp && currentApp.getSession(),
              rootProcId = this._rootStackLookup.get(this._applicationProcIds.get(currentApp)),
              applicationStackItemWidget = this._applicationStackRootWidgets.get(rootProcId);
            const windowList = this._windowStacks.get(this._getRootProcId(currentApp));
            const lastNonModalWin = windowList ? windowList.filter(w => !w.isModal())[0] : null;

            // Do not change chromebar title when in tabbed container
            if (!currentSession.isInTabbedContainerMode()) {
              this._chromeBarTitleWidget.setWindowTitle(lastNonModalWin ? lastNonModalWin.getTitle() : "", currentApp);
            }

          }
        },
        /**
         *
         * @param {classes.VMApplication} application
         * @private
         */
        _getRootProcId: function(application) {
          return this._rootStackLookup.get(this._applicationProcIds.get(application));
        },

        syncHost: function() {
          this.updateItemsStatuses(context.HostService._currentWindowNode);
        },

        /**
         * Get the application widget list
         * @return {Map<string, classes.SessionSidebarApplicationStackItemWidget>}
         */
        getApplicationWidgetList: function() {
          return this._applicationStackRootWidgets;
        },

        /**
         * Get the application by is procId
         * @param procId
         * @return {classes.VMApplication}
         */
        getApplicationByProcId: function(procId) {
          return this._applicationLookupByProcId.get(procId);
        },

        /**
         * Get the window widget list
         * @return {Map<classes.WindowNode, classes.SessionSidebarWindowItemWidget>}
         */
        getWindowWidgetList: function() {
          return this._windowItems;
        },

        /**
         * get the root waiting application for application procId
         * @param {classes.VMApplication} application
         * @return {classes.VMApplication|null}
         */
        getRootWaitingApplication: function(application) {
          let app = application;
          let appInfo = application.applicationInfo.connectionInfo;
          let procId = appInfo.procId;

          do {
            if (!appInfo.procIdWaiting || !appInfo.procIdParent) {
              return app;
            }

            procId = appInfo.procIdParent;
            app = this._applicationLookupByProcId.get(procId);
            appInfo = app && app.applicationInfo.connectionInfo;
          } while (app && appInfo);

          return null;
        },

        /**
         * Get parent application
         * @param {classes.VMApplication} application
         * @return {null|classes.VMApplication}
         */
        getParentApplication: function(application) {
          let parentProcId = application.applicationInfo.connectionInfo.procIdParent;

          if (parentProcId) {
            return this._applicationLookupByProcId.get(parentProcId);
          }

          return null;
        },

        /**
         * Get the child application
         * @param {classes.VMApplication} application
         * @return {null|classes.VMApplication}
         */
        getChildApplication: function(application) {
          let appProcId = application.getProcId();

          for (let [procId, app] of this._applicationLookupByProcId.entries()) {
            if (app.applicationInfo.connectionInfo.procIdParent === appProcId) {
              return app;
            }
          }

          return null;
        },

        /**
         * Save the last VMApplication and active window id
         * @param {classes.VMApplication} application
         * @param {number} lastActiveWindowId
         */
        setLastActiveWindow: function(application, lastActiveWindowId) {
          let rootApp = this.getRootWaitingApplication(application);

          if (!rootApp) {
            return;
          }

          this._lastActiveWindow.set(rootApp.getProcId(), {
            ui: application.getUI(),
            windowId: lastActiveWindowId
          });
        },

        /**
         * Go back to the last active window id
         * @param {classes.VMApplication} application
         */
        goBackToLastActiveWindow: function(application) {
          const procId = this.getRootWaitingApplication(application || this.getSession().getCurrentApplication()).getProcId();
          const info = this._lastActiveWindow.get(procId);

          info.ui.syncCurrentWindow();
          info.ui.setCurrentWindow(info.windowId);

          const uiWidget = info.ui.getWidget();
          uiWidget.domAttributesMutator(() => uiWidget.removeClass("inactiveWindow"));

          if (gbc.StoredSettingsService.isSideBarVisible()) {
            context.HostLeftSidebarService.hideSidebar();
          }
        },

        /**
         * Get all the applications
         * @return {classes.VMApplication[]}
         */
        getApplications: function() {
          const res = [];

          this._applicationLookupByProcId.forEach((value) => {
            res.push(value);
          });

          return res;
        }
      };
    });
  });
