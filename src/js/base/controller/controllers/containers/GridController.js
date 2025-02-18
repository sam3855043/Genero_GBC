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

modulum('GridController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class GridController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.GridController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.GridController.prototype */ {
        __name: "GridController",
        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          this._addBehavior(cls.LayoutInfoVMBehavior);
          this._addBehavior(cls.StyleVMBehavior);
          // END WARNING

          // 4st behaviors
          this._addBehavior(cls.Reverse4STBehavior);

          // vm behaviors
          this._addBehavior(cls.HiddenVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          // ui behaviors

          this._addBehavior(cls.GridAutomaticStack4STBehavior);
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
    cls.ControllerFactory.register("Grid", cls.GridController);

  });
