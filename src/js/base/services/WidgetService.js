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

modulum('WidgetService', ['InitService'],
  function(context, cls) {

    /**
     * Main widget service
     * @namespace gbc.WidgetService
     * @gbcService
     */
    context.WidgetService = context.oo.StaticClass( /** @lends gbc.WidgetService */ {
      __name: "WidgetService",

      /** @type number */
      cursorX: 0,
      /** @type number */
      cursorY: 0,

      /** @type classes.EventListener */
      _eventListener: null,

      /** @type {Map<string,classes.WidgetBase>} */
      _widgetsMap: null,

      /** @type {Array<string>} */
      _currentAppIds: null,

      /** @type {Array<classes.WidgetBase>} */
      _delayedWidgetDestroy: null,

      /**
       *  Init widget service
       */
      init: function() {
        this._eventListener = new cls.EventListener();
        this._widgetsMap = new Map();
        this._currentAppIds = [];
        this._delayedWidgetDestroy = [];
      },

      /**
       * Register VM application
       * @param app {classes.VMApplication} - app
       */
      registerVMApplication: function(app) {
        this._currentAppIds.push(app.applicationHash);
      },

      /**
       * Unregister VM application
       * @param app {classes.VMApplication} - app
       */
      unregisterVMApplication: function(app) {
        const appId = app.applicationHash;
        const delayedWidgets = [];

        this._delayedWidgetDestroy.forEach(function(w) {
          if (!w.isDestroyed() && (appId === null || w.getApplicationIdentifier() === appId)) {
            delayedWidgets.push(w);
          }
        }.bind(this));

        delayedWidgets.forEach(function(w) {
          w.destroy(true);
        });

        const widgets = this.getAllWidgets(appId);
        if (widgets.length !== 0) {
          gbc.error("WidgetService::unregisterVMApplication --> all widgets of the application are not destroyed");
          gbc.error(
            `Left ${widgets.length} Widgets: ${widgets.map(w=>w.__name + "-" + w._uuid + "@" + w._appHash + "/" + w._auiTag).join(",")}`);

          // anyway clean the widgets
          widgets.forEach(function(w) {
            if (!w.isDestroyed()) {
              w.destroy();
            }
          }.bind(this));
        }

        this._currentAppIds.remove(app.applicationHash);
      },

      /**
       * Register widget
       * @param widget {classes.WidgetBase} - widget
       */
      registerWidget: function(widget) {
        this._widgetsMap.set(widget.getUniqueIdentifier(), widget);

        if (widget.getApplicationIdentifier() === null) {
          gbc.error("WidgetService::registerWidget --> widget has no application id");
        }
      },

      /**
       * Unregister widget
       * @param widget {classes.WidgetBase} - widget
       */
      unregisterWidget: function(widget) {
        const success = this._widgetsMap.delete(widget.getUniqueIdentifier());
        if (!success) {
          gbc.error("WidgetService::unregisterWidget --> widget is not registered");
        }
      },

      /**
       * Add delayed widget destroy
       * @param widget {classes.WidgetBase} - widget
       */
      addDelayedWidgetDestroy: function(widget) {
        if (this._widgetsMap.has(widget.getUniqueIdentifier())) {
          const idx = this._delayedWidgetDestroy.findIndex(function(elm) {
            return elm.getUniqueIdentifier() === widget.getUniqueIdentifier();
          });

          if (idx < 0) {
            this._delayedWidgetDestroy.push(widget);
          }
        }
      },

      /**
       * Add delayed widget destroy
       * @param widget {classes.WidgetBase} - widget
       */
      removeDelayedWidgetDestroy: function(widget) {
        const idx = this._delayedWidgetDestroy.findIndex(function(elm) {
          return elm.getUniqueIdentifier() === widget.getUniqueIdentifier();
        });

        if (idx >= 0) {
          this._delayedWidgetDestroy.splice(idx);
        }
      },

      /**
       * Get a widget from its uuid
       * @param uuid {String} - uuid of widget
       * @returns {classes.WidgetBase} widget
       */
      getWidget: function(uuid) {
        const widget = this._widgetsMap.get(uuid);
        return widget ? widget : null;
      },

      /**
       * Returns a Widget from a dom element
       * @param {Element} elem - dom element
       * @param {String} [widgetClass] - class name of the widget that we want to return (default=gbc_WidgetBase)
       * @return {classes.WidgetBase} Widget pointer
       */
      getWidgetFromElement: function(elem, widgetClass) {
        widgetClass = widgetClass ? widgetClass : "gbc_WidgetBase";
        let widget = null;
        if (elem && elem.elementOrParent) {
          const widgetElement = elem.elementOrParent(widgetClass);
          if (widgetElement) {
            const widgetUuid = widgetElement.id.slice(2);
            widget = context.WidgetService.getWidget(widgetUuid);
          }
        }
        return widget;
      },

      /**
       * Get all widgets of a given app
       * @param {String} [appId] - app id or null for all apps
       * @return {Array<classes.WidgetBase>} array of widgets
       */
      getAllWidgets: function(appId) {
        appId = (typeof(appId) === "undefined") ? null : appId;
        const widgets = [];
        this._widgetsMap.forEach(function(value, key, map) {
          if (appId === null || value.getApplicationIdentifier() === appId) {
            widgets.push(value);
          }
        });
        return widgets;
      },

      /**
       * Get number of widgets
       * @param {String} [appId] - app id or null for all apps
       * @return {number} number of widgets
       */
      getAllWidgetsCount: function(appId) {
        appId = (typeof(appId) === "undefined") ? null : appId;
        if (appId === null) {
          return this._widgetsMap.size;
        } else {
          return this.getAllWidgets(appId).length;
        }
      },

      /**
       * Emit an event
       * @param {string} type event type to emit
       * @param {*} data - data
       */
      _emit: function(type, data) {
        this._eventListener.emit(type, data);
      },

      // TODO comment
      onWidgetCreated: function(kind, hook) {
        this._eventListener.when(context.constants.widgetEvents.created, function(evt, src, data) {
          if (!hook) {
            hook = kind;
            kind = null;
          }
          if (!kind || data.__name === kind) {
            hook(evt, src, data);
          }
        });
      }

    });
    context.InitService.register(context.WidgetService);
  });
