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
     * Standardized queries to access ua proxy
     * @namepace classes.UANetwork
     */
    cls.UANetwork = context.oo.StaticClass(function() {

      const passableQueryString = ["qainfo", "responsive", "noquitpopup", "debugmode", "setlng",
        "ur_platform_type", "ur_platform_name", "ur_protocol_type", "contextmenu", "mobileui", "browsermultipage", "serviceworker", "json"
      ];

      const httpQueries = /** @lends classes.UANetwork */ {
        /**
         * send start query
         * /ua/r?frontEndId1=...&frontEndId2=...
         */
        start: {
          verb: "GET",
          action: "r",
          /** @ignore */
          uriPart: function(application) {
            const info = application.info();
            let parts = [info.appId, "?Bootstrap=done"].join("");
            const keys = Object.keys(info.urlParameters),
              len = keys.length;
            for (let i = 0; i < len; i++) {
              const key = keys[i],
                id = "&" + key + "=";
              const args = info.urlParameters[key];
              if (args) {
                parts += id + (Array.isArray(args) ? args : [args]).join(id);
              }
            }
            return parts;
          }
        },

        /**
         * send wait new task
         * /ua/sua/session_id?appId=...
         */
        waitTask: {
          verb: "GET",
          action: "wait",
          /** @ignore */
          uriPart: function(application) {
            const info = application.info();
            return [info.session, "?appId=", (info.app || 0)].join("");
          }
        },

        /**
         * send start new task
         * /ua/sua/session_id?appId=...&pageId=1
         * post data : empty
         */
        runTask: {
          verb: "POST",
          action: "sua",
          /** @ignore */
          uriPart: function(application) {
            const info = application.info();
            if (info.app === application._session.__lastNewtaskRun) {
              return null;
            } else {
              application._session.__lastNewtaskRun = info.app;
            }
            return [info.session, "?appId=", (info.app || 0), "&pageId=1"].join("");
          }
        },

        /**
         * Get url for new task in new window
         * /ua/sua/session_id?appId=...
         */
        newApp: {
          urlOnly: true,
          action: "sua",
          /** @ignore */
          uriPart: function(application, httpOptions) {
            const info = application.info();
            const keys = Object.keys(info.urlParameters),
              len = keys.length,
              parts = [info.session, "?appId=", (info.app || 0)];
            for (let i = 0; i < len; i++) {
              const key = keys[i],
                lowerKey = key.toLocaleLowerCase(),
                id = "&" + key + "=";
              if (key !== "appId") {
                if (!httpOptions || !httpOptions.noQueryString || passableQueryString.indexOf(lowerKey) >= 0) {
                  const args = info.urlParameters[key];
                  if (args) {
                    parts.push(id + (Array.isArray(args) ? args : [args]).join(id));
                  }
                }
              }
            }
            if (gbc.queryStringTheme === gbc.ThemeService.getCurrentTheme()) {
              parts.push("&theme=" + gbc.queryStringTheme);
            }
            return parts.join("");
          }
        },

        /**
         * send aui order(s)
         * /ua/sua/session_id?appId=...&pageId=...
         * post data : aui order(s)
         */
        auiOrder: {
          verb: "POST",
          action: "sua",
          appId: true,
          pageId: true
        },

        /**
         * send empty request
         * /ua/sua/session_id?appId=...&pageId=...
         * post data : empty
         */
        empty: {
          verb: "POST",
          action: "sua",
          appId: true,
          pageId: true
        },

        /**
         * send ping
         * /ua/ping/session_id?appId=...
         * post data : empty
         */
        ping: {
          verb: "POST",
          appId: true
        },

        /**
         * track prompt
         * /ua/sua/session_id
         */
        trackPrompt: {
          verb: "POST",
          action: "sua"
        },

        /**
         * run without waiting a appId in
         * /ua/start/session_id/xcfAppId
         */
        runApplication: {
          verb: "GET",
          action: "start",
          /** @ignore */
          uriPart: function(application, httpOptions) {
            const info = application.info();
            return [info.session, httpOptions.xcfAppId].join("/");
          }

        },

        /**
         * send interrupt
         * /ua/interrupt/session_id?appId=...
         * post data : empty
         */
        interrupt: {
          verb: "POST",
          appId: true
        },

        /**
         * send close
         * /ua/close/session_id?appId=...
         * post data : empty
         */
        close: {
          verb: "POST",
          appId: true
        },

        /**
         * send close
         * /ua/close/session_id
         * post data : empty
         */
        closeSession: {
          action: "close",
          verb: "POST"
        },

        /**
         * send new task query
         * /ua/newtask/session_id
         */
        newTask: {
          verb: "POST",
          action: "newtask",
          sequence: true
        },

        /**
         * ft-lock-file
         */
        ftLockFile: {
          verb: "GET",
          customUrl: true,
          headers: {
            "X-FourJs-LockFile": true
          }
        }
      };
      const methods = {};
      const preparedMethod = {};

      const querySend = function(query, application, prepared, callback, data, httpOptions) {
        const logMessage = [query, prepared.verb, prepared.url].join(" : ");
        context.LogService.networkProtocol.log("HTTP REQUEST\n", logMessage, data);
        let themeValue = gbc.ThemeService.getValue("theme-network-retry-on-error");
        const httpRetriedErrors = themeValue instanceof Array ? themeValue.slice() :
          themeValue.split(" ").map(x => parseInt(x)).filter(x => !isNaN(x));
        themeValue = gbc.ThemeService.getValue("theme-network-retry-timeout");
        let httpRetries = themeValue instanceof Array ? themeValue.slice() :
          themeValue.split(" ").map(x => parseInt(x)).filter(x => !isNaN(x));

        if (window.isURLParameterEnabled("serviceworker")) {
          // use old way for start connection or meta send
          const isMeta = data && data.indexOf("meta") === 0;
          const isNewTask = query === "newTask" || query === "runTask";

          if (query !== "start" && !isMeta) {
            try {
              const {
                application,
                ...fetchDetail
              } = prepared;
              gbc.sendMessage({
                action: "querySend",
                query,
                fetchDetail,
                data
              });
              return;
            } catch (err) {
              Function.noop();
              // can't use Service Worker, use old way
            }
          }
        }

        const xhr = new XMLHttpRequest();
        xhr.withCredentials = prepared.withCredentials;
        xhr.query = query;
        xhr.open(prepared.verb, prepared.url, true);
        const headers = Object.keys(prepared.headers);
        for (const element of headers) {
          xhr.setRequestHeader(element, prepared.headers[element]);
        }
        if (httpOptions && httpOptions.headers) {
          const keys = Object.keys(httpOptions.headers);
          for (const element of keys) {
            xhr.setRequestHeader(element, httpOptions.headers[element]);
          }
        }
        const invalid = false;
        const _retryCurrentRequest = () => {
          const timeout = httpRetries.shift() * 1000;
          xhr.abort();
          window.setTimeout(() => {
            xhr.open(prepared.verb, prepared.url, true);
            xhr.send((data ? data : null));
          }, timeout);
        };

        // "load" event triggered when the request is complete (even if HTTP status is like 400 or 500) and the response is fully downloaded
        xhr.onload = function(invalid, appInfo, logMessage, xhrEvent) {
          if (!invalid) {
            context.LogService.networkProtocol.log("HTTP RESPONSE\n", logMessage, xhrEvent.target.response);
            if (callback) {
              callback.call(null, xhrEvent.target.response, null, xhrEvent.target);
            }
          }
        }.bind(null, invalid, prepared.appInfo, logMessage);
        if (!prepared.ignoreResponse) {
          xhr.onreadystatechange = function(appInfo, xhrEvent) {
            let error = true;
            if (xhr.readyState === XMLHttpRequest.DONE) {
              if (httpRetriedErrors.includes(xhr.status) && (httpRetries.length > 0)) {
                _retryCurrentRequest();
                return;
              }
              if (xhr.query === "runApplication" && xhr.status >= 400) {
                error = false;
              } else if (xhr.status === 404) {
                if (application && application.protocolInterface && application.protocolInterface.isRunning) {
                  appInfo.ending = cls.ApplicationEnding.notok("Session does not exist.");
                } else {
                  appInfo.ending = cls.ApplicationEnding.notFound;
                }
              } else if (xhr.status === 403) {
                appInfo.ending = cls.ApplicationEnding.forbidden;
              } else if (xhr.status >= 400 && xhr.status < 500) {
                appInfo.ending = cls.ApplicationEnding.notok(xhr.responseText);
              } else if (xhr.status >= 500) {
                context.LogService.networkProtocol.log("HTTP RESPONSE", logMessage, xhr.status, xhr.statusText, xhr
                  .responseText);
                if (application && application.protocolInterface && application.protocolInterface.isRunning) {
                  appInfo.ending = cls.ApplicationEnding.notok("Session does not exist.");
                } else {
                  appInfo.ending = cls.ApplicationEnding.notFound;
                }
              } else if (xhr.status !== 200) {
                context.LogService.networkProtocol.log("HTTP RESPONSE", logMessage, xhr.status, xhr.statusText, xhr
                  .responseText);
                error = false;
              } else {
                error = false;
              }
              if (application && error) {
                context.LogService.networkProtocol.log("HTTP REQUEST ERROR", xhr.statusText, xhr.responseText);
                application.error("HTTP", "Network error (" + xhr.statusText + ")", xhr);
                if (callback) {
                  callback.call(null, xhrEvent.target.response, null, xhrEvent.target);
                }
              }
            }
          }.bind(null, prepared.appInfo);

          //"error" event triggered when the request could not be made, e.g. network down.
          xhr.onerror = function(invalid, appInfo, logMessage, xhrEvent, textStatus, errorThrown) {
            if (httpRetries.length > 0) {
              _retryCurrentRequest();
            } else {
              if (!invalid) {
                context.LogService.networkProtocol.log("HTTP REQUEST ERROR", textStatus, errorThrown);
                appInfo.ending = cls.ApplicationEnding.notok("Server unreachable");
                application.error("HTTP", "Network error (" + textStatus + ")", xhrEvent);
                if (callback) {
                  callback.call(null, xhrEvent.target.response, null, xhrEvent.target);
                }
              }
            }
          }.bind(null, invalid, prepared.appInfo, logMessage);
        }
        xhr.send((data ? data : null));
      };

      const createQuery = function(query, info) {
        preparedMethod[query] = function(query, info, application, httpOptions) {
          const appInfo = application.info();
          let url, shouldReturn = false,
            withCredentials = false;
          if (info.customUrl) {
            url = httpOptions && httpOptions.customUrl;
          } else {
            const parts = [appInfo && (appInfo.customUA || appInfo.connector) || "", "/ua/", info.action || query, "/"],
              uriPart = cls.UANetwork._getUriPart(application, info, httpOptions);
            if (!uriPart) {
              shouldReturn = true;
            } else {
              parts.push(uriPart);
              url = parts.join("");
            }
          }
          if (context.ThemeService.getValue("theme-network-use-credentials-headers")) {
            withCredentials = true;
          }
          const headers = {};
          const defaultHeaders = Object.keys(context.constants.network.sentHeaders);
          for (const element of defaultHeaders) {
            headers[element] = context.constants.network.sentHeaders[element];
          }

          headers[context.constants.network.headers.session] = appInfo.session;

          if (info.headers) {
            const ikeys = Object.keys(info.headers);
            for (const element of ikeys) {
              headers[element] = info.headers[element];
            }
          }
          return {
            shouldReturn: shouldReturn,
            withCredentials: withCredentials,
            url: url,
            application: application,
            appInfo: appInfo,
            headers: headers,
            verb: info.verb
          };
        };
        methods[query] = function(query, info, application, callback, data, httpOptions) {
          const prepared = preparedMethod[query](query, info, application, httpOptions);
          if (prepared.shouldReturn) {
            return;
          }
          if (info.urlOnly) {
            return prepared.url;
          }

          querySend(query, application, prepared, callback, data, httpOptions);

        }.bind(null, query, info);
      };
      const queryKeys = Object.keys(httpQueries);
      for (var i = 0; i < queryKeys.length; i++) {
        var query = queryKeys[i];
        const queryInfo = httpQueries[query];
        /**
         * For each sub cited methods, the same signature
         * @param application the current application
         * @param callback the callback in case of success
         * @param data the payload to send
         * @param httpOptions the http request options (like headers) to send
         */
        createQuery(query, queryInfo);
      }
      const result =
        /** @lends classes.UANetwork */
        {
          __name: "UANetwork",
          __sequence: 0,
          _prepared: {},
          querySend: querySend,
          _getUriPart: function(application, info, httpOptions) {
            const appInfo = application.info();
            const uriParts = [];
            // Manage server prefix for cgi
            if (info.uriPart) {
              uriParts.push(info.uriPart(application, httpOptions));
            } else {
              uriParts.push(appInfo.session);
              let queryStarted = false;
              if (info.appId) {
                queryStarted = true;
                uriParts.push("?appId=", appInfo.app || 0);
                if (info.pageId) {
                  uriParts.push("&pageId=", appInfo.page++);
                }
              }
              if (info.sequence) {
                uriParts.push(queryStarted ? "&" : "?", "seq=", this.__sequence++);
              }
            }
            const uriPart = uriParts.join("");
            if (!uriPart) {
              return null;
            }
            return uriPart;
          }
        };

      const keys = Object.keys(methods);
      for (const element of keys) {
        result[element] = methods[element];
        result._prepared[element] = preparedMethod[element].bind(null, element, httpQueries[element]);
      }

      return result;

    });
  })(gbc, gbc.classes);
