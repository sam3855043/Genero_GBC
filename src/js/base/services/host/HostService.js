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

modulum('HostService', ['InitService', 'DebugService', 'EventListener'],
  function(context, cls) {

    /**
     * Main service which init global gbc listeners
     * @namespace gbc.HostService
     * @gbcService
     */
    context.HostService = context.oo.StaticClass( /** @lends gbc.HostService */ {
      __name: "HostService",

      currentWindowChanged: "currentWindowChanged",

      /** @type classes.MainContainerWidget */
      _widget: null,
      /** @type classes.LogPlayerWidget */
      _logPlayer: null,
      /** @type String */
      _defaultTitle: "",
      /** @type classes.ApplicationHostWidget */
      _applicationHostWidget: null,
      /** @type classes.WindowNode */
      _currentWindowNode: null,
      /** @type classes.EventListener */
      _eventListener: null,
      /** @type HTMLElement */
      _dropDownContainer: null,
      /** @type HTMLElement */
      _fontPreloader: null,
      /** @type Array **/
      _windowStack: null,
      /** @type String */
      _currentMediaSize: null,
      /**
       * @type {HandleRegistration}
       */
      _browserResizeHandler: null,

      /** @type Object **/
      _hostSize: null,

      /** @type String **/
      _windowState: null,

      _tabbedHostInfo: null,
      /**
       * @type {WeakMap<classes.WindowWidget, classes.WindowNode>}
       */
      _widgetToNodeWindows: null,
      _closeButtonsInfo: null,

      init: function() {
        this._eventListener = new cls.EventListener();
        this._windowStack = [];
        this._widgetToNodeWindows = new WeakMap();
        this._closeButtonsInfo = {};

        const existingOnError = window.onerror;
        window.onerror = function(msg, file, line, col, error) {
          if (existingOnError) {
            existingOnError(msg, file, line, col, error);
          }
          context.HostService._eventListener.emit('error', error, msg, file, line, col);
          return false;
        };

        // Device orientation handler
        window.addEventListener("orientationchange", function() {
          if (window.isIOS()) {
            const viewportSelector = document.querySelector("meta[name=viewport]");
            if (viewportSelector) {
              const content = viewportSelector.getAttribute("content");
              //GMI-911: temporarily limiting the zoom to 1.0 to avoid
              //scaling too large on orientation change
              viewportSelector.setAttribute("content", `${content}, maximum-scale=1.0`);
              // Using setTimeout since iOS doesn't seem to relayout everytime there is a rotation change.
              // No events are sent to the VM, nor layout executed
              window.setTimeout(() => {
                //reset to zoomable after a while
                viewportSelector.setAttribute("content", content);
              }, 90);
            }
          }
          if (window.isMobile) {
            this._eventListener.emit("orientationChange.Host");
          }
        }.bind(this));

        // Keep track of host size on resize
        this._hostSize = {
          width: 0,
          height: 0
        };

        // Window Resize handler
        window.addEventListener("resize", function() {
          let screenSizeChanged = {
            width: this._hostSize.width !== window.document.body.offsetWidth,
            height: this._hostSize.height !== window.document.body.offsetHeight
          };
          this._hostSize = {
            width: window.document.body.offsetWidth,
            height: window.document.body.offsetHeight,
          };
          // emit new size and changes in host size
          this._eventListener.emit("resize.Host", window.document.body.offsetWidth, window.document.body.offsetHeight, screenSizeChanged);
        }.bind(this));

        // Let know the VM when the screen is resized
        this.onScreenResize(function() {
          const mediaString = context.ThemeService.getMediaString();
          if (mediaString !== this._currentMediaSize) {
            if (gbc.SessionService.getCurrent() && !gbc.SessionService.getCurrent().isEmpty()) {
              let event = new cls.VMConfigureEvent(0, {
                media: context.ThemeService.getMediaString()
              });
              this._currentMediaSize = mediaString;
              gbc.SessionService.getCurrent().getApplications().forEach((app) => {
                let focusNode = app.getFocusedVMNode();
                if (focusNode && focusNode.getCurrentValueNode) {
                  focusNode = focusNode.getCurrentValueNode();
                }

                const controller = focusNode ? focusNode.getController() : null;
                const newVmFocusWidget = controller ? controller.getWidget() : null;

                if (newVmFocusWidget && newVmFocusWidget.getValue) {
                  controller.sendWidgetCursors();
                  controller.sendWidgetValue(newVmFocusWidget.getValue());
                }

                app.scheduler.eventVMCommand(event, app.getNode(0));
                gbc.LogService.ui.log("resize", context.ThemeService.getMediaString());
              });
            }
          }
        }.debounce(250).bind(this));

        this.onScreenResize(() => this.updateDisplay());
      },

      destroy: function() {
        if (this._browserResizeHandler) {
          this._browserResizeHandler();
          this._browserResizeHandler = null;
        }
      },

      isLogPlayerRequested: function() {
        return window.isURLParameterEnabled("logplayer");
      },

      preStart: function() {
        if (!context.DebugService.isMonitorWindow()) {
          this._widget = cls.WidgetFactory.createWidget("MainContainer", {
            appHash: gbc.systemAppId
          });
          if (this.isLogPlayerRequested()) {
            this._logPlayer = cls.WidgetFactory.createWidget("LogPlayer", {
              appHash: gbc.systemAppId
            });
            this._logPlayer.addChildWidget(this._widget);
          }
          window.requestAnimationFrame(function() {
            const w = this._logPlayer ? this._logPlayer : this._widget;
            document.body.appendChild(w.getElement());
            if (this.isLogPlayerRequested()) {
              context.HostLeftSidebarService.enableSidebar(true);
            }
          }.bind(this));
          this._defaultTitle = document.title;
          this._applicationHostWidget = cls.WidgetFactory.createWidget("ApplicationHost", {
            appHash: gbc.systemAppId
          });
          this._widget.addChildWidget(this._applicationHostWidget);

          // create drop down container
          if (!this._dropDownContainer) {
            // TODO rename gbc_DropDownContainerWidget to gbc_DropDownContainer (this is not a widget)
            this._dropDownContainer = document.createElement("div");
            this._dropDownContainer.addClasses("gbc_DropDownContainerWidget", "hidden");
            document.body.appendChild(this._dropDownContainer);
          }
          // preload mono font
          if (!this._fontPreloader) {
            this._fontPreloader = document.createElement("span");
            this._fontPreloader.textContent = "M";
            this._fontPreloader.addClasses("gbc_MonoFontPreloader");
            document.body.appendChild(this._fontPreloader);
          }
          context.HostLeftSidebarService.preStart();
        }
      },
      getWidget: function() {
        return this._widget;
      },

      /**
       * Return the DOM Element created to host drop down widget
       * @returns {Element}
       */
      getDropDownContainer: function() {
        return this._dropDownContainer;
      },

      /**
       *
       * @returns {classes.ApplicationHostWidget}
       */
      getApplicationHostWidget: function() {
        return this._applicationHostWidget;
      },

      getLogPlayer: function() {
        return this._logPlayer;
      },

      start: function() {
        const params = context.UrlService.currentUrl().getQueryStringObject();
        if (window.gbcWrapper.protocolType !== "direct" && (params.app || context.bootstrapInfo.appName)) {
          context.SessionService.startApplication(params.app || context.bootstrapInfo.appName);
        } else {
          this.displayNoSession();
        }
      },
      displaySession: function() {
        this._applicationHostWidget.getLauncher().setHidden(true);
      },
      displayNoSession: function() {
        this._applicationHostWidget.getLauncher().setHidden(false);
      },
      whenError: function(cb) {
        this._eventListener.when('error', cb);
      },
      /**
       *
       * @param {number?} appHash
       * @returns {classes.WindowNode}
       */
      getCurrentWindowNode: function(appHash) {
        if (typeof appHash === "number" && appHash >= 0) {
          return context.SessionService.getCurrent().getApplicationByHash(appHash).getCurrentWindow();
        }
        return this._currentWindowNode;
      },
      /**
       * @param {number?} appHash
       * @returns {classes.WindowWidget}
       */
      getCurrentWindowWidget: function(appHash) {
        const windowNode = this.getCurrentWindowNode(appHash);
        return windowNode && windowNode.getWidget();
      },
      /**
       */
      unsetCurrentWindowNode: function() {
        this._currentWindowNode = null;
      },

      /**
       * Defines the initial state of the window (UR only).
       * @param {String} state - state of the window
       */
      setWindowState: function(state) {
        this._windowState = state;
      },
      /**
       * Get the state of the window as defined in the 4ST
       * @return {String}
       */
      getWindowState: function() {
        return this._windowState || "normal";
      },

      /**
       * get info about the current available closebutton if any
       * @return {*}
       * @private
       */
      _getCurrentWindowCloseButtonInfo: function() {
        let result = null;
        const windowNode = this.getCurrentWindowNode(),
          windowWidget = windowNode && windowNode.getWidget();
        if (windowWidget) {
          const uiWidget = windowWidget.getUserInterfaceWidget && windowWidget.getUserInterfaceWidget(),
            app = uiWidget && uiWidget.getParentWidget();
          if (app && app._tabbedPage) {
            if (this._tabbedHostInfo) {
              result = this.getCloseButtonInfo(this._tabbedHostInfo.node);
            }
          } else {
            result = this.getCloseButtonInfo(windowNode);
          }
        }
        return result;
      },

      /**
       * do a click if possible on the current available closebutton if any
       */
      tryCloseButtonClick: function() {
        const closeInfo = this._getCurrentWindowCloseButtonInfo();
        if (closeInfo && closeInfo.closeWidget) {
          closeInfo.closeWidget.manageMouseClick();
        }
      },
      /**
       *
       * @param {Hook} hook
       * @return {HandleRegistration}
       */
      onCurrentWindowChange: function(hook) {
        return this._eventListener.when(this.currentWindowChanged, hook);
      },

      syncCurrentWindow: function() {
        const session = context.SessionService.getCurrent(),
          app = session && session.getCurrentApplication();
        if (app && app.getUI()) {
          const appUI = app.getUI();
          appUI.syncCurrentWindow();
        }
      },

      updateDisplay: function() {
        if (this._applicationHostWidget) {
          const session = context.SessionService.getCurrent();
          let app = session && session.getCurrentApplication();
          if (session && session.isInTabbedContainerMode()) {
            app = session.displayChanged();
          }
          if (app && app.scheduler) {
            app.scheduler.layoutCommand({
              resize: true
            });

            let ui = app.getUI();
            let appWidget = ui && ui.getWidget();
            let uiWidget = appWidget && appWidget.getUserInterfaceWidget();
            let chromeBar = uiWidget && uiWidget.getChromeBarWidget();

            if (chromeBar) {
              chromeBar.refresh();
            }
          }
        }
      },

      /**
       * - Manage switch of window in the DOM depending on whether they are modal or not and having WebComponent or not.
       * - Display/hide topmenu & toolbars of active/inactive windows.
       * - Set window title
       * @param {classes.WindowNode} windowToDisplay
       */
      setDisplayedWindowNode: function(windowToDisplay) {
        this.updateDisplay();
        const session = context.SessionService.getCurrent();
        if (session) {
          if (windowToDisplay) {
            const
              app = session && session.getCurrentApplication(),
              currentWindowWidget = this._currentWindowNode && this._currentWindowNode.getWidget(),
              currentWindowUIWidget = currentWindowWidget && currentWindowWidget.getUserInterfaceWidget(),
              appUIWidget = app && app.getUI() && app.getUI().getWidget(),
              tabbedPage = appUIWidget && appUIWidget._tabbedPage,
              windowToDisplayWidget = windowToDisplay.getWidget(),
              windowToDisplayIsModal = windowToDisplayWidget && windowToDisplayWidget.isModal,
              windowToDisplayUIWidget = windowToDisplayWidget && windowToDisplayWidget.getUserInterfaceWidget(),
              switchingApplication = !this._currentWindowNode || (windowToDisplayUIWidget !== currentWindowUIWidget),
              areInSameApplication = appUIWidget === windowToDisplayUIWidget,
              windowToDisplayHasWebComponent = windowToDisplayWidget && windowToDisplayWidget.hasChildWebComponent(),
              windowToDisplayElement = windowToDisplayWidget && windowToDisplayWidget.getElement(),
              windowToDisplayUIContainerElement = windowToDisplayUIWidget.getContainerElement(),
              windowText = windowToDisplayWidget ? (windowToDisplayWidget.getText() || windowToDisplayUIWidget.getText()) : "",
              windowIcon = windowToDisplayWidget ? (windowToDisplayWidget.getImage() || windowToDisplayUIWidget.getImage()) : "";
            let
              previousWindow = windowToDisplayUIWidget._activeWindow,
              previousWindowWidget = previousWindow && previousWindow.getWidget(),
              previousWindowIsModal = previousWindowWidget && previousWindowWidget.isModal,
              previousWindowHasWebComponent = previousWindowWidget && previousWindowWidget.hasChildWebComponent();

            // If new window is a modal, we don't remove/insert it in DOM. Modal is fully managed by WindowTypeVMBehavior
            session.getNavigationManager().freezeWindow(this._currentWindowNode, windowToDisplayIsModal);
            // determine if in current application a switch of window occured
            // if only a switch of application occured without change of window in current app, we do nothing (application management done by SessionWidget did all the job)

            if (switchingApplication) {
              context.DebugService.onApplicationSwitch();
            }
            // TODO what happens when previousWindow === win ?
            // if app window changed and new active window isn't a modal, we add it to DOM
            if (switchingApplication || !windowToDisplayIsModal) {
              // WebComponent Management
              if (previousWindowHasWebComponent || windowToDisplayHasWebComponent) {
                // if window to remove has a webcomponent, just send it far away out of view, without removing it
                if (previousWindowHasWebComponent) {
                  previousWindowWidget.addClass("gbc_out_of_view");
                  if (!windowToDisplayHasWebComponent && windowToDisplayUIContainerElement) {
                    windowToDisplayUIContainerElement.appendChild(windowToDisplayElement);
                  }
                } else {
                  if (previousWindowWidget) {
                    previousWindowWidget.getElement().remove();
                  }
                }
                // if window to be displayed has a webcomponent, just put it back in the view
                if (windowToDisplayHasWebComponent) {
                  windowToDisplayWidget.removeClass("gbc_out_of_view");
                  if (!windowToDisplayElement.parentNode) {
                    windowToDisplayUIContainerElement.appendChild(windowToDisplayElement);
                  }
                }
                // if neither previous and new window has WebComponent
              } else if (windowToDisplayUIWidget) {
                // TODO when previousWindow === win
                // TODO window is removed and immediately added to DOM this useless
                // TODO and activate signal is sent whereas it should not
                if (windowToDisplayUIContainerElement) {
                  // if previous window wasn't a modal neither, we can safely remove it from DOM
                  if (previousWindowWidget && !previousWindowIsModal) {
                    previousWindowWidget.getElement().remove();
                  }
                  if (!windowToDisplayHasWebComponent && (!windowToDisplayElement.parentElement ||
                      (windowToDisplayElement.parentElement.lastChild !== windowToDisplayElement))) {
                    windowToDisplayUIContainerElement.appendChild(windowToDisplayElement);
                  }
                }
                // send activate signal to inform elements that window is append to DOM
                windowToDisplayUIWidget.activate(windowToDisplayWidget);
              }
            } else if (windowToDisplayIsModal) {
              const childrenWin = windowToDisplayUIWidget.getChildren();
              let nonModalPrevWin = null;
              let winIndex = childrenWin.indexOf(windowToDisplayWidget);
              const parentId = windowToDisplay.getParentWindowId();

              // Get the previous non-modal window to display it
              for (winIndex; winIndex >= 0; winIndex--) {
                nonModalPrevWin = childrenWin[winIndex - 1];
                if (nonModalPrevWin && !nonModalPrevWin.isModal && nonModalPrevWin._auiTag === parentId) {
                  break;
                }
              }
              if (nonModalPrevWin && (nonModalPrevWin.hasChildWebComponent && !nonModalPrevWin.hasChildWebComponent())) {
                if (nonModalPrevWin !== previousWindow && !windowToDisplayUIContainerElement.contains(nonModalPrevWin.getElement())) {
                  windowToDisplayUIContainerElement.appendChild(nonModalPrevWin.getElement());
                }
                nonModalPrevWin._forceVisible = true;
              }
            }
            if (!previousWindow || previousWindow.isDestroyed()) {
              previousWindow = this.getPreviousWindowOfStack(windowToDisplay);
            }
            previousWindowWidget = previousWindow && previousWindow.getWidget();
            previousWindowIsModal = previousWindowWidget && previousWindowWidget.isModal;
            // hide topmenu/toolbar of previous windows if none previous and new window are modal. In that case, topmenu/toolbar container is shared
            if (previousWindowWidget && !previousWindowIsModal && windowToDisplay && !windowToDisplayIsModal) {
              if (previousWindowWidget._activeTopMenuWidget) {
                previousWindowWidget._activeTopMenuWidget.setHidden(true);
              }
            }

            //Manage the top menu of the background window for modal window
            if (previousWindowWidget && previousWindowIsModal && previousWindow.getParentWindowId() > 0) {
              const parentOfWindowToDisplayAsModal = windowToDisplay.getParentNodeWhenModal(),
                parentWidgetOfWindowToDisplayAsModal = parentOfWindowToDisplayAsModal && parentOfWindowToDisplayAsModal.getWidget(),
                parentOfPreviousWindowAsModal = previousWindow.getParentNodeWhenModal(),
                parentWidgetOfPreviousWindowAsModal = parentOfPreviousWindowAsModal && parentOfPreviousWindowAsModal.getWidget();
              if (parentWidgetOfPreviousWindowAsModal && parentWidgetOfPreviousWindowAsModal._activeTopMenuWidget) {
                parentWidgetOfPreviousWindowAsModal._activeTopMenuWidget.setHidden(true);
              }
              if (parentWidgetOfWindowToDisplayAsModal && parentWidgetOfWindowToDisplayAsModal._activeTopMenuWidget) {
                parentWidgetOfWindowToDisplayAsModal._activeTopMenuWidget.setHidden(false);
                if (windowToDisplayIsModal && previousWindow &&
                  (previousWindow !== parentOfWindowToDisplayAsModal) && previousWindowWidget._activeTopMenuWidget) {
                  previousWindowWidget._activeTopMenuWidget.setHidden(true);
                }
              }
            }

            if (windowToDisplayWidget) {
              // display topmenu/toolbar of new current window
              if (windowToDisplayWidget._activeTopMenuWidget) {
                windowToDisplayWidget._activeTopMenuWidget.setHidden(false);
              }
              if (windowToDisplayWidget._toolBarWidget) {
                windowToDisplayWidget._toolBarWidget.setHidden(false);
              }
            }

            this._currentWindowNode = windowToDisplay;
            const windowToDisplayApplication = windowToDisplay && windowToDisplay.getApplication();
            if (windowToDisplayApplication) {
              windowToDisplayApplication.setCurrentWindow(windowToDisplay);
            }
            windowToDisplayUIWidget._activeWindow = windowToDisplay.isDestroyed() ? null : windowToDisplay;

            session.getNavigationManager().unfreezeWindow(this._currentWindowNode);

            if (windowToDisplayWidget) {
              const chromebar = windowToDisplayWidget.getParentWidget().getChromeBarWidget();
              if (chromebar) {
                chromebar.setLinkedWindow(windowToDisplayWidget);
              }

              // if we switched application we need to invalidate allocated space
              if (previousWindow && switchingApplication) {
                windowToDisplayWidget.getLayoutEngine().invalidateAllocatedSpace();
              }
              // set current window title (icon + text) as application host menu title
              if (areInSameApplication && !switchingApplication && tabbedPage) {
                if (!windowToDisplayWidget.isModal) {
                  tabbedPage.setText(windowText);
                  tabbedPage.setImage(windowIcon);
                }
              }
              if (!app || (!tabbedPage && !windowToDisplayWidget.isModal)) {
                session.getNavigationManager().setCurrentWindow(windowToDisplay);
                //A                this.setCurrentTitle(windowText);
                //A                this.setCurrentIcon(windowIcon);
              }
            }
            if (switchingApplication || windowToDisplay !== previousWindow) {
              this._eventListener.emit(this.currentWindowChanged, windowToDisplayWidget);
            }
            // need to refresh current application layout for potential background dynamic VM update
            if (app) {
              if (app.dvm) {
                app.dvm.updateProcessingStatus();
              }
              app.scheduler.layoutCommand();
              app.scheduler.restoreFocusCommand(true);
            }
          }
          session.getNavigationManager().updateItemsStatuses(this._currentWindowNode);
        }
      },

      unsetDisplayedWindowNode: function() {
        this.setDisplayedWindowNode(null);
      },

      /**
       * Define the current app title to display
       * @param {string} title - text to display in top bar
       * @param {classes.Application} app -
       */
      setDocumentTitle: function(title, app) {
        if (document.title !== title && app) {
          document.title = title ? title : this._defaultTitle;
          context.__wrapper.nativeCall(context.__wrapper.param({
            name: "windowTitle",
            args: {
              "title": document.title
            }
          }, app));
        }
      },

      /**
       * Define the current icon for this app
       * @param {string} img - the icon url for current app
       * @param {string} appIcon - the global icon url
       */
      setCurrentIcon: function(img, appIcon) {
        const app = gbc.SessionService.getCurrent() && gbc.SessionService.getCurrent().getCurrentApplication();
        const uiWidget = app && app.model.getNode(0) && app.model.getNode(0).getWidget();
        if (uiWidget && uiWidget.getChromeBarWidget()) {
          uiWidget.getChromeBarWidget().setIcon(img, appIcon);
        }
      },

      /**
       * @param {classes.WindowNode} windowNode
       */
      getCloseButtonInfo: function(windowNode) {
        const app = windowNode && windowNode.getApplication(),
          appHash = app && app.applicationHash,
          windowWidget = windowNode && windowNode.getWidget(),
          windowUuid = windowWidget && windowWidget.getUniqueIdentifier();
        return windowNode && this._closeButtonsInfo[appHash] && this._closeButtonsInfo[appHash][windowUuid];
      },
      /**
       *
       * @param {classes.WindowNode} windowNode
       */
      setTabbedHost: function(windowNode) {
        const windowWidget = windowNode && windowNode.getWidget();
        this._tabbedHostInfo = {
          node: windowNode,
          widget: windowWidget,
          appHash: windowWidget._appHash,
          windowId: windowWidget.getUniqueIdentifier()
        };
      },
      /**
       *
       * @param {classes.WindowNode} windowNode
       * @param {classes.WidgetBase} widget
       * @param {Object} opts
       */
      registerClosableWindow: function(windowNode, widget, opts) {
        const app = windowNode && windowNode.getApplication(),
          appHash = app && app.applicationHash,
          windowWidget = widget || windowNode && windowNode.getWidget(),
          windowUuid = windowWidget && windowWidget.getUniqueIdentifier();
        // Add a window to the stack
        if (this._windowStack.indexOf(windowNode) < 0) {
          this._windowStack.push(windowNode);
        }
        if (windowNode && this._closeButtonsInfo[appHash] && this._closeButtonsInfo[appHash][windowUuid]) {
          this.unregisterClosableWindow(windowNode, true);
        }
        this._widgetToNodeWindows.set(windowWidget, windowNode);
        const perAppInfo = this._closeButtonsInfo[appHash] = this._closeButtonsInfo[appHash] || {};
        const closeInfo = perAppInfo[windowUuid] = perAppInfo[windowUuid] || {};

        // Tabbed host with different window (hosted window)
        if (this._tabbedHostInfo && this._tabbedHostInfo.appHash !== appHash) {
          if (opts && opts.chromeBar) {

            opts.chromeBar.setHidden(true);
          }
          closeInfo.closeWidget = cls.WidgetFactory.createWidget("TabbedApplicationClose", {
            appHash: gbc.systemAppId
          });
          closeInfo.closeClickHandler = closeInfo.closeWidget.onClick(windowWidget._emitClose.bind(windowWidget));

          const session = context.SessionService.getCurrent(),
            application = session && session.getApplicationByHash(appHash),
            applicationWidget = application && application.getUI() && application.getUI().getWidget(),
            actionsElement = applicationWidget && applicationWidget._tabbedPage && applicationWidget._tabbedPage.getTitleWidget()
            .getActionsContainerElement();
          this.setClosableWindowActionProcessing(windowWidget, application.isProcessing());
          if (actionsElement) {
            actionsElement.appendChild(closeInfo.closeWidget.getElement());
          }

          // Tabbed host with a window (host window)
        } else if (this._tabbedHostInfo && this._tabbedHostInfo.appHash === appHash) {
          //  if chromebar
          if (opts && opts.chromeBar) {
            closeInfo.closeWidget = opts.chromeBar.getGbcMenuItem("close");
            closeInfo.closeWidget.setLinkedWindow(windowWidget);
          }
        } else {
          // default case
          //  if chromebar
          if (opts && opts.chromeBar) {
            closeInfo.closeWidget = opts.chromeBar.getGbcMenuItem("close");
            if (!closeInfo.closeWidget.isHidden()) {
              closeInfo.closeWidget.setLinkedWindow(windowWidget);
            }
          }
        }
      },

      unregisterClosableWindow: function(windowNode, noHostDelete) {
        const app = windowNode && windowNode.getApplication(),
          appHash = app && app.applicationHash,
          windowWidget = windowNode && windowNode.getWidget(),
          windowUuid = windowWidget && windowWidget.getUniqueIdentifier();
        this._widgetToNodeWindows.delete(windowWidget);
        // Remove window from the stack
        if (this._windowStack.indexOf(windowNode) >= 0) {
          this._windowStack.splice(this._windowStack.indexOf(windowNode), 1);
        }
        const closeInfo = this.getCloseButtonInfo(windowNode);
        if (closeInfo.closeWidget.isInstanceOf(cls.ChromeBarItemCloseWidget)) {
          closeInfo.closeWidget.setLinkedWindow(null); // Should restore old linked window
          if (!noHostDelete && this._tabbedHostInfo && this._tabbedHostInfo.windowId === windowUuid) {
            delete this._tabbedHostInfo;
          }
        } else {
          if (closeInfo && closeInfo.closeWidget && !closeInfo.closeWidget.isDestroyed()) {
            closeInfo.closeWidget.getElement().remove();
            if (closeInfo.closeClickHandler) {
              closeInfo.closeClickHandler();
              closeInfo.closeClickHandler = null;
            }
            closeInfo.closeWidget.destroy();
            closeInfo.closeWidget = null;
            delete this._closeButtonsInfo[appHash][windowUuid];
            if (!Object.keys(this._closeButtonsInfo[appHash]).length) {
              delete this._closeButtonsInfo[appHash];
            }
            if (!noHostDelete && this._tabbedHostInfo && this._tabbedHostInfo.windowId === windowUuid) {
              delete this._tabbedHostInfo;
            }
          }
        }
      },
      setClosableWindowActionActive: function(windowWidget, active, winNode) {
        const windowNode = this._widgetToNodeWindows.get(windowWidget) || winNode;
        const closeInfo = this.getCloseButtonInfo(windowNode);
        if (closeInfo && closeInfo.closeWidget) {
          closeInfo.closeWidget.setActive(active, windowWidget);
        }
      },
      setClosableWindowActionHidden: function(windowWidget, hidden) {
        const windowNode = this._widgetToNodeWindows.get(windowWidget);
        const closeInfo = this.getCloseButtonInfo(windowNode);
        if (closeInfo && closeInfo.closeWidget && windowWidget.isClosable()) {
          closeInfo.closeWidget.setHidden(hidden, windowWidget);
        }
      },
      setClosableWindowActionProcessing: function(windowWidget, processing) {
        const windowNode = this._widgetToNodeWindows.get(windowWidget);
        const closeInfo = this.getCloseButtonInfo(windowNode);
        if (closeInfo && closeInfo.closeWidget && closeInfo.closeWidget._setProcessingStyle) {
          closeInfo.closeWidget._setProcessingStyle(processing);
        }
      },

      /**
       * Handler when the screen orientation changed
       * @param {function} callback - method to call once screen orientation changes
       * @note mobile only
       */
      onOrientationChange: function(callback) {
        return this._eventListener.when("orientationChange.Host", callback.bind(this));
      },

      /**
       * Handler when the screen size changed
       * @param {function} callback - method to call once screen size changes
       */
      onScreenResize: function(callback) {
        return this._eventListener.when("resize.Host", callback.bind(this));
      },

      /**
       * Check if current gbc is running as UR
       * @return {Boolean} - true if native, false otherwise
       */
      isUR: function() {
        return gbc.__wrapper.isNative();
      },

      /**
       *
       * @param {classes.WindowWidget} windowToDisplay
       */
      getPreviousWindowOfStack: function(windowToDisplay) {
        let newIndex = this._windowStack.indexOf(windowToDisplay) - 1;
        newIndex = newIndex >= 0 ? newIndex : 0;
        return this._windowStack[newIndex];
      }
    });
    context.InitService.register(context.HostService);
  });
