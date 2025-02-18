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
modulum('VMDragDropEvent', ['VMEventBase'],
  function(context, cls) {
    /**
     *
     * @class VMDragDropEvent
     * @memberOf classes
     * @extends classes.VMEventBase
     */
    cls.VMDragDropEvent = context.oo.Class({
      base: cls.VMEventBase
    }, function() {
      return /** @lends classes.VMDragDropEvent.prototype */ {
        __name: "VMDragDropEvent",
        type: "dragDropEvent",
        /**
         * @type {Object}
         */
        attributes: null,

        /**
         * @param {string} idRef
         * @param {object} attr
         */
        constructor: function(idRef, attr) {
          this.attributes = {
            idRef: idRef
          };
          const keys = Object.keys(attr);
          for (const element of keys) {
            this.attributes[element] = attr[element];
          }

        }
      };
    });
  });
