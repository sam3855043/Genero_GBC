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

modulum('ClipboardService', ['InitService'],
  function(context, cls) {

    /**
     * @namespace gbc.ClipboardService
     * @gbcService
     */
    context.ClipboardService = context.oo.StaticClass( /** @lends gbc.ClipboardService */ {
      __name: "ClipboardService",

      /** @type {Clipboard} */
      _clipboard: null,

      /**
       *  Init ClipboardService
       */
      init: function() {
        this._clipboard = navigator.clipboard;

        if (this._clipboard) {
          document.body.on('paste.ClipboardService', this._handlePaste.bind(this));
          document.body.on('copy.ClipboardService', this._handleCopy.bind(this));
          document.body.on('cut.ClipboardService', this._handleCut.bind(this));
        } else {
          context.LogService.warn("Clipboard API is not available on your device");
        }

      },

      /**
       * Handle Paste event
       * @param {ClipboardEvent} event
       * @private
       */
      _handlePaste: function(event) {
        context.LogService.clipboard.log("Paste event : ", event);

        if (!this._canProcessEvent()) {
          return;
        }

        // search widget from dom event
        const widget = gbc.WidgetService.getWidgetFromElement(event.target);
        // if a widget is found
        if (widget) {

          // Get pasted data via event (no need of clipboard API)
          const clipboardData = event.clipboardData || window.clipboardData;
          const pastedData = clipboardData.getData('Text');

          // Add Paste command to scheduler
          context.SessionService.getCurrent().getCurrentApplication().scheduler.clipboardPasteCommand(pastedData, widget);

          // Cancel the native paste
          event.preventCancelableDefault();
        }
      },

      /**
       * Handle Copy event
       * @param {ClipboardEvent} event
       * @private
       */
      _handleCopy: function(event) {
        context.LogService.clipboard.log("Copy event : ", event);

        // search widget from dom event
        let widget = gbc.WidgetService.getWidgetFromElement(event.target);

        // if a widget is found
        if (widget) {

          if (widget.isInTable()) {
            widget = widget.getTableWidgetBase();
          }

          // Get data from clipboard API
          navigator.clipboard.readText().then(async function(clipboardText) {
            // widget manage copied text
            const newText = widget.manageClipboardCopy(clipboardText);
            if (newText !== clipboardText) {
              // if text has been changed by widget write it in clipboard
              await navigator.clipboard.writeText(newText);
            }
          });
        }
      },

      /**
       * Handle Cut event
       * @param {ClipboardEvent} event
       * @private
       */
      _handleCut: function(event) {
        context.LogService.clipboard.log("Cut event : ", event);

        // search widget from dom event
        let widget = gbc.WidgetService.getWidgetFromElement(event.target);

        // if a widget is found
        if (widget) {

          this.cutFromWidget(widget);

          // Cancel the native cut
          event.preventCancelableDefault();
        }
      },

      /**
       * Paste content of clipboard in the given widget
       * @param {classes.WidgetBase} widget
       */
      pasteToWidget: async function(widget) {

        if (!this.isApiAvailable()) {
          return false;
        }

        const text = await this.getClipboardData();
        context.SessionService.getCurrent().getCurrentApplication().scheduler.clipboardPasteCommand(text, widget);
        return true;
      },

      /**
       * Copy content of the widget to the clipboard
       * @param {classes.WidgetBase} widget
       * @param {?string} [forcedValue]
       * @param {Boolean} [ignoreSelection]
       */
      copyFromWidget: async function(widget, forcedValue = null, ignoreSelection = false) {

        if (!this.isApiAvailable()) {
          return;
        }

        const copyData = forcedValue !== null ? forcedValue : widget.manageClipboardCopy(widget.getValueForClipboard(ignoreSelection));
        context.LogService.clipboard.log(`Set clipboard from widget COPY ${widget._auiName}`);
        await this.setClipboardData(copyData);
      },

      /**
       * Copy content of the widget to the clipboard
       * @param {classes.WidgetBase} widget
       */
      cutFromWidget: function(widget) {
        if (!this.isApiAvailable()) {
          return;
        }
        context.SessionService.getCurrent().getCurrentApplication().scheduler.clipboardCutCommand(widget);
      },

      /**
       * Check if clipboard API is available
       * @return {boolean}
       */
      isApiAvailable: function() {
        if (!this._clipboard) {
          context.LogService.clipboard.error(`Clipboard api not available`);
        }

        return !!this._clipboard;
      },

      /**
       * @return {boolean} false if the application is waiting in background
       * @private
       */
      _canProcessEvent: function() {
        const application = context.SessionService.getCurrent()?.getCurrentApplication();

        if (application) {
          return application.canProcessEvent();
        }

        return true;
      },

      /**
       * Get the clipboard content
       * @returns {Promise<String>}
       */
      getClipboardData: async function() {
        try {
          return await navigator.clipboard.readText();
        } catch (err) {
          context.LogService.clipboard.error(`Failed to get data from clipboard ${err}`);
          return null;
        }
      },

      /**
       * Set the clipboard content
       * @returns {Promise<boolean>}
       */
      setClipboardData: async function(textToSet) {
        if (!this.isApiAvailable()) {
          return false;
        }

        if (textToSet === null) {
          return false;
        }

        try {
          await this._clipboard.writeText(textToSet);
          context.LogService.clipboard.log(`Set clipboard data: ${textToSet}`);
          return true;
        } catch (e) {
          return false;
        }
      },

      /**
       * Add text to the current clipboard content
       * @param {string} textToAdd
       * @returns {Promise<boolean>}
       */
      addToClipboardData: async function(textToAdd) {
        if (!this.isApiAvailable()) {
          return false;
        }
        try {
          const currentText = await this._clipboard.readText();
          await navigator.clipboard.writeText(currentText + textToAdd);
          context.LogService.clipboard.log(`Add data to existing clipboard. New clipboard : ${currentText + textToAdd}`);
          return true;
        } catch (e) {
          return false;
        }
      }
    });
    context.InitService.register(context.ClipboardService);
  });
