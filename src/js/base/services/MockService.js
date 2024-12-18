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

modulum('MockService', ['InitService'],
  function(context, cls) {

    /**
     * QA AUI less GBC service creator
     * @namespace gbc.MockService
     * @gbcService
     */
    context.MockService = context.oo.StaticClass( /** @lends gbc.MockService */ {
      __name: "MockService",
      _i: 0,
      _init: false,
      init: function() {},

      fakeApplication: function(forUnit, appId, procId) {
        procId = procId || forUnit ? ("fake:" + (this._i++)) : null;

        if (!this._init) {
          this._init = true;
          context.LogService.registerLogProvider(new cls.BufferedConsoleLogProvider(), null);
          gbc.start();
        }
        let currentSession = context.SessionService.getCurrent();
        if (forUnit) {
          if (currentSession) {
            currentSession.destroy(true);
            currentSession = null;
          }

          // Force ListView to be Table for unit tests
          if (window.isMobile()) {
            window.gbc.ThemeService.setValue("theme-table-default-widget", "table");
          }
        }
        const params = {
          mode: "no"
        };
        let newApp = null;
        if (!currentSession) {
          newApp = context.SessionService.startApplication(appId || "fake", params, procId).getCurrentApplication();
          newApp.getSession()._sessionId = "00000000000000000000000000000000";
        } else {
          currentSession.start(appId || "fake", params);
          newApp = currentSession.getCurrentApplication();
        }
        newApp.applicationInfo.connectionInfo = {
          procId: procId || appId || "fake"
        };
        newApp.applicationInfo.procId = procId || appId || "fake";
        if (procId) {
          context.SessionService.getCurrent().getNavigationManager().updateApplicationInformation(newApp);
        }
        newApp.applicationInfo.ignoreFrontcallModules = ["webcomponent"];
        return newApp;
      }
    });
    context.InitService.register(context.MockService);
  });
