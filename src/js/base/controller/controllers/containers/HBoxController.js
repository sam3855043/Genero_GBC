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

modulum('HBoxController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class HBoxController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.HBoxController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.HBoxController.prototype */ {
        __name: "HBoxController",

        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          this._addBehavior(cls.LayoutInfoVMBehavior);
          this._addBehavior(cls.StyleVMBehavior);
          // END WARNING

          // 4st behaviors
          this._addBehavior(cls.Reverse4STBehavior);
          this._addBehavior(cls.Packed4STBehavior);

          // vm behaviors
          this._addBehavior(cls.HiddenVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          this._addBehavior(cls.SplitterVMBehavior);
          this._addBehavior(cls.OrientationVMBehavior);
          this._addBehavior(cls.SplitVMBehavior);
          this._addBehavior(cls.NoSwipeVMBehavior);
          this._addBehavior(cls.NavigationArrows4STBehavior);
          this._addBehavior(cls.NavigationDots4STBehavior);

          // ui behaviors
          this._addBehavior(cls.OnSplitterUIBehavior);
        },

        /**
         * @inheritDoc
         */
        _createWidget: function(type) {
          return cls.WidgetFactory.createWidget(type, {
            appHash: this.getAnchorNode().getApplication().applicationHash,
            appWidget: this.getAnchorNode().getApplication().getUI().getWidget(),
            auiTag: this.getAnchorNode().getId(),
            inTable: this.isInTable(),
            inMatrix: this.isInMatrix(),
            inScrollGrid: this.isInScrollGrid(),
            uiWidget: this.getUINode().getController().getWidget()
          }, this.getAnchorNode());
        },

        /**
         * @inheritDoc
         */
        ensureVisible: function(executeAction) {
          const widget = this.getAnchorNode().getWidget();
          widget.emit(context.constants.widgetEvents.splitViewChange, widget);
          return $super.ensureVisible.call(this, executeAction);
        }
      };
    });
    cls.ControllerFactory.register("HBox", cls.HBoxController);

  });
