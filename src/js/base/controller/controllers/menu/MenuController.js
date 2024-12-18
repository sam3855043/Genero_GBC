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

modulum('MenuController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class MenuController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.MenuController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.MenuController.prototype */ {
        __name: "MenuController",
        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          this._addBehavior(cls.LayoutInfoVMBehavior);
          this._addBehavior(cls.StyleVMBehavior);
          // END WARNING

          // pseudo-selector behaviors
          this._addBehavior(cls.ActivePseudoSelectorBehavior);
          // 4st behaviors
          this._addBehavior(cls.FontStyle4STBehavior);
          this._addBehavior(cls.FontSize4STBehavior);
          this._addBehavior(cls.FontColor4STBehavior);
          this._addBehavior(cls.Border4STBehavior);
          this._addBehavior(cls.Reverse4STBehavior);

          // vm behaviors
          this._addBehavior(cls.ColorVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontWeightVMBehavior);
          this._addBehavior(cls.TextDecorationVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          this._addBehavior(cls.TextActionVMBehavior);
          this._addBehavior(cls.ImageVMBehavior);
          this._addBehavior(cls.TitleVMBehavior);
          this._addBehavior(cls.WindowTypeVMBehavior);
          this._addBehavior(cls.VisibleMenuVMBehavior);
          this._addBehavior(cls.MenuEnabledVMBehavior);

          this._addBehavior(cls.WindowCloseUIBehavior);

          // 4ST styles
          this._addBehavior(cls.ActionPanelButtonTextAlign4STBehavior);
          this._addBehavior(cls.ActionPanelButtonTextHidden4STBehavior);
          this._addBehavior(cls.RingMenuPosition4STBehavior);

        },
        attachUI: function() {
          if (this._widget) {

            const chromeBar = this.isInChromeBar() ? this.getUINode().getWidget().getChromeBarWidget() : false;
            const isDialog = this.getAnchorNode()._vmStyles.indexOf("dialog") >= 0;

            if (chromeBar && !isDialog) {
              chromeBar.addMenu(this._widget);
            } else {
              this.getAnchorNode().getAncestor('Window').getController().getWidget().addMenu(this._widget);
            }

          }
        },

        _createWidget: function(type) {
          const widget = $super._createWidget.call(this, type);
          const ctrl = this.getNodeBindings().parent.getController();
          if (ctrl) {
            widget._windowWidget = ctrl.getWidget();
            return widget;
          } else {
            return null;
          }
        },

        detachUI: function() {
          if (this._widget && this.autoCreateWidget() && this._widget._modalWidget) {
            this._widget._modalWidget.when(context.constants.widgetEvents.close, () => {
              //Restore the window icon
              if (gbc.HostService.getCurrentWindowNode()) {
                gbc.HostService.setDisplayedWindowNode(gbc.HostService.getCurrentWindowNode());
              }
            }, true);
          }
          $super.detachUI.call(this);
        },

      };
    });
    cls.ControllerFactory.register("Menu", cls.MenuController);

  });
