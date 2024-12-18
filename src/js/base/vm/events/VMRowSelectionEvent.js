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
modulum('VMRowSelectionEvent', ['VMEventBase'],
  function(context, cls) {
    /**
     *
     * @class VMRowSelectionEvent
     * @memberOf classes
     * @extends classes.VMEventBase
     */
    cls.VMRowSelectionEvent = context.oo.Class({
      base: cls.VMEventBase
    }, function() {
      return /** @lends classes.VMRowSelectionEvent.prototype */ {
        __name: "VMRowSelectionEvent",
        type: "rowSelectionEvent",
        /**
         * @type {Object}
         */
        attributes: null,
        /**
         * @param {string} idRef reference of the table
         * @param {object} attr row update information
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
