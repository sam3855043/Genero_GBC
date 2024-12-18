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

modulum('ForegroundBackgroundService', ['InitService'],
  function(context, cls) {

    /**
     * Foreground Background Service to handle foreground & background modes in browser with the corresponding predefined actions
     * @namespace gbc.ForegroundBackgroundService
     * @gbcService
     */
    context.ForegroundBackgroundService = context.oo.StaticClass( /** @lends gbc.ForegroundBackgroundService */ {
      __name: "ForegroundBackgroundService",

      /**
       * Handle to watch document visibility changes.
       * @type {HandleRegistration}
       */
      _visibilityChangeHandler: null,

      /**
       * Initialize the service
       */
      init: function() {
        this._visibilityChangeHandler = context.InitService.when(
          context.constants.widgetEvents.visibilityChange,
          this._onVisibilityChangeCommand.bind(this)
        );
      },

      /**
       * Generates enterbackground/enterforeground commands in scheduler depending on document visibility
       * @private
       */
      _onVisibilityChangeCommand: function() {
        const app = context.SessionService.getCurrent() && context.SessionService.getCurrent().getCurrentApplication();
        if (app) {
          if (document.hidden) {
            // document.hidden is similar to document.visibilityState to listen to browser inactive/active tabs (historically named Page API)
            if (!context.NativeService.hasActiveNativeAction("enterbackground")) {
              // Do not send enterbackground command if it is already sent by NativeService (UR)
              app.scheduler.enterBackgroundCommand();
            }
          } else {
            if (!context.NativeService.hasActiveNativeAction("enterforeground")) {
              // Do not send enterforeground command if it is already sent by NativeService (UR)
              app.scheduler.enterForegroundCommand();
            }
          }
        }
      },

      /**
       * @inheritDoc
       */
      destroy: function() {
        if (this._visibilityChangeHandler) {
          this._visibilityChangeHandler();
          this._visibilityChangeHandler = null;
        }
      },
    });
    context.InitService.register(context.ForegroundBackgroundService);
  });
