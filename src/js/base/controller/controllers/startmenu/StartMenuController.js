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

modulum('StartMenuController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class StartMenuController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.StartMenuController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.StartMenuController.prototype */ {
        __name: "StartMenuController",

        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          this._addBehavior(cls.LayoutInfoVMBehavior);
          // END WARNING
          this._addBehavior(cls.TextVMBehavior);

          // 4st behaviors
          this._addBehavior(cls.Border4STBehavior);
          this._addBehavior(cls.Reverse4STBehavior);

          // vm behaviors
          this._addBehavior(cls.BackgroundColorVMBehavior);
        },

        _getWidgetType: function(kind) {
          let type;
          if (!kind) {
            const windowNode = this.getAnchorNode().getApplication().getVMWindow();
            if (windowNode) {
              kind = windowNode.getStyleAttribute("startMenuPosition");
            }
          }
          switch (kind) {
            case "poptree":
              // poptree isn't implemented, using tree instead
              /* falls through */
            case "tree":
              type = 'StartMenu';
              break;
            case "menu":
              type = 'TopMenu';
              break;
          }
          return type;
        },

        attachUI: function() {
          const session = this.getAnchorNode().getApplication().getSession();
          const uiWidget = this.getAnchorNode().getAncestor('UserInterface').getController().getWidget();
          // _widgetKind is probably obsolete but is kept as a security
          if (this._widgetType === "StartMenu" || this._widgetKind === "poptree" || this._widgetKind === "tree") {
            session.manageStartMenu(this.getAnchorNode(), this.getWidget());
          } else if (this._widgetType === "TopMenu" || this._widgetKind === "menu") {
            this.getWidget().setIsStartMenu(true);
            uiWidget.addTopMenu(this.getWidget(), 0, uiWidget);
          }
        },

        _detachWidgetRecursive: function(node) {
          const children = node.getChildren();
          for (const element of children) {
            this._detachWidgetRecursive(element);
          }
          node.getController()._detachWidget();
        },

        _attachWidgetRecursive: function(node) {
          node.getController()._attachWidget();
          const children = node.getChildren();
          for (const element of children) {
            this._attachWidgetRecursive(element);
          }
        },

        _createWidgetRecursive: function(node, kind) {
          const currentController = node.getController();
          const type = currentController._getWidgetType(kind);
          currentController._widget = currentController._createWidget(type === "TopMenu" ? "StartMenuTopMenu" : type);
          const children = node.getChildren();
          for (const element of children) {
            this._createWidgetRecursive(element, kind);
          }
        },

        _detachUIRecursive: function(node) {
          const children = node.getChildren();
          for (const element of children) {
            this._detachUIRecursive(element);
          }
          node.getController().detachUI();
        },

        _attachUIRecursive: function(node) {
          node.getController().attachUI();
          const children = node.getChildren();
          for (const element of children) {
            this._attachUIRecursive(element);
          }
        },

        changeWidgetKind: function(kind) {
          if (kind !== this._widgetKind) {
            this._widgetKind = kind;
            this._widgetType = this._getWidgetType(kind);
            const anchor = this.getAnchorNode();
            this._detachWidgetRecursive(anchor);
            this._detachUIRecursive(anchor);
            if (this._widgetKind !== "none") {
              this._createWidgetRecursive(anchor, kind);
              this._attachUIRecursive(anchor);
              this._attachWidgetRecursive(anchor);
            }
            anchor.applyBehaviors(null, true, true);
            return true;
          }
          return false;
        }
      };
    });
    cls.ControllerFactory.register("StartMenu", cls.StartMenuController);

  });
