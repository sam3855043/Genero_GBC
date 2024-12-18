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

modulum('ChromeBarItemUploadStatusWidget', ['ChromeBarItemWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Close Button in ChromeBar
     * @class ChromeBarItemUploadStatusWidget
     * @memberOf classes
     * @extends classes.ChromeBarItemWidget
     */
    cls.ChromeBarItemUploadStatusWidget = context.oo.Class(cls.ChromeBarItemWidget, function($super) {
      return /** @lends classes.ChromeBarItemUploadStatusWidget.prototype */ {
        __name: "ChromeBarItemUploadStatusWidget",
        __templateName: "ChromeBarItemWidget",

        _active: false,
        _count: 0,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this.setItemType("gbcItem");
          this.setTitle(i18next.t('gwc.file.upload.processing'));
          this.setImage("zmdi-upload");
        },

        /**
         * Change style when idle
         */
        setIdle: function() {
          this._count--;
          if (this._count === 0) {
            this.removeClass("processing");

          }
        },

        /**
         * Change style when processing
         */
        setProcessing: function() {
          this._count++;
          this.addClass("processing");
        },

        /**
         * Handle file upload progress
         * @param {Object} progress object info
         * @param {number} progress.loaded amount already uploaded
         * @param {number} progress.total total amount of data
         */
        setProgress: function(progress) {
          const percent = Math.round(progress.loaded * 100 / progress.total);
          this.setText(percent + "%");
          this.setImage();
          const loadingBar = document.querySelector(".loading-bar");
          loadingBar.setAttribute("percent", percent.toString());
          loadingBar.style.width = percent.toString() + "%";
          if (percent === 100) {
            loadingBar.removeAttribute("percent");
            loadingBar.style.width = "100%";
          }
          this.setTitle(i18next.t('gwc.file.upload.processing') + " (" + this.formatFileSize(progress.loaded) + "/" + this.formatFileSize(
            progress.total) + ")");
        },

        /**
         * Display human-readable value
         * @param {Number} bytes
         * @param {Number?} decimalPoint - length of the decimal part
         * @return {string} human readable value
         */
        formatFileSize: function(bytes, decimalPoint) {
          if (bytes === 0) {
            return '0 Bytes';
          }
          const k = 1000,
            dm = decimalPoint || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },

        /**
         * @inheritDoc
         */
        canBeInTheOverFlowMenu: function() {
          return false;
        }

      };
    });
    cls.WidgetFactory.registerBuilder('ChromeBarItemUploadStatus', cls.ChromeBarItemUploadStatusWidget);
  });
