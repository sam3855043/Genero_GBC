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

modulum('FrontCallService.modules.mobile', ['FrontCallService'],
  function(context, cls) {
    /**
     * Private helper function for the photo/video selection mobile frontcalls
     * @param type input type, should be "file"
     * @param accept image or video
     * @param capture null for file selector, environment for primary camera
     */
    const manageInput = function(type, accept, capture) {
      let input = document.createElement('input');
      input.type = type;
      input.accept = accept;
      if (capture) {
        input.capture = capture;
      }

      input.oncancel = () => {
        this.setReturnValues([null]);
      };
      input.onchange = (e) => {
        var file = e.target.files[0];
        if (file) {
          this.setReturnValues([URL.createObjectURL(file)]);
        } else {
          this.setReturnValues([null]);
        }
      };

      if (!window.browserInfo.isSafari) {
        input.click();
      } else {
        // setTimeout at 0ms to wait until the JS event stack is cleared and has processed the previous input init code
        // https://stackoverflow.com/a/779785
        setTimeout(() => {
          input.click();
        });
        setTimeout(() => {
          // empty timeout that makes "capture" type work
        }, 3000);
      }
    };

    /**
     * Mobile module to store variables into browser's sessions
     * @instance mobile
     * @memberOf gbc.FrontCallService.modules
     */
    context.FrontCallService.modules.mobile = /** @lends gbc.FrontCallService.modules.mobile */ {

      /**
       * Invokes the mobile device's contact list to select a contact
       * Only available on chrome Android
       * Returns the vCard of the contact
       */
      chooseContact: async function() {
        if (!navigator.contacts) {
          this.runtimeError("This browser does not support chooseContact");
          return;
        }

        try {
          const contactProperties = ["name", "email", "tel", "address"];
          const contact = await navigator.contacts.select(contactProperties);
          if (!contact || !contact[0]) {
            this.setReturnValues([null]);
            return;
          }

          const [firstContact] = contact;
          const {
            name = "", address = "", tel = "", email = ""
          } = firstContact;

          const vCard =
            `BEGIN:VCARD\n` +
            `VERSION:4.0\n` +
            `FN:${name};\n` +
            `TEL;TYPE=voice;VALUE=uri:tel:${tel}\n` +
            `ADR;LABEL=${address}\n` +
            `EMAIL:${email}\n` +
            `END:VCARD\n`;
          this.setReturnValues([vCard]);
        } catch (ex) {
          this.runtimeError(ex);
        }
      },

      /**
       * Invokes the device's default mail app
       * Returns ok if the app was opened, failed otherwise
       */
      composeMail: function(to, subject, content, cc = "", bcc = "", attachments = null) {
        const statusOK = "ok";
        const statusFAILED = "failed";

        if (!to || !subject || !content) {
          this.parametersError("Missing parameter");
          return;
        }

        if (attachments) {
          this.parametersError("Attachments are not supported by GBC frontcalls");
          return;
        }

        try {
          window.open(`mailto:${to}?cc=${cc}&bcc=${bcc}&subject=${subject}&body=${content}`);
        } catch (e) {
          this.setReturnValues([`${statusFAILED}: ${e}`]);

          return;
        }
        this.setReturnValues([statusOK]);
      },

      /**
       * Invokes the device's default messaging app
       * Returns ok if the app was opened, failed otherwise
       */
      composeSMS: function(recipients, content) {
        const statusOK = "ok";
        const statusFAILED = "failed";

        if (!recipients || !content) {
          this.parametersError("Missing parameter");
          return;
        }

        try {
          window.location = `sms:+${recipients};?&body=${content}`;
        } catch (e) {
          this.setReturnValues([statusFAILED]);
          return;
        }
        return [statusOK];
      },

      /**
       * On Android, checks for the specific type of connection, otherwise checks for online/offline status
       * Returns the type of connection
       */
      connectivity: function() {
        const statusNONE = "NONE";
        const statusWIFI = "WIFI";
        const statusETHERNET = "Ethernet";
        const statusMOBILE = "MobileNetwork";
        const statusUNDEFINED = "Undefined Network";

        if (!navigator.connection) {
          // Check for any kind of connection
          if (navigator.onLine) {
            this.setReturnValues([statusUNDEFINED]);
            return;
          }
          this.setReturnValues([statusNONE]);
          return;
        }

        if (typeof navigator.connection.type === "undefined") {
          this.setReturnValues([statusUNDEFINED]);
          return;
        }

        if (navigator.connection.type === "cellular") {
          return this.setReturnValues([statusMOBILE]);
        }
        if (navigator.connection.type === "ethernet") {
          return this.setReturnValues([statusETHERNET]);
        }
        if (navigator.connection.type === "wifi") {
          return this.setReturnValues([statusWIFI]);
        }

        if (navigator.onLine) {
          this.setReturnValues([statusUNDEFINED]);
          return;
        }

        return this.setReturnValues([statusNONE]);
      },

      /**
       * Checks that the content is in the foreground
       * Returns true if the page content is at least partially visible (foreground tab of a non minimized window)
       */
      isForeground: function() {
        try {
          this.setReturnValues([document.visibilityState === "visible"]);
        } catch (e) {
          this.runtimeError("This browser does not support visibility check");
        }
      },

      /**
       * Opens a BarcodeScanner widget to scan any barcode with the device's primary camera
       * Returns two strings: first string for barcode's data, second string for barcode's type
       */
      scanBarCode: async function() {
        if (!("BarcodeDetector" in window)) {
          this.runtimeError("This browser does not support barcode detection");
          return;
        }
        const app = this.getAnchorNode().getApplication();
        this._barcodeScannerWidget = cls.WidgetFactory.createWidget("BarcodeScanner", {
          appHash: app.applicationHash
        });
        app.layout.afterLayout(() => {
          this._barcodeScannerWidget.resizeHandler();
        });
        app.getUI().getWidget().getElement().appendChild(this._barcodeScannerWidget.getElement());
        try {
          await this._barcodeScannerWidget.show();
        } catch (error) {
          this.runtimeError("Error starting stream: " + error);
          return;
        }
        this._barcodeScannerWidget.onClose(() => {
          this.setReturnValues([null, "cancelled"]);
        });
        this._barcodeScannerWidget.detectBarcode((data) => {
          if (data) {
            this.setReturnValues([data.rawValue, data.format.toUpperCase()]);
          } else {
            this.setReturnValues([null, "cancelled"]);
          }
        });
      },

      /**
       * Opens the device's gallery (mobile) or file explorer (desktop) to select an image
       * Returns the blob URL to the selected photo
       */
      choosePhoto: function() {
        manageInput.call(this, 'file', 'image/*');
      },

      /**
       * Opens the device's gallery or file explorer to select a video
       * Returns the blob URL to the selected video
       */
      chooseVideo: function() {
        manageInput.call(this, 'file', 'video/*');
      },

      /**
       * Opens the device's camera (mobile) or file explorer (desktop) to capture an image
       * Returns the blob URL to the captured photo
       */
      takePhoto: function() {
        manageInput.call(this, 'file', 'image/*', 'environment');
      },

      /**
       * Opens the device's camera (mobile) or file explorer (desktop) to capture a video
       * Returns the blob URL to the captured video
       */
      takeVideo: function() {
        manageInput.call(this, 'file', 'video/*', 'environment');
      },

      /**
       * Get Browser's Geolocation
       * Returns status, latitude, longitude
       */
      getGeolocation: function() {
        // See : http://dev.w3.org/geo/api/spec-source.html
        const statusOK = "ok";
        const statusKO = "nok";

        if (!navigator.geolocation) {
          this.runtimeError("This browser does not support geolocalisation");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          function(position) {
            this.setReturnValues([statusOK, position.coords.latitude, position.coords.longitude]);
          }.bind(this),
          function(error) {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                this.setReturnValues([statusKO, 'PERMISSION_DENIED']);
                return;
              case error.POSITION_UNAVAILABLE:
                this.setReturnValues([statusKO, 'POSITION_UNAVAILABLE']);
                return;
              case error.TIMEOUT:
                this.setReturnValues([statusKO, 'TIMEOUT']);
                return;
              default:
                this.setReturnValues([statusKO, 'UNKNOWN_ERROR']);
                return;
            }
          }.bind(this)
        );
      }
    };
  }
);
