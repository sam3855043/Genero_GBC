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

modulum('SessionService', ['InitService'],
  function(context, cls) {

    /**
     * Service that manages Sessions
     * @namespace gbc.SessionService
     * @gbcService
     * @publicdoc
     */
    context.SessionService = context.oo.StaticClass( /** @lends gbc.SessionService */ {
      __name: "SessionService",

      /**
       * Label for event listener
       * @private
       */
      sessionAdded: "sessionAdded",
      /**
       * Label for event listener
       * @private
       */
      sessionRemoved: "sessionRemoved",

      /**
       * session identifier
       * @type {Number}
       * @private
       */
      _identifier: 0,
      /**
       * @type {classes.VMSession[]}
       */
      _sessions: null,
      _bySessionId: null,
      _eventListener: null,

      /**
       * Initialize the session Service
       */
      init: function() {
        this._eventListener = new cls.EventListener();
        this._sessions = [];
        this._bySessionId = {};
      },

      /**
       * Start an application
       * @param appName {string}
       * @param params {Object}
       @param procId {string}
       * @returns {classes.VMSession}
       */
      startApplication: function(appName, params, procId) {
        const session = new cls.VMSession(this._identifier++);
        this._eventListener.emit(this.sessionAdded, session);
        const subAppInfo = context.bootstrapInfo.subAppInfo;
        if (subAppInfo) {
          let parentSession = context.BrowserWindowsService.getParentSession();
          session._baseInfos = parentSession && parentSession._baseInfos;
          session.startSubTask(subAppInfo, (app) => {
            if (procId) {
              app.info().connectionInfo = app.info().connectionInfo || {};
              app.info().procId = procId;
              app.info().connectionInfo.procId = procId;
            }
          });
        } else {
          let app = session.start(appName, params);
          if (procId) {
            app.info().connectionInfo = app.info().connectionInfo || {};
            app.info().procId = procId;
            app.info().connectionInfo.procId = procId;
          }
        }

        this._sessions.push(session);
        context.HostService.displaySession();
        return session;
      },

      /**
       * Start via a connection
       * @param {window.gbcWrapper} wrapper
       * @param {Object<string, *>} readyData
       * @return {*}
       */
      startDirect: function(wrapper, readyData) {
        let session = null;
        if (this._sessions.length) {
          session = this._sessions[0];
        } else {
          session = new cls.VMSession(this._identifier++);
          this._sessions.push(session);
          this._eventListener.emit(this.sessionAdded, session);
          context.HostService.displaySession();
        }
        session.startDirect(wrapper, readyData);
        return session;
      },

      fromSessionId: function(id) {
        return this._bySessionId[id];
      },

      updateSessionId: function(session, id) {
        this._bySessionId[id] = session;
      },

      /**
       * Remove a session
       * @param session
       * @param restarting
       */
      remove: function(session, restarting) {
        this._bySessionId[session.getSessionId()] = null;
        this._sessions.remove(session);
        this._eventListener.emit(this.sessionRemoved, session);
        if (!this._sessions.length && !restarting) {
          let baseURI = document.baseURI;
          if (!baseURI) {
            const base = document.getElementsByTagName("base");
            if (base.length) {
              baseURI = base[0].href || "";
            }
          }
          context.UrlService.setCurrentUrl(baseURI.replace(/\/$/, "/index.html"));
          context.HostService.displayNoSession();
        }
      },

      /**
       * Return active sessions
       * @returns {classes.VMSession[]}
       */
      getSessions: function() {
        return this._sessions;
      },

      /**
       * Return a session by id
       * @param identifier {string} id of the session to get
       * @return {classes.VMSession} the requested session
       */
      getSession: function(identifier) {
        return this._sessions.filter(function(item) {
          return item.getIdentifier() === identifier;
        })[0];
      },

      /**
       * Get the current running session
       * @returns {classes.VMSession} the current session
       * @publicdoc
       */
      getCurrent: function() {
        if (this._sessions) {
          return this._sessions[this._sessions.length - 1];
        } else {
          return null;
        }
      },

      /**
       * Handler called once a sesion has been added
       * @param hook
       * @return {*|HandleRegistration|promise.Promise<any>|Q.Promise<void>|Q.Promise<string>}
       */
      onSessionAdded: function(hook) {
        return this._eventListener.when(this.sessionAdded, hook);
      },
      /**
       * Handler called once a sesion has been removed
       * @param hook
       * @return {*|HandleRegistration|promise.Promise<any>|Q.Promise<void>|Q.Promise<string>}
       */
      onSessionRemoved: function(hook) {
        return this._eventListener.when(this.sessionRemoved, hook);
      }
    });
    context.InitService.register(context.SessionService);
  });
