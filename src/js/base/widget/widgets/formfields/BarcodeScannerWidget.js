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

modulum('BarcodeScannerWidget', ['ModalWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class BarcodeScannerWidget
     * @memberOf classes
     * @extends classes.ModalWidget
     */
    cls.BarcodeScannerWidget = context.oo.Class(cls.ModalWidget, function($super) {
      return /** @lends classes.BarcodeScannerWidget.prototype */ {
        __name: "BarcodeScannerWidget",
        __templateName: "ModalWidget",

        _videoDom: null,

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);
          this._element.addClass("gbc_ModalWidget");
          const dialogContents = document.createElement("div");
          const headerTitleDom = document.createElement('span');
          headerTitleDom.innerHTML = "Barcode Scanner";

          this._videoDom = document.createElement('video');

          this._videoDom.autoplay = true;
          dialogContents.appendChild(this._videoDom);

          this.setHeader(headerTitleDom);
          this.setClosable(true);
          this.setContent(dialogContents);

          this.when(context.constants.widgetEvents.modalOut, function() {
            this.hide(false);
          }.bind(this));
          this.when(context.constants.widgetEvents.close, function() {
            this.hide(false);
          }.bind(this));
        },

        /**
         * Starts the video feed in the widget
         * @returns {Promise<void>}
         * @private
         */
        _startStream: async function() {
          this._videoDom.srcObject = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              width: {
                max: window.innerWidth * 0.9
              },
              height: {
                max: window.innerHeight * 0.9
              },
              focusMode: "continuous",
              facingMode: {
                ideal: "environment"
              },
            }
          });
          this._videoDom.onloadedmetadata = (e) => {
            this._videoDom.play();
          };

        },

        /**
         * Self-repeating function that extracts a shot from the video feed to detect a barcode
         * once per second until a barcode is detected or the feed is cut
         * @param onDetect result callback which expects data as a parameter
         * @returns {Promise<void>}
         */
        detectBarcode: async function(onDetect) {
          if (!("BarcodeDetector" in window)) {
            onDetect(null);
            return;
          }
          if (this._videoDom && this._videoDom.videoWidth && this._videoDom.videoHeight) {
            const barcodeDetector = new window.BarcodeDetector();
            try {
              barcodeDetector.detect(this._videoDom).then((barcodes) => {
                if (barcodes.length > 0) {
                  onDetect(barcodes[0]);
                } else {
                  this._registerTimeout(this.detectBarcode.bind(this, onDetect), 1000);
                }
              });
            } catch (e) {
              onDetect(null);
            }
          } else {
            this._registerTimeout(this.detectBarcode.bind(this, onDetect), 1000);
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._videoDom) {
            if (this._videoDom.srcObject) {
              this._videoDom.srcObject.getTracks()[0].stop();
              this._videoDom.srcObject = null;
            }
            this._videoDom = null;
          }
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        show: async function() {
          await this._startStream();
          $super.show.call(this);
          this.resizeHandler();
        },

        /**
         * hides the dialog
         * @inheritDoc
         */
        hide: function() {
          if (this._videoDom) {
            this._videoDom.srcObject.getTracks()[0].stop();
            this._videoDom.srcObject = null;
            this._videoDom = null;
          }
          this._resetAsMoved();
          $super.hide.call(this);
        },
      };
    });
    cls.WidgetFactory.registerBuilder('BarcodeScanner', cls.BarcodeScannerWidget);
  });
