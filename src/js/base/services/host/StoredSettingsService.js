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

modulum('StoredSettingsService', ['InitService', 'LocalSettingsService'],
  function(context, cls) {

    /**
     * Stored Settings Service to handle clientside specific configurations
     * @class gbc.StoredSettingsService
     * @gbcService
     */
    gbc.StoredSettingsService = context.oo.Singleton( /** @lends gbc.StoredSettingsService */ {
      __name: "StoredSettingsService",

      /**
       * NameSpace for Stored App Settings to avoid conflict
       */
      _storedSettingsAppName: "storedSettings_gwcJS",

      /**
       * NameSpace for layout settings
       */
      _storedSettingsLayoutDataName: "storedSettingsLayout_gwcJS",

      /**
       * Copy of browser stored app settings
       * @type {Object}
       */
      _storedSettings: null,

      /**
       * Copy of browser stored layout settings
       * @type {Object}
       */
      _storedLayoutSettings: null,

      /**
       * Flag to define if stored settings are enabled or not
       * @type {boolean}
       */
      _storedSettingsEnable: true,

      /**
       * Keep track of disabled tables in an array
       * @type {Array}
       */
      _disabledTables: [],

      /**
       * Keep track of disabled tables
       */
      _disabledWindows: [],

      /**
       * Updated forms name
       * @type {Set<string>}
       */
      _updatedForms: null,

      _eventListener: new cls.EventListener(),

      /**
       * Should be called once
       */
      init: function() {
        this._storedSettings = context.LocalSettingsService.read(this._storedSettingsAppName);
        this._updatedForms = new Set();

        if (!this._storedSettings) {
          try {
            context.LocalSettingsService.write(this._storedSettingsAppName, {});
            context.LocalSettingsService.write(this._storedSettingsLayoutDataName, {});
            this._storedSettings = {};
            this._storedLayoutSettings = {};
          } catch (e) {
            this._storedSettingsEnable = false;
          }
        } else {
          this._storedLayoutSettings = context.LocalSettingsService.read(this._storedSettingsLayoutDataName);
        }

        context.InitService.when(gbc.constants.widgetEvents.onBeforeUnload, function() {
          if (context.SessionService.getCurrent() &&
            context.SessionService.getCurrent().isInBrowserMultiPageMode() &&
            !context.SessionService.getCurrent().isMasterBrowserPage()
          ) {
            return;
          }
          this.sync();
        }.bind(this));
      },

      moveLayoutSettings: function() {
        if (!this._storedLayoutSettings) {
          let settings = context.LocalSettingsService.read(this._storedSettingsLayoutDataName);

          if (!settings) {
            settings = this._storedSettings;
          } else {
            this._storedLayoutSettings = settings;
            return;
          }

          if (!settings) {
            settings = context.LocalSettingsService.read(this._storedSettingsAppName);
          }

          if (settings && settings.gwc && settings.gwc.forms) {
            this._storedLayoutSettings = {
              gwc: {
                forms: settings.gwc.forms
              }
            };
          } else {
            this._storedLayoutSettings = {
              gwc: {}
            };
          }

          this.writeLayoutData(this._storedLayoutSettings);
          this.syncLayout();
        }
      },

      /**
       * Access to a local copy of stored data or browser's one if local copy is empty
       * @returns {Object}
       */
      readSettingsData: function() {
        return this._storedSettings || context.LocalSettingsService.read(this._storedSettingsAppName);
      },

      /**
       * Access to a local copy of layout stored data or browser's one if local copy is empty
       * @returns {Object}
       */
      readLayoutData: function() {
        let session = context.SessionService.getCurrent();
        if (session && (session.isInBrowserMultiPageMode() || !session.isMasterBrowserPage())) {
          this._storedLayoutSettings = context.LocalSettingsService.read(this._storedSettingsLayoutDataName);
          return this._storedLayoutSettings;
        }

        this._storedLayoutSettings = this._storedLayoutSettings || context.LocalSettingsService.read(this._storedSettingsLayoutDataName);
        return this._storedLayoutSettings;
      },

      /**
       * Write the local copy of stored App data
       * @param object
       */
      writeSettingsData: function(object) {
        this._storedSettings = object;
      },

      /**
       * Write the local copy of stored layout data
       * @param object
       */
      writeLayoutData: function(object) {
        this._storedLayoutSettings = object;
        let session = context.SessionService.getCurrent();
        if (session && (session.isInBrowserMultiPageMode() || !session.isMasterBrowserPage())) {
          context.LocalSettingsService.write(this._storedSettingsLayoutDataName, this._storedLayoutSettings);
        }
      },

      /**
       * Synchronize the App temporary stored settings to the browser'storage
       * @note Keep in mind that calling this many times will lower performances
       */
      syncApp: function() {
        context.LocalSettingsService.write(this._storedSettingsAppName, this._storedSettings);
      },

      /**
       * Synchronize the Layout temporary stored settings to the browser'storage
       * @note Keep in mind that calling this many times will lower performances
       */
      syncLayout: function() {
        let session = context.SessionService.getCurrent();
        if (session && (session.isInBrowserMultiPageMode() || !session.isMasterBrowserPage())) {
          context.LocalSettingsService.write(this._storedSettingsLayoutDataName,
            this._extend(true, context.LocalSettingsService.read(this._storedSettingsLayoutDataName),
              this._keepUpdatedForms(this._storedLayoutSettings)));
        } else {
          context.LocalSettingsService.write(this._storedSettingsLayoutDataName, this._storedLayoutSettings);
        }
      },

      /**
       * Synchronize all the temporary stored settings to the browser'storage
       * @note Keep in mind that calling this many times will lower performances
       */
      sync: function() {
        context.LocalSettingsService.write(this._storedSettingsAppName, this._storedSettings);
        this.syncLayout();
      },

      /**
       * Return a tree with only the updated forms
       * @private
       */
      _keepUpdatedForms: function() {
        if (!this._storedLayoutSettings.gwc || !this._storedLayoutSettings.gwc.forms) {
          return {};
        }

        const keys = Object.keys(this._storedLayoutSettings.gwc.forms);
        const res = {
          gwc: {
            forms: {}
          }
        };

        keys.forEach(function(key) {
          if (this._updatedForms.has(key)) {
            res.gwc.forms[key] = this._storedLayoutSettings.gwc.forms[key];
          }
        }.bind(this));

        return res;
      },

      /**
       *
       * @param deep
       * @param oldSettings
       * @param newSettings
       * @returns {{}}
       * @private
       */
      _extend: function(deep, oldSettings, newSettings) {
        // Variables
        const extended = {};

        // Merge the object into the extended object
        const merge = (obj) => {
          for (let prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
              if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                if (!deep && Object.getOwnPropertyNames(obj[prop]).length === 0) {
                  delete extended[prop];
                } else {
                  extended[prop] = this._extend(deep, extended[prop], obj[prop]);
                }
              } else {
                extended[prop] = obj[prop];
              }
            }
          }
        };

        merge(oldSettings);
        merge(newSettings);

        return extended;
      },

      /**
       * Write the stored Settings in Local Storage of the browser
       * /!\ you should not call this function directly, it will break the stored settings
       * @param {boolean} isLayoutData
       * @param {object|string} newSettings
       * @param {boolean} [deep]
       * @private
       */
      _update: function(isLayoutData, newSettings, deep = true) {

        // Pass in the objects to merge as arguments.
        // For a deep extend, set the first argument to `true`.

        const oldSettings = isLayoutData ? this.readLayoutData() : this.readSettingsData();

        const finalSettings = this._extend(deep, oldSettings, newSettings);
        if (isLayoutData) {
          this.writeLayoutData(finalSettings);
        } else {
          this.writeSettingsData(finalSettings);
        }
      },

      /**
       * Will create an object according to the accessor key given
       * @param key {string} accessor to the setting
       * @param leafValue
       * @returns {{}}
       * @private
       */
      _buildTree: function(key, leafValue) {
        const obj = {};
        const splittedKey = key.split('.');
        const splicedKey = key.split('.');
        let newKey = '';

        //Create branch
        if (splittedKey.length > 1) {
          for (let i = 0; splittedKey.length > 0; i++) {
            if (!obj.hasOwnProperty(splittedKey[i])) {
              newKey = splicedKey.splice(i + 1).join('.');
              if (newKey.length > 0) {
                obj[splittedKey[i]] = this._buildTree(newKey, leafValue);
              } else {
                break;
              }
            } else {
              break;
            }
          }
        } else { //create Leaf
          obj[key] = leafValue === 0 ? 0 : leafValue || false;
        }
        return obj;
      },

      /**
       * Helper to get a cookie by name
       * @param name {string}
       * @returns {*}
       * @private
       */
      _getCookie: function(name) {
        const match = document.cookie.match(new RegExp(name + '=([^;]+)'));
        if (match) {
          return match[1];
        }
      },

      /**
       * Check if table/window has been disabled by 4ST style
       * @param key {string} accessor to stored ressource
       * @returns {boolean}
       * @private
       */
      _isForcedDefault: function(key) {
        //Check if form disabled
        const formName = key.replace('gwc.forms.', '').split('.')[0];
        //Check if table disabled
        const tableName = key.replace('gwc.forms.' + formName + '.tables.', '').split('.')[0];

        return (this._disabledWindows.indexOf(formName) >= 0 || this._disabledTables.indexOf(tableName) >= 0);
      },

      /**
       * Choose to use or not Stored Settings
       * @param {boolean} state is Enable?
       */
      enable: function(state) {
        this._storedSettingsEnable = state;
        this._update(false, {
          'storedSettingDisabled': !state
        }, false);
      },

      /**
       * Check if StoredSettings are enabled or not
       * @returns {boolean}
       */
      areEnabled: function() {
        const allStored = this.readSettingsData();
        if (allStored === null) {
          return false;
        }
        /* jshint ignore:start */
        if (allStored.hasOwnProperty('storedSettingDisabled')) {
          this._storedSettingsEnable = !allStored.storedSettingDisabled;
        }
        /* jshint ignore:end */
        return this._storedSettingsEnable;
      },

      /**
       * Disable stored Settings of a given window
       * @param winName
       * @param disable
       */
      disableWindowStoredSettings: function(winName, disable) {
        if (!disable) {
          const index = this._disabledWindows.indexOf(winName);
          if (index >= 0) {
            this._disabledWindows.splice(index, 1);
          }
        } else {
          this._disabledWindows.push(winName);
        }
      },

      /**
       * Disable stored Settings of a given table
       * @param tableName
       * @param disable
       */
      disableTableStoredSettings: function(tableName, disable) {
        if (!disable) {
          const index = this._disabledTables.indexOf(tableName);
          if (index >= 0) {
            this._disabledTables.splice(index, 1);
          }
        } else {
          this._disabledTables.push(tableName);
        }
      },

      /**
       * Reset and erase all stored settings
       */
      reset: function() {
        this.writeSettingsData({});
        this.writeLayoutData({});
        this._eventListener.emit('storedSettingsReset');
      },

      /**
       * Reset and erase a specific stored settings
       * @param key {?string} key to remove from stored settings
       */
      removeSettings: function(key) {
        this.setSettings(key, {}, true); //true to replace
      },

      /**
       * Get a stored setting by its key accessor (i.e: gwc.app.something)
       * @param {string} key
       * @returns {*}
       */
      getSettings: function(key) {
        let settings = key.startsWith("gwc.forms.") ? this.readLayoutData() : this.readSettingsData();
        const keys = key.split('.');
        if (this.areEnabled() && !this._isForcedDefault(key)) {
          for (const element of keys) {
            if (settings.hasOwnProperty(element)) {
              settings = settings[element];
            } else {
              settings = null;
              break;
            }
          }
          return typeof(settings) === 'undefined' ? null : settings;
        } else {
          return null;
        }

      },

      /**
       * Store a setting, create the accessor path if non-existing
       * @param {string} key accessor to the setting
       * @param {*} settings
       * @param {boolean} [replace]
       * @returns {boolean} true if success / false otherwise
       */
      setSettings: function(key, settings, replace = false) {
        if (this.areEnabled() && !this._isForcedDefault(key)) {
          const isLayoutSettings = key.startsWith("gwc.forms.");

          const match = key.match(/^(gwc\.forms\.)(\w*)(\..*)$/);
          if (match) {
            this._updatedForms.add(match[2]);
          }

          //get Settings first
          let existingSetting = this.getSettings(key);

          //If existing : update values
          if (!existingSetting) {
            const tree = this._buildTree(key);
            this._update(isLayoutSettings, tree);
          }

          existingSetting = settings;
          const allStored = this._goDown(key, existingSetting);
          this._update(isLayoutSettings, allStored, !replace);
          return true;
        } else {
          return false;
        }
      },

      /**
       * Used to be recursive
       * @param key
       * @param settings
       * @returns {*|{}}
       * @private
       */
      _goDown: function(key, settings) {
        return this._buildTree(key, settings);
      },

      //Sidebar related functions
      /**
       * Store the sidebar status: visible / hiiden
       * @param visible {bool}
       */
      setSideBarVisible: function(visible) {
        this.setSettings('gwc.app.sidebar.visible', visible);
      },

      /**
       * Check if sideBar is visible
       * @returns {bool}
       */
      isSideBarVisible: function() {
        return this.getSettings('gwc.app.sidebar.visible');
      },

      /**
       * Store the sidebar width
       * @param width {number}
       */
      setSideBarwidth: function(width) {
        this.setSettings('gwc.app.sidebar.width', width);
      },

      /**
       * Get the sidebar width
       * @returns {number}
       */
      getSideBarwidth: function() {
        return this.getSettings('gwc.app.sidebar.width');
      },

      //Language related functions
      /**
       * Manually set the language of the interface
       * @param locale {string} should be something like "en-US" or "fr-FR"
       */
      setLanguage: function(locale) {
        this.setSettings('gwc.app.locale', locale);
        gbc.I18NService.setLng(locale);
      },

      /**
       * Get the language set
       * @returns {string} locale
       */
      getLanguage: function() {
        let locale = this.getSettings('gwc.app.locale');
        if (!locale) {
          locale = this._getCookie('lang');
        }
        return locale;
      },

      //Log level related functions
      /**
       * store the log level
       * @param loglevel {string}
       */
      setLoglevel: function(loglevel) {
        this.setSettings('gwc.app.loglevel', loglevel);
      },

      /**
       * Get the log level
       * @returns {string} loglevel
       */
      getLoglevel: function() {
        return this.getSettings('gwc.app.loglevel') || 'none';
      },

      //Log types related functions
      /**
       * store the log types
       * @param logtypes {string}
       */
      setLogtypes: function(logtypes) {
        this.setSettings('gwc.app.logtypes', JSON.stringify(logtypes));
      },

      /**
       * Get the log types
       * @returns {string} logtypes
       */
      getLogtypes: function() {
        return JSON.parse(this.getSettings('gwc.app.logtypes') || "null");
      },

      //Splitter related functions
      /**
       * Define a splitter according to parameters
       * @param formName
       * @param identifier
       * @param splitInfo
       */
      setSplitter: function(formName, identifier, splitInfo) {
        const selector = 'gwc.forms.' + formName + '.layoutContainer.' + identifier;
        this.setSettings(selector, splitInfo);
      },

      /**
       * Get Splitter info
       * @param formName
       * @param identifier
       * @returns {*}
       */
      getSplitter: function(formName, identifier) {
        const selector = 'gwc.forms.' + formName + '.layoutContainer.' + identifier;
        return this.getSettings(selector);
      },

      //Collapsible group related functions
      /**
       * Define a group collapsed state according to parameters
       * @param {string} formName
       * @param {string} identifier
       * @param {boolean} collapsedInfo
       */
      setGroupCollapsedState: function(formName, identifier, collapsedInfo) {
        const selector = 'gwc.forms.' + formName + '.groupCollapsed.' + identifier;
        this.setSettings(selector, collapsedInfo);
      },

      /**
       * Get group collapsed state
       * @param {string} formName
       * @param {string} identifier
       * @returns {boolean}
       */
      getGroupCollapsedState: function(formName, identifier) {
        const selector = 'gwc.forms.' + formName + '.groupCollapsed.' + identifier;
        return this.getSettings(selector);
      },

      /**
       * Handling a callback on reset storedSettings
       * @param hook
       * @returns {*|HandleRegistration}
       */
      whenReset: function(hook) {
        return this._eventListener.when('storedSettingsReset', hook);
      }
    });
    context.InitService.register(context.StoredSettingsService);
  });
