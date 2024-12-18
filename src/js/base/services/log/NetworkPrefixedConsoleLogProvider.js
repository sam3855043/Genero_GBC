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

modulum('NetworkPrefixedConsoleLogProvider', ['LogProviderBase'],
  function(context, cls) {

    /**
     * Console log provider to handle all Network logs
     * @class NetworkPrefixedConsoleLogProvider
     * @memberOf classes
     * @extends classes.LogProviderBase
     */
    cls.NetworkPrefixedConsoleLogProvider = context.oo.Class(cls.LogProviderBase, /** @lends classes.PrefixedConsoleLogProvider.prototype */ {
      __name: "NetworkPrefixedConsoleLogProvider",
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
            console.debug(...args);
          },
          log: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.log(...args);
          },
          info: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.info(...args);
          },
          warn: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.warn(...args);
          },
          error: function() {
            const args = Array.prototype.slice.apply(arguments);
            if (prefixStyle) {
              args.unshift(prefixStyle);
            }
            args.unshift(_prefix);
            console.error(...args);
          },

          record: function() {
            const args = Array.prototype.slice.call(arguments);
            const logStr = args.join(" ");
            const isRequest = logStr.indexOf("HTTP REQUEST") >= 0;
            const isResponse = logStr.indexOf("HTTP RESPONSE") >= 0;

            if (isRequest || isResponse) {
              const entry = this._buildRecordEntry(prefix, args);
              context.LogService.record(entry);
            }
          }.bind(this), // need to bind this to call _buildRecordEntry function
        };
      },

      _buildRecordEntry: function(provider, args) {

        const lineContent = args[1].split(':');
        const uaDetails = lineContent[0].trim();
        const httpMethod = lineContent[1].trim();
        const urlInfo = lineContent[2].trim().match(
          /\/ua\/(\w+)\/([a-f0-9]*)[^?]*\??(?:appId=(\d*)(&pageId=(\d*))?)?/);

        const t = new Date().getTime();
        const appId = urlInfo ? parseInt(urlInfo[3]) : context.LogService.getLastRecord().appId;
        const pageId = urlInfo ? parseInt(urlInfo[5]) : context.LogService.getLastRecord().pageId;
        const uaType = urlInfo ? urlInfo[1] : "unknown";
        const entry = {
          provider: provider.replace(/\s/g, ''),
          t: t,
          httpType: args[0].trim(),
          httpMethod: lineContent && httpMethod,
          uaType: uaType,
          uaDetails: lineContent && uaDetails,
          type: args[1].trim(),
          data: args[2] && ("" + args[2]).trim()
        };

        if (uaType === "sua") {
          entry.appId = appId;
          entry.pageId = pageId;
        }
        return entry;
      },

      /**
       * @inheritDoc
       */
      getLogger: function() {
        return this._logger;
      }
    });
  });
