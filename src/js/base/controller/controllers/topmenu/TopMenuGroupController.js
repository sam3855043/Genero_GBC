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

modulum('TopMenuGroupController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class TopMenuGroupController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.TopMenuGroupController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.TopMenuGroupController.prototype */ {
        __name: "TopMenuGroupController",
        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          this._addBehavior(cls.LayoutInfoVMBehavior);
          this._addBehavior(cls.StyleVMBehavior);
          // END WARNING

          // 4st behaviors
          this._addBehavior(cls.FontStyle4STBehavior);
          this._addBehavior(cls.FontSize4STBehavior);
          this._addBehavior(cls.FontColor4STBehavior);
          this._addBehavior(cls.Border4STBehavior);
          this._addBehavior(cls.Reverse4STBehavior);

          // vm behaviors
          this._addBehavior(cls.HiddenVMBehavior);
          this._addBehavior(cls.ColorVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontWeightVMBehavior);
          this._addBehavior(cls.TextDecorationVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          this._addBehavior(cls.ImageVMBehavior);
          this._addBehavior(cls.TextActionVMBehavior);
        },
        attachUI: function() {
          // get widget, assign its parent
          let topmenuWidget = this.getAnchorNode().getAncestor("TopMenu").getWidget();
          let groupWidget = this.getAnchorNode().getWidget();
          groupWidget.setTopMenuWidget(topmenuWidget);
          $super.attachUI.call(this);
        }
      };
    });
    cls.ControllerFactory.register("TopMenuGroup", cls.TopMenuGroupController);

  });
