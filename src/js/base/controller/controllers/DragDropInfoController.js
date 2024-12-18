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

modulum('DragDropInfoController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class DragDropInfoController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.DragDropInfoController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.DragDropInfoController.prototype */ {
        __name: "DragDropInfoController",

        /**
         * @param {ControllerBindings} bindings
         */
        constructor: function(bindings) {
          $super.constructor.call(this, bindings);

          const anchor = this.getNodeBindings().anchor;
          // vm behaviors
          this._addBehavior(cls.DndAcceptedVMBehavior);

          context.DndService.setDragDropInfoNode(anchor);
          context.DndService.setDndAccepted(false);
        },

        /**
         * @inheritdoc
         */
        destroy: function() {
          $super.destroy.call(this);

          context.DndService.setDragDropInfoNode(null);
          context.DndService.setDndAccepted(false);
        },

        /**
         * DragDropInfo don't create widgets
         */
        createWidget: function() {
          return null;
        }
      };
    });
    cls.ControllerFactory.register("DragDropInfo", cls.DragDropInfoController);
  });
