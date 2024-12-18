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
modulum('VMApplication', ['EventListener'],
  function(context, cls) {
    /**
     * Object that represents an application of a VM Session
     * @class VMApplication
     * @memberOf classes
     * @extends classes.EventListener
     * @publicdoc Base
     */
    cls.VMApplication = context.oo.Class(cls.EventListener, function($super) {
      return /** @lends classes.VMApplication.prototype */ {
        $static: /** @lends classes.VMApplication */ {
          styleListLoaded: "gStyleListLoaded"
        },
        __name: "VMApplication",
        /** General information for this application
         * @type classes.VMApplicationInfo
         */
        applicationInfo: null,
        procId: null,
        /** Indicator to know if the application is running or not */
        running: false,
        /** Indicator to know if the application is ending */
        ending: false,
        ended: false,
        /** Indicator to know if the application has protocol error */
        hasError: false,
        /** protocolInterface
         * @type classes.ProtocolInterface
         */
        protocolInterface: null,
        /** dvm management
         * @type classes.DVMApplicationService
         */
        dvm: null,
        /** model (aui) management
         * @type classes.AuiApplicationService
         */
        model: null,
        /** layout management
         * @type classes.LayoutApplicationService
         */
        layout: null,
        /** actions
         * @type classes.ActionApplicationService
         */
        action: null,
        /** file transfer management
         * @type classes.FileTransferApplicationService
         */
        filetransfer: null,
        /** Scheduler
         * @type classes.SchedulerApplicationService
         */
        scheduler: null,
        /** keyboard management
         * @type classes.KeyboardApplicationService
         */
        keyboard: null,

        /** input management
         * @type classes.InputApplicationService
         */
        input: null,

        /** Focus management
         * @type classes.FocusApplicationService
         */
        focus: null,
        /** application ui
         * @type classes.UIApplicationService
         * */
        _ui: null,
        /**
         * @type {classes.VMSession}
         */
        _session: null,

        /** @type {Array} */
        styleAttributesChanged: null,

        /** @type {boolean} */
        styleListsChanged: false,

        /** @type {Object} */
        usedStyleAttributes: {},

        /** @function */
        _afterLayoutHandler: null,

        _currentlyProcessing: false,
        _processingDelayer: 0,

        _title: null,
        _icon: null,

        _currentWindow: null,
        /**
         *
         * @param {classes.VMApplicationInfo} info - application info
         * @param {classes.VMSession} session

         */
        constructor: function(info, session) {
          $super.constructor.call(this);
          this._session = session;
          this.applicationInfo = info;
          this.applicationHash = session.getApplicationIdentifier();
          if (!info.inNewWindow) {
            this._ui = cls.ApplicationServiceFactory.create('UI', this);
            this.dvm = cls.ApplicationServiceFactory.create('Dvm', this);
            this.model = cls.ApplicationServiceFactory.create('Model', this);
            this.layout = cls.ApplicationServiceFactory.create('Layout', this);
            this.action = cls.ApplicationServiceFactory.create('Action', this);
            this.filetransfer = cls.ApplicationServiceFactory.create('FileTransfer', this);
            this.scheduler = cls.ApplicationServiceFactory.create('Scheduler', this);
            this.keyboard = cls.ApplicationServiceFactory.create('Keyboard', this);
            this.input = cls.ApplicationServiceFactory.create('Input', this);
            this.focus = cls.ApplicationServiceFactory.create('Focus', this);
            this.message = cls.ApplicationServiceFactory.create('Message', this);
            session.getNavigationManager().addApplication(this);

            // emit gbcReady signal when gbc seems to be ready for user interaction
            this._afterLayoutHandler = this.layout.afterLayout(function() {
              if (this.scheduler.hasNoCommandToProcess()) {
                this._registerTimeout(function() {
                  this.emit(context.constants.widgetEvents.gbcReady);
                }.bind(this), 50);
              }
            }.bind(this), false);
            if (gbc.qaMode) {
              gbc.QAService.bindToScheduler(this.scheduler);
            }
          }
          this.protocolInterface = cls.ApplicationServiceFactory.create(this._getProtocolInterface(info), this);

          this.styleAttributesChanged = [];
          context.WidgetService.registerVMApplication(this);

          //We must notify native app that the app is ready to obtain the focus on the webview
          this.gbcReady(function() {
            context.__wrapper.nativeCall(context.__wrapper.param({
              name: "gbcReady",
              args: {
                "windowState": gbc.HostService.getWindowState()
              }
            }, this));
          }, true);
        },
        /**
         * Get the owning session
         * @returns {classes.VMSession} The owning session
         * @publicdoc
         */
        getSession: function() {
          return this._session;
        },

        waitForApplicationInNewWindow: function(onSuccess, onFailure) {
          this.protocolInterface.waitForApplicationInNewWindow(onSuccess, onFailure);
        },
        prepareEmergencyClose: function() {
          this._emergencyClose = cls.UANetwork._prepared.close(this);
          window.requestAnimationFrame(function() {
            try {
              if (window.opener && window.opener._emergencyClose) {
                window.opener._emergencyClose[context.uid].push(this._emergencyClose);
              }
            } catch (e) {
              if (e.name === "SecurityError") {
                context.LogService.networkProtocol.log("GBC opened from a cross domain origin", e);
              }
            }
          }.bind(this));
        },
        _getProtocolInterface: function(info) {
          let result = "NoProtocolInterface";
          switch (info.mode) {
            case "direct":
              result = "DirectProtocolInterface";
              break;
            case "ua":
              result = "UAProtocolInterface";
              break;
            default:
              break;
          }
          return result;
        },
        /**
         * @inheritDoc
         */
        destroy: function() {
          if (!this._destroyed) { // TODO whe should not call destroy on a destroyed object

            if (this._afterLayoutHandler) {
              this._afterLayoutHandler();
              this._afterLayoutHandler = null;
            }

            this._ui.destroy();
            this.filetransfer.destroy();
            this._session.remove(this);
            this.model.destroy();

            this.applicationInfo = null;

            this._session = null;
            this._ui = null;
            this.dvm = null;
            this.model = null;
            this.layout = null;
            this.action = null;
            this.filetransfer = null;
            this.scheduler = null;
            this.keyboard = null;
            this.input = null;
            this.focus = null;
            this.message = null;
            this.protocolInterface = null;

            this._currentWindow = null;

            $super.destroy.call(this);

            context.WidgetService.unregisterVMApplication(this);
          }
        },

        start: function() {
          this.protocolInterface.start(this.applicationInfo);
        },
        stop: function(message) {
          if (!this.stopping) {
            this.stopping = true;
            if (!this.ended && this.applicationInfo) {
              if (message) {
                this.applicationInfo.ending = cls.ApplicationEnding.notok(message);
              }
              if (!this.applicationInfo.ending) {
                this.applicationInfo.ending = cls.ApplicationEnding.ok;
              }
              if (this.applicationInfo.urlParameters && this.applicationInfo.urlParameters.logPlayer) {
                this.applicationInfo.ending = cls.ApplicationEnding.logPlayer;
              }

              context.styler.bufferize();
              // TODO reorder, why we don't call this in destroy ??
              this.scheduler.destroy();
              this.model.remove();
              this.setEnding();
              this.action.destroy();
              this.layout.destroy();
              this.model.stop();
              this.dvm.destroy();
              this.protocolInterface.destroy();
              this.keyboard.destroy();
              this.input.destroy();
              this.focus.destroy();
              this.filetransfer.destroy();
              this.message.destroy();

              this.destroy();
              context.styler.flush();
              this.ended = true;
            }
          }
        },
        /**
         * Set status of application
         * @param {boolean} running Status
         */
        setRunning: function(running) {
          this.running = running;
          this._ui.setRunning(running);
        },

        /**
         * Set the error status at application's protocol error
         */
        setError: function() {
          this.hasError = true;
        },

        /**
         * Set the ending status at application's end
         */
        setEnding: function() {
          if (!this.ending && !this.ended && !this._destroyed) {
            this.ending = true;
            this.setIdle();
          }
        },

        /**
         * Returns this application's info.
         * @returns {classes.VMApplicationInfo}
         */
        info: function() {
          return this.applicationInfo;
        },
        /**
         * Get application instantiated node by its Aui ID
         * @param {number} id the node id
         * @returns {classes.NodeBase} the node, if found
         * @publicdoc
         */
        getNode: function(id) {
          return this.model && this.model.getNode(id);
        },
        uiNode: function() {
          return this.getNode(0);
        },

        /**
         * Check if a widget has the VM focus
         * @param {classes.WidgetBase} widget
         * @returns {boolean} true if widget has the VM focus
         */
        hasVMFocus(widget) {
          const widgetNode = this.getNode(widget.getAuiTag());
          return widgetNode?.hasVMFocus() === true;
        },

        /**
         * Get the VM Focused Node instance
         * @returns {classes.NodeBase} The VM focused node
         * @publicdoc
         */
        getFocusedVMNode: function() {
          const uiNode = this.uiNode();
          if (uiNode) {
            const id = uiNode.attribute("focus");
            return this.getNode(id);
          }
          return null;
        },

        /**
         * Get the VM Focused Node instance
         * or if the focused node is a table or a matrix get the current value node
         * @param {boolean} [inputModeOnly] - return value node only if is node is in INPUT mode
         * @returns {*|classes.NodeBase}
         */
        getFocusedVMNodeAndValue: function(inputModeOnly) {
          let focusedNode = this.getFocusedVMNode();
          if (focusedNode && focusedNode.getCurrentValueNode) {
            const currentValueNode = focusedNode.getCurrentValueNode(inputModeOnly);
            if (currentValueNode) {
              focusedNode = currentValueNode;
            }
          }
          return focusedNode;
        },

        newTask: function() {
          let session = context.BrowserWindowsService.getRootSession();
          if (session) {
            session.newTask();
          } else {
            this.protocolInterface.newTask();
          }
        },
        /**
         * Set the idle status to true
         */
        setIdle: function() {
          this._setProcessingStyle(false);
          this.dvm.setIdle(true);
          this.action.setInterruptablesActive(false);
        },

        /**
         * Bypass Idle Time excecution in case of GMA UR background service
         * @param {Boolean} bypass - true to bypass, false to get back to normal
         */
        bypassIdleTimer: function(bypass) {
          if (context.__wrapper.isGMA()) {
            this._bypassTimer = bypass;
          }
        },

        /**
         * Check if Idle Timer execution is bypassed
         * @return {Boolean} true if byPassed, false otherwise
         */
        isBypassedIdleTimer: function() {
          return this._bypassTimer;
        },

        /**
         * Set the processing status to true
         */
        setProcessing: function() {
          this._setProcessingStyle(true);
          this.dvm.setIdle(false);
          this.action.setInterruptablesActive(true);
        },

        _setProcessingStyleImpl: function(processing) {
          this._processingDelayer = 0;
          if (this._ui && this._ui.getWidget()) {
            this._session.getNavigationManager().setApplicationProcessing(this, processing);
            const windows = this.model.getNodesByTag("Window"),
              len = windows.length;
            let i = 0;
            for (; i < len; i++) {
              if (windows[i] && windows[i]._setProcessingStyle) {
                windows[i]._setProcessingStyle(processing);
              }
            }
          }
        },

        _setProcessingStyle: function(processing) {
          if (!processing) {
            if (this._processingDelayer !== 0) {
              this._clearAnimationFrame(this._processingDelayer);
              this._processingDelayer = 0;
            }
            this._setProcessingStyleImpl(false);
          } else {
            if (this._processingDelayer === 0) {
              this._processingDelayer = this._registerAnimationFrame(this._setProcessingStyleImpl.bind(this, true));
            }
          }
        },
        /**
         * Check if the application is idle
         * @returns {boolean} true if idle, false otherwise
         */
        isIdle: function() {
          return this.dvm.idle;
        },

        /**
         * Check if the application is running
         * @returns {boolean} true if running, false otherwise
         */
        isProcessing: function() {
          return !this.dvm?.idle;
        },
        /**
         * Send an Interrupt order
         */
        interrupt: function() {
          this.protocolInterface.interrupt();
        },
        close: function() {
          if (!this.ended && !this._destroyed) {
            if (this.ending) {
              this.destroy();
            } else {
              this.protocolInterface.close();
            }
          }
        },
        error: function() {
          this.setEnding();
        },
        /**
         * fail application gracefully,
         * @param ending ending message
         */
        fail: function(ending) {
          if (ending && this.applicationInfo) {
            this.applicationInfo.ending = cls.ApplicationEnding.notok(ending);
          }
          this._registerTimeout(function() {
            this.protocolInterface.stop(ending); // send destroy event to the VM
          }.bind(this));
        },
        /**
         * get active window
         * @returns {classes.WindowNode}
         */
        getVMWindow: function() {
          if (this.ending) {
            return null;
          }
          const uiNode = this.uiNode();
          const uiCurrentWindow = uiNode &&
            uiNode.isAttributeSetByVM("currentWindow") &&
            uiNode.attribute("currentWindow");
          if (uiCurrentWindow) { // we don't consider the value 0 as it is not a Window node
            return this.model.getNode(uiCurrentWindow);
          } else {
            return null;
          }
        },

        getActionApplicationService: function() {
          return this.action;
        },

        /**
         *
         * @param {classes.WidgetBase} widget
         */
        attachRootWidget: function(widget) {
          this._ui.getWidget().addChildWidget(widget);
        },
        /**
         *
         * @returns {classes.UIApplicationService}
         */
        getUI: function() {
          return this._ui;
        },

        /**
         * Get items from the chromebar or from the applicationHostWidget if legacy mode enabled
         * @param {String} name
         * @return {*}
         */
        getMenu: function(name) {
          const menu = this.getUI().getWidget().getUserInterfaceWidget().getChromeBarWidget();
          return menu.getGbcMenuItem(name);
        },

        /**
         * Get the Chromebar
         * @return {classes.ChromeBarWidget|null} the chromebar
         */
        getChromeBar: function() {
          const uiNode = this.model && this.model.getNode(0),
            uiWidget = uiNode && uiNode.getWidget();
          return uiWidget && uiWidget.getChromeBarWidget();
        },

        hasActiveKeyEventNode: function() {
          const uiNode = this.uiNode();
          if (uiNode) {
            const focusId = uiNode.attribute('focus');
            const focusedNode = this.getNode(focusId);
            if (['Table', 'Matrix', 'Menu', 'MenuAction', 'Dialog', 'Action'].indexOf(focusedNode.getTag()) !== -1) {
              const isActive = focusedNode.attribute('active') === 1;
              return isActive && (!focusedNode.isAttributePresent("dialogType") || focusedNode.attribute("dialogType").startsWith(
                "Display")); // if node is table and is in display or displayarray mode (only send keys to VM if not in edit mode)
            }
          }
          return false;
        },

        setTabbedContainerMode: function(activation, windowNode) {
          if (this._session && activation) {
            this._session.activateTabbedContainerMode(windowNode);
          }
        },

        getTitle: function() {
          return this._title;
        },

        setTitle: function(title) {
          this._title = title;
          this.emit(context.constants.widgetEvents.titleChanged, title);
        },

        getImage: function() {
          return this._image;
        },

        setImage: function(image) {
          this._image = image;
          this.emit(context.constants.widgetEvents.iconChanged, image);
        },

        /**
         * transforms a resource path
         * GBC internal
         * DO NOT IMPLEMENT
         * @param {string} path raw path
         * @param {string} [nativePrefix] native prefix if any
         * @param {string} [browserPrefix] browser prefix if any
         * @return {string} the transformed resource path
         */
        wrapResourcePath: function(path, nativePrefix, browserPrefix) {
          path = "" + path; // force path to string if not
          // if the path has a scheme, don't change it
          if (!path || /^(http[s]?|[s]?ftp|data|file|font)/i.test(path)) {
            return path;
          }
          const startPath = context.__wrapper.isNative() ?
            this.info().nativeResourcePrefix + (nativePrefix ? nativePrefix + "/" : "") :
            (browserPrefix ? browserPrefix + "/" : "");

          // In case there is a queryString, we should not encode it, keep it aside before adding it to returnPath
          const queryIndex = path && path.indexOf("?");
          let queryStr = "";
          if (queryIndex > 0) {
            queryStr = path.substring(queryIndex);
            path = path.replace(queryStr, "");
          }

          // Prevent Windows path like C:\foo\too.ttf
          if (context.__wrapper.isNative()) {
            // clean path
            path = encodeURIComponent(path).replace("%2F", "/");
          }

          return startPath + path + queryStr;
        },

        getCurrentWindow: function() {
          return this._currentWindow;
        },

        setCurrentWindow: function(windowNode) {
          this._currentWindow = windowNode;
        },

        /**
         * get the application procId
         * @return {String}
         */
        getProcId: function() {
          return this.applicationInfo.connectionInfo.procId;
        },

        /**
         * get the parent application procId
         * @return {String}
         */
        getParentProcId: function() {
          return this.applicationInfo.connectionInfo.procIdParent;
        },

        /**
         * Return true if we can accept events on this application
         * @return {boolean}
         */
        canProcessEvent: function() {
          const curSession = context.SessionService.getCurrent();
          const navigationManager = curSession && curSession.getNavigationManager();

          return !(this.isProcessing() && navigationManager.getChildApplication(this));
        },

        /**
         * attach to gbcReady event
         * @param {Function} hook the hook
         * @param {boolean} [once] true to free handle after first call
         * @return {HandleRegistration} the event handle
         */
        gbcReady: function(hook, once) {
          return this.when(context.constants.widgetEvents.gbcReady, hook, once);
        }
      };
    });
  });
