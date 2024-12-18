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

modulum('EventVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Event VM command.
     * This class sends an event to the VM.
     * @class EventVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.EventVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.EventVMCommand.prototype */ {
        __name: "EventVMCommand",

        /** @type {classes.VMEventBase} */
        _event: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.VMEventBase} event to execute
         * @param {classes.NodeBase} [node] optional used only to check integrity of event
         */
        constructor: function(app, event, node) {
          $super.constructor.call(this, app, node);
          this._event = event;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          if (this._event) {
            this._vmEvents = [this._event];
          }
          return this._vmEvents && this._vmEvents.length > 0;
        },

        /**
         * @inheritDoc
         */
        needsVmSync: function() {
          return this._needsVmSync || (this._event instanceof cls.VMActionEvent || this._event instanceof cls.VMKeyEvent || this
            ._event instanceof cls
            .VMFunctionCallEvent);
        },

      };
    });
  }
);
