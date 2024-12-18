/// FOURJS_START_COPYRIGHT(D,2016)
/// Property of Four Js*
/// (c) Copyright Four Js 2016, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('FilePickerWidget', ['ModalWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class FilePickerWidget
     * @memberOf classes
     * @extends classes.ModalWidget
     */
    cls.FilePickerWidget = context.oo.Class(cls.ModalWidget, function($super) {
      return /** @lends classes.FilePickerWidget.prototype */ {
        __name: "FilePickerWidget",
        __templateName: "ModalWidget",
        $static: {
          fileSelectionChangedEvent: "fileSelectionChanged"
        },
        /**
         * @type {HTMLElement}
         */
        _headerTitleDom: null,
        /**
         * @type {classes.FileInputWidget}
         */
        _fileInput: null,
        /**
         * @type {?string}
         */
        _rawCaption: null,

        /**
         * @type {Number}
         */
        _selfDestroyTimer: null,
        /**
         * @type {Array<string>}
         */
        _selectedFiles: null,
        /**
         * @type {Array<string>}
         */
        _availableFiles: null,

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);
          this._element.addClass("gbc_ModalWidget").addClass("mt-dialog-filetransfer");
          const dialogContents = document.createElement("div");

          this._headerTitleDom = document.createElement('span');
          this._headerTitleDom.innerHTML = '<i class="zmdi zmdi-upload"></i> <span>' + i18next.t("gwc.file.upload.select") +
            '<span>';
          this.setHeader(this._headerTitleDom);

          this.setClosable(true);
          this.setContent(dialogContents);

          this._fileInput = cls.WidgetFactory.createWidget("FileInput", this.getBuildParameters());
          dialogContents.appendChild(this._fileInput.getElement());
          this._fileInput.setParentWidget(this);
          this._fileInput.whenFileSelectionChanged(this._whenFileSelectionChanged.bind(this));

          this.when(context.constants.widgetEvents.modalOut, function() {
            this.hide(false);
          }.bind(this));
          this.when(context.constants.widgetEvents.close, function() {
            this.hide(false);
          }.bind(this));
        },

        /**
         * @inheritDoc
         */
        destroy: function(force) {
          if (force) {
            this._destroy();
            return;
          }

          context.WidgetService.addDelayedWidgetDestroy(this);
          this._resetSelfDestroy();
        },

        /**
         * Really destroy the widget
         * @private
         */
        _destroy: function() {
          if (this._fileInput) {
            this._fileInput.destroy();
            this._fileInput = null;

            $super.destroy.call(this);
            context.WidgetService.removeDelayedWidgetDestroy(this);
          }
          this._headerTitleDom = null;
        },

        /**
         * @inheritDoc
         */
        show: function() {
          $super.show.call(this);
          this.resizeHandler();
        },
        /**
         * hides the dialog
         * @inheritDoc
         * @param {boolean} gotFile
         */
        hide: function(gotFile) {
          const wasDisplayed = this.isVisible();
          this._resetAsMoved();
          $super.hide.call(this);
          if (wasDisplayed && !gotFile) {
            const emptySelection = this._fileInput && this._fileInput.isAllowMultipleFiles() ? [] : null;
            this.emit(cls.FilePickerWidget.fileSelectionChangedEvent, emptySelection);
          }
        },
        /**
         * sets the file input extension filter
         * @param {string} extension
         */
        setExtension: function(extension) {
          this._fileInput.setExtension(extension);
        },

        /**
         * sets the dialog caption
         * @param {string} caption
         */
        setCaption: function(caption) {
          this._rawCaption = caption;
          this._updateCaption();
        },

        /**
         * updates dialog caption
         * @private
         */
        _updateCaption: function() {
          let caption = this._rawCaption;
          if (!this._rawCaption) {
            if (this._fileInput.isAllowMultipleFiles()) {
              caption = i18next.t("gwc.file.upload.select-multiple");
            } else {
              caption = i18next.t("gwc.file.upload.select");
            }
          }
          this._headerTitleDom.querySelector("span").textContent = caption;
        },

        /**
         * Specify whether to allow multiple file selection or not
         * @param {boolean} allow
         */
        allowMultipleFiles: function(allow) {
          this._fileInput.allowMultipleFiles(allow);
          this._updateCaption();
        },

        /**
         * callback when file input selection changed
         * @param event
         * @param src
         * @param data
         * @private
         */
        _whenFileSelectionChanged: function(event, src, data) {
          // normalize() converts 2 combined diacritical marks into 1 (ex: é encoded as e')
          // For example under Safari a file with name 'Qualité.pdf' has a length of 12 while under
          // chrome length will be 11 because of the special accent char : é
          // for this reason we need to normalize our file name
          // ! IE11 doesn't support normalize.
          if (Array.isArray(data)) {
            this._selectedFiles = data;
          } else {
            const fileName = data.normalize ? data.normalize() : data;
            this._selectedFiles = [fileName];
          }
          this._availableFiles = this._selectedFiles.slice();
          this.emit(cls.FilePickerWidget.fileSelectionChangedEvent, data);
          this._resetSelfDestroy();
          this.hide(true);
        },

        /**
         * register callback when file input selection changed
         * @param {Hook} hook
         * @return {HandleRegistration}
         */
        whenFileSelectionChanged: function(hook) {
          return this.when(cls.FileInputWidget.fileSelectionChangedEvent, hook);
        },

        /**
         * gets the files availables for sending
         * @return {Array<string>}
         */
        getAvailableFiles: function() {
          return this._availableFiles || [];
        },

        /**
         * sends the given filename's resource to the given url
         * @param {string} filename
         * @param {string} url
         * @param {function} callback
         * @param {function} errorCallback
         * @param {function} progressHandler - called while progress event is sent
         */
        send: function(filename, url, callback, errorCallback, progressHandler) {
          this._stopSelfDestroyTimer();
          const cb = function(fn, data) {
            this._startSelfDestroyTimer();
            fn(data);
          };
          this._fileInput.send(filename, url, cb.bind(this, callback), cb.bind(this, errorCallback), cb.bind(this, progressHandler));
        },

        /**
         * free the given filename's resource
         * @param {string} filename
         * @param {boolean} [selfDestroyOnEmpty] if no more files waiting, self-destructs if true
         */
        freeFile: function(filename, selfDestroyOnEmpty) {
          if (this._availableFiles) {
            this._availableFiles.remove(filename);
            if (selfDestroyOnEmpty && !this._availableFiles.length) {
              this._destroy();
            }
          }
        },

        /**
         * stop the self-destruction timer
         * @private
         */
        _stopSelfDestroyTimer: function() {
          if (this._selfDestroyTimer) {
            this._clearTimeout(this._selfDestroyTimer);
            this._selfDestroyTimer = null;
          }
        },
        /**
         * start the self-destruction timer
         * @private
         */
        _startSelfDestroyTimer: function() {
          const timeout = parseInt(context.ThemeService.getValue("$gbc-FilePicker-selfdestroy-timeout"), 10) || 900;
          this._selfDestroyTimer = this._registerTimeout(this._onSelfDestroy.bind(this), timeout * 1000);
        },
        /**
         * reset the self-destruction timer
         * @private
         */
        _resetSelfDestroy: function() {
          this._stopSelfDestroyTimer();
          this._startSelfDestroyTimer();
        },
        /**
         * triggered when self-destruction activates
         * @private
         */
        _onSelfDestroy: function() {
          this._selfDestroyTimer = null;
          this._destroy();
        }
      };
    });
    cls.WidgetFactory.registerBuilder('FilePicker', cls.FilePickerWidget);
  });
