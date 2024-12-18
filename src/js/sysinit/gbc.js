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

(function(contextWin) {
  // try to store js errors for forensics
  contextWin.__jsErrors = contextWin.__jsErrors || [];
  contextWin.__jsWarns = contextWin.__jsWarns || [];

  /**
   * @namespace classes
   * @alias classes
   */
  const classes = {};

  /**
   * Genero Browser Client main entry point service
   * @namespace gbc
   * @gbcService
   */
  const gbc = contextWin.augmentedFace.Singleton( /** @lends gbc.prototype */ {
    __name: "gbc",
    oo: contextWin.augmentedFace,
    uid: String.random(),
    version: "%%VERSION%%" || "none",
    build: "%%BUILD%%" || "none",
    tag: "%%TAG%%" || "dev-snapshot",
    dirtyFlag: "%%DIRTY%%" || "",
    lastCompDate: "%%COMPDATE%%" || "",
    prodMode: "%%PROD%%",
    copyrightYear: "%%YEAR%%",
    systemAppId: -1,
    queryStringTheme: null,
    qaMode: false,
    unitTestMode: false,
    canShowExitWarning: true,
    androidEmulationDebug: contextWin.androidEmulationDebug,
    browserMultiPage: false,
    bootstrapInfo: contextWin.__gbcBootstrap || {},
    dayjs: contextWin.dayjs,
    // jshint ignore:start
    dayjs_plugin_customParseFormat: contextWin.dayjs_plugin_customParseFormat,
    dayjs_plugin_localeData: contextWin.dayjs_plugin_localeData,
    // jshint ignore:end
    styler: contextWin.styler,
    StateMachine: contextWin.StateMachine,
    classes: classes,
    constants: {
      theme: {}
    },
    errorCount: 0,
    jsErrorCount: 0,
    systemModalOpened: false, // true if a modal system (about, settings, etc...) is currently opened

    /**
     * prepare GBC system environment
     * @memberOf gbc
     */
    preStart: function() {
      document.body.toggleClass("is-mobile-device", contextWin.isMobile());
      document.body.toggleClass("is-not-mobile-device", !contextWin.isMobile());
      document.body.toggleClass("is-touch-device", contextWin.isTouchDevice());
      document.body.toggleClass("is-not-touch-device", !contextWin.isTouchDevice());
      document.body.toggleClass("is-firefox", contextWin.browserInfo.isFirefox);
      document.body.toggleClass("is-edge", contextWin.browserInfo.isEdge);
      document.body.toggleClass("is-chrome", contextWin.browserInfo.isChrome);
      document.body.toggleClass("is-opera", contextWin.browserInfo.isOpera);
      document.body.toggleClass("is-safari", contextWin.browserInfo.isSafari);
      document.body.toggleClass("is-ios", contextWin.browserInfo.isIOS);
      document.body.toggleClass("is-android", contextWin.browserInfo.isAndroid);
      if (contextWin.gbc.bootstrapInfo.serverVersion) {
        contextWin.gbc.bootstrapInfo.serverVersion = contextWin.gbc.bootstrapInfo.serverVersion.replace(" - Build ", "-");
      }
      contextWin.gbc.bootstrapInfo.subAppInfo = parseInt(contextWin.gbc.bootstrapInfo.subAppInfo, 10) || 0;
      // Event activation changed
      contextWin.gbc.DebugService.whenActivationChanged(function(event, src, active) {
        contextWin.gbc.LogService.enableProviders(active);
      });
      contextWin.gbc.LogService.registerLogProvider(
        new classes.KeyboardPrefixedConsoleLogProvider("[KEYBOARD ]", "background: #AA6; color: #FFF"), "keyboard", "Keyboard");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.MousePrefixedConsoleLogProvider("[MOUSE    ]", "background: #A66; color: #FFF"), "mouse", "Mouse");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.UiPrefixedConsoleLogProvider("[UI       ]", "background: #015d51; color: #FFF"), "ui", "UI");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.PrefixedConsoleLogProvider("[SCHEDULER]", "background: #6A6; color: #FFF"), "scheduler", "Scheduler");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.PrefixedConsoleLogProvider("[CLIPBOARD]", "background: #8c0099; color: #FFF"), "clipboard", "Clipboard");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.PrefixedConsoleLogProvider("[FOCUS    ]", "background: #A6A; color: #FFF"), "focus", "Focus");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.PrefixedConsoleLogProvider("[gICAPI   ]", "background: #6AA; color: #FFF"), "gICAPI", "gICAPI");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.NetworkPrefixedConsoleLogProvider("[NETWORK  ]", "background: #66A; color: #FFF"), "networkProtocol",
        "Network");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.PrefixedConsoleLogProvider("[ServiceWorker]", "background: #66aa86; color: #FFF"), "sw", "ServiceWorker");
      contextWin.gbc.LogService.registerLogProvider(
        new classes.PrefixedConsoleLogProvider("[INPUT]", "background: #8A6; color: #FFF"), "input", "Input");
      contextWin.gbc.LogService.registerLogProvider(new classes.BufferedConsoleLogProvider(), null, "Default");

      // need to enable or disable debug mode explicitly
      // because DebugService can be also be activated by GAS parameters
      if (window.isURLParameterEnabled(contextWin.location.search, "debugmode")) {
        contextWin.gbc.DebugService.activate();
      } else if (window.isURLParameterDisabled(contextWin.location.search, "debugmode")) {
        contextWin.gbc.DebugService.disable();
      }

      contextWin.gbc.bootstrapInfo.gbcPath = "resources";

      // querystrings
      // activate QA info
      if (window.isURLParameterEnabled(contextWin.location.search, "qainfo")) {
        contextWin.gbc.qaMode = true;
      }
      // activate contextmenu
      if (window.isURLParameterEnabled(contextWin.location.search, "contextmenu")) {
        gbc.ThemeService.setValue("theme-disable-context-menu", false);
      }
      // activate mobileUI
      if (window.isURLParameterEnabled(contextWin.location.search, "mobileui")) {
        gbc.ThemeService.setValue("aui-mobileUI-default", true);
      }
      // activate browserMultiPage
      if (window.isURLParameterEnabled(contextWin.location.search, "browsermultipage")) {
        gbc.browserMultiPage = true;
      } else if (window.isURLParameterDisabled(contextWin.location.search, "browsermultipage")) {
        gbc.browserMultiPage = false;
      }

      // inhibit default browser behaviors
      document.body.addEventListener('keydown', function(event) {
        const contentEditable = Boolean(event.target.getAttribute("contenteditable")) &&
          event.target.getAttribute("contenteditable") !== "false";
        const isInputable = event.target.tagName === "TEXTAREA" || event.target.tagName === "INPUT" ||
          (event.target.tagName === "DIV" && contentEditable);

        if (event.ctrlKey) {
          if (event.which === 80 /* p */ || event.which === 83 /* s */ ) {
            event.preventCancelableDefault();
          }
          if (event.which === 65 /* a */ && !isInputable) {
            event.preventCancelableDefault();
          }
        }

        if (event.which === 8 /* backspace */ && (!isInputable || event.target.readOnly)) {
          event.preventCancelableDefault(); // inhibit previous page on backspace
        }

        // fallback to manage accelerators is focused unfortunately ended on body
        gbc.InitService.onKeyFallback(event);
      });

      if (contextWin.gbc.qaMode) {
        contextWin.gbc.classes.DebugHelper.activateDebugHelpers();
      }

      /**
       * Disable default IE behavior when pressing F1 key (which launches page toward microsoft website)
       * ref: https://agile.strasbourg.4js.com/jira/browse/ENGGCS-3879
       */
      if ('onhelp' in window) {
        // To avoid IE to display the help popup dialog on F1, we override associated 'onhelp' event
        window.onhelp = function() {
          return false;
        };
      }

      //DayJS config
      // jshint ignore:start
      contextWin.dayjs.extend(contextWin.dayjs_plugin_localeData);
      contextWin.dayjs.extend(contextWin.dayjs_plugin_customParseFormat);
      // jshint ignore:end

    },

    /**
     * start the GBC system (home page or application if bootstrapped)
     */
    start: function() {
      if (contextWin.gbc.__gbcStarted) {
        return;
      }

      if (window.isURLParameterEnabled("serviceworker")) {
        gbc.LogService.sw.log("Service Worker enabled");
        if (!('serviceWorker' in navigator)) {
          gbc.LogService.sw.warn("Service Worker not available on your system > Fallback on xhr");
        } else {
          navigator.serviceWorker.register('/service-worker.js').then(
            (registration) => {
              // registered!
              gbc.SW = registration.installing ||
                registration.waiting ||
                registration.active;
            },
            err => {
              gbc.LogService.sw.error("SW registration failed!");
            }
          );
          //listen for the latest sw
          navigator.serviceWorker.addEventListener('controllerchange', async () => {
            gbc.SW = navigator.serviceWorker.controller;
          });
          //listen for messages from the service worker
          navigator.serviceWorker.addEventListener('message', this.onMessage);
        }
      }

      contextWin.gbc.__gbcStarted = true;
      gbc.HostService.preStart();
      document.body.addClass("flexible_host_stretch_row");
      if (gbc.DebugService.isMonitorWindow()) {
        return;
      }
      contextWin.gbc.HostService.start();
    },

    onMessage: function(message) {
      //got a message from the service worker
      const {
        data
      } = message;
      gbc.LogService.sw.log('[GBC:RCV]<--', data);
      const app = gbc.SessionService.getCurrent().getCurrentApplication();
      const orders = data.VMresponse.filter(order => order.type === "om");
      if (orders.length > 0) {
        app.dvm.manageAuiOrders(orders);
        app.protocolInterface.uaProtocol.transition();
      }
    },
    sendMessage: function(msg) {
      //send some structured-cloneable data from the webpage to the sw
      if (navigator.serviceWorker.controller) {
        gbc.LogService.sw.log('[GBC:SEND]-->', msg);
        navigator.serviceWorker.controller.postMessage(msg);
      } else {
        throw Error("Service Worker API not available");
      }

    },

    /**
     * GBC system entry point
     */
    run: function(callback) {
      if (!gbc.__initialized) {
        modulum.assemble();
        const queryStringTheme = contextWin.location.search.match(/^(?:.*[?&])?theme=([^&$]+)(?:&.*)?$/);
        gbc.queryStringTheme = queryStringTheme && queryStringTheme[1];

        // handle SSO queryString
        const queryStringSSO = contextWin.location.search.match(/^(?:.*[?&])?gnonce=([^&$]+)(?:&.*)?$/);
        if (queryStringSSO && history.pushState) {
          // create new URL by removing &gnonce=XXX
          const params = new URLSearchParams(contextWin.location.search); // jshint ignore:line
          params.toString();
          params.delete('gnonce');
          let newQueryStr = params.toString().length > 0 ? '?' : '';
          newQueryStr = newQueryStr + params.toString();
          const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + newQueryStr;
          window.history.pushState({
            path: newurl
          }, '', newurl); //or use replaceState to update the history stack
        }

        //initTheme use uninitialized services (StoredSettingsService, LocalSettingsService, ...)
        gbc.ThemeService.initTheme(gbc.queryStringTheme, function() {
          gbc.InitService.initServices();
          gbc.preStart();
          const start = function() {
            gbc.start();
          };
          if (Object.isFunction(contextWin.__gbcDefer)) {
            contextWin.__gbcDefer(start);
          } else {
            contextWin.requestAnimationFrame(start);
          }
          gbc.__initialized = true;
          if (callback instanceof Function) {
            callback();
          }
        });
      }
    },
    /**
     * display before ending warning if needed when quitting the web page
     * @return {string}
     */
    showExitWarning: function() {
      if (gbc.ThemeService.getValue("theme-disable-ending-popup") !== true &&
        !contextWin.__desactivateEndingPopup &&
        !window.isURLParameterEnabled(contextWin.location.search, "noquitpopup") &&
        !contextWin.gbc.DebugService.isActive() && gbc.SessionService.getCurrent() && gbc.SessionService
        .getCurrent().getCurrentApplication()) {
        return "The Genero application is still running.\n" +
          "If you leave now, some data may be lost.\n" +
          "Please use the application user interface to exit the application before navigating away from this page.";
      }
    },
    /**
     * emulated window.alert
     * @param {string} text
     * @param {string} header
     * @param {Function?} closeCallback
     * @ignore
     */
    alert: function(text, header, closeCallback) {
      let modal = contextWin.gbc.classes.WidgetFactory.createWidget('Modal', {
        appHash: gbc.systemAppId
      });
      modal._gbcSystemModal();
      modal.setHeader(header);

      let contents = document.createElement("div");
      contents.setAttribute("style", "white-space: pre;");
      contents.textContent = text;

      modal.setContent(contents);
      document.body.appendChild(modal.getElement());
      modal.onClose(function() {
        modal.destroy();
        modal = null;
        contents = null;
        if (closeCallback) {
          closeCallback();
        }
      }.bind(this));

      modal.show();
    },
    /**
     * return information regarding the gbc version, build number, 
     * gas version, fgl version and platform used by the current application
     * If an app is given, read the content of the object
     * @param {classes.VMApplicationInfo?} app
     */
    info: function(app = null) {
      const origin = app || gbc.SessionService.getCurrent().getCurrentApplication().applicationInfo;
      const {
        serverVersion,
        connectionInfo: {
          runtimeVersion
        }
      } = origin;
      let platform = '';
      if (contextWin.browserInfo.isIOS) {
        platform = 'GMI';
      } else if (contextWin.browserInfo.isAndroid) {
        platform = 'GMA';
      } else if (navigator.userAgent.indexOf("QtWebEngine") !== -1) {
        platform = 'GDC';
      } else {
        platform = 'GBC';
      }
      return {
        gbcVersion: gbc.version,
        buildNumber: gbc.build,
        serverVersion,
        runtimeVersion,
        platform
      };
    }
  });

  const rawError = function() {
    const args = Array.prototype.join.call(arguments, " ");
    contextWin.__jsErrors.push(args);
    console.error(args);
  };

  const stackCallback = function(stackframes) {
    rawError("ERROR - Stacktrace");
    const stringifiedStack = "    at " + stackframes.map(function(sf) {
      return sf.toString();
    }).join('\n    at ');
    rawError(stringifiedStack);
  };

  const stackErrorCallback = function(err) {
    rawError(err);
  };

  /**
   * log and stacktrace errors of the GBC system
   * @param errorText
   * @param error
   * @param _fromNativeCall
   * @ignore
   */
  gbc.error = function(errorText, error, _fromNativeCall) {
    const text = Object.isString(errorText) && errorText || error && error.toString && error.toString(),
      err = error || (errorText && errorText.stack);
    rawError(text);
    if (!_fromNativeCall) {
      gbc.__wrapper.nativeCall(gbc.__wrapper.param({
        name: "error",
        args: [text]
      }));
    }
    if (contextWin.StackTrace && err && typeof(err) !== "string") {
      contextWin.StackTrace.fromError(err).then(stackCallback).catch(stackErrorCallback);
    }
  };

  /**
   * log and stacktrace warning of the GBC system
   * @ignore
   */
  gbc.warn = function() {
    const args = Array.prototype.join.call(arguments, " ");
    contextWin.__jsWarns.push(args);
    console.warn(args);
  };

  /**
   *
   * @param msg
   * @param file
   * @param line
   * @param col
   * @param error
   * @ignore
   */
  contextWin.onerror = function(msg, file, line, col, error) {
    gbc.error(msg, error);
    if (window.isURLParameterEnabled(contextWin.location.search, "debugmode")) {
      window.critical.display(msg);
    }
  };

  /**
   * js stacktrace emulation
   * @ignore
   */
  gbc.stack = function() {
    if (contextWin.StackTrace) {
      contextWin.StackTrace.generateArtificially().then(stackCallback).catch(stackErrorCallback);
    }
  };

  contextWin.addEventListener("unload", function() {
    let i = 0;
    const sessions = gbc.SessionService && gbc.SessionService.getSessions(),
      len = sessions && sessions.length;
    if (len) {
      for (; i < len; i++) {
        if (sessions[i]) {
          sessions[i].closeSession(true);
        }
      }
    }
    gbc.InitService.emit(gbc.constants.widgetEvents.onUnload);
    gbc.DebugService.destroy();
    gbc.InitService.destroy();
    document.body.innerHTML = "";
  });

  /**
   * @ignore
   * @return {*|string}
   */
  contextWin.onbeforeunload = function() {
    //emit hook
    gbc.InitService.emit(gbc.constants.widgetEvents.onBeforeUnload);
    gbc.LogService.ui.log("window onBeforeUnload called");

    if (gbc.canShowExitWarning) {
      // Deprecated since Chrome 51 : https://www.chromestatus.com/feature/5349061406228480
      return gbc.showExitWarning();
    }
  };

  /**
   * @ignore
   * @return {*|string}
   */
  contextWin.onblur = function() {
    //emit hook
    if (gbc.InitService && gbc.constants.widgetEvents) {
      gbc.InitService.emit(gbc.constants.widgetEvents.onBlur);
    }
  };

  contextWin.modulum.inject(gbc, gbc.classes);

  /**
   * testing purpose only
   * @param callback
   * @ignore
   * @private
   */
  gbc.__isIdleTest = function(callback) {
    try {
      const session = contextWin.gbc && contextWin.gbc.SessionService && contextWin.gbc.SessionService.getCurrent();
      const qaReady = gbc && gbc.QAService && gbc.QAService.isQAReady && gbc.QAService.isQAReady();
      callback({
        session: Boolean(session),
        idle: (!session || !session.getCurrentApplication() || session.isCurrentIdle()),
        qaReady: qaReady,
        jsErrors: window.__jsErrors,
        jsWarns: window.__jsWarns
      });
    } catch (e) {
      const result = {
        ___TEST_EXCEPTION: true
      };
      result.message = e.toString();
      result.stack = e.stack && e.stack.toString();
      callback(result);
    }
  };

  if (window.isURLParameterEnabled(contextWin.location.search, "unittestmode")) {
    gbc.unitTestMode = true;
  }
  gbc.__wrapper = contextWin.gbcWrapper;

  contextWin.gbc = gbc;

  contextWin.gbcWrapper.__init();
})(window);
