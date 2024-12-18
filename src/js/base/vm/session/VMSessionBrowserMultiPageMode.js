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

modulum("VMSessionBrowserMultiPageMode", ["EventListener"],
  function(context, cls) {
    /**
     * A VM driven Session
     * @class VMSessionBrowserMultiPageMode
     * @memberOf classes
     * @extends classes.EventListener
     * @publicdoc Base
     */
    cls.VMSessionBrowserMultiPageMode = context.oo.Class(cls.EventListener, function($super) {
      return /** @lends classes.VMSessionBrowserMultiPageMode.prototype */ {
        __name: "VMSessionBrowserMultiPageMode",
        /**
         * @type {?classes.VMSession}
         */
        _session: null,

        /**
         * @inheritDoc
         * @constructs
         * @param {classes.VMSession} session session
         */
        constructor: function(session) {
          $super.constructor.call(this);
        },

        /**
         * get owning session
         * @returns {?classes.VMSession}
         */
        getSession: function() {
          return this._session;
        },

        /**
         * @override
         */
        destroy: function() {
          this._session = null;
          $super.destroy.call(this);
        }
      };
    });
  });
