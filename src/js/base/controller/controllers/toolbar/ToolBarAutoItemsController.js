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

modulum('ToolBarAutoItemsController', ['ControllerPlaceholderBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class ToolBarAutoItemsController
     * @memberOf classes
     * @extends classes.ControllerPlaceholderBase
     */
    cls.ToolBarAutoItemsController = context.oo.Class(cls.ControllerPlaceholderBase, function($super) {
      return /** @lends classes.ToolBarAutoItemsController.prototype */ {
        __name: "ToolBarAutoItemsController",

        /**
         * MenuController creation handler
         */
        _controllerCreationHandlerMenu: null,
        /**
         * ActionController creation handler
         */
        _controllerCreationHandlerAction: null,

        /**
         * Application creation handler
         */
        _applicationAddHandler: null,
        /**
         * Application remove handler
         */
        _applicationRemoveHandler: null,

        /**
         * Window creation handler
         */
        _windowAddHandler: null,
        /**
         * Window remove handler
         */
        _windowRemoveHandler: null,
        /**
         * This placeholder contains application
         * @type {?boolean}
         */
        _isPrograms: null,
        /**
         * This placeholder contains windows
         * @type {?boolean}
         */
        _isWindows: null,
        /**
         * This placeholder contains actions
         * @type {?boolean}
         */
        _isActions: null,

        constructor: function(bindings) {
          $super.constructor.call(this, bindings);
          this._isPrograms = false;
          this._isWindows = false;
          this._isActions = false;

          if (bindings.anchor.attribute("content") === 'actions') {
            this._isActions = true;
            this._controllerCreationHandlerMenu = cls.ControllerFactory.onControllerCreated("MenuAction",
              (event, realWidgetController) => {
                if (!this.isInChromeBar() && realWidgetController.getWidget().getApplicationIdentifier() === this.getWidget()
                  .getApplicationIdentifier()) {
                  realWidgetController.createVirtualWidget(this, this.isInChromeBar() ? "ChromeBarItem" : "ToolBarItem");
                }
              });
            this._controllerCreationHandlerAction = cls.ControllerFactory.onControllerCreated("Action",
              (event, realWidgetController) => {
                if (!this.isInChromeBar() && realWidgetController.getWidget().getApplicationIdentifier() === this.getWidget()
                  .getApplicationIdentifier()) {
                  realWidgetController.createVirtualWidget(this, this.isInChromeBar() ? "ChromeBarItem" : "ToolBarItem");
                }
              });
          } else if (bindings.anchor.attribute("content") === 'programs') {
            this._registerProgramsHandlers();
          } else if (bindings.anchor.attribute("content") === 'windows') {
            this._registerWindowsHandlers();
          }
        },

        /**
         * Register application handlers
         * @private
         */
        _registerProgramsHandlers: function() {
          if (this.isInChromeBar()) {
            return;
          }

          this._isPrograms = true;
          let navigationManager = context.SessionService.getCurrent().getNavigationManager();
          this._applicationAddHandler = navigationManager.when(context.constants.VMSessionNavigationManagerEvents
            .addSessionSidebarApplicationStackItem,
            (event) => {
              let applicationWidget = event.data[1];

              this.getWidget().setPositionInParent(this.getAnchorNode().getVirtualIndex());
              let virtualWidget = this._addApplication(applicationWidget);
              if (virtualWidget) {
                this.getWidget().applyCommonStyleToWidget(virtualWidget);
              }
            });

          this._applicationRemoveHandler = navigationManager.when(context.constants.VMSessionNavigationManagerEvents
            .removeSessionSidebarApplicationStackItem,
            (event) => {
              let applicationWidget = event.data[1];
              let virtualWidget = this.getWidget().getVirtualWidget(applicationWidget);

              if (virtualWidget) {
                let layoutEngine = this.getWidget().getLayoutEngine();
                layoutEngine.invalidateMeasure();
                layoutEngine.forceMeasurement();

                layoutEngine = this.getWidget().getParentWidget().getLayoutEngine();
                layoutEngine.invalidateMeasure();
                layoutEngine.forceMeasurement();

                virtualWidget.getAUIWidget().removeVirtualChildWidget(virtualWidget);
                virtualWidget.destroy();
              }
            });
        },

        /**
         * Register window handlers
         * @private
         */
        _registerWindowsHandlers: function() {
          if (this.isInChromeBar()) {
            return;
          }

          this._isWindows = true;
          let navigationManager = context.SessionService.getCurrent().getNavigationManager();

          this._windowAddHandler = navigationManager.when(context.constants.VMSessionNavigationManagerEvents.addSessionSidebarWindowItem,
            (event) => {
              //We can add element only if we are already attached
              if (this.getWidget() && this.getWidget().getParentWidget()) {
                let windowWidget = event.data[1];
                let application = event.data[0];

                this.getWidget().setPositionInParent(this.getAnchorNode().getVirtualIndex());
                let virtualWidget = this._addWindow(application, windowWidget);
                if (virtualWidget) {
                  this.getWidget().applyCommonStyleToWidget(virtualWidget);
                }
              }
            });

          this._windowRemoveHandler = navigationManager.when(context.constants.VMSessionNavigationManagerEvents
            .removeSessionSidebarWindowItem,
            (event) => {
              let windowWidget = event.data[1];
              let virtualWidget = this.getWidget().getVirtualWidget(windowWidget);

              if (virtualWidget) {
                let layoutEngine = this.getWidget().getLayoutEngine();
                layoutEngine.invalidateMeasure();
                layoutEngine.forceMeasurement();

                layoutEngine = this.getWidget().getParentWidget().getLayoutEngine();
                layoutEngine.invalidateMeasure();
                layoutEngine.forceMeasurement();

                virtualWidget.getAUIWidget().removeVirtualChildWidget(virtualWidget);
                virtualWidget.destroy();
              }
            });
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);

          if (this._controllerCreationHandlerMenu) {
            this._controllerCreationHandlerMenu();
            this._controllerCreationHandlerMenu = null;
          }
          if (this._controllerCreationHandlerAction) {
            this._controllerCreationHandlerAction();
            this._controllerCreationHandlerAction = null;
          }
          if (this._applicationAddHandler) {
            this._applicationAddHandler();
            this._applicationAddHandler = null;
          }
          if (this._applicationRemoveHandler) {
            this._applicationRemoveHandler();
            this._applicationRemoveHandler = null;
          }
          if (this._windowAddHandler) {
            this._windowAddHandler();
            this._windowAddHandler = null;
          }
          if (this._windowRemoveHandler) {
            this._windowRemoveHandler();
            this._windowRemoveHandler = null;
          }
        },

        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          this._addBehavior(cls.LayoutInfoVMBehavior);
          this._addBehavior(cls.StyleVMBehavior);
          // END WARNING

          // 4st behaviors
          this._addBehavior(cls.FontStyle4STBehavior, true);
          this._addBehavior(cls.FontSize4STBehavior, true);
          this._addBehavior(cls.FontColor4STBehavior, true);
          this._addBehavior(cls.Border4STBehavior, true);
          this._addBehavior(cls.Reverse4STBehavior, true);

          this._addBehavior(cls.ScaleIcon4STBehavior, true, true);
          this._addBehavior(cls.DefaultTTFColor4STBehavior);

          // vm behaviors
          this._addBehavior(cls.EnabledButtonVMBehavior);
          this._addBehavior(cls.HiddenVMBehavior);
          this._addBehavior(cls.ColorVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontWeightVMBehavior);
          this._addBehavior(cls.TextDecorationVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          this._addBehavior(cls.ImageVMBehavior);
          this._addBehavior(cls.TitleVMBehavior);
          this._addBehavior(cls.TextActionVMBehavior);

          // ScaleIcon requires that the image is already present
          this._addBehavior(cls.ScaleIcon4STBehavior, true, true);
        },

        _getWidgetType: function(kind, active) {
          let type;
          const chromeBarTheme = this.isInChromeBar();

          if (chromeBarTheme) {
            type = "ChromeBarPlaceholder";
          } else {
            type = "ToolBarPlaceholder";
          }

          return type;
        },

        /**
         * attach UI
         */
        attachUI: function() {
          $super.attachUI.call(this);

          if (this._isPrograms) {
            //The placeholder is attached now. So we can add the children
            //Application is a parent of the TopMenu, so we need to attach it manually
            let navigationManager = context.SessionService.getCurrent().getNavigationManager();

            navigationManager.getApplicationWidgetList().forEach((applicationWidget) => {
              this._addApplication(applicationWidget);
            });
          } else if (this._isWindows) {
            //The placeholder is attached now. So we can add the children
            //Window can be a parent of the TopMenu, so we need to attach it manually
            let navigationManager = context.SessionService.getCurrent().getNavigationManager();

            navigationManager.getWindowWidgetList().forEach((windowWidget, windowNode) => {
              this._addWindow(windowNode.getApplication(), windowWidget);
            });
          } else if (this._isActions) {
            //The placeholder is attached now. So we can add the actions
            let uiNode = context.SessionService.getCurrent().getCurrentApplication().uiNode();
            let windowNode = uiNode.getFirstChildWithId(uiNode.attribute("currentWindow"));

            if (windowNode && !this.isInChromeBar()) {
              this._addActions(windowNode, "MenuAction");
              this._addActions(windowNode, "Action");
            }
          }
        },

        /**
         * detach UI
         */
        detachUI: function() {
          if (this._isPrograms || this._isWindows) {
            this.getWidget().destroyAllChildren();
          }

          $super.detachUI.call(this);
        },

        /**
         * Add an application in the placeholder
         * @param {classes.SessionSidebarApplicationStackItemWidget} applicationWidget
         * @return {null|classes.WidgetBase}
         * @private
         */
        _addApplication: function(applicationWidget) {
          let placeHolderWidget = this.getWidget();
          let controller = new cls.ToolBarDummyController();
          controller.setWidget(applicationWidget);

          let virtualWidget = controller.createVirtualWidget(this, this.isInChromeBar() ? "ChromeBarItem" : "ToolBarItem");

          virtualWidget.setText(applicationWidget.getTitle());
          if (applicationWidget.getIcon()) {
            virtualWidget.setImage(applicationWidget.getIcon());
          }
          placeHolderWidget.appendVirtualChildWidget(0, virtualWidget);
          applicationWidget.addVirtualChildWidget(virtualWidget);
          controller.destroy();

          return virtualWidget;
        },

        /**
         * Add a window in the placeholder
         * @param {classes.VMApplication} application
         * @param {classes.SessionSidebarWindowItemWidget} windowWidget
         * @return {null|classes.WindowWidget}
         * @private
         */
        _addWindow: function(application, windowWidget) {
          let navigationManager = application.getSession().getNavigationManager();

          if (navigationManager.getRootWaitingApplication(application).getProcId() !==
            navigationManager.getRootWaitingApplication(this.getAnchorNode().getApplication()).getProcId()) {
            return null;
          }

          let placeHolderWidget = this.getWidget();
          let controller = new cls.TopMenuDummyController();
          controller.setWidget(windowWidget);

          let virtualWidget = controller.createVirtualWidget(this, this.isInChromeBar() ? "ChromeBarItem" : "ToolBarItem");

          //If virtualWidget is null so it already exist
          if (virtualWidget) {
            if (windowWidget.getWindowName()) {
              virtualWidget.setText(windowWidget.getWindowName());
            }
            if (windowWidget.getWindowIcon()) {
              virtualWidget.setImage(windowWidget.getWindowIcon());
            }

            placeHolderWidget.appendVirtualChildWidget(0, virtualWidget);
            windowWidget.addVirtualChildWidget(virtualWidget);
          }

          controller.destroy();

          return virtualWidget;
        },

        /**
         * Add MenusActions in the placeholder
         * @param {classes.WindowNode} windowNode
         * @param {string} tagName
         * @return {null|classes.WindowWidget}
         * @private
         */
        _addActions: function(windowNode, tagName) {
          windowNode.getDescendants(tagName).forEach((menuAction) => {
            let realWidgetController = menuAction.getController();
            if (!realWidgetController) {
              return;
            }

            let parentController = menuAction.getParentNode().getController();
            let parentId = menuAction.getParentNode().getId();
            let position = menuAction.getIndex();
            let virtualWidget = realWidgetController.createVirtualWidget(this, this.isInChromeBar() ? "ChromeBarItem" : "ToolBarItem");

            if (virtualWidget) {
              let placeholderWidget = this.getWidget();

              placeholderWidget.setPositionInParent(this.getAnchorNode().getVirtualIndex());
              placeholderWidget.addVirtualChildWidget(parentId, virtualWidget, position);
              parentController._addPlaceholderController(this);
            }
          });
        },
      };
    });
    cls.ControllerFactory.register("ToolBarAutoItems", cls.ToolBarAutoItemsController);

  });
