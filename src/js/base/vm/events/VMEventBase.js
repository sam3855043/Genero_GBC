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
modulum('VMEventBase',
  function(context, cls) {
    /**
     * Base class of vm events
     * @class VMEventBase
     * @memberOf classes
     */
    cls.VMEventBase = context.oo.Class(function() {
      return /** @lends classes.VMEventBase.prototype */ {
        __name: "VMEventBase",
        directFire: false
      };
    });
  });
