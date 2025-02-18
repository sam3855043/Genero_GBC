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

modulum('MessageApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {

    /**
     * @class MessageApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.MessageApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.MessageApplicationService.prototype */ {
        __name: "MessageApplicationService",

        /**
         * @type classes.EventListener
         */
        _eventListener: null,

        _messageList: null,
        _maxMessageStack: 10,

        constructor: function(app) {
          $super.constructor.call(this, app);
          this._messageList = {};
        },

        /**
         * Add a message to the stack
         * @param {string} id - count param
         * @param {classes.MessageWidget} widget - message to add
         */
        addMessage: function(id, widget) {
          this._messageList[id] = widget;
        },

        /**
         * Remove a message by its id
         * @param {string} id - count param
         * @param {Boolean?} allWindows - remove messages from all window with same id if true
         */
        removeMessage: function(id, allWindows) {
          if (this._messageList[id]) {
            this._messageList[id].setHidden(true);
            delete(this._messageList[id]);
          }
          this.handlePositions();

          // if multi pages
          const userInterfaceNode = this._application.getNode(0),
            session = userInterfaceNode.getApplication().getSession();
          if (session.hasServerFeature("browser-multi-page") && allWindows) {
            // for each window of the session, send the message
            session._childWindows.forEach((win) => {
              const winSession = win.gbc.SessionService.getCurrent();
              if (winSession) {
                winSession.getApplications().forEach((app) => {
                  if (app !== this._application) { // no notif on same app
                    app.message.removeMessage(id);
                  }
                });
              }
            });

            // In case this window has been opened by another app in the session
            if (window._opener) {
              const openerWinSession = window._opener.gbc.SessionService.getCurrent();
              if (openerWinSession) {
                openerWinSession.getApplications().forEach((app) => {
                  if (app !== this._application) { // no notif on same app
                    app.message.removeMessage(id);
                  }
                });
              }
            }
          }

        },

        /**
         * Allow messages and error defined at same position to stack
         * @private
         */
        handlePositions: function() {
          if (this._messageList) {
            const messageKeys = Object.keys(this._messageList).sort(function(a, b) {
              return a - b;
            });
            if (messageKeys.length <= 0) {
              return;
            }
            const bodyRect = document.body.getBoundingClientRect();

            const stack = context.ThemeService.getValue("theme-message-display-position") === context.ThemeService.getValue(
              "theme-error-display-position");

            for (let i = 0; i < messageKeys.length; i++) {
              const messageWidget = this._messageList[messageKeys[i]];
              if (messageWidget && messageWidget.getElement()) {
                const prevWidget = i >= 1 && messageKeys[i - 1] && this._messageList[messageKeys[i - 1]];
                const positionName = messageWidget.getForcedPosition() || messageWidget.getPosition();
                const style = {};
                // TODO : Need to remove margins if screen is really small;
                const margin = context.ThemeService.getValue("theme-margin-ratio") * 14;
                const drift = {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                };

                const uiWidget = messageWidget.getUserInterfaceWidget();
                if (uiWidget && !uiWidget._destroyed && uiWidget.getContainerElement()) {
                  const userInterfaceRect = uiWidget.getContainerElement().getBoundingClientRect();
                  const messageRect = messageWidget.getElement().getBoundingClientRect();

                  // Push message above bottom toolbar if any
                  const tbPosition = this._application && this._application.getCurrentWindow() &&
                    this._application.getCurrentWindow().getWidget() &&
                    this._application.getCurrentWindow().getWidget().getToolBarPosition();
                  if (tbPosition === "bottom") {
                    drift.bottom = drift.bottom + 40; //TODO: 40 is hardcoded: not good
                  }

                  // Use body and ui RECT for position calculations
                  drift.bottom = drift.bottom + bodyRect.height - userInterfaceRect.height - userInterfaceRect.top;
                  drift.top = drift.top + userInterfaceRect.top;
                  drift.left = drift.left + bodyRect.left + userInterfaceRect.left;
                  drift.center = drift.left + (userInterfaceRect.width / 2) - (messageRect.width / 2);

                  const overlap = prevWidget && this._checkOverlap(messageWidget, prevWidget);
                  const anyHidden = messageWidget.isHidden() || (prevWidget && prevWidget.isHidden());

                  // Handle stack if more than 1 message and none of the widgets is hidden
                  if ((i >= 1 && (stack || overlap)) && !anyHidden) {
                    drift.bottom += messageRect.height + (margin / 2);
                    drift.top += messageRect.height + (margin / 2);
                  }

                  if (positionName.indexOf("top") >= 0) {
                    style.top = (margin + drift.top).toFixed() + "px";
                    style.bottom = null;
                  }
                  if (positionName.indexOf("bottom") >= 0) {
                    style.top = null;
                    style.bottom = (margin + drift.bottom).toFixed() + "px";
                  }
                  if (positionName.indexOf("right") >= 0) {
                    style.left = null;
                    style["margin-left"] = margin.toFixed() + "px";
                    style.right = margin.toFixed() + "px";
                  }
                  if (positionName.indexOf("left") >= 0) {
                    style.left = (margin + drift.left).toFixed() + "px";
                    style.right = null;
                    style["margin-right"] = margin.toFixed() + "px";
                  }
                  if (positionName.indexOf("center") >= 0) {
                    style.left = (margin + drift.center).toFixed() + "px";
                    style.right = null;
                    style["margin-right"] = margin.toFixed() + "px";
                  }

                  if (!messageWidget.isHidden()) {
                    style.opacity = 1;
                    style["z-index"] = context.ThemeService.getValue("gbc-MessageWidget-z-index");
                  } else {
                    style.opacity = 0;
                    style["z-index"] = -1;
                  }
                  messageWidget.setStyle(style);
                }
              }
            }
          }
        },

        /**
         * Check if 2 widgets overlap in the view
         * @param w1 - first widget to compare
         * @param w2 - second widget to compare
         * @return {boolean} - true if it overlaps, false otherwise
         * @private
         */
        _checkOverlap: function(w1, w2) {
          if (w1.isHidden() || w2.isHidden()) {
            return false;
          }
          const rect1 = w1.getElement().getBoundingClientRect();
          const rect2 = w2.getElement().getBoundingClientRect();
          return !(rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom);
        },

        /**
         * Special message to display when X-FourJs-Message header is set
         * @param {String} message - Message to send
         * @param {Boolean?} messageAllWin - deep look for all windows to notify
         */
        gasAdminMessage: function(message, messageAllWin) {
          const userInterfaceNode = this._application.getNode(0);
          if (!userInterfaceNode) {
            return;
          }

          const userInterfaceWidget = userInterfaceNode.getController().getWidget(),
            msgWidget = userInterfaceWidget.getMessageWidget();
          msgWidget.setText(message);
          msgWidget.setMessageKind("admin");
          msgWidget.setMessageDisplayTime(0); // always displayed until clicked
          msgWidget.setHtmlFormat(false);
          msgWidget.setHidden(false);
          msgWidget.setPosition(gbc.ThemeService.getValue("gbc-MessageWidget-gasadmin-display-position"));

          // Redefine click action
          msgWidget.manageMouseClick = () => {
            msgWidget.setHidden(true);
            this.removeMessage("gasadmin", true);
          };
          this.addMessage("gasadmin", msgWidget);
          this.handlePositions();

          // if multi pages, display on all related pages
          const session = userInterfaceNode.getApplication().getSession();
          if (session.hasServerFeature("browser-multi-page") && messageAllWin) {

            // for each window of the session, send the message
            session._childWindows.forEach((win) => {
              win.gbc.SessionService.getCurrent().getApplications().forEach((app) => {
                if (app !== this._application) { // no notif on same app
                  app.message.gasAdminMessage(message);
                }
              });
            });

            // In case this window has been opened by another app in the session
            if (window._opener) {
              window._opener.gbc.SessionService.getCurrent().getApplications().forEach((app) => {
                if (app !== this._application) { // no notif on same app
                  app.message.gasAdminMessage(message);
                }
              });
            }
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._messageList = null;
          $super.destroy.call(this);
        }
      };
    });
    cls.ApplicationServiceFactory.register("Message", cls.MessageApplicationService);
  });
