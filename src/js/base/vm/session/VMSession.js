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

modulum("VMSession", ["EventListener", "VMSessionTabbedContainerMode", "VMSessionBrowserMultiPageMode"],
  function(context, cls) {
    /**
     * A VM driven Session
     * @class VMSession
     * @memberOf classes
     * @extends classes.EventListener
     * @publicdoc Base
     */
    cls.VMSession = context.oo.Class(cls.EventListener, function($super) {
      return /** @lends classes.VMSession.prototype */ {
        __name: "VMSession",
        /**
         * @type {?string}
         */
        _identifier: null,
        /**
         * @type {?string}
         */
        _sessionId: null,
        /**
         * @type {classes.VMApplication[]}
         */
        _applications: null,

        /**
         * app id bootstrapped by the GAS
         * if not 0, it is loaded as a new tab/window in browser
         * @type {number}
         */
        _htmlHostPageAppId: 0,

        _baseInfos: null,
        _closeHandler: null,
        _restartHandler: null,
        /**
         * @type {classes.SessionWidget}
         */
        _widget: null,
        _applicationIdentifier: 0,
        _applicationQueue: null,

        _waitingNewTasks: 0,
        _showEnding: false,
        _flushingApplications: false,
        _flushingApplicationsListener: false,
        _unloadListener: false,
        _flushableApplications: null,
        /** @type {?string} */
        _logPromptUrl: null,
        /** @type Window */
        _logPromptWindow: null,
        /** @type classes.SessionLogPromptWidget */
        _logPromptWidget: null,
        /** @type string[] */
        _serverFeatures: null,
        /** @type {?string} */
        _endUrl: null,

        _sessionMode: null,
        _childWindows: null,

        /** @type {classes.VMSessionNavigationManager} */
        _navigationManager: null,

        /**
         * @inheritDoc
         * @constructs
         * @param {?string} identifier session identifier
         */
        constructor: function(identifier) {
          $super.constructor.call(this);
          this._navigationManager = new cls.VMSessionNavigationManager(this);
          this._htmlHostPageAppId = context.bootstrapInfo.subAppInfo;
          this._widget = cls.WidgetFactory.createWidget("Session", {
            appHash: gbc.systemAppId,
            session: this
          });
          this._widget.when(context.constants.widgetEvents.titleChanged,
            (title) => context.HostService.setDocumentTitle());
          context.HostService.getApplicationHostWidget().addChildWidget(this._widget);
          context.HostLeftSidebarService.addSession(this);
          this._identifier = identifier;
          this._applications = [];
          this._applicationQueue = [];
          this._childWindows = [];
          this._closeHandler = this._widget.getEndWidget().when(context.constants.widgetEvents.close, () => this.destroy());
          this._restartHandler = this._widget.getEndWidget().when(context.constants.widgetEvents.restart, () => this._onRestart());

          this._flushableApplications = [];
          context.HostLeftSidebarService.setTitle(i18next.t("gwc.main.sidebar.title"));
          // if context.bootstrapInfo.subAppInfo > 0, we are in a child window
          if (this._htmlHostPageAppId) {
            this.activateBrowserMultiPageMode();
          }
          this._flushingApplicationsListener = context.InitService.when(
            gbc.constants.widgetEvents.onBeforeUnload, () => this._flushWaitingApplications());
          this._unloadListener = context.InitService.when(
            gbc.constants.widgetEvents.onUnload, () => this._destroyChildrenWindows());
          this._serverFeatures = [];
        },
        _onRestart: function() {
          if (context.bootstrapInfo.reloadOnRestart === "true") {
            window.location.reload(true);
            return;
          }
          const info = this._baseInfos;
          this.destroy(true);
          context.SessionService.startApplication(info.appId, info.urlParameters);
        },
        getWidget: function() {
          return this._widget;
        },
        getIdentifier: function() {
          return this._identifier;
        },

        getApplicationIdentifier: function() {
          return this._applicationIdentifier++;
        },

        destroy: function(restarting) {
          context.SessionService.remove(this, true === restarting);
          if (this._sessionMode) {
            this._sessionMode.destroy();
            this._sessionMode = null;
          }
          this._closeHandler();
          this._restartHandler();

          if (this._navigationManager) {
            this._navigationManager.destroy();
            this._navigationManager = null;
          }
          this._widget.destroy();
          this._widget = null;
          this._applications.length = 0;
          this._applicationQueue.length = 0;
          this._flushingApplicationsListener();
          this._destroyChildrenWindows();
          $super.destroy.call(this);
        },
        getConnector: function() {
          return this._baseInfos.connector;
        },
        /**
         * Get the session ID
         * @return {string} the session ID
         * @publicdoc
         */
        getSessionId: function() {
          return this._sessionId;
        },

        setSessionId: function(id) {
          if (!this._sessionId) {
            this._sessionId = id;
            context.SessionService.updateSessionId(this, id);
          } else if (id !== this._sessionId) {
            this.error("Session Id Changed");
          }
        },
        getAppId: function() {
          return this._baseInfos.appId;
        },
        error: function(msg) {

        },

        /**
         * @returns {classes.VMSessionNavigationManager}
         */
        getNavigationManager: function() {
          return this._navigationManager;
        },

        /**
         *
         * @param {classes.VMApplication} application
         */
        add: function(application) {
          let queueSize = this._applicationQueue.length;
          this._applications.push(application);

          if (queueSize === 0 || this._applicationQueue[queueSize - 1] !== application) {
            this._applicationQueue.push(application);
          }

          application.__idleChangedSessionHook = application.dvm.onIdleChanged(
            () => this._onIdleChanged(application));
          this.emit(context.constants.baseEvents.applicationAdded, application);
        },
        /**
         *
         * @param {classes.VMApplication} application
         */
        remove: function(application) {
          application.__idleChangedSessionHook();
          this._navigationManager.removeApplication(application);
          this._applications.remove(application);
          this._applicationQueue.remove(application);
          this._applicationEnding = application.info().ending;
          let pos = 0;

          while (pos < this._applicationQueue.length) {
            if (this._applicationQueue[pos] === this._applicationQueue[pos + 1]) {
              this._applicationQueue.splice(pos, 1);
            } else {
              pos++;
            }
          }

          this.emit(context.constants.baseEvents.applicationRemoved, application);
          const currentApp = this.getNewApplication(application);

          if (currentApp) {
            this.setCurrentApplication(currentApp);
            const currentWindow = currentApp.getVMWindow();
            if (currentWindow) {
              const appWidget = currentApp.getUI().getWidget(),
                winWidget = currentWindow.getController().getWidget();

              this.getNavigationManager().setLastActiveWindow(currentApp, currentWindow.getId());
              winWidget.domAttributesMutator(() => appWidget.removeClass("inactiveWindow"));

              this._widget.setCurrentWidget(appWidget);
              context.HostService.setDisplayedWindowNode(currentWindow);
            }
          }

          this._showEnding = true;
          this._updateDisplayEnd();
        },

        _updateDisplayEnd: function() {
          if (this._showEnding && !this._applications.length) {
            if (!this._destroyed) {
              this.getWidget().showWaitingEnd();
            }
            context.HostService.unsetDisplayedWindowNode();

            let delay = 0;

            if (context.BrowserWindowsService.isRootWindow() && this.isInBrowserMultiPageMode()) {
              delay = 1000;
            }

            this._registerTimeout(() => {
              if (!(
                  (context.BrowserWindowsService.isRootWindow() &&
                    context.BrowserWindowsService.countChildWindows(
                      (w) => (!/monitor=true/.test(window._multiWindowData.directChildren[0].location.search)))) ||
                  (this.isInBrowserMultiPageMode() && this._waitingNewTasks > 0))) {
                if (this._waitingNewTasks === 0 && !this._destroyed) {
                  context.HostLeftSidebarService.setContent();
                  if (this.isInTabbedContainerMode()) {
                    this._sessionMode.freeIdleHook();
                  }
                }
                this.displayEnd();
              }
            }, delay);
          }
        },
        _autoclose: function() {
          this._registerTimeout(() => {
            const can = !this._flushableApplications || !this._flushableApplications.length;
            if (can) {
              cls.WindowHelper.closeWindow();
            } else {
              this._autoclose();
            }
          }, 200);
        },

        /**
         * Terminate the session
         * (This is always called by window.onunload with forceServer=true)
         * @param {boolean} [forceServer] true to send a session close (/ua/close) to the server (if supported)
         * @publicdoc
         */
        closeSession: function(forceServer) {
          // if forceServer and is not child of another tab (stantdalone or browserMultiPage activated),
          // send session /ua/close if it has feature
          if (forceServer && this.isMasterBrowserPage() && this.hasServerFeature("close-session")) {
            if (this._applications && this._applications[0]) {
              this._applications[0].protocolInterface.closeSession();
            }
            // if forceServer and is child of another tab (browserMultiPage activated)
            // try to send app /ua/close (will free parent app processing if RUN was called)
          } else if (forceServer && !this.isMasterBrowserPage() && this._applications[0]) {
            this._applications[0].close();
          } else {
            while (this._applications.length) {
              this._applications[0].stop();
            }
          }
        },

        setEndUrl: function(url) {
          this._endUrl = url;
        },

        displayEnd: function() {
          if (!this.isMasterBrowserPage()) {
            this._autoclose();
            return;
          }
          this.emit(context.constants.baseEvents.displayEnd, this._baseInfos.session);
          if (this.getWidget()) {
            this.getWidget().getEndWidget().setHeader(i18next.t("gwc.app.ending.title"));
            // disable sidebar on session end
            context.HostLeftSidebarService.enableSidebar(false);
            if (this._baseInfos.session) {
              this.getWidget().getEndWidget().showSessionActions();
              this.getWidget().getEndWidget().setSessionLinks(this._baseInfos.customUA || this._baseInfos.connector || "",
                this._baseInfos.session);
              this.getWidget().getEndWidget().setSessionID(this._baseInfos.session);
            }
            if (this._baseInfos.mode === "ua") {
              this.getWidget().getEndWidget().showUAActions();
            }
            if (!this._applicationEnding.normal) {

              switch (this._applicationEnding.flag) {
                case "notFound":
                  this.getWidget().getEndWidget().setHeader(i18next.t("gwc.app.notFound.title"));
                  this.getWidget().getEndWidget().setMessage(i18next.t("gwc.app.notFound.message", {
                    appId: "<strong>\"" + this._baseInfos.appId + "\"</strong>"
                  }));
                  break;
                case "notok":
                  this.getWidget().getEndWidget().setMessage(
                    "<p data-details='notok'>" + i18next.t("gwc.app.error.message") + ".</p><p>" + this._applicationEnding
                    .message +
                    "</p>");
                  break;
                case "forbidden":
                  this.getWidget().getEndWidget().setMessage(
                    "<p data-details='forbidden'>" + i18next.t("gwc.app.forbidden.message") + ".</p><p>" + this._applicationEnding
                    .message + "</p>");
                  break;
                case "autoLogout":
                  this.getWidget().getEndWidget().setMessage(
                    "<p data-details='autoLogout'>" + i18next.t("gwc.app.autologout.message") + ".</p>");
                  break;
                case "uaProxy":
                  this.getWidget().getEndWidget().setMessage(
                    "<p data-details='uaProxy'>" + i18next.t("gwc.app.uaProxy.message") + ".</p><p>" + this._applicationEnding
                    .message +
                    "</p>");
                  break;
              }
            }
            if (this._endUrl) {
              this.getWidget().showRedirectEnd();
              window.location.href = this._endUrl;
            } else if (this._applicationEnding.flag !== "hidden") {
              this.getWidget().showEnd();
            }
          }
          this.displayLogPrompt();
          context.HostService.unsetDisplayedWindowNode();
        },

        displayLogPrompt: function(promptUrl) {
          const latePromptHandling = !this._logPromptUrl && Boolean(promptUrl);
          if (!latePromptHandling) {
            this._trackPromptEnding();
          }
          if (this._logPromptUrl !== promptUrl) {
            this._logPromptUrl = promptUrl;
            if (!this._logPromptUrl) {
              document.body.removeClass("logPrompting");
              if (this._logPromptWindow) {
                this._logPromptWindow.close();
                this._logPromptWindow = null;
              }
              if (this._logPromptWidgetHandle) {
                this._logPromptWidgetHandle();
              }
              if (this._logPromptWidget) {
                this._logPromptWidget.destroy();
                this._logPromptWidget = null;
              }
            } else {
              if (latePromptHandling) {
                this._trackPromptEnding();
              }
              if (!this._logPromptWidget) {
                this._logPromptWidget = cls.WidgetFactory.createWidget("SessionLogPrompt", {
                  appHash: gbc.systemAppId
                });
                this._logPromptWidgetHandle = this._logPromptWidget.when(context.constants.widgetEvents.click, function() {
                  if (this.isMasterBrowserPage()) {
                    this._displayLogPopup();
                  } else {
                    const opener = window.opener,
                      openerSession = opener && opener.gbc && opener.gbc.SessionService.getCurrent();
                    if (openerSession) {
                      openerSession._displayLogPopup();
                    }
                  }
                }.bind(this));
                document.body.appendChild(this._logPromptWidget.getElement());
              }
              if (this.isMasterBrowserPage()) {
                if (!this._logPromptWindow) {
                  document.body.addClass("logPrompting");
                } else {
                  this._logPromptWindow.location.href = this._logPromptUrl;
                }
              }
            }
          }
        },
        _displayLogPopup: function() {
          if (!this._logPromptWindow || this._logPromptWindow.closed) {
            this._logPromptWindow = window.open(this._logPromptUrl, "",
              "resizable,scrollbars,status,width=" + window.innerWidth + ",height=" + window.innerHeight +
              ",top=" + window.screenTop + ",left=" + window.screenLeft);
          } else if (this._logPromptWindow) {
            this._logPromptWindow.focus();
          }
        },

        _trackPromptEnding: function() {
          if (this._logPromptUrl) {
            let hasOnlyIdle = true;
            const protocolInterface = this.getApplications()[0] && this.getApplications()[0].protocolInterface,
              protocolAlive = protocolInterface && protocolInterface.isAlive();
            this.getApplications().forEach(function(app) {
              hasOnlyIdle = hasOnlyIdle && app.isIdle();
            });
            if (hasOnlyIdle && protocolAlive) {
              protocolInterface.trackPrompt();
            }
          }
        },

        /**
         *
         * @param {string[]} features
         */
        addServerFeatures: function(features) {
          for (const item of features) {
            const feature = item.trim();
            if (this._serverFeatures.indexOf(feature) < 0) {
              this._serverFeatures.push(feature);
            }
          }
        },
        /**
         *
         * @param {string} feature
         * @return {boolean}
         */
        hasServerFeature: function(feature) {
          return Boolean(this._serverFeatures) && this._serverFeatures.indexOf(feature) >= 0;
        },
        /**
         *
         * @returns {boolean}
         */
        isEmpty: function() {
          return !this._applications.length;
        },

        start: function(appName, params) {
          const info = new cls.VMApplicationInfo({
            appId: appName,
            urlParameters: params || (
              context.bootstrapInfo.queryString ?
              new cls.QueryString(context.bootstrapInfo.queryString).copyContentsObject() :
              context.UrlService.currentUrl().getQueryStringObject()
            )
          });
          info.connector = info.urlParameters.connector || context.bootstrapInfo.connectorUri || "";
          info.customUA = info.urlParameters.customUA || null;
          info.mode = info.urlParameters.mode || "ua";
          info.inNewWindow = !this.isMasterBrowserPage();
          if (info.inNewWindow) {
            info.session = this._sessionId = context.bootstrapInfo.sessionId;
            context.HostLeftSidebarService.setTitle(i18next.t("gwc.main.sidebar.multitab_title"));
          }
          this._baseInfos = info;
          const application = new cls.VMApplication(info, this);
          const appWidget = application.getUI().getWidget();
          this.add(application);
          this._widget.setCurrentWidget(appWidget);
          application.start();
          this._registerNewTask(application.protocolInterface);
          return application;
        },

        startSubTask: function(taskId, taskProcIdParent = null, taskWaiting = null, callback = () => {}) {
          let info = {
            ...(this._baseInfos || {})
          };
          info.connectionInfo = {};
          info.urlParameters = {
            ...(this._baseInfos.urlParameters || {})
          };
          info.inNewWindow = this.isInBrowserMultiPageMode() || (!this.isMasterBrowserPage() && (this._htmlHostPageAppId !== taskId));

          if (info.inNewWindow) {
            info.urlParameters = context.bootstrapInfo.queryString ?
              new cls.QueryString(context.bootstrapInfo.queryString).copyContentsObject() :
              context.UrlService.currentUrl().getQueryStringObject();
            info.connector = info.urlParameters.connector || context.bootstrapInfo.connectorUri || "";
            info.customUA = info.urlParameters.customUA || null;
            info.mode = info.urlParameters.mode || "ua";
          }
          if (!this.isMasterBrowserPage()) {
            context.HostLeftSidebarService.setTitle(i18next.t("gwc.main.sidebar.multitab_title"));
            this._sessionId = context.bootstrapInfo.sessionId;
            info.session = this._sessionId;
          }

          info.task = true;
          info.page = 2;
          info.app = taskId;
          info.taskProcIdParent = taskProcIdParent;
          info.taskWaiting = taskWaiting;

          let hostingWindow = taskWaiting && window._multiWindowData.findWindowBy((w) => {
            const session = w && w.gbc && w.gbc.SessionService.getCurrent();
            if (session) {
              return session.getApplications().find(
                (app) => app.info() && app.info().connectionInfo.procId === taskProcIdParent);
            }
            return null;
          });
          info.inNewWindow = info.inNewWindow && !hostingWindow;
          if (!info.inNewWindow) {
            const session = hostingWindow ? hostingWindow.gbc.SessionService.getCurrent() : this;
            session._startSubTaskLocally(info, callback);
          } else {
            let application = new cls.VMApplication(new cls.VMApplicationInfo(info), this);
            application.waitForApplicationInNewWindow(() => {
              this.waitedForNewTask();
              callback(application);
            }, () => {});
          }
        },

        _startSubTaskLocally: function(info, callback) {
          let application = new cls.VMApplication(new cls.VMApplicationInfo(info), this);
          const appWidget = application.getUI().getWidget();
          this._widget.setCurrentWidget(appWidget);
          this.add(application);
          application.start();
          this.waitedForNewTask();
          callback(application);
        },

        /**
         *
         * @param {window.gbcWrapper} wrapper
         * @param {Object<string, *>} readyData
         */
        startDirect: function(wrapper, readyData) {
          context.HostLeftSidebarService.enableSidebar(true);
          let meta = cls.AuiProtocolReader.translate(readyData.meta)[0];
          const info = new cls.VMApplicationInfo({
            pingTimeout: 1000,
            connectionInfo: meta.attributes,
            procId: meta.attributes.procId,
            page: 1,
            auiOrder: 0,
            mode: "direct",
            nativeResourcePrefix: readyData.nativeResourcePrefix.replace(/\/$/, "") + "/__dvm__/"
          });
          if (readyData.headers) {
            const headersKeys = Object.keys(context.constants.network.startHeaders);
            for (const key of headersKeys) {
              const value = context.constants.network.startHeaders[key];
              info[value.prop || key] = readyData.headers[context.constants.network.headers[key]];
            }
          }

          gbc.classes.EncodingHelper.setVMEncoding(meta.attributes.encoding.toLowerCase());

          info.wrapper = wrapper;
          this._baseInfos = info;
          const application = new cls.VMApplication(info, this);
          application.setProcessing();
          application.procId = info.procId;
          const appWidget = application.getUI().getWidget();
          this._widget.setCurrentWidget(appWidget);
          this.add(application);
          this._navigationManager.updateApplicationInformation(application);
          application.start();
        },
        onApplicationAdded: function(hook) {
          return this.when(context.constants.baseEvents.applicationAdded, hook);
        },
        onApplicationRemoved: function(hook, once) {
          return this.when(context.constants.baseEvents.applicationRemoved, hook, once);
        },

        info: function() {
          return this._baseInfos;
        },

        /**
         * Get all running applications
         * @returns {classes.VMApplication[]} an array of applications or null
         * @publicdoc
         */
        getApplications: function() {
          return this._applications;
        },

        /**
         * Get the current application
         * @returns {classes.VMApplication}
         */
        getCurrentApplication: function() {
          if (this._applications.length && this._applications[this._applications.length - 1]) {
            return this._applications[this._applications.length - 1];
          }
          return null;
        },

        /**
         *
         * @returns {classes.VMApplication}
         */
        getApplicationByHash: function(hash) {
          return this._applications && this._applications.filter(function(item) {
            return item.applicationHash === hash;
          })[0];
        },
        getApplicationByProcId: function(procId) {
          return this._applications && this._applications.filter(function(item) {
            return item.procId === procId ||
              (item.info() && item.info().procId === procId) ||
              (item?.info()?.connectionInfo.procId === procId);
          })[0];
        },
        setCurrentApplication: function(application) {
          const index = this._applications.indexOf(application);
          if (index !== -1) {
            this._applications.splice(index, 1);
            this._applications.push(application);
          }
        },
        _onIdleChanged: function(application) {
          this.emit(context.constants.baseEvents.idleChanged, application);
        },
        whenIdleChanged: function(hook) {
          return this.when(context.constants.baseEvents.idleChanged, hook);
        },
        isCurrentIdle: function() {
          const app = this.getCurrentApplication();
          return !app || app.dvm.processed && app.dvm.idle && app.layout.isIdle() && app.scheduler.hasNoCommandToProcess();
        },

        _addWaitingApplication: function(application) {
          this._flushableApplications.push(application);
        },
        _removeWaitingApplication: function(application) {
          this._flushableApplications.remove(application);
        },
        _flushWaitingApplications: function() {
          this._flushingApplications = true;
          while (this._flushableApplications && this._flushableApplications.length) {
            cls.WindowHelper.openWindow(cls.UANetwork.newApp(this._flushableApplications.shift(), null, null, {
              noQueryString: true
            }), true);
          }
        },
        _registerNewTask: function(protocolInterface) {
          this._storedProtocol = protocolInterface;
        },
        newTask: function() {
          if (this._storedProtocol) {
            this._storedProtocol.newTask();
          }
        },
        _registerChildWindow: function(win) {
          if (win) {
            window._emergencyClose = window._emergencyClose || {};
            win._opener = window;
            win.addEventListener("load", function() {
              window._emergencyClose[win.gbc.uid] = [];
              win.addEventListener("unload", function() {
                if (window.browserInfo.isFirefox) {
                  const emergencyCloses = window._emergencyClose[win.gbc.uid];
                  for (const closeInfo of emergencyCloses) {
                    cls.UANetwork.querySend("close", null, closeInfo, function() {}, null, null);
                  }
                }
                if (win.location.href !== "about:blank") { // thank you firefox
                  this._updateDisplayEnd();
                }
              }.bind(this));
            }.bind(this));
            this._childWindows.push(win);
          }
        },
        _destroyChildrenWindows: function() {
          this._childWindows = [];
          context.BrowserWindowsService.closeAllChildren();
        },
        waitingForNewTask: function() {
          this._waitingNewTasks++;
        },

        waitedForNewTask: function() {
          if (this._waitingNewTasks > 0) {
            this._waitingNewTasks--;
          }
          this._updateDisplayEnd();
        },

        isInBrowserMultiPageMode: function() {
          return this._sessionMode && this._sessionMode.isInstanceOf(cls.VMSessionBrowserMultiPageMode);
        },

        isMasterBrowserPage: function() {
          return !this._htmlHostPageAppId;
        },

        isInTabbedContainerMode: function() {
          return this._sessionMode && this._sessionMode.isInstanceOf(cls.VMSessionTabbedContainerMode);
        },

        displayChanged: function() {
          let app = null;
          if (this.isInTabbedContainerMode()) {
            app = this._sessionMode.triggerDisplayChanged();
          }
          return app;
        },

        /**
         *
         * @param {classes.WindowNode} windowNode
         */
        activateTabbedContainerMode: function(windowNode) {
          if (!this._sessionMode && windowNode) {
            this._sessionMode = new cls.VMSessionTabbedContainerMode(this);
            this._sessionMode.activate(windowNode);
            context.HostLeftSidebarService.setApplicationListVisibility(true);
            context.HostLeftSidebarService.setTabbedContainerMode(true);
          }
        },

        getHostApplication: function() {
          return this.isInTabbedContainerMode() && this._sessionMode.getHostApplication();
        },

        activateBrowserMultiPageMode: function() {
          if (!this._sessionMode && (this.getApplications().length === 1)) {
            this._sessionMode = new cls.VMSessionBrowserMultiPageMode(this);
            context.HostLeftSidebarService.setTitle(i18next.t("gwc.main.sidebar.multitab_title"));
          }
        },

        /**
         * '
         * @param {classes.VMApplication} app
         * @param {classes.ApplicationWidget} appWidget
         */
        addApplicationWidget: function(app, appWidget) {
          if (this.isInTabbedContainerMode()) {
            this._sessionMode.addApplicationWidget(app, appWidget);
          } else {
            this.getWidget().addChildWidget(appWidget);
          }
        },

        manageStartMenu: function(startMenuNode, widget) {
          if (this.isInTabbedContainerMode() && this._sessionMode.willManageStartMenu()) {
            this._sessionMode.manageStartMenu(startMenuNode, widget);
          } else {
            startMenuNode.getAncestor("UserInterface").getController().getWidget().addStartMenu(widget);
          }
        },

        /**
         * Get the running application corresponding to the remove application
         * @param removedApplication
         * @return {classes.VMApplication}
         */
        getNewApplication: function(removedApplication) {
          let parentProcId = removedApplication.getParentProcId();

          if (!parentProcId || this._applicationQueue.length === 1) {
            return this._applicationQueue[this._applicationQueue.length - 1];
          }

          let app = null;
          let childApp = null;
          let procId = parentProcId;
          //Search the running child
          do {
            app = this._navigationManager.getApplicationByProcId(procId);
            childApp = app && this._navigationManager.getChildApplication(app);
            procId = childApp && childApp.getProcId();
          } while (app && app.isProcessing() && childApp);

          // if no app has been found return the first one
          if (!app && this._applicationQueue.length > 0) {
            return this._applicationQueue[0];
          }
          return app;
        },

        /**
         * Get the application with identifier = applicationIdentifier
         * @param {number} applicationIdentifier
         * @return {classes.VMApplication|undefined}
         */
        getApplicationByIdentifier: function(applicationIdentifier) {
          return this._applications.find((app) => {
            return app.applicationHash === applicationIdentifier;
          });
        }
      };
    });
  });
