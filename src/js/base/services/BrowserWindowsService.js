/// FOURJS_START_COPYRIGHT(D,2020)
/// Property of Four Js*
/// (c) Copyright Four Js 2020, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('BrowserWindowsService', ['InitService'],
  function(context, cls) {

    /**
     * Service that manages links between browser windows used by sessions
     * @namespace gbc.BrowserWindowsService
     * @gbcService
     * @publicdoc
     */
    context.BrowserWindowsService = context.oo.StaticClass( /** @lends gbc.BrowserWindowsService */ {
      __name: "BrowserWindowsService",

      _eventListener: null,

      /**
       * Initialize the session Service
       */
      init: function() {
        this._eventListener = new cls.EventListener();
        window.addEventListener("multiWindowUnloadRoot", () => {
          window.close();
        });
      },

      /**
       * @returns {Window}
       */
      isRootWindow: function() {
        return window._multiWindowData.isRoot;
      },

      /**
       * @returns {gbc}
       */
      getRootGbc: function() {
        let rootWindow = window._multiWindowData.rootWindow;
        return rootWindow && rootWindow.gbc;
      },

      /**
       * @returns {classes.VMSession}
       */
      getRootSession: function() {
        let rootGbc = this.getRootGbc();
        return rootGbc && rootGbc.SessionService.getCurrent();
      },

      /**
       * @returns {gbc}
       */
      getParentGbc: function() {

      },

      /**
       * @returns {classes.VMSession}
       */
      getParentSession: function() {
        let parentWindow = window._multiWindowData.parentWindow;
        let parentGbc = parentWindow && parentWindow.gbc;
        return parentGbc && parentGbc.SessionService.getCurrent();
      },

      /**
       *
       * @returns {number}
       */
      countChildWindows: function(filter = (w) => true) {
        return window._multiWindowData.directChildren.filter(filter).length;
      },

      /**
       *
       */
      closeAllChildren: function() {
        if (this.isRootWindow()) {
          let children = window._multiWindowData.directChildren;
          while (children.length) {
            const w = children.pop();
            w.__desactivateEndingPopup = true;
          }
        }
      }
    });
    context.InitService.register(context.BrowserWindowsService);
  });
