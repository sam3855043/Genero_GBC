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

modulum('ToolBarController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class ToolBarController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.ToolBarController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.ToolBarController.prototype */ {
        __name: "ToolBarController",
        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          this._addBehavior(cls.LayoutInfoVMBehavior);
          this._addBehavior(cls.StyleVMBehavior);
          // END WARNING

          // 4st behaviors
          this._addBehavior(cls.TextPosition4STBehavior);
          this._addBehavior(cls.Aspect4STBehavior);
          this._addBehavior(cls.Size4STBehavior);
          this._addBehavior(cls.Border4STBehavior);
          this._addBehavior(cls.Reverse4STBehavior);
          this._addBehavior(cls.ToolBarItemsAlignment4STBehavior);
          this._addBehavior(cls.Position4STBehavior);

          // vm behaviors
          if (this.getAnchorNode().getParentNode().getTag() === 'Form') {
            this._addBehavior(cls.FormRelatedHiddenVMBehavior);
          }
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.ButtonTextHiddenVMBehavior);
        },

        /**
         * @inheritDoc
         */
        attachUI: function() {
          let parentNode = this.getAnchorNode().getParentNode();
          while (parentNode) {
            const controller = parentNode.getController();
            if (controller) {
              const widget = controller.getWidget();
              if (widget?.addToolBar) {
                const order = this.getAnchorNode().getParentNode().getTag() === 'Form' ? 1 : 0;

                const chromeBar = this.isInChromeBar() ? this.getUINode().getWidget().getChromeBarWidget() : false;

                // Ensure the form widget is correctly associated to the toolbar
                // This is done here, because when we set the toolbar allocated width, we need the parent form layout info
                // Those info are not available yet since the link between the toolbar and the form doesn't exist
                this.getWidget().setFormWidget(this.getAnchorNode().getParentNode().getWidget());

                if (!chromeBar) {
                  widget.addToolBar(this.getWidget(), order);
                } else {
                  chromeBar.addToolBar(this.getWidget(), order);
                }

                break;
              }
            }
            parentNode = parentNode.getParentNode();
          }
        },

        detachUI: function() {
          const winNode = this.getAnchorNode().getAncestor('Window');
          const uiNode = this.getAnchorNode().getAncestor('UserInterface');
          if (winNode) {
            const winWidget = winNode.getController().getWidget();
            winWidget.removeToolBar(this.getWidget());
          } else {
            const uiWidget = uiNode.getController().getWidget();
            uiWidget.removeToolBar(this.getWidget());
          }

          $super.detachUI.call(this);
        },

        destroy: function() {
          if (this._afterLayoutHandler) {
            this._afterLayoutHandler();
          }
          $super.destroy.call(this);
        }

      };
    });
    cls.ControllerFactory.register("ToolBar", cls.ToolBarController);
  });
