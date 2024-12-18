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

modulum('LogPlayerService',
  function(context, cls) {

    /**
     * Log Player Service to centralize log playing logic used in LogPlayerWidget and in UR Log Player
     * @namespace gbc.LogPlayerService
     * @gbcService
     */
    context.LogPlayerService = context.oo.StaticClass( /** @lends gbc.LogPlayerService */ {
      __name: "LogPlayerService",

      /**
       * @type {Map<number, Map<number, classes.VMApplication>>}
       */
      _fakeSessions: null,

      _appStack: null,
      /**
       * Get the mock application registered with a session id and an application id
       * @param {number} sessionId
       * @param {number} appId
       * @param {number} procId
       * @param {boolean} dontCreate
       * @returns {classes.VMApplication}
       */
      getApplication: function(sessionId, appId, procId, dontCreate) {
        if (!this._fakeSessions) {
          this._fakeSessions = new Map();
        }
        if (!this._appStack) {
          this._appStack = [];
        }
        if (!this._fakeSessions.has(sessionId)) {
          this._fakeSessions.set(sessionId, new Map());
        }
        if (appId === null) {
          appId = procId;
        }
        const fakeSession = this._fakeSessions.get(sessionId);
        if (!fakeSession.has(appId) && !dontCreate) {
          const app = window.gbc.MockService.fakeApplication(false, appId, procId);
          app.setRunning(true);
          app.info().procId = procId;
          app.procId = procId;
          app.info().webComponent = window.location.origin +
            window.location.pathname.replace(/\/[^\/]+$/, "/") +
            context.ThemeService.getResource("webcomponents");
          fakeSession.set(appId, app);

          this._appStack.push(app);
          app.dvm.when(context.constants.baseEvents.gotRN0, () => {
            window.requestAnimationFrame(() => {
              let session = app.getSession();
              app.stop();
              let appIndex = this._appStack.indexOf(app);
              if (appIndex >= 0) {
                let nextApp = this._appStack[appIndex - 1];
                this._appStack.splice(appIndex, 1);
                if (!nextApp) {
                  nextApp = this._appStack[this._appStack.length - 1];
                }
                if (nextApp) {
                  nextApp.getSession().getWidget().setCurrentWidget(nextApp.getUI().getWidget());
                }
              }
              if (session && session.getApplications() && !session.getApplications().length) {
                session.destroy();
              }
            });
          });
        }
        return fakeSession.get(appId);
      },

      /**
       * Set a given app visible
       * @param {classes.VMApplication} app- application to set visible
       */
      setVisibleApplication: function(app) {
        const session = app.getSession();
        if (session) {
          session.getWidget().setCurrentWidget(app.getUI().getWidget());
        }
      },

      /**
       * Unregister a mock application
       * @param sessionId
       * @param appId
       */
      removeApplication: function(sessionId, appId) {
        if (!this._fakeSessions) {
          this._fakeSessions = new Map();
        }
        const session = this._fakeSessions.get(sessionId);
        if (session) {
          session.delete(appId);
          if (!session.size) {
            this._fakeSessions.delete(sessionId);
          }
        }
      },

      /**
       * Clean all applications/session
       */
      cleanApplications: function() {
        if (this._fakeSessions) {
          this._fakeSessions.clear();
        }
      },

      /**
       * Replace resource reference with mock ones
       * @param {string} order
       * @param {Object?} imageMap
       * @returns {string}
       */
      mockOrderResources: function(order, imageMap) {
        const imgMock = context.ThemeService.getResource("img/logo.png"),
          ttfMock = context.ThemeService.getResource("fonts/materialdesignicons-webfont.ttf");

        const imgReplacer = function(tpl, data) {
          return tpl.toString().replace(/([^"]+\.(?:png|jpg|gif|svg))(?:\?[^\\"]+)?/g, function(id) {
            return data && data[id] || imgMock;
          });
        };

        order = imgReplacer(order, imageMap);

        return order.replace(/"[^"]+\.ttf\?[^"]+"/g, "\"" + ttfMock + "\"") // Fonts
          .replace(/componentType "[^"]+"/g, "componentType \"empty\""); // webcomponents
      }
    });
  });
