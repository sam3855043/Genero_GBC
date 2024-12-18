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

(
  function(context, cls) {
    /**
     * @class UAHandShake
     * @memberOf classes
     */
    cls.UAHandShake = context.oo.StaticClass(
      /** @lends classes.UAHandShake */
      {
        run: function(application, callback) {
          // Performing the initial hanshake
          const data = cls.AuiProtocolWriter.translate({
            type: "meta",
            verb: "Client",
            attributes: {
              name: "GBC",
              version: context.version,
              encoding: "UTF-8",
              encapsulation: 0,
              filetransfer: 0,
              mobileUI: context.ThemeService.getValue("aui-mobileUI-default") ? 1 : 0,
              media: context.ThemeService.getMediaString(), // could be  'small' (phone), 'medium' (tablet), 'large' (desktop): see FGL-5429
              json: (window.isURLParameterEnabled("json") || context.ThemeService.getValue("aui-json-protocol")) ? 1 : 0
            }
          });
          application.model.logFireEvent(data);
          cls.UANetwork.auiOrder(application, callback, data);
        }
      });
  })(gbc, gbc.classes);
