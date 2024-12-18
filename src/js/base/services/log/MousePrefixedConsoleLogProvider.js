/// FOURJS_START_COPYRIGHT(D,2019)
/// Property of Four Js*
/// (c) Copyright Four Js 2019, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('MousePrefixedConsoleLogProvider', ['LogProviderBase'],
  function(context, cls) {

    /**
     * Console log provider to handle all mouse logs
     * @class MousePrefixedConsoleLogProvider
     * @memberOf classes
     * @extends classes.LogProviderBase
     */
    cls.MousePrefixedConsoleLogProvider = context.oo.Class(cls.LogProviderBase, /** @lends classes.PrefixedConsoleLogProvider.prototype */ {
      __name: "MousePrefixedConsoleLogProvider",
      _logger: null,

      /**
       * @inheritDoc
       */
      constructor: function(prefix, prefixStyle) {
        const _prefix = (prefixStyle ? "%c" : "") + prefix;
        this._logger = {
          debug: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.debug.apply(console, args);
          },
          log: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.log.apply(console, args);
          },
          info: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.info.apply(console, args);
          },
          warn: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.warn.apply(console, args);
          },
          error: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.error.apply(console, args);
          },
          record: function() {
            const args = Array.prototype.slice.call(arguments);
            const logStr = args[0];
            const mouse = logStr.match(/(onClick|onRightClick)/);
            const t = new Date().getTime();

            if (mouse) {
              const evt = args[1];
              const closestNode = args[1].target.closest("gbc_WidgetBase");
              const itemId = args[1].target.id || closestNode ? closestNode.getAttribute("data-aui-name") : null;
              const auiId = closestNode ? closestNode.getAttribute("data-aui-id") : null;

              const entry = {
                provider: prefix.replace(/\s/g, ''),
                t: t,
                itemId: itemId,
                itemElement: args[1].target.outerHTML,
                auiId: auiId,
                clientX: evt.clientX,
                clientY: evt.clientY,
                rightClick: mouse[1] === "onRightClick",
              };

              context.LogService.record(entry);
            }
          },
        };
      },

      /**
       * @inheritDoc
       */
      getLogger: function() {
        return this._logger;
      }
    });
  });
