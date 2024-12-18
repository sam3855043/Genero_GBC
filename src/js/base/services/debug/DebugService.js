/// FOURJS_START_COPYRIGHT(D,2014)
/// Property of Four Js*
/// (c) Copyright Four Js 2014, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('DebugService', ['InitService'],
  function(context, cls) {

    /**
     * Debug Service
     * @namespace gbc.DebugService
     * @gbcService
     */
    context.DebugService = context.oo.StaticClass(function() {
      return /** @lends gbc.DebugService */ {
        __name: "DebugService",
        /** @type Window */
        _monitorWindow: null,
        /**
         * @type classes.MonitorWidget
         */
        _widget: null,
        _folder: null,
        _vmLogs: null,
        _proxyLogs: null,

        /**
         * @type classes.DebugAuiController
         */
        _debugAuiController: null,
        auiview: null,
        _isDebugWindow: false,
        /**
         * @type classes.EventListener
         */
        _eventListener: null,

        _debugUis: null,
        _active: false,
        _disabled: false,

        _highlightElement: null,
        _highlightTimer: null,
        _highlightDisplayTime: null,

        _gridHighlightColors: null,

        _nodeToShow: null,
        _persistentDebugGrid: false,

        _orderManagedEvent: null,

        _canCounterServer: false,
        /**
         * Check if the current page is a debug monitor
         * @return {boolean} - true if it's the debug monitor, false otherwise
         * @private
         */
        _isMonitor: function() {
          return Boolean(context.UrlService.currentUrl().getQueryStringObject().monitor);
        },

        /**
         * Init service method. should be called only once.
         */
        init: function() {
          this._debugUis = [];
          this._eventListener = new cls.EventListener();
          this._highlightDisplayTime = 2000;
          // Set default style of debug grid highlight
          this._gridHighlightColors = {
            color1: "rgba(255,100,0,0.2)",
            color2: "rgba(255,0,0,0.2)"
          };

          if (this._isMonitor()) {
            this.auiview = {};
            this._isDebugWindow = true;
            this._debugAuiController = new cls.DebugAuiController();

            this._monitor = cls.WidgetFactory.createWidget("Monitor", {
              appHash: gbc.systemAppId
            });

            this._folder = cls.WidgetFactory.createWidget("Folder", {
              appHash: gbc.systemAppId
            });
            this._folder.isMinified = true;
            const auiTree = this._createAuiTreePage();
            const pageProxy = this._createProxyPage();
            const pageVm = this._createVmPage();
            this._folder.addChildWidget(auiTree);
            this._folder.addChildWidget(pageProxy);
            this._folder.addChildWidget(pageVm);
            // Due to a weird rendering, the vm content is displayed and should active
            // to then be set inactive
            this._folder.setCurrentPage(pageVm);
            this._folder.setCurrentPage(auiTree);

            const containerElement = document.createElement('div');
            containerElement.addClass('tab-folder-debug');
            containerElement.appendChild(this._monitor.getElement());
            containerElement.appendChild(this._folder.getElement());

            document.body.appendChild(containerElement);

            window.setTimeout(function() {
              // Getting correct gbc's instance to inspect
              const rootGbc = window._multiWindowData.parentWindow?.gbc || context.BrowserWindowsService.getRootGbc(),
                session = rootGbc.SessionService.getCurrent(),
                app = session?.getCurrentApplication();
              if (app) {
                this._debugAuiController._appInfo = gbc.info(app.applicationInfo);
                this._debugAuiController._sessionId = app.getSession()._sessionId;
                this._debugAuiController.refreshDebugAui(app.getNode(0));
                this._vmLogs.loadDebugContent(app.getSession()._sessionId);
                this._proxyLogs.loadDebugContent(app.getSession()._sessionId);
                rootGbc.DebugService.attach(window);
                // Refresh debug window at each order
                this._onAppOrdersManaged(app, function() {
                  this._debugAuiController.refreshDebugAui(app.getNode(0));
                }.bind(this));
              }
            }.bind(this), 100);
          } else {
            if (context.__wrapper.isNative()) {
              context.__wrapper.on(context.__wrapper.events.DEBUGNODE, function(event, src, nodeId) {
                this.onHighlightAuiNode({
                  auiNodeId: nodeId
                });
              }.bind(this));
            }
          }
          this.whenActivationChanged(function(event, src, active) {
            if (active) {
              document.body.addClass("gbc_DebugMode");
              if (window.isURLParameterEnabled(window.location.search, "debugcounter")) {
                this.tryCounterServer();
              }
            }
          }.bind(this));

        },

        _createAuiTreePage: function() {
          const auiPage = cls.WidgetFactory.createWidget("Page", {
            appHash: gbc.systemAppId
          });
          auiPage.setTitle("AUI tree");
          auiPage.setText("AUI tree");
          auiPage.addChildWidget(this._debugAuiController.getWidget());
          return auiPage;
        },
        _createProxyPage: function() {
          const proxyPage = cls.WidgetFactory.createWidget("Page", {
            appHash: gbc.systemAppId
          });
          proxyPage.setTitle("Proxy logs");
          proxyPage.setText("Proxy logs");
          this._proxyLogs = cls.WidgetFactory.createWidget("MonitorDebugProxyLogs", {
            appHash: gbc.systemAppId
          });
          proxyPage.addChildWidget(this._proxyLogs);
          return proxyPage;
        },
        _createVmPage: function() {
          const vmPage = cls.WidgetFactory.createWidget("Page", {
            appHash: gbc.systemAppId
          });
          vmPage.setTitle("VM logs");
          vmPage.setText("VM logs");
          this._vmLogs = cls.WidgetFactory.createWidget("MonitorDebugVmLogs", {
            appHash: gbc.systemAppId
          });
          vmPage.addChildWidget(this._vmLogs);
          return vmPage;
        },

        /**
         * Handler called once application has switched
         */
        onApplicationSwitch: function() {
          if (this._monitorWindow) {
            const debugAuiController = this._monitorWindow.gbc.DebugService._debugAuiController;
            const app = gbc.SessionService.getCurrent().getCurrentApplication();

            // Refresh debug window at each order
            this._onAppOrdersManaged(app, function() {
              debugAuiController.refreshDebugAui(app.getNode(0));
            }.bind(this));

            debugAuiController.refreshDebugAui(app.getNode(0));
            this.attach(this._monitorWindow);
          }
          this.hideHighlightAui();

        },

        /**
         * @return {boolean}
         */
        isMonitorWindow: function() {
          return this._isDebugWindow;
        },

        /**
         * Destroy the service
         */
        destroy: function() {
          if (this._highlightTimer) {
            window.clearTimeout(this._highlightTimer);
            this._highlightTimer = null;
          }
          if (this._monitorWindow) {
            this._monitorWindow.close();
          }
          if (this._orderManagedEvent) {
            this._orderManagedEvent(); //unbind events
          }
        },

        /**
         * Show the Debug window with the AUI tree
         * @param {Number} [auiId] the aimed node id
         */
        show: function(auiId) {
          if (!this._monitorWindow) {
            if (context.__wrapper.isNative()) {
              context.__wrapper.showDebugger(
                context.__wrapper.param(Object.isNumber(auiId) ? auiId : -1, context.SessionService.getCurrent().getCurrentApplication()));
            } else {
              const url = context.UrlService.currentUrl();
              window.open(url.removeQueryString("app").addQueryString("monitor", true).toString());
            }
          } else {
            const uiNode = context.SessionService.getCurrent().getCurrentApplication().getNode(0);
            const debugAuiController = this._monitorWindow.gbc.DebugService._debugAuiController;
            if (uiNode.auiSerial !== debugAuiController.auiSerial) {
              debugAuiController.refreshDebugAui(uiNode);
            }
            this._monitorWindow.focus();
          }
        },

        /**
         *
         * @param monitorWindow
         */
        attach: function(monitorWindow) {
          if (this._monitorWindow !== monitorWindow) {
            this._monitorWindow = monitorWindow;
            this._monitorWindow.document.title = "GBC Debug tools";
            this._monitorWindow.onunload = function() {
              this._monitorWindow = null;
            }.bind(this);
            //persistent Debug Grid
            this._monitorWindow.document.querySelector("#debugGrid").on("change.persistentDebugGrid", function(event) {
              gbc.DebugService.setPersistentDebugGrid(event.target.checked);
            }.bind(this));
            if (this._nodeToShow !== null) {
              this._monitorWindow.gbc.DebugService._debugAuiController.showNode(this._nodeToShow);
              this._nodeToShow = null;
            } else {
              this._monitorWindow.gbc.DebugService._debugAuiController.showNode(window.gbcNode(0));
            }
            this._monitorWindow.addEventListener(context.classes.DebugAuiController.highlightAui, this.onHighlightAuiNode.bind(
              this));
          }
        },

        /**
         * Enable/disable the persistent Debug grid
         * @param status {boolean} - true to enable, false otherwise
         */
        setPersistentDebugGrid: function(status) {
          this._persistentDebugGrid = status;
          if (!status && this._highlightElement) {
            document.body.removeChild(this._highlightElement);
            this._highlightTimer = null;
            this._highlightElement = null;
          }
        },

        /**
         * Define timeout before hiding debug highlight
         * @param time {number} - time to keep debug highlight on screen (in ms) - default: 2000ms
         */
        setHighlightDisplayTime: function(time) {
          this._highlightDisplayTime = time;
        },

        /**
         *
         * @param widget
         */
        registerDebugUi: function(widget) {
          if (this._debugUis.indexOf(widget) < 0) {
            this._debugUis.push(widget);
          }
          widget.activate(this._active);
        },

        /**
         *
         * @param widget
         */
        unregisterDebugUi: function(widget) {
          if (this._debugUis.indexOf(widget) >= 0) {
            this._debugUis.remove(widget);
          }
        },

        /**
         *
         * @param hook
         * @return {*|HandleRegistration}
         */
        whenActivationChanged: function(hook) {
          return this._eventListener.when("debugActivationChanged", hook);
        },

        /**
         * This override the disabled mode
         */
        enable: function() {
          this._disabled = false;
        },

        /**
         *
         */
        disable: function() {
          this._disabled = true;
        },

        /**
         * Activate the Debug service
         * @param {?Boolean} force - true to override the url parameters
         */
        activate: function(force) {
          if (force) {
            this.enable();
          }
          if (!this._active && !this._disabled) {
            this._active = true;
            for (const element of this._debugUis) {
              element.activate(this._active);
            }
            context.classes.DebugHelper.activateDebugHelpers();
            this._registerDebugContextMenu();
            document.body.addClass("gbc_DebugMode");
            this._eventListener.emit("debugActivationChanged", true);
          }
        },

        /**
         *
         * @private
         */
        _registerDebugContextMenu: function() {
          if (!this._isMonitor() && !this.__debugContextMenuRegistered) {
            this.__debugContextMenuRegistered = true;
            window.addEventListener('contextmenu', function(event) {
              const modKey = (navigator.userAgent.indexOf('Mac') !== -1) ? event.metaKey : event.ctrlKey;
              if (modKey && !event.shiftKey && !event.altKey) {
                const auiNode = window.gbcNode(event.target);
                if (auiNode) {
                  this.show(auiNode.getId());
                  if (this._monitorWindow) {
                    const uiNode = auiNode.getApplication().getNode(0);
                    const debugAuiController = this._monitorWindow.gbc.DebugService._debugAuiController;
                    if (uiNode.auiSerial !== debugAuiController.auiSerial) {
                      debugAuiController.refreshDebugAui(uiNode);
                    }
                    this._monitorWindow.gbc.DebugService._debugAuiController.showNode(auiNode);
                  } else {
                    this._nodeToShow = auiNode;
                  }
                  event.preventCancelableDefault();
                }
              }
            }.bind(this));
          }
        },

        /**
         * Handler called once received orders from the VM
         * @param app - vm application
         * @param callback - hook called once orders are received
         * @private
         */
        _onAppOrdersManaged: function(app, callback) {
          if (this._orderManagedEvent) {
            this._orderManagedEvent();
          }
          this._orderManagedEvent = app.dvm.onOrdersManaged(function() {
            callback();
          }.bind(this));
        },

        /**
         *
         * @return {boolean}
         */
        isActive: function() {
          return this._active;
        },

        /**
         * Hide the highlight layer
         */
        hideHighlightAui: function() {
          if (this._highlightElement) {
            this._highlightElement.addClass("hidden");
          }
        },

        /**
         * Handler called when an element is clicked in AUI tree
         * @param event
         */
        onHighlightAuiNode: function(event) {
          const currentSession = gbc.SessionService.getCurrent();
          const currentApp = currentSession && currentSession.getCurrentApplication();
          if (currentApp) {
            let node = currentApp.getNode(event.auiNodeId);
            if (node.getTag() === 'TreeItem') {
              let table = node;
              while (table.getTag() !== 'Table') {
                table = table.getParentNode();
              }
              const valueIndex = node.attribute('row');
              if (valueIndex === -1) {
                return;
              }
              node = table.getFirstChild('TableColumn').getFirstChild('ValueList').getChildren()[valueIndex];
            }
            let widget = null;
            while (!widget) {
              const ctrl = node.getController();
              if (ctrl) {
                widget = ctrl.getWidget();
              }
              node = node.getParentNode();
            }

            if (this._highlightElement) {
              window.clearTimeout(this._highlightTimer);
              document.body.removeChild(this._highlightElement);
              this._highlightElement = null;
            }

            if (widget._layoutEngine) {
              if (widget._layoutEngine instanceof cls.GridLayoutEngine) {
                this._highlightElement = this.createGridHighlightElement(widget);
              } else if (widget._layoutEngine instanceof cls.DBoxLayoutEngine) {
                this._highlightElement = this.createDBoxHighlightElement(widget);
              }
            }
            if (!this._highlightElement) {
              this._highlightElement = this.createDefaultHighlightElement(widget);
            }

            document.body.appendChild(this._highlightElement);
            if (!this._persistentDebugGrid) {
              this._highlightTimer = window.setTimeout(function() {
                document.body.removeChild(this._highlightElement);
                this._highlightTimer = null;
                this._highlightElement = null;
              }.bind(this), this._highlightDisplayTime);
            }
          }
        },

        /*
         * Change style properties for grid highlight element
         * @param {Object} - style object with backgroundColor and border css
         */
        setGridHighlightColor: function(color1, color2) {
          this._gridHighlightColors = {
            color1,
            color2
          };
        },

        /**
         * Will create an element used to highlight a widget
         * @param widget
         * @return {HTMLElement}
         */
        createDefaultHighlightElement: function(widget) {
          const widgetRect = widget.getElement().getBoundingClientRect();
          const element = document.createElement("div");
          element.style.position = 'fixed';
          element.style.backgroundColor = "rgba(255,0,0,0.5)";
          element.style.border = "1px solid red";
          element.style.zIndex = 999999;
          element.style.top = widgetRect.top + "px";
          element.style.left = widgetRect.left + "px";
          element.style.width = widgetRect.width + "px";
          element.style.height = widgetRect.height + "px";

          document.body.off("keydown.debugLayer");
          document.body.on("keydown.debugLayer", function(event) {
            // Hide debug layer on shift key down
            if (event.shiftKey) {
              element.style.zIndex = -5000;
              this._rebuildDebugLayer = true;
            }
          }.bind(this));

          document.body.off("keyup.debugLayer");
          document.body.on("keyup.debugLayer", function(event) {
            // Rebuild debug layer on shift key up
            if (this._rebuildDebugLayer) {
              this._rebuildDebugLayer = false;
              this.onHighlightAuiNode({
                auiNodeId: widget._auiTag
              });
            }
          }.bind(this));

          // Rebuild debug layer on each layout
          const currentSession = gbc.SessionService.getCurrent();
          const currentApp = currentSession && currentSession.getCurrentApplication();
          if (currentApp) {
            currentApp.layout.afterLayout(this.onHighlightAuiNode.bind(this, {
              auiNodeId: widget._auiTag
            }), true);
          }

          return element;
        },

        /**
         * Will create an element used to highlight a grid widget
         * @param widget
         * @return {HTMLElement}
         */
        createGridHighlightElement: function(widget) {
          const widgetRect = widget.getElement().getBoundingClientRect();
          const element = this.createDefaultHighlightElement(widget);
          element.style.backgroundColor = "";
          element.addClass("persistentDebugGrid");

          const decorating = {
            offsetLeft: widget.getLayoutInformation().getDecoratingOffset().getWidth(true),
            offsetTop: widget.getLayoutInformation().getDecoratingOffset().getHeight(true),
            width: widget.getLayoutInformation().getDecorating().getWidth(true),
            height: widget.getLayoutInformation().getDecorating().getHeight(true)
          };
          const dimensionElementsList = [
            widget._layoutEngine._xspace.dimensionManager.dimensionElements,
            widget._layoutEngine._yspace.dimensionManager.dimensionElements
          ];

          const xSpace = document.createElement("div");
          xSpace.addClass("xSpace");
          const ySpace = document.createElement("div");
          ySpace.addClass("ySpace");

          for (let i = 0; i < dimensionElementsList.length; ++i) {
            const dimensionElements = dimensionElementsList[i];
            let total = 0;
            for (let j = 0; j < dimensionElements.length; ++j) {
              const dimensionElement = dimensionElements[j];
              const bandSize = dimensionElement.getSize(true, true);
              const band = document.createElement("div");
              band.style.position = 'absolute';
              band.style.backgroundColor = j % 2 ? this._gridHighlightColors.color1 : this._gridHighlightColors.colors;
              band.addClass("element");
              if (i === 0) { // X
                band.style.top = 0 + (decorating.offsetTop - 15) + "px";
                band.style.left = total + decorating.offsetLeft + "px";
                band.style.width = bandSize + "px";
                band.style.height = widgetRect.height - decorating.height + 30 + "px";
                xSpace.append(band);
              } else { // Y
                band.style.top = total + decorating.offsetTop + "px";
                band.style.left = 0 + (decorating.offsetLeft - 10) + "px";
                band.style.width = widgetRect.width - decorating.width + 20 + "px";
                band.style.height = bandSize + "px";
                ySpace.append(band);
              }
              total += bandSize;
              band.setAttribute("title", dimensionElement.toString());
            }
          }

          element.appendChild(ySpace);
          element.appendChild(xSpace);

          const widgets = widget._layoutEngine._registeredWidgets;
          const slots = widget._layoutEngine._registeredSlots;
          for (let i = 0; i < widgets.length; ++i) {
            const childWidget = widgets[i];
            const slotX = slots[childWidget.getUniqueIdentifier()].x;
            const slotY = slots[childWidget.getUniqueIdentifier()].y;
            const childWidgetRect = childWidget.getElement().getBoundingClientRect();
            const childRectElement = document.createElement("div");
            childRectElement.addClass("slot");
            childRectElement.style.position = 'fixed';
            childRectElement.style.border = "1px solid red";
            childRectElement.style.top = childWidgetRect.top + "px";
            childRectElement.style.left = childWidgetRect.left + "px";
            childRectElement.style.width = childWidgetRect.width + "px";
            childRectElement.style.height = childWidgetRect.height + "px";
            childRectElement.setAttribute("title", slotX.toString() + "\n--------\n" + slotY.toString());
            element.appendChild(childRectElement);
          }
          return element;
        },

        /**
         * Will create an element used to highlight a DBox widget
         * @param widget
         * @return {HTMLElement}
         */
        createDBoxHighlightElement: function(widget) {
          const widgetRect = widget.getElement().getBoundingClientRect();
          const element = this.createDefaultHighlightElement(widget);

          element.style.backgroundColor = "";

          const children = widget.getChildren();
          let total = 0;
          for (let i = 0; i < children.length; ++i) {
            const bandSize = widget._layoutEngine._getAllocatedSize(children[i]);
            const band = document.createElement("div");
            band.style.position = 'absolute';
            band.style.backgroundColor = i % 2 ? "rgba(255,100,0,0.5)" : "rgba(255,0,0,0.5)";
            if (widget._layoutEngine instanceof cls.HBoxLayoutEngine) {
              band.style.top = 0;
              band.style.left = total + "px";
              band.style.width = bandSize + "px";
              band.style.height = widgetRect.height + "px";
            } else {
              band.style.top = total + "px";
              band.style.left = 0;
              band.style.width = widgetRect.width + "px";
              band.style.height = bandSize + "px";
            }
            total += bandSize;
            element.appendChild(band);
          }

          return element;
        },

        /**
         *
         * @param catName
         * @param noToggle
         */
        catClicked: function(catName, noToggle) {
          if (!noToggle) {
            this.auiview['.cat_' + catName] = !this.auiview['.cat_' + catName];
          }
          const elements = document.body.getElementsByClassName('cat_' + catName);
          let i = 0;
          const len = elements.length;
          for (; i < len; i++) {
            elements[i].toggleClass("hidden", Boolean(this.auiview['.cat_' + catName]));
          }
        },

        tryCounterServer: function() {
          try {
            fetch("http://localhost:9999/")
              .then(function() {
                this._canCounterServer = true;
              }.bind(this))
              .catch(function() {
                this._canCounterServer = false;
              }.bind(this));

          } catch (e) {
            this._canCounterServer = false;
          }
        },

        count: function(name) {
          if (this._canCounterServer) {
            try {
              fetch("http://localhost:9999/var/increment/" + name).catch();
            } catch (e) {
              //
            }
          }
        }
      };
    });
    context.InitService.register(context.DebugService);
  });
