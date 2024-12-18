/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('FileTransferApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {
    /**
     * Base class of application scoped services
     * @class FileTransferApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.FileTransferApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.FileTransferApplicationService.prototype */ {
        __name: "FileTransferApplicationService",
        /**
         * @type {Object<string, Array<FilePickerWidget>>}
         */
        _fileChoosers: null,
        /**
         * @inheritDoc
         */
        constructor: function(app) {
          $super.constructor.call(this, app);
          this._fileChoosers = {};
        },
        /**
         * Handler raised on file pick
         * @param callback
         * @param errorCallback
         * @param event
         * @param src
         * @param data
         * @private
         */
        _whenFileSelectionChanged: function(callback, errorCallback, event, src, data) {
          let hasData = false;
          let normalizedFileName = "";
          if (data) {
            if (Array.isArray(data)) {
              if (data.length) {
                hasData = true;
                for (const fileName of data) {
                  // normalize() converts 2 combined diacritical marks into 1 (ex: é encoded as e')
                  // For exemple under Safari a file with name 'Qualité.pdf' has a length of 12 while under
                  // chrome length will be 11 because of the special accent char : é
                  // for this reason we need to normalize our file name.
                  // ! IE11 doesn't support normalize.
                  normalizedFileName = fileName.normalize ? fileName.normalize() : fileName;
                  this._fileChoosers[normalizedFileName] = this._fileChoosers[normalizedFileName] || [];
                  this._fileChoosers[normalizedFileName].push(src);
                  src._processing = true;
                }
              } else {
                src.destroy();
              }
            } else {
              hasData = true;
              // cf previous comment of normalize()
              normalizedFileName = data.normalize ? data.normalize() : data;
              this._fileChoosers[normalizedFileName] = this._fileChoosers[normalizedFileName] || [];
              this._fileChoosers[normalizedFileName].push(src);
              src._processing = true;
            }
            if (hasData) {
              src.when(context.constants.widgetEvents.destroyed, this._onFilePickerDestroyed.bind(this, src), true);
            }
            callback(data);
          } else {
            src.destroy();
            callback("");
          }
        },
        /**
         * manage openFile frontcall
         * @param options
         * @param callback
         * @param errorCallback
         * @return {classes.FilePickerWidget} the new FilePicketWidget
         */
        openFile: function(options, callback, errorCallback) {
          const filePicker = cls.WidgetFactory.createWidget("FilePicker", {
            appHash: this._application.applicationHash
          });
          this._application.layout.afterLayout(function() {
            filePicker.resizeHandler();
          });
          this._application.getUI().getWidget().getElement().appendChild(filePicker.getElement());
          filePicker.setExtension(this._extractExtensions(options && options.wildcards || ""));
          filePicker.setCaption(options && options.caption || "");
          filePicker.show();
          filePicker.whenFileSelectionChanged(this._whenFileSelectionChanged.bind(this, callback, errorCallback));

          return filePicker;
        },
        /**
         * manage openFiles frontcall
         * @param options
         * @param callback
         * @param errorCallback
         * @return {classes.FilePickerWidget} return the new FilePicker widget
         */
        openFiles: function(options, callback, errorCallback) {
          const filePicker = cls.WidgetFactory.createWidget("FilePicker", {
            appHash: this._application.applicationHash
          });
          this._application.layout.afterLayout(function() {
            filePicker.resizeHandler();
          });
          this._application.getUI().getWidget().getElement().appendChild(filePicker.getElement());
          filePicker.setExtension(this._extractExtensions(options && options.wildcards || ""));
          filePicker.setCaption(options && options.caption || "");
          filePicker.allowMultipleFiles(true);
          filePicker.show();
          filePicker.whenFileSelectionChanged(this._whenFileSelectionChanged.bind(this, callback, errorCallback));

          return filePicker;
        },

        /**
         * Fetches a blob and sends it to the VM
         * @param blobURL - where to fetch the blob (must be local address)
         * @param url - where to send the blob
         * @param onSuccess
         * @param onError
         * @returns {Promise<void>}
         * @private
         */
        _sendBlob: async function(blobURL, url, onSuccess, onError) {
          const request = new XMLHttpRequest();
          if (context.ThemeService.getValue("theme-network-use-credentials-headers")) {
            request.withCredentials = true;
          }
          request.onload = (event) => {
            if (event.target.status === 413) {
              // File too big
              onError();
            } else {
              onSuccess();
            }
          };
          request.onerror = (event) => {
            onError();
          };
          request.open("POST", url);

          let blob = await fetch(blobURL)
            .then(response => response.blob())
            .catch(error => onError(error));

          if (blob) {
            let formData = new FormData();
            formData.append(blobURL, blob);
            request.send(formData);
          }
        },

        /**
         * getFile method executed on getfile frontcall call
         * @param options
         * @param callback
         * @param errorCallback
         * @return {classes.FilePickerWidget} return the new FilePicker widget
         */
        getFile: function(options, callback, errorCallback) {
          if (options.filename.startsWith("blob")) {
            this._sendBlob(options.filename, options.fileTransferUrl, callback, errorCallback);
          } else {
            let filePicker;
            // cf previous comment of normalize() in _whenFileSelectionChanged function definition
            const normalizedFileName = options.filename.normalize ? options.filename.normalize() : options.filename;
            const onSuccess = () => {
                if (filePicker._processing) {
                  if (this._application.getMenu("uploadStatus")) {
                    this._application.getMenu("uploadStatus").setIdle();
                  }
                }
                callback();
                filePicker.freeFile(normalizedFileName, true);
                if (this._fileChoosers[normalizedFileName]) {
                  this._fileChoosers[normalizedFileName].remove(filePicker);
                }
              },
              onError = () => {
                if (filePicker._processing) {
                  if (this._application.getMenu("uploadStatus")) {
                    this._application.getMenu("uploadStatus").setIdle();
                  }
                }
                errorCallback();
                filePicker.freeFile(normalizedFileName, true);
                if (this._fileChoosers[normalizedFileName]) {
                  this._fileChoosers[normalizedFileName].remove(filePicker);
                }
              },
              onProgress = (progressEvent) => {
                this._application.getMenu("uploadStatus").setProgress({
                  loaded: progressEvent.loaded,
                  total: progressEvent.total
                });
              },
              onFile = (file) => {
                if (!file) {
                  onError();
                } else {
                  if (this._application.getMenu("uploadStatus")) {
                    this._application.getMenu("uploadStatus").setProcessing();
                  }
                  const url = options.fileTransferUrl;
                  filePicker.send(file, url, onSuccess, onError, onProgress);
                }
              };

            if (this._fileChoosers[normalizedFileName] && this._fileChoosers[normalizedFileName].length) {
              filePicker = this._fileChoosers[normalizedFileName].shift();
              onFile(normalizedFileName);
            } else {
              filePicker = cls.WidgetFactory.createWidget("FilePicker", {
                appHash: this._application.applicationHash
              });
              this._application.layout.afterLayout(function() {
                filePicker.resizeHandler();
              });
              this._application.getUI().getWidget().getElement().appendChild(filePicker.getElement());
              filePicker.setExtension("." + normalizedFileName.split('.').pop());
              filePicker.show();
              filePicker.whenFileSelectionChanged(this._whenFileSelectionChanged.bind(this, onFile, onError));
            }
          }
        },
        /**
         * @inheritDoc
         */
        destroy: function() {
          const destroyable = [],
            keys = Object.keys(this._fileChoosers);
          let len = keys.length,
            k = 0,
            i = 0;
          for (; k < len; k++) {
            while (this._fileChoosers[keys[k]] && this._fileChoosers[keys[k]][i]) {
              if (!destroyable.contains(this._fileChoosers[keys[k]][i])) {
                destroyable.push(this._fileChoosers[keys[k]][i]);
              }
              i++;
            }
          }
          len = destroyable.length;
          for (k = 0; k < len; k++) {
            destroyable[k].destroy();
          }
          $super.destroy.call(this);
        },

        /**
         * free resources when a file picker is destroyed
         * @param {classes.FilePickerWidget} picker
         * @private
         */
        _onFilePickerDestroyed: function(picker) {
          const files = picker && picker.getAvailableFiles();
          if (files) {
            for (const element of files) {
              if (this._fileChoosers[element]) {
                this._fileChoosers[element].remove(picker);
              }
            }
          }
        },

        /**
         * format extensions
         * @param {string} raw
         * @return {string}
         * @private
         */
        _extractExtensions: function(raw) {
          const regex = /[^\s.]+\.[^\s.]+/g;
          let m;
          const res = [];
          while ((m = regex.exec(raw)) !== null) {
            const ext = m[1];
            if (ext === ".*") {
              res.length = 0;
              break;
            }
            res.push(ext);
          }
          return res.join(",") || "";
        }
      };
    });
    cls.ApplicationServiceFactory.register("FileTransfer", cls.FileTransferApplicationService);
  });
