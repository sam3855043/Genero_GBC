/// FOURJS_START_COPYRIGHT(D,2014)
/// Property of Four Js*
/// (c) Copyright Four Js 2014, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

'use strict';

modulum('FrontCallService.modules.standard', ['FrontCallService'],
  function(context, cls) {
    context.TemplateService.registerRawTemplate('FrontCallStandardPlaySound', '<audio></audio>');

    /**
     * Standard module of Frontcall Service
     * @instance standard
     * @memberOf gbc.FrontCallService.modules
     */
    context.FrontCallService.modules.standard = /** @lends gbc.FrontCallService.modules.standard */ {

      /**
       * Adds to the content of the clipboard
       * @param textToAdd to the current clipboard
       * @returns {?boolean[]}
       */
      cbAdd: async function(textToAdd) {
        if (!textToAdd) {
          this.parametersError();
          return;
        }
        const result = await context.ClipboardService.addToClipboardData(textToAdd);
        this.setReturnValues([result]); // TRUE=success, FALSE=error
      },

      /**
       * Clears the content of the clipboard.
       * @returns {boolean[]} - true if supported and succeed false otherwise
       */
      cbClear: async function() {
        const result = await context.ClipboardService.setClipboardData("");
        this.setReturnValues([result]); //execution status (TRUE=success, FALSE=error).
      },

      /**
       * Gets the content of the clipboard.
       * @returns {string[]} - content of the clipboard
       */
      cbGet: async function() {
        const textResult = await context.ClipboardService.getClipboardData();
        this.setReturnValues([textResult]);
      },

      /**
       * Pastes the content of the clipboard to the current field.
       * @returns {boolean[]}
       */
      cbPaste: async function() {
        if (!context.ClipboardService.isApiAvailable()) {
          // Not supported without the Clipboard API
          this.setReturnValues([false]);
        }

        // find focused node to paste content to
        const focusedNode = this.getAnchorNode().getApplication().getFocusedVMNode();
        if (focusedNode && focusedNode.getController() && focusedNode.getController().getWidget()) {
          const focusedWidget = focusedNode.getController().getWidget();
          const pasteResult = await context.ClipboardService.pasteToWidget(focusedWidget);
          this.setReturnValues([pasteResult]);
        }
      },

      /**
       * Set the content of the clipboard.
       * @param text
       * @returns {?boolean[]}
       */
      cbSet: async function(text) {
        if (text === undefined) {
          this.parametersError();
          return;
        }
        const result = await context.ClipboardService.setClipboardData(text);
        this.setReturnValues([result]);
      },

      /**
       * Invokes the device's default mail app
       * Returns ok if the app was opened, failed otherwise
       * (Alias of mobile module's composeMail)
       */
      composeMail: function(to, subject, content, cc = "", bcc = "", attachments = null) {
        context.FrontCallService.modules.mobile.composemail.call(this, to, subject, content, cc, bcc, attachments);
      },

      /**
       * On Android, checks for the specific type of connection, otherwise checks for online/offline status
       * Returns the type of connection
       * (Alias of mobile module's connectivity)
       */
      connectivity: function() {
        context.FrontCallService.modules.mobile.connectivity.call(this);
      },

      /**
       * Executes a command on the front-end platform, with or without waiting.
       * @unsupported
       * @param command
       * @param wait
       * @returns {boolean[]}
       */
      execute: function(command, wait) {
        return [false];
      },

      /**
       * Queries general front-end properties.
       * @param {string} kind of module to call
       * @returns {*}
       */
      feinfo: function(kind) {
        if (kind === undefined) {
          this.parametersError();
          return;
        }
        if (kind.toLowerCase) {
          switch (kind.toLowerCase()) {
            case 'browsername':
              if (window.browserInfo.isFirefox) {
                return ['Firefox'];
              } else if (window.browserInfo.isChrome) {
                return ['Chrome'];
              } else if (window.browserInfo.isEdge) {
                return ['Edge'];
              } else if (window.browserInfo.isOpera) {
                return ['Opera'];
              } else if (window.browserInfo.isSafari) {
                return ['Safari'];
              }
              return ['Unknown'];
              // The code identifying the type of front-end component.
            case 'fename':
              return ['GBC'];
              // Returns "1" if the front-end runs in Active X mode (GDC specific). Unsupported in GBC
            case 'isactivex':
              return [false];
              // Number of screens available on the front-end platform. Always return 1 in GBC
            case 'numscreens':
              return [1];
              // The operating system type where the front-end is running.
            case 'ostype':
              if (navigator.appVersion.indexOf('Win') !== -1) {
                return ['WINDOWS'];
              } else if (navigator.appVersion.indexOf('Android') !== -1) {
                return ['ANDROID'];
              } else if (navigator.appVersion.indexOf('iPhone') !== -1 || navigator.appVersion.indexOf('iPad') !== -1) {
                return ['IOS'];
              } else if (navigator.appVersion.indexOf('Linux') !== -1) {
                return ['LINUX'];
              } else if (navigator.appVersion.indexOf('Mac') !== -1) {
                return ['OSX'];
              }
              return ['Unknown OS Type'];
              // The version of the operating system. Always unknow in GBC.
            case 'osversion':
              return ['Unknown'];
              // Unsupportedin GBC, deprecated in 3.10
            case 'outputmap':
              return [''];
              // Returns the screen pixel density of the front-end platform
            case 'ppi':
              return [window.devicePixelRatio * 96];
              // Returns the screen resolution of the front-end platform
            case 'screenresolution':
              return [(window.devicePixelRatio * screen.width) + 'x' + (window.devicePixelRatio * screen
                .height)]; // taking pixel ratio into account
              // Returns the build platform target code name
            case 'target':
              return ['web'];
              // Returns the current size of the front-end view-port.
            case 'windowsize':
              return [window.document.body.clientWidth + 'x' + window.document.body.clientHeight];
              // Returns the language and territory of the locale
            case 'userpreferredlang':
              return [gbc.StoredSettingsService.getLanguage()];
              // Get browser theme, dark or light
            case 'colorscheme':
              if (window.matchMedia) {
                return (window.matchMedia('(prefers-color-scheme: light)').matches) ? ['light'] : ['dark'];
              }
              return ['light'];
          }
        }
        return [''];
      },

      /**
       * Retrieves a file from the front-end context to the virtual machine context.
       * @param filename
       * @param url
       */
      fgl_getfile: function(filename, url) { // jshint ignore:line
        if (!filename || !url) {
          this.parametersError();
          return;
        }
        const app = this.getAnchorNode().getApplication();
        app.filetransfer.getFile({
            fileTransferUrl: url,
            filename: filename
          }, function() {
            this.setReturnValues([]);
          }.bind(this),
          function(msg) {
            this.runtimeError(msg);
          }.bind(this));
      },

      /**
       * Transfers a file from the virtual machine context to the front end context.
       * @param url
       * @param filename
       * @returns {?Array}
       */
      fgl_putfile: function(url, filename) { // jshint ignore:line
        if (!url || !filename) {
          this.parametersError();
          return undefined;
        }
        const cdUrl = url + (url.indexOf("?") >= 0 ? "&" : "?") + "ContentDisposition=attachment";
        const node = this.getAnchorNode && this.getAnchorNode(),
          app = node?.getApplication(),
          session = app && app.getSession();
        if (session && session.hasServerFeature("ft-lock-file")) {
          cls.UANetwork.ftLockFile(app, function() {
            window.open(cdUrl, filename);
            this.setReturnValues([]);
          }.bind(this), null, {
            customUrl: cdUrl
          });
        } else {
          window.open(cdUrl, filename);
          return [];
        }
      },

      /**
       * Get Browser's Geolocation
       * Returns status, latitude, longitude
       * (Alias of mobile module's getGeolocation)
       */
      getGeolocation: function() {
        context.FrontCallService.modules.mobile.getgeolocation.call(this);
      },

      /**
       * Returns an environment variable set in the user session on the front end platform.
       * @unsupported
       * @param name
       * @returns {string[]}
       */
      getEnv: function(name) {
        if (name === undefined) {
          this.parametersError();
          return undefined;
        }
        return [''];
      },

      /**
       * Returns the local window manager identifier of the window
       * @unsupported
       * @param auiWindowId
       * @returns {string[]}
       */
      getWindowId: function(auiWindowId) {
        if (auiWindowId === undefined) {
          this.parametersError();
          return undefined;
        }
        return [''];
      },

      /**
       * Checks that the content is in the foreground
       * Returns true if the page content is at least partially visible (foreground tab of a non minimized window)
       * (Alias of mobile module's isForeground)
       */
      isForeground: function() {
        context.FrontCallService.modules.mobile.isforeground.call(this);
      },

      /**
       * Opens a URL with the default URL handler of the front-end.
       * @param {string} url to open
       * @param {string=} mode how to open, if 'replace', will open it in the app window
       * @returns {string[]}
       */
      launchURL: function(url, mode) {
        if (url === undefined) {
          this.parametersError();
          return [''];
        }
        const specialSchemas = ['mailto:', 'news:', 'file:', 'tel:', 'sms:'];
        let replace = (mode === 'replace');

        // Do not open a blank window if it's a redirect url
        if (specialSchemas.some((schema) => url.indexOf(schema) >= 0)) {
          replace = true;
        }
        if (replace) {
          gbc.canShowExitWarning = false;
          window.location = url;
        } else { // 'popup'
          const win = window.open('about:blank');
          if (win) {
            win.document.write('<html><body><a href="' + url +
              '" target="_self">' + i18next.t("gwc.app.noload") + '</a></body></html>');
            win.document.close();
            win.location = url;
          }
        }
        return [];
      },

      /**
       * Unloads a DLL or shared library front call module.
       * @unsupported
       * @param name
       * @returns {*}
       */
      mdClose: function(name) {
        if (name === undefined) {
          this.parametersError();
          return;
        }
        return [-2];
      },

      /**
       * Displays a file dialog window to get a directory path on the local file system.
       * @unsupported
       * @param path
       * @param caption
       * @returns {string[]}
       */
      openDir: function(path, caption) {
        if (path === undefined || caption === undefined) {
          this.parametersError();
          return undefined;
        }
        return [''];
      },

      /**
       * Displays a file dialog window to let the user select a single file path on the local file system.
       * @param path
       * @param fileTypeName
       * @param wildcards
       * @param caption
       */
      openFile: function(path, fileTypeName, wildcards, caption) {
        const app = this.getAnchorNode().getApplication();
        this._filePickerWidget = app.filetransfer.openFile({
            path: path,
            fileTypeName: fileTypeName,
            wildcards: wildcards,
            caption: caption
          }, function(filename) {
            const functionCallNode = this.getAnchorNode();
            if (functionCallNode) {
              this.setReturnValues([filename]);
            } else {
              this.displayErrorMessage(i18next.t('gwc.file.upload.file-already-uploaded'));
            }
          }.bind(this),
          function(msg) {
            this.runtimeError(msg);
          }.bind(this));
      },

      /**
       * Displays a file dialog window to let the user select a list of file paths on the local file system.
       * @param path
       * @param fileTypeName
       * @param wildcards
       * @param caption
       */
      openFiles: function(path, fileTypeName, wildcards, caption) {
        const app = this.getAnchorNode().getApplication();
        this._filePickerWidget = app.filetransfer.openFiles({
            path: path,
            fileTypeName: fileTypeName,
            wildcards: wildcards,
            caption: caption
          }, function(filenames) {
            const functionCallNode = this.getAnchorNode();
            if (functionCallNode) {
              this.setReturnValues([JSON.stringify(filenames)]);
            } else {
              this.displayErrorMessage(i18next.t('gwc.file.upload.files-already-uploaded'));
            }
          }.bind(this),
          function(msg) {
            this.runtimeError(msg);
          }.bind(this));
      },

      /**
       * Displays the setting pannel as a modal 
       * @returns {Array}
       */
      openSettings: function() {
        if (this._settingsModal === undefined || this._settingsModal === null) {
          const app = this.getAnchorNode().getApplication();
          this._settingsModal = cls.WidgetFactory.createWidget('ApplicationHostSettings', {
            appHash: app.applicationHash
          });
          document.body.appendChild(this._settingsModal.getElement());
          this._settingsModal.when(context.constants.widgetEvents.close, function() {
            if (this._settingsModal) {
              this._settingsModal.destroy();
              this._settingsModal = null;
            }
          }.bind(this), true);
        }
        this._settingsModal.show();
        return [''];
      },

      /**
       * Plays the sound file passed as parameter on the front-end platform.
       * @param {string} soundFile source (local or distant)
       * @returns {Array}
       */
      playSound: function(soundFile) {
        if (soundFile === undefined) {
          this.parametersError();
          return undefined;
        }
        const audio = context.TemplateService.renderDOM('FrontCallStandardPlaySound');
        audio.setAttribute('src', soundFile);
        try {
          audio.play();
          return [];
        } catch (err) {
          console.warn(err);
          return [false];
        }
      },

      /**
       * Displays a file dialog window to get a path to save a file on the local file system.
       * @unsupported
       * @param path
       * @param name
       * @param filetype
       * @param caption
       * @returns {string[]}
       */
      saveFile: function(path, name, filetype, caption) {
        if (path === undefined || name === undefined || filetype === undefined || caption === undefined) {
          this.parametersError();
          return undefined;
        }
        return [''];
      },

      /**
       * Override the font used for report generation for the current application.
       * @unsupported
       * @param font
       * @returns {boolean[]}
       */
      setReportFont: function(font) {
        if (font === undefined) {
          this.parametersError();
          return undefined;
        }
        return [false];
      },

      /**
       * Override the printer configuration used for report generation for the current application.
       * @unsupported
       * @param printer
       * @returns {boolean[]}
       */
      setReportPrinter: function(printer) {
        if (printer === undefined) {
          this.parametersError();
          return undefined;
        }
        return [false];
      },

      /**
       * Defines the base path where web components are located.
       * @deprecated
       * @param path
       * @returns {Array}
       */
      setWebComponentPath: function(path) {
        if (path === undefined) {
          this.parametersError();
          return undefined;
        }
        this.getAnchorNode().getApplication().info().webComponentUsrPath = path;
        return [];
      },

      /**
       * Opens a file on the front-end platform with the program associated to the file extension.
       * @unsupported
       * @param document
       * @param action
       * @returns {boolean[]}
       */
      shellExec: function(document, action) {
        if (document === undefined) {
          this.parametersError();
          return undefined;
        }
        return [false];
      }
    };
  }
);
