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

modulum('InitService',
  function(context, cls) {

    /**
     * Root Service
     * @namespace gbc.InitService
     * @gbcService
     */
    context.InitService = context.oo.StaticClass( /** @lends gbc.InitService */ {
      __name: "InitService",
      _builtinActionDefaultsKeys: ['enter', 'esc', 'f3', 'ctrl+f3', 'f4', 'f1', 'alt+f4', 'ctrl+f', 'ctrl+g', 'tab', 'shift+tab',
        'down', 'up', 'home', 'end', 'pageup', 'pagedown', 'ctrl+tab', 'ctrl+shift+tab'
      ],

      _services: [],
      _onVisibilityChangeHandler: null,
      _eventListener: new cls.EventListener(),

      create: function(auiData, app, forUnit) {
        app = app || context.MockService.fakeApplication(forUnit);
        const treeModificationTrack = new cls.TreeModificationTracker();
        const node = gbc.classes.NodeFactory.createRecursive(null, auiData, app, treeModificationTrack);
        node.createController();
        return node;
      },
      register: function(service) {
        this._services.push(service);
      },
      /**
       * Fallback method bound on body to manage accelerators when focused unfortunately moved to body
       * @param {domEvent} event - body keydown event
       * @private
       */
      onKeyFallback: function(event) {
        if (document.activeElement.tagName === "BODY") {

          const currentApp = context.SessionService.getCurrent() && context.SessionService.getCurrent().getCurrentApplication();
          if (currentApp && currentApp.keyboard) {

            const appWidget = currentApp.getUI().getWidget();
            if (appWidget) {
              const uiWidget = appWidget._uiWidget;
              if (uiWidget && !uiWidget._destroyed) {
                // 1. Refocus UserInterface widget
                uiWidget.setFocus();
                // 2. Using KeyboardApplicationService logic, we process the key
                currentApp.keyboard._onKeyDown(event);
              }
            }
          }
        }
      },
      initServices: function() {
        this._onVisibilityChangeHandler = function() {
          this.emit(context.constants.widgetEvents.visibilityChange);
        }.bind(this);
        document.addEventListener("visibilitychange", this._onVisibilityChangeHandler);

        for (const element of this._services) {
          element.init();
        }
        context.__wrapper.emit(context.__wrapper.events.SERVICESREADY);
      },
      /**
       * unique identifiers increments storage
       */
      _uniqueId: {
        asString: 0,
        asNumber: 0
      },

      destroy: function() {
        document.removeEventListener("visibilitychange", this._onVisibilityChangeHandler);
        if (context.SessionService.getCurrent()) {
          const currentApp = context.SessionService.getCurrent().getCurrentApplication();
          if (currentApp) {
            currentApp.close();
          }
        }
      },

      /**
       * Get a unique identifier (an auto increment number)
       * @return {number}
       */
      uniqueId: function() {
        return ++this._uniqueId.asNumber;
      },

      /**
       * Get a unique identifier as string (based on an auto increment number)
       * @return {string} a unique identifier as string
       */
      uniqueIdAsString: function() {
        return "" + (++this._uniqueId.asString);
      },

      emit: function(eventName) {
        this._eventListener.emit(eventName);
      },
      when: function(eventName, hook) {
        return this._eventListener.when(eventName, hook);
      }

    });
  });
