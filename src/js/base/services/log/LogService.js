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

modulum('LogService', ['InitService', 'ConsoleLogProvider', 'StoredSettingsService'],
  function(context, cls) {

    /**
     * GBC log service
     * @namespace gbc.LogService
     * @gbcService
     */
    context.LogService = context.oo.StaticClass( /** @lends gbc.LogService */ {
      __name: "LogService",
      /**
       * @type {string}
       */
      _currentLevel: "none",
      /**
       * @type {string[]}
       */
      levels: ["all", "debug", "log", "info", "warn", "error"],
      /**
       * @type {Object<string, classes.LogProviderBase>}
       */
      _providers: {
        _default: new cls.ConsoleLogProvider()
      },
      /**
       * @type {Array<string>}
       */
      _activeLoggers: null,
      /**
       * @type {Object<string, string>}
       */
      _labels: {},

      /** @type {Boolean} **/
      _enableRecording: false,
      /** @type {Object} **/
      _recordingsHeaders: null,
      /** @type {Array<Object>} **/
      _recordings: null,
      /** @type {Object} **/
      _recordingsImages: null,

      /**
       * initialize service
       */
      init: function() {
        this._currentLevel = context.StoredSettingsService.getLoglevel();
        this._activeLoggers = context.StoredSettingsService.getLogtypes();
        this.changeLevel(this._currentLevel, true);

        this.enableRecording(window.isURLParameterEnabled(window.location.search,
          "recordgbclog")); // QueryString  ?recordGbcLog=1  will enable this
        gbc.DebugService.whenActivationChanged(function() {
          if (gbc.LogService.isRecordingEnabled()) {
            gbc.LogService._recordingsHeaders.gbcInfos.debugMode = gbc.DebugService.isActive();
          }
        });
      },

      /**
       *
       * @param {string} level
       * @return {number}
       * @private
       */
      _intLevel: function(level) {
        return this.levels.indexOf(level);
      },

      /**
       *
       * @return {string}
       */
      getCurrentLevel: function() {
        return this._currentLevel;
      },

      /**
       * @param {string} newLevel
       * @param {boolean} force
       */
      changeLevel: function(newLevel, force) {
        const intlevel = this._intLevel(this._currentLevel);
        const intnewlevel = this._intLevel(newLevel);
        if (force || (intnewlevel !== intlevel)) {
          this._currentLevel = newLevel;
          const p = Object.keys(this._providers);
          for (const element of p) {
            this._prepareLogger(element, this._isActive(element || "_default") ? intnewlevel : -1);
          }
        }
      },

      /**
       * @param {classes.LogProviderBase} provider
       * @param {string|Array<string>} type
       * @param {string} [label]
       */
      registerLogProvider: function(provider, type, label) {
        const types = (Array.isArray(type) ? type : [type]);
        for (const element of types) {
          if (label) {
            this._labels[element || "_default"] = label;
          }
          this._providers[element || "_default"] = provider;
          this._prepareLogger(element || "_default", this._isActive(element || "_default") ? this._intLevel(this._currentLevel) :
            -1);
        }
      },

      /**
       *
       * @param {string} type
       * @param {number} intnewlevel
       * @private
       */
      _prepareLogger: function(type, intnewlevel) {
        let target = this;
        if (type !== "_default") {
          this[type] = {};
          target = this[type];
        }
        for (let i = 1; i < this.levels.length; i++) {
          const levelName = this.levels[i];
          if (intnewlevel < 0 || intnewlevel > i) {
            target[levelName] = this._getLogMethod(type, "record");
          } else {
            target[levelName] = this._getLogMethod(type, levelName);
          }
        }
      },

      /**
       *
       * @param {string} type
       * @return {boolean}
       * @private
       */
      _isActive: function(type) {
        return !this._activeLoggers || this._activeLoggers.indexOf(type) >= 0;
      },

      /**
       *
       * @param {string} logType
       * @param {string} level
       * @return {Function}
       * @private
       */
      _getLogMethod: function(logType, level) {
        const provider = this._providers[logType] || this._providers._default;
        const recordEnabled = this.isRecordingEnabled();
        return function() {
          if (provider.isEnabled()) {
            if (level !== "record") {
              provider.getLogger()[level].apply(provider.getLogger(), arguments);
              // If Record is enabled, use record method of the logger
              if (recordEnabled && provider.getLogger().record) {
                provider.getLogger().record.apply(provider.getLogger(), arguments);
              }
            } else {
              if (recordEnabled && provider.getLogger().record) {
                provider.getLogger().record.apply(provider.getLogger(), arguments);
              }
            }
          }
          // Not enabled: record anyway if enabled
          else if (recordEnabled && provider.getLogger().record) {
            provider.getLogger().record.apply(provider.getLogger(), arguments);
          }
        };
      },
      debug: function() {
        console.debug.apply(console, arguments);
      },
      log: function() {
        console.log.apply(console, arguments);
      },
      info: function() {
        console.info.apply(console, arguments);
      },
      warn: function() {
        console.warn.apply(console, arguments);
      },
      error: function() {
        console.error.apply(console, arguments);
      },

      /**
       * @return {Array<{name:string, label:string}>}
       */
      getTypes: function() {
        return Object.keys(this._providers).map(function(k) {
          return {
            name: k,
            label: this._labels[k] || k
          };
        }.bind(this));
      },

      /**
       * @return {Array<string>}
       */
      getActiveLogTypes: function() {
        return this._activeLoggers;
      },

      /**
       * @param {string} type
       */
      toggleType: function(type) {
        if (!this._activeLoggers) {
          this._activeLoggers = Object.keys(this._providers);
        }
        if (this._activeLoggers.indexOf(type) >= 0) {
          this._activeLoggers.remove(type);
        } else {
          this._activeLoggers.push(type);
        }
        this._prepareLogger(type || "_default", this._isActive(type || "_default") ? this._intLevel(this._currentLevel) : -1);
      },

      /**
       * Activate the providers
       * @param {Boolean} enable - true to enable the providers, false otherwise
       */
      enableProviders: function(enable) {
        const providers = Object.keys(this._providers);
        for (const element of providers) {
          this._providers[element].enable(enable);
        }
      },

      checkMemoryLogs: function(clearObject) {
        // Ensure last recorded log has been saved
        const memoryLogs = gbc.LocalSettingsService.read("logPlayer");
        if (memoryLogs) {
          if (!window.isURLParameterEnabled("qainfo")) {
            const useMemoryLog = window.confirm(i18next.t('gwc.logPlayer.unsavedConfirm'));
            if (useMemoryLog) {
              this._recordingsHeaders = memoryLogs.headers;
              this._recordings = memoryLogs.log;
              this.download("recovered_" + memoryLogs.filename);
              if (typeof clearObject !== 'undefined') {
                this.clearLog(clearObject);
              }
            }
            gbc.LocalSettingsService.write("logPlayer", null);
          } else {
            gbc.error("Existing log!");
            gbc.LocalSettingsService.write("logPlayer", null);
          }
        }
      },
      /**
       * Activate recording of GBClog
       * @param {boolean} enabled - true to enable the recording
       */
      enableRecording: function(enabled) {
        if (enabled) {
          this._recordings = [];
          this._enableRecording = enabled;

          this.checkMemoryLogs();

          const winRect = window.document.body.getBoundingClientRect();
          // Save useful information
          this._recordingsHeaders = {
            logType: "gbcLog",
            runDate: new Date(),
            gbcInfos: {
              version: gbc.version,
              build: gbc.build,
              platformName: window.gbcWrapper.platformName,
              protocolType: window.gbcWrapper.protocolType,
              activeTheme: gbc.ThemeService.getCurrentTheme(),
              availableThemes: gbc.ThemeService.getAvailableThemes(),
              isSideBarVisible: gbc.StoredSettingsService.isSideBarVisible(),
              sideBarSize: gbc.StoredSettingsService.getSideBarwidth() || parseInt(gbc.ThemeService.getValue(
                "theme-sidebar-default-width"), 10),
              debugMode: gbc.DebugService.isActive()
            },
            browserInfos: {
              userAgent: window.navigator.userAgent,
              os: navigator.platform,
              activeLanguage: navigator.language,
              availableLanguages: navigator.languages,
              dimension: {
                width: parseInt(winRect.width, 10),
                height: parseInt(winRect.height, 10),
              },
              url: window.location.href
            },
            themeVariables: gbc.ThemeService._currentVariables,
            storedSettings: gbc.StoredSettingsService._storedSettings,
            logs: []
          };
          // end of headers
          this._recordingsImages = {}; // init image list

          gbc.InitService.when(gbc.constants.widgetEvents.onBeforeUnload, function() {
            const session = gbc.SessionService.getCurrent();
            const filename = session.getAppId() + "-" + session.getSessionId().substring(0, 8) + ".gbclog";
            // If there is an un-saved log, store it into the memory before leaving
            if (this._recordingsHeaders.logType) {
              gbc.LocalSettingsService.write("logPlayer", {
                headers: this._recordingsHeaders,
                log: this._recordings,
                filename: filename
              });
            }
          }.bind(this));
        }
      },

      /**
       * Check if recording is enabled on this session
       * @return {boolean} true if enabled, false otherwise
       */
      isRecordingEnabled: function() {
        return this._enableRecording;
      },

      /**
       * Add an entry to the record
       * @param {Object} entry
       */
      record: function(entry) {
        if (!Object.isNumber(entry.appId)) {
          const session = gbc.SessionService.getCurrent();
          const app = session && session.getCurrentApplication();
          if (app) {
            entry.appId = app.applicationHash;
          }
        }
        this._recordings.push(entry);
      },

      /**
       * Map image to its base64 equivalent
       * @param imgWidget
       * @param {Boolean} usePlaceholder - true to use a generated placeHolder
       */
      addImage: function(imgWidget, usePlaceholder) {
        console.log("Image: add it with placeholder", usePlaceholder);
        if (usePlaceholder) {
          const size = imgWidget.getNaturalDimension(),
            width = size.width,
            height = size.height,
            backgroundColor = '#bbdefb',
            fontColor = '#000000',
            canvas = document.createElement('canvas');

          /* set canvas stage */
          canvas.id = "placeholder";
          canvas.width = width;
          canvas.height = height;

          /* set canvas stage */
          canvas.id = "placeholder";
          canvas.width = width;
          canvas.height = height;

          /* add content */
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = fontColor;
          ctx.font = '16px Courier';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#FF0000";
          // Drow cross
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(canvas.width, canvas.height - 2);
          ctx.moveTo(0, canvas.height - 2);
          ctx.lineTo(canvas.width + 2, 0);
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 2;
          //ctx.fillText($0.alt, (width / 2), (height / 2) + height/3)
          ctx.stroke();
          ctx.closePath();

          /* convert to image base64 */
          this._recordingsImages[imgWidget.getValue()] = canvas.toDataURL('image/png');
        } else {
          // Use real image encoded to base64 (take more space in output file)
          window.toDataURL(
            imgWidget.getValue(),
            function(dataUrl) {
              this._recordingsImages[imgWidget.getValue()] = dataUrl;
            }.bind(this),
            "image/png"
          );
        }

      },

      /**
       * Get the last record
       * @return {Object} last recorded entry
       */
      getLastRecord: function() {
        return this._recordings[this._recordings.length - 1];
      },

      /**
       * Function to download data to a file
       * @param {String?} filename - give a name to the file to download (if no name, generate it)
       * @return {boolean}
       */
      download: function(filename) {
        if (!this.isRecordingEnabled()) {
          console.warn(i18next.t("gwc.logPlayer.notEnabled"));
          return false;
        }

        const session = gbc.SessionService.getCurrent();
        filename = filename ? filename : (session.getAppId() + "-" + session.getSessionId().substring(0, 8) + (window.isURLParameterEnabled(
            window.location.search,
            "withrealimages") ?
          "_realImages" : "") + ".gbclog");

        const type = "json";
        const logContent = this.getLogContent();

        const file = new Blob([logContent], {
          type: type
        });
        if (window.navigator.msSaveOrOpenBlob) { // IE10+
          window.navigator.msSaveOrOpenBlob(file, filename);
        } else { // Others
          const a = document.createElement("a"),
            url = URL.createObjectURL(file);
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 0);
        }
      },

      /**
       * Get JSON stringified content of the log
       * @param {string} [format] - choose output format (json or string(default))
       * @return {string} content
       */
      getLogContent: function(format) {
        format = typeof format === "string" ? format : "string";
        this._recordingsHeaders.logs = this._recordings;
        this._recordingsHeaders.images = this._recordingsImages;
        return format === "string" ? JSON.stringify(this._recordingsHeaders, null, 2) : this._recordingsHeaders;
      },

      /**
       * Clear the log from memory
       * @param {Object} clearObject
       * @param {Boolean} clearObject.header - clear the log header
       * @param {Boolean} clearObject.images - clear the images records
       * @param {Boolean} clearObject.clearContent - clear the log content
       */
      clearLog: function(clearObject) {
        gbc.LocalSettingsService.write("logPlayer", null);
        if (!clearObject) {
          this._recordingsHeaders = {};
          this._recordingsImages = {};
          this._recordings = [];
        } else {
          if (clearObject.header) {
            this._recordingsHeaders = {};
          }
          if (clearObject.images) {
            this._recordingsImages = {};
          }
          if (clearObject.clearContent) {
            this._recordings = [];
          }
        }
      }

    });
    context.InitService.register(context.LogService);
  });
