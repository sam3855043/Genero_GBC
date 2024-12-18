/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TopmenuService', ['InitService', 'DebugService', 'EventListener'],
  function(context, cls) {

    /**
     * Service used to synchronise topmenus across windows and sidebar
     * @namespace gbc.TopmenuService
     * @gbcService
     */
    context.TopmenuService = context.oo.StaticClass( /** @lends gbc.TopmenuService */ {
      __name: "TopmenuService",

      _topmenuList: null,
      _responsiveMenu: null,

      init: function() {
        this._topmenuList = [];
      },

      /**
       * Add a topmenu to the handled tm of this service
       * @param {classes.TopMenuWidget} topmenu - tm to add
       */
      addTopMenu: function(topmenu) {
        this._topmenuList.push(topmenu);
      },

      /**
       * Remove a topmenu from the handled tm of this service
       * - used to avoid memory leaks
       * @param {classes.TopMenuWidget} topmenu - tm to delete
       */
      removeTopmenu: function(topmenu) {
        const idx = this._topmenuList.indexOf(topmenu);
        this._topmenuList.splice(idx, 1);
      },

      /**
       * Get all TopMenus of an app
       * @param {Number} appHash - appHash to get topmenus of
       * @return {Array} an array of topmenus
       */
      getAppTopMenus: function(appHash) {
        return this._topmenuList.filter(tm => tm._appHash === appHash);
      },

      /**
       * Sync TopMenus for given app
       *  - will display the topmenu where it should be
       * @param {Number} appHash - app Hash of app to display
       */
      syncTopMenus: function(appHash) {
        const appTM = this.getAppTopMenus(appHash);
        const session = gbc.SessionService.getCurrent();
        const currentWindow = session.getCurrentApplication().getCurrentWindow();

        // Sync only if currentWindow
        if (currentWindow) {

          appTM.forEach((tm, index) => {
            // show Global Topmenu or TopmMenu in current window
            let visible = tm.isGlobal() || tm.getParentWidget() === currentWindow.getWidget();
            let hidden = !visible;

            // if next Topmenu in list is in modal
            if (index + 1 < appTM.length && appTM[index + 1].getWindowWidget()) { // ensure window widget exist in case of startmenu
              // This next topmenu has a modal window as parent, and we are displaying it: show the current TopMenu
              if (appTM[index + 1].getWindowWidget().isModal && currentWindow.isModal()) {
                hidden = false;
              }
            }

            tm.render({
              hidden
            });
          });

          gbc.HostLeftSidebarService.renderAppTopMenu(appHash);
        }
      },

    });
    context.InitService.register(context.TopmenuService);
  });
