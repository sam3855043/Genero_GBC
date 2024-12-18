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

modulum('NavigationService', ['InitService'],
  function(context, cls) {

    /**
     * Service that manages navigation
     * @namespace gbc.NavigationService
     * @gbcService
     * @publicdoc
     */
    context.NavigationService = context.oo.StaticClass( /** @lends gbc.NavigationService */ {
      __name: "NavigationService",

      /**
       * @type {classes.EventListener}
       */
      _eventListener: null,
      _handlerRegistered: false,
      _newRootApplicationEvent: "gbc.NavigationService.newRootApplication",

      /**
       * Initialize the navigation Service
       */
      init: function() {
        this._eventListener = new cls.EventListener();

        window.requestAnimationFrame(() => {
          gbc.HostService.onCurrentWindowChange(this._registerHandler.bind(this));
        });
      },

      /**
       * Register the new Application internal handler
       * @private
       */
      _registerHandler: function() {
        if (this._handlerRegistered) {
          return;
        }

        this._handlerRegistered = true;
        const navigationManager = gbc.SessionService.getCurrent().getNavigationManager();

        navigationManager.when(context.constants.VMSessionNavigationManagerEvents
          .addSessionSidebarApplicationStackItem,
          (event) => {
            let application = event.data[0];
            this._eventListener.emit(this._newRootApplicationEvent, application);
          });
      },

      /**
       * Run the new application
       * @param {string} applicationId appId defined in the XCF file
       * @param onFailure callback in case of failure
       */
      newRootApplication: function(applicationId, onFailure) {
        let application = gbc.SessionService.getCurrent().getCurrentApplication();
        application.protocolInterface.runApplication(application, applicationId, onFailure);
      },

      /**
       * Event raised when a new application is created. Callback syntax: fn(application)
       * @param {function} callback function syntaxe: fn(VMApplication)
       * @return {HandleRegistration}
       */
      onNewRootApplication: function(callback) {
        return this._eventListener.when(this._newRootApplicationEvent, function(event) {
          callback(event.data[0]);
        });
      },

      /**
       * Get all the root applications
       * @return {classes.VMApplication[]}
       */
      getRootApplicationList: function() {
        const res = new Set();
        const navigationManager = gbc.SessionService.getCurrent().getNavigationManager();
        const appList = navigationManager.getApplications();

        appList.forEach((app) => {
          res.add(navigationManager.getRootWaitingApplication(app));
        });

        return Array.from(res);
      },

      /**
       * Get the current root application
       * @return {classes.VMApplication}
       */
      getCurrentRootApplication: function() {
        const session = gbc.SessionService.getCurrent();
        const navigationManager = session.getNavigationManager();

        return navigationManager.getRootWaitingApplication(session.getCurrentApplication());
      },

      /**
       * Show the active window of the application
       * @param {classes.VMApplication} application
       */
      setForegroundApplication: function(application) {
        application.getSession().getNavigationManager().goBackToLastActiveWindow(application);
      },

      /**
       * Close the current application
       */
      closeApplication: function() {
        gbc.SessionService.getCurrent().getCurrentApplication().close();
      },

    });

    context.InitService.register(context.NavigationService);
  });
