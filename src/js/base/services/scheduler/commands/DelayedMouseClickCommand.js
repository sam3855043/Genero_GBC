/// FOURJS_START_COPYRIGHT(D,2022)
/// Property of Four Js*
/// (c) Copyright Four Js 2022, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('DelayedMouseClickCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Delayed mouse click command.
     * @class DelayedMouseClickCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.DelayedMouseClickCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.DelayedMouseClickCommand.prototype */ {
        __name: "DelayedMouseClickCommand",

        /** @type Object */
        _mouseEvent: null,
        /** @type classes.WidgetBase */
        _widget: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.WidgetBase} widget - widget where we must replay the event
         * @param {Object} mouseEvent mouse js event
         */
        constructor: function(app, widget, mouseEvent) {
          $super.constructor.call(this, app, null);
          this._widget = widget;
          this._mouseEvent = mouseEvent;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          let processed = false;
          if (this._widget) {
            if (this._widget.isDestroyed() === false) {
              context.MouseService._onClick(this._mouseEvent, this._widget.getElement(), true);
              processed = true;
            } else {
              context.LogService.scheduler.log("Widget destroyed : delayed click not executed.", this._widget);
              processed = false;
            }
          }

          return processed;
        },

        /**
         * @inheritDoc
         */
        checkIntegrity: function() {
          return true;
        }
      };
    });
  }
);
