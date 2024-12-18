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

modulum('NativeService',
  function(context, cls) {

    /**
     * Native Service to interact with native in UR mode
     * @namespace gbc.NativeService
     * @gbcService
     */
    context.NativeService = context.oo.StaticClass( /** @lends gbc.NativeService */ {
      __name: "NativeService",

      _activeNativeAction: {},

      /**
       *
       * @param {{name:string, args:Array}} data
       */
      onNativeAction: function(data) {
        if (data) {
          const app = context.SessionService.getCurrent().getCurrentApplication();
          this._activeNativeAction[data.name] = true;
          switch (data.name) {
            case "notificationpushed":
              app.scheduler.nativeNotificationPushedCommand();
              break;
            case "notificationselected":
              app.scheduler.nativeNotificationSelectedCommand();
              break;
            case "cordovacallback":
              app.scheduler.nativeCordovaCallbackCommand();
              break;
            case "back":
              app.scheduler.nativeBackCommand(data.args);
              break;
            case "close":
              app.scheduler.nativeCloseCommand();
              break;
            case "enterbackground":
              app.scheduler.enterBackgroundCommand();
              break;
            case "enterforeground":
              app.scheduler.enterForegroundCommand();
              break;
            default:
              // Fallback: trigger action as called
              const actionService = app.getActionApplicationService();
              let actionNode = actionService.getAction(data.name);
              if (actionNode) {
                app.scheduler.actionVMCommand(actionNode, {});
              }
              break;
          }
        }
      },

      /**
       * Returns true if native action name has been executed at least once during application cycle lifetime
       * @param {string} actionName
       * @returns {boolean}
       */
      hasActiveNativeAction: function(actionName) {
        if (!this._activeNativeAction) {
          return false;
        }
        return !!this._activeNativeAction[actionName];
      },

      /**
       * Destroy handler
       * @param data
       */
      onDestroyEvent: function(data) {
        const session = context.SessionService.getCurrent(),
          app = session.getApplicationByProcId(data.procId);
        app.fail(data.content.message);
      },

      /**
       * Native End handler
       * @param {Object} data - contains everything requested to End the app
       */
      onNativeEnd: function(data) {
        const {
          content: {
            message
          },
          procId
        } = data;

        // Get App with ProcId
        const session = context.SessionService.getCurrent(),
          app = session?.getApplicationByProcId(procId);
        // Stop app with message
        app?.stop(message);
      },

      /**
       * Gbc Call handler when Native wants to send data to GBC
       * @param data
       */
      onGbcCall: function(data) {
        const {
          //procId,
          //content,
          content: {
            name,
            args,
          }
        } = data;

        // According to name of the call, switch to correct method (replace with switch when more than 3 cases)
        if (name === "updateFont") {
          gbc.ThemeService.setFontData(args);
        }
      },

      /**
       * @inheritDoc
       */
      destroy: function() {
        this._activeNativeAction = null;
      },
    });
  });
