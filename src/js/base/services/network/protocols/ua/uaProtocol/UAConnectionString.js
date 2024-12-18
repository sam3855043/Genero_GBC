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
     * @class UAConnectionString
     * @memberOf classes
     */
    cls.UAConnectionString = context.oo.StaticClass(
      /** @lends classes.UAConnectionString */
      {

        run: function(data, headers, application) {
          application.model.logDvm(data);
          let appInfo = application && application.info(),
            session = application && application.getSession();
          try {
            if (!appInfo.session || appInfo.task || !session.isMasterBrowserPage()) {
              if (!appInfo.session) {
                const headersKeys = Object.keys(context.constants.network.startHeaders);
                for (const key of headersKeys) {
                  const value = context.constants.network.startHeaders[key];
                  const hvalue = headers[key];
                  if (hvalue === null) {
                    throw value.error;
                  }
                  appInfo[value.prop || key] = hvalue;
                }
                session.setSessionId(appInfo.session);
                appInfo.serverVersion = headers.server;
              }
              const t = appInfo.timeout;
              appInfo.pingTimeout = (t > 1 ? t > 5 ? t - 5 : t - 1 : t) * 1000;

              const vmMessages = cls.AuiProtocolReader.translate(data);

              if (vmMessages.length === 0 || vmMessages.length !== 1 && vmMessages[0].type !== "meta" || vmMessages[0].verb !==
                "Connection") {
                if (!data) {
                  throw new Error("No connectionString received. Ensure your application is compiled and published.");
                } else {
                  throw new Error("Received connectionString bad format : \"" + data + "\"");
                }
              }

              appInfo.connectionInfo = vmMessages[0].attributes;
              session.getNavigationManager().updateApplicationInformation(application);
              gbc.classes.EncodingHelper.setVMEncoding(appInfo.connectionInfo.encoding.toLowerCase());
              application.prepareEmergencyClose();
            }
          } catch (e) {
            const message = "" + e.toString();
            if (appInfo) {
              appInfo.ending = cls.ApplicationEnding.notok(message);
            }
          }
        }
      });
  })(gbc, gbc.classes);
