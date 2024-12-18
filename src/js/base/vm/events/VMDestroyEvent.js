/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";
modulum('VMDestroyEvent', ['VMEventBase'],
  function(context, cls) {
    /**
     *
     * @class VMDestroyEvent
     * @memberOf classes
     * @extends classes.VMEventBase
     */
    cls.VMDestroyEvent = context.oo.Class({
      base: cls.VMEventBase
    }, function() {
      return /** @lends classes.VMDestroyEvent.prototype */ {
        __name: "VMDestroyEvent",
        type: "destroyEvent",
        /**
         * @type {Object}
         */
        attributes: null,

        /**
         * Will send an event: "{DestroyEvent 0{{status "INTEGER"}{message "STRING"}"}}
         * @param {number} status - status according to the spec:
         *  DecorationDeleted = -4,
         *  MDIContainerExists = -100
         *  MDIContainerDestroyed = -101
         *  MDIContainerNotExists = -102
         *  MDIContainerRenamed = -103
         *  InvalidAUITree = -3
         *  InvalidCompatMode = -5
         *  InvalidUniversalRendering = -7
         *  and win only:
         *  UserObjectCountToHigh = -1000
         * @param {string} message - message to pass to the VM
         */
        constructor: function(status, message) {
          this.attributes = {
            status: status,
            message: message
          };
        }
      };
    });
  });
