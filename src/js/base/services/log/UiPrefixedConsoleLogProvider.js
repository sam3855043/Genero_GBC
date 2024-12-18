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

modulum('UiPrefixedConsoleLogProvider', ['LogProviderBase'],
  function(context, cls) {

    /**
     * Console log provider to handle all UI logs
     * @class UiPrefixedConsoleLogProvider
     * @memberOf classes
     * @extends classes.LogProviderBase
     */
    cls.UiPrefixedConsoleLogProvider = context.oo.Class(cls.LogProviderBase, /** @lends classes.PrefixedConsoleLogProvider.prototype */ {
      __name: "UiPrefixedConsoleLogProvider",
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
            const t = new Date().getTime();
            const name = args[2];
            const type = logStr.match(/\w*/);

            const data = {};
            if (args[3]) {
              if (name === "ContextMenuWidget") {
                data.x = args[3].x;
                data.auiTag = args[3]._auiTag;
                data.parentName = args[3].getParentWidget().__name;
              }
              if (name === "ImageWidget") {
                const imgWidget = args[3];
                data.size = imgWidget.getLayoutInformation().getMeasured();
                data.auiTag = imgWidget._auiTag;

                const qs = context.UrlService.currentUrl().getQueryStringObject();
                const useRealImage = Boolean(qs.withRealImages); // QueryString  &withRealImages=1  will enable this

                context.LogService.addImage(imgWidget, !useRealImage); // add image for easy mapping
              }
            }

            const entry = {
              provider: prefix.replace(/\s/g, ''), // Change [UI      ] to [UI]
              t: t,
              type: type[0].toLowerCase(),
              status: args[1],
              name: name,
              data: data
            };

            context.LogService.record(entry);
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
