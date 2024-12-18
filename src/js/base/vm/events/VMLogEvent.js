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
modulum('VMLogEvent', ['VMEventBase'],
  function(context, cls) {
    /**
     * Insert a marker in GUI Log
     * @class VMLogEvent
     * @memberOf classes
     * @extends classes.VMEventBase
     */
    cls.VMLogEvent = context.oo.Class({
      base: cls.VMEventBase
    }, function() {
      return /** @lends classes.VMLogEvent.prototype */ {
        __name: "VMLogEvent",
        type: "logEvent",
        /**
         * @type {Object}
         */
        attributes: null,

        /**
         * @param {String} data - text data to pass
         */
        constructor: function(data) {
          this.attributes = {
            data: data
          };
        }
      };
    });
  });
