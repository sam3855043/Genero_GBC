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

modulum('NoLogProvider', ['LogService', 'LogProviderBase'],
  function(context, cls) {

    const noLog = {};
    const levels = context.LogService.levels;
    for (const item of levels) {
      noLog[item] = Function.noop;
    }
    /**
     * @class NoLogProvider
     * @memberOf classes
     * @extends classes.LogProviderBase
     */
    cls.NoLogProvider = context.oo.Class(cls.LogProviderBase, /** @lends classes.NoLogProvider.prototype */ {
      __name: "NoLogProvider",

      getLogger: function() {
        return noLog;
      }
    });
  });
