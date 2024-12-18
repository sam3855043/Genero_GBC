/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

/*
 see tools/doc/internaldoc/UR/implement.md for documentation
 bootstrapper for gbc environment
 will let embedding platforms do their job
 */

(function(context) {
  let runReady = function(data) {
    if (context.gbcWrapper._readyData.isLogReplay) {
      let procId = (context.gbcWrapper.protocolVersion && context.gbcWrapper.protocolVersion >= 2) ?
        context.gbc.classes.AuiProtocolReader.translate(data.meta)[0].attributes.procId : "0";
      var app = context.gbc.LogPlayerService.getApplication(0, null, procId);
      let receiveHook = context.gbcWrapper.on(context.gbcWrapper.events.RECEIVE, function(event, src, data) {
        let whenManaged = function() {
          if (app.ending || app.ended) {
            context.gbcWrapper.logProcessed(context.gbcWrapper.param(null, app));
          } else {
            app.layout.afterLayout(function() {
              context.gbcWrapper.logProcessed(context.gbcWrapper.param(null, app));
            }, true);
          }
        };
        if (app && !app.ending && !app.ended) {
          if (context.gbcWrapper.protocolVersion && context.gbcWrapper.protocolVersion >= 2) {
            if (data.procId === app.info().procId) {
              gbc.LogService.networkProtocol.log(`⇓ LOG-RCV order`, data.content);
              app.dvm.manageAuiOrders(data.content, whenManaged);
            }
          } else {
            app.dvm.manageAuiOrders(data, whenManaged);
          }
        }
      });
      app.getSession().onApplicationRemoved((event, src, application) => {
        if (application === app && receiveHook) {
          receiveHook();
        }
      }, true);
      context.gbcWrapper.URReady(context.gbcWrapper.param({
        UCName: "GBC",
        UCVersion: gbc.version,
        mobileUI: gbc.ThemeService.getValue("aui-mobileUI-default") ? 1 : 0,
        media: gbc.ThemeService.getMediaString(),
        theme: gbc.ThemeService.getCurrentTheme()
      }, {
        procId: procId
      }));
    } else {
      context.gbc.SessionService.startDirect(context.gbcWrapper, data);
    }
  };

  var readyCallbacks = [],
    /**
     *
     * @param event
     * @param src
     * @param data
     */
    doReadyCallbacks = function(event, src, data) {
      if (!context.gbcWrapper.ready) {
        if (!context.gbcWrapper._readyData) {
          context.gbcWrapper._readyData = data;
        }
        context.gbcWrapper.ready = true;
        var i = 0,
          len = readyCallbacks.length;
        for (; i < len; i++) {
          readyCallbacks[i]();
        }
        readyCallbacks = [];
      } else {
        runReady(data);
      }
    };
  /**
   * @namespace window.gbcWrapper
   */
  context.gbcWrapper = {
    events: {
      /**
       * Event ready
       * Fired once when platform declares its low level bindings are ready
       */
      READY: "ready",
      /**
       * Event close
       * Fired when platform's close button is clicked
       */
      CLOSE: "close",
      /**
       * Event end
       * Fired when an application ends
       */
      END: "end",
      /**
       * Event receive
       * Fired when data are received
       */
      RECEIVE: "receive",
      /**
       * Event nativeAction
       * Fired when native sends an action to be managed by UR (e.g. pushNotification, cordovaCallback
       */
      NATIVEACTION: "nativeAction",
      /**
       * Event destroyEvent
       * Fired when native sends a destroyEvent to be managed by UR
       */
      DESTROYEVENT: "destroyEvent",
      /**
       * Event debugNode
       * Fired when debugNode is selected in the debugger
       */
      DEBUGNODE: "debugNode",
      /**
       * Event servicesReady
       * Fired when all the services are initialized
       */
      SERVICESREADY: "servicesready",
      /**
       * Event gbcCall
       * Fired when UR wants to send info to GBC
       */
      GBCCALL: "gbcCall"
    },
    /**
     * true when all platform bindings are ready to use
     */
    ready: false,

    /**
     * @typedef {Object} ReadyData
     * @property {Object<string, *>} [headers]
     * @property {string} [meta]
     * @property {boolean} [debugMode]
     * @property {boolean} [isLogReplay]
     * @property {Number} [logLevel]
     * @property {string} nativeResourcePrefix
     * @property {Object<string, string|Array<string>>} [forcedURfrontcalls]
     */

    /**
     * application start data
     * @type {?ReadyData}
     */
    _readyData: null,

    /**
     * @typedef {Object<string, string|Array<string>>} ForcedURFrontCalls
     */

    /**
     * list of frontcalls per module forced to be called at browser side
     * @type {Object<string, string|Array<string>>}
     */
    _forcedURfrontcalls: {
      "webcomponent": "*",
      "wci": ["childcount", "childinstances"],
      "qa": ["startqa", "removestoredsettings", "getattribute"]
    },

    /**
     * platform type
     * can be "browser" or "native"
     */
    platformType: context.gbcWrapperInfo.platformType || "browser",
    /**
     * platform name
     * can be "browser", "GDC", "GMA", "GMI"
     */
    platformName: context.gbcWrapperInfo.platformName || "browser",
    /**
     * protocol type
     * can be "ua" or "direct"
     */
    protocolType: context.gbcWrapperInfo.protocolType || "ua",
    /**
     * protocol version
     */
    protocolVersion: context.gbcWrapperInfo.protocolVersion,

    /**
     * inform the platform that Universal Renderer is fully initialized and wait for data
     * param {Object<string, *>} options additional information for the protocol
     */
    URReady: function(attr) {},

    /**
     * send data through the platform
     * @param {string} data stringified aui order
     * @param {Object<string, *>} options additional information for the protocol
     *   e.g. in no user activity actions, options will be set to {userActivity: "no"}
     */
    send: function(data, options) {},

    /**
     * inform the platform about a childstart
     */
    childStart: function() {},

    /**
     * send interrupt signal through the platform
     */
    interrupt: function() {},

    /**
     * send close signal through the platform
     */
    close: function() {},

    /**.
     * @callback frontcallCallback
     * @param {{status:number, result:string, errorMessage:string}} result
     */

    /**
     * call the platform's frontcall
     * @param {number} nodeId
     * @param {frontcallCallback} callback
     */
    frontcall: function(nodeId, callback) {},

    /**
     * Show the native aui debugger
     * @param {Number} data the node id or -1
     */
    showDebugger: function(data) {},

    /**
     * Call a named native function
     * @param {{name:string, args:Array}} data native call info
     *
     * Possible call data are:
     *
     * > `{name:"windowTitle",args: [<document.title>]}`
     * > will update the document title to the native
     *
     * > `{name:"error",args: [<error message>]}`
     * > will send error messages to the native
     *
     * > `{name:"noBackAction"}`
     * > will inform the native there is no back resolved action (after a 'nativeAction' 'back')
     *
     * @return {Boolean} true if nativeCall executed correctly, false otherwise (false on web wrapper as not native)
     */
    nativeCall: function(data) {
      return false;
    },

    /**
     * Inform the native platform that a log was processed
     * Fired in UR log player mode when a log order is fully processed
     */
    logProcessed: function() {},

    /**
     * fires event in gbcWrapper
     * @param {string} eventType the event type
     * @param {*} [data] any data to fire with
     * DO NOT IMPLEMENT
     */
    emit: function(eventType, data) {},

    /**
     * gbcWrapper initializer
     * GBC internal
     * DO NOT IMPLEMENT
     * @private
     */
    __init: function() {
      console.log(
        "GBC", context.gbc.version + "-" + context.gbc.build,
        "- Platform:", context.gbcWrapper.platformName,
        "- Protocol:", context.gbcWrapper.protocolType,
        "- Protocol Version:", context.gbcWrapper.protocolVersion);
      context.gbcWrapper.on = function(eventType, eventHandler) {
        if (eventType === context.gbcWrapper.events.READY) {
          if (eventHandler instanceof Function) {
            if (this.ready) {
              eventHandler();
            } else {
              if (this._eventListener) {
                this._eventListener.when(eventType, eventHandler, true);
              } else {
                readyCallbacks.push(eventHandler);
              }
            }
            return;
          } else {
            throw new Error("gbcWrapper: onReady callback is not a function");
          }
        }
        if (this._eventListener) {
          return this._eventListener.when(eventType, eventHandler);
        }
      };
      if (context.gbcWrapper.protocolType === "direct") {
        context.__gbcDefer = function(start) {
          start();
        };
      }
    },

    /**
     * gbcWrapper prepare wrapper before real start
     * GBC internal
     * DO NOT IMPLEMENT
     * @private
     */
    __prepare: function() {
      var listener = context.gbcWrapper._eventListener =
        new context.gbc.classes.EventListener();
      context.gbcWrapper.emit = function(eventType, data) {
        this._eventListener.emit(eventType, data);
      };
      listener.when(context.gbcWrapper.events.READY, doReadyCallbacks);
      if (context.gbcWrapper.isBrowser()) {
        this.emit(context.gbcWrapper.events.READY);
      }
    },
    /**
     * gbcWrapper ending wrapper initialization after GBC ready
     * GBC internal
     * DO NOT IMPLEMENT
     * @private
     */
    __gbcReady: function() {
      if (context.gbcWrapper.protocolType === "direct") {
        context.gbcWrapper.on(context.gbcWrapper.events.NATIVEACTION, function(event, src, data) {
          context.gbc.NativeService.onNativeAction(data);
        });
        context.gbcWrapper.on(context.gbcWrapper.events.DESTROYEVENT, function(event, src, data) {
          context.gbc.NativeService.onDestroyEvent(data);
        });
        context.gbcWrapper.on(context.gbcWrapper.events.CLOSE, function() {
          context.gbc.NativeService.onNativeAction({
            name: "close"
          });
        });
        context.gbcWrapper.on(context.gbcWrapper.events.END, function(event, src, data) {
          context.gbc.NativeService.onNativeEnd(data);
        });

        // Generic Call from UR to GBC
        context.gbcWrapper.on(context.gbcWrapper.events.GBCCALL, function(event, src, data) {
          context.gbc.NativeService.onGbcCall(data);
        });

        context.gbcWrapper.on(context.gbcWrapper.events.READY, function() {
          if (context.gbcWrapper._readyData.nativeResourcePrefix) {
            context.gbcWrapper.nativeResourcePrefix =
              context.gbcWrapper._readyData.nativeResourcePrefix.replace(/\/$/, "") + "/__dvm__/";
          } else {
            throw new Error("gbcWrapper: onReady data did not contain a valid 'nativeResourcePrefix'");
          }
          if (context.gbcWrapper._readyData.debugMode) {
            context.gbc.DebugService.activate();
          }
          if (context.gbcWrapper._readyData.language) {
            context.gbc.I18NService.setLng(context.gbcWrapper._readyData.language);
          }

          /**
           * Info about font used in program
           */
          if (context.gbcWrapper._readyData.font) {
            context.gbc.ThemeService.setFontData(context.gbcWrapper._readyData.font);
          }

          /**
           ~~ Notes about log level ~~
           "none"  is LogLevel 0 : only sent when GDC is launched without debug mode
           "error" is LogLevel 1 : param LOWEST  in GDC
           "warn"  is LogLevel 2 : param LOW     in GDC
           "info", "log", is LogLevel 3 : param HIGH in GDC
           "debug" is LogLevel 4 : param HIGHEST in GDC
          */
          context.gbc.LogService.changeLevel(
            ["none", "error", "warn", "log", "debug"][context.gbcWrapper._readyData.logLevel || 0] || "none"
          );
          if (context.gbcWrapper._readyData.forcedURfrontcalls) {
            context.gbcWrapper._forcedURfrontcalls = context.gbcWrapper._readyData.forcedURfrontcalls;
          }
          //
          runReady(context.gbcWrapper._readyData);
        });
      }
    },

    /**
     * returns if gbc runs whether in native mode or not
     * GBC internal
     * DO NOT IMPLEMENT
     * @return {boolean} true if gbc runs in native mode
     */
    isNative: function() {
      return this.platformType === "native";
    },

    /**
     * returns if gbc runs whether in browser mode or not
     * GBC internal
     * DO NOT IMPLEMENT
     * @return {boolean} true if gbc runs in browser mode
     */
    isBrowser: function() {
      return this.platformType === "browser";
    },

    /**
     * in native mode, will check if function call is forced to be done by UR
     * GBC internal
     * DO NOT IMPLEMENT
     * @param {string} moduleName the function call module
     * @param {string} functionName the function call name
     * @return {boolean} whtether or not function call is forced to by done by UR
     * @private
     */
    isFrontcallURForced: function(moduleName, functionName) {
      return Boolean(this._forcedURfrontcalls[moduleName]) &&
        ((this._forcedURfrontcalls[moduleName] === "*") ||
          (this._forcedURfrontcalls[moduleName].indexOf(functionName) >= 0));
    },

    /**
     * in GMA
     * @returns {boolean}
     */
    isGMA: function() {
      return this.platformName === "GMA";
    },

    param: function(data, application) {
      if (this.protocolVersion && this.protocolVersion >= 2) {
        if (data || (typeof data === "string") || (typeof data === "boolean") || (typeof data === "number")) {
          return {
            procId: application && application.procId || "",
            content: data
          };
        } else {
          return {
            procId: application && application.procId || ""
          };
        }
      } else {
        return data;
      }
    }
  };

})(window);
