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
modulum('UIApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {
    /**
     * @class UIApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.UIApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.UIApplicationService.prototype */ {
        __name: "UIApplicationService",
        /**
         * @type {classes.ApplicationWidget}
         */
        _applicationWidget: null,
        /** @type {?number} */
        _currentWindowIdRef: null,
        constructor: function(app) {
          $super.constructor.call(this, app);
          this._applicationWidget = cls.WidgetFactory.createWidget("Application", {
            appHash: this._application.applicationHash
          });
          this._applicationWidget.setApplicationHash(app.applicationHash);
          this._applicationWidget.onActivate(this._onActivate.bind(this));
          this._application.getSession().addApplicationWidget(app, this._applicationWidget);
          this._applicationWidget.onLayoutRequest(this._onLayoutRequest.bind(this));
        },
        _onActivate: function() {
          this._application.getSession().setCurrentApplication(this._application);
        },
        _onLayoutRequest: function() {
          this._application.scheduler.layoutCommand();
        },
        destroy: function() {
          if (!this._destroyed) {
            this._applicationWidget.destroy();
            this._applicationWidget = null;
            $super.destroy.call(this);
          }
        },
        /**
         *
         * @returns {classes.ApplicationWidget}
         */
        getWidget: function() {
          return this._applicationWidget;
        },
        setRunning: function(running) {
          if (running) {
            this.getWidget().hideWaiter();
          }
        },
        isLayoutable: function() {
          return this.getWidget() && this.getWidget().getElement() && !this.getWidget().getElement().hasClass("gbc_out_of_view");
        },
        setCurrentWindow: function(currentWindowId) {
          if (this._currentWindowIdRef !== currentWindowId) {
            this._currentWindowIdRef = currentWindowId;
            this.syncCurrentWindow();
          }
        },

        syncCurrentWindow: function() {
          let currentWin = null;
          const session = this._application && this._application.getSession(),
            model = this._application && this._application.model,
            UINode = model && model.getNode(0),
            UIController = UINode && UINode.getController(),
            UIWidget = UIController && UIController.getWidget(),
            children = UIWidget && UIWidget.getChildren();

          currentWin = children && this._currentWindowIdRef && (
            children.find(win => win._auiTag === this._currentWindowIdRef) ||
            // If no window has been found, return the traditional window container
            children.find(win => win.hasClass("gbc_TraditionalContainerWindow")) ||
            null);

          if (currentWin) {
            const currentWinNode = model && model.getNode(currentWin._auiTag);
            // before displaying window we display its corresponding application
            session.getWidget().setCurrentWidget(currentWin.getApplicationWidget());
            context.HostService.setDisplayedWindowNode(currentWinNode);

            gbc.HostService.updateDisplay(); // re-align everything in window

            this.emit(context.constants.applicationEvents.startMenuPositionUpdate, currentWin._auiTag);
          }
        }
      };
    });
    cls.ApplicationServiceFactory.register("UI", cls.UIApplicationService);
  });
