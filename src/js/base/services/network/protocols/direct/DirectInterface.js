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
     * Direct protocol interface. manages the full protocol as a state machine
     * @class DirectInterface
     * @memberOf classes
     * @extends classes.ProtocolInterface
     */
    cls.DirectInterface = context.oo.Class({
      base: cls.ProtocolInterface
    }, function() {
      return /** @lends classes.DirectInterface.prototype */ {
        __name: "DirectInterface",
        /**
         * @type {classes.VMApplication}
         */
        application: null,
        /**
         * The Direct protocol is managed by Finite State Machine
         * @see https://github.com/jakesgordon/javascript-state-machine
         */
        directProtocol: null,
        _incomingData: null,
        eventQueue: null,
        eventInterval: null,
        eventIntervalTimeout: 0,
        onFirstGuiReady: null,
        /** @type {window.gbcWrapper} */
        _wrapper: null,
        _wrapperReceiveHandler: null,
        /**
         * @constructs
         * @param application
         */
        constructor: function(application) {
          this.application = application;

          this._incomingData = [];
          this.onFirstGuiReady = [];
          this.eventQueue = [];
          this._wrapper = application.info().wrapper;
          const directInterface = this;
          const directProtocol = this.directProtocol = context.StateMachine.create(
            /** @lends classes.DirectInterface#directProtocol */
            {
              /**
               * the general error handler
               */
              error: function(eventName, from, to, args, errorCode, errorMessage) {
                if (application.info()) {
                  application.info().ending = cls.ApplicationEnding.notok("" + errorCode + ". " + errorMessage);
                } else {
                  gbc.error("" + errorCode + ". " + errorMessage);
                }
              },
              initial: "Start",
              /**
               * the different events of the state machine
               * @see the directStates constant
               */
              events: context.constants.network.directStates,
              callbacks: {
                /**
                 * whenever we leave a state
                 */
                onleavestate: function(action, from, to) {
                  context.LogService.networkProtocol.log(`{${application.procId}}`, "PROTOCOL", from, " -> [", action, "] -> ", to);
                },
                onleaveStart: function(event, from, to, ending) {
                  directInterface.read(function(data) {
                    cls.DirectInitialAUI.run(data, application, function() {
                      window.setTimeout(function() {
                        application.setRunning(true);
                        directProtocol.transition();
                      }, 10);
                    });
                  });
                  return context.StateMachine.ASYNC;
                },
                onenterRecvInitialAUI: function() {
                  if (application.isProcessing()) {
                    directProtocol.waitForMoreInitialAUI();
                  } else {
                    directProtocol.guiMode();
                  }
                },
                onenterSendEmpty: function() {
                  directProtocol.getMoreOrder();
                },
                onleaveSendEmpty: function() {
                  if (!directInterface.application.hasError && !directInterface.application.ending) {
                    directInterface.read(function(data) {
                      cls.DirectRecvOrder.run(data, application, function() {
                        directProtocol.transition();
                      });
                    });
                    return StateMachine.ASYNC;
                  }
                },
                onenterRecvOrder: function() {
                  if (application.isProcessing()) {
                    directProtocol.waitForMoreOrder();
                  } else {
                    directProtocol.guiMode();
                  }
                },
                onenterGUI: function() {
                  if (directInterface.application.ending) {
                    if (directProtocol.transition) {
                      directProtocol.transition.cancel();
                    }
                    directProtocol.waitForEnd();
                  } else {
                    if (directInterface.onFirstGuiReady) {
                      const callbacks = directInterface.onFirstGuiReady;
                      directInterface.onFirstGuiReady = null;
                      while (callbacks.length) {
                        callbacks.splice(0, 1)[0]();
                      }
                    }

                    directInterface.eventInterval = window.setInterval(function() {
                      if (directInterface.eventQueue.length) {
                        directInterface.application.setProcessing();
                        window.setTimeout(function() {
                          directProtocol.sendOrder();
                        }, 10);
                        if (directInterface.eventInterval !== null) {
                          window.clearInterval(directInterface.eventInterval);
                          directInterface.eventInterval = null;
                        }
                      }
                    }, directInterface.eventIntervalTimeout);
                  }
                },
                onleaveGUI: function() {
                  if (directInterface.eventInterval !== null) {
                    window.clearInterval(directInterface.eventInterval);
                    directInterface.eventInterval = null;
                  }
                },
                onenterSendOrder: function() {
                  directProtocol.getOrderAnswer();
                },
                onleaveSendOrder: function(event, from, to) {
                  if (to !== "ApplicationEnd") {
                    let orders = [];
                    let evt = null;
                    // not send all events but only until first with directFire
                    while (directInterface.eventQueue.length > 0) {
                      evt = directInterface.eventQueue.shift();
                      orders.push(evt);
                      if (evt.directFire) {
                        break;
                      }
                    }

                    cls.DirectSendOrders.run(orders.flatten(), application, directInterface);
                    directInterface.read(function(data) {
                      cls.DirectRecvOrder.run(data, application, function() {
                        directProtocol.transition();
                      });
                    });
                    return StateMachine.ASYNC;
                  }
                },
                onenterReadOrder: function() {
                  directProtocol.getOrderAnswer();
                },
                onleaveReadOrder: function(event, from, to) {
                  if (to !== "ApplicationEnd") {
                    directInterface.read(function(data) {
                      cls.DirectRecvOrder.run(data, application, function() {
                        directProtocol.transition();
                      });
                    });
                    return StateMachine.ASYNC;
                  }
                },
                /**
                 * when the application ends, we wait for a confirmation close
                 */
                onenterApplicationEnding: function() {
                  directProtocol.endApp();
                },
                onenterApplicationEnd: function() {
                  application.stop();
                }
              }
            });
        },
        start: function() {
          this._wrapperReceiveHandler = this._wrapper.on(this._wrapper.events.RECEIVE, (event, src, data) => {
            if (this._wrapper.protocolVersion && this._wrapper.protocolVersion >= 2) {
              if (data.procId === this.application.info().procId) {
                this._onReceive(event, src, data.content);
              }
            } else {
              this._onReceive(event, src, data);
            }
          });
          this._wrapper.URReady(context.__wrapper.param({
            UCName: "GBC",
            UCVersion: gbc.version,
            mobileUI: context.ThemeService.getValue("aui-mobileUI-default") ? 1 : 0,
            media: gbc.ThemeService.getMediaString(),
            icon: gbc.ThemeService.getResource("img/gbc_logo.ico"),
            theme: gbc.ThemeService.getCurrentTheme()
          }, this.application));
          this.directProtocol.start();
        },

        stop: function(message) {
          const data = cls.AuiProtocolWriter.translate({
              type: "om",
              order: this.application.info().auiOrder++,
              orders: [new cls.VMDestroyEvent(-3, message)]
            }, this.application),
            options = {};
          this.application.model.logFireEvent(data);
          this.write(data, options);
        },

        event: function(events, noTimer = true) {
          if (events) {
            if (this.application && !this.application.ending) {
              // detect short time when we are going to send a request to the VM, but we didn't send yet
              this.application.pendingRequest = true;
              this.eventQueue.push(events);
              this.eventQueue[this.eventQueue.length - 1].directFire = true;

              if (this.eventInterval !== null) {
                window.clearInterval(this.eventInterval);
                this.eventInterval = null;
              }

              if (noTimer) {
                this._manageEvents();
              } else {
                this.eventInterval = window.setInterval(this._manageEvents.bind(this), this.eventIntervalTimeout);
              }
            } else {
              if (this.eventInterval !== null) {
                window.clearInterval(this.eventInterval);
                this.eventInterval = null;
              }
            }
          }
        },
        /**
         * @returns {number} the delay in ms between network requests
         */
        getNetworkDelay: function() {
          return this._networkDelay;
        },
        /**
         * @param {number} delay the delay in ms between network requests
         */
        setNetworkDelay: function(delay) {
          this._networkDelay = delay;
        },
        _manageEvents: function() {
          if (this.application) {
            this.application.pendingRequest = false;
            if (this.application.isIdle() && this.directProtocol.can("sendOrder")) {
              if (this.eventQueue.length) {
                this.application.setProcessing();
                if (this._networkDelay > 0) {
                  window.setTimeout(this.directProtocol.sendOrder.bind(this.directProtocol), this._networkDelay);
                } else {
                  this.directProtocol.sendOrder();
                }
                if (this.eventInterval !== null) {
                  window.clearInterval(this.eventInterval);
                  this.eventInterval = null;
                }
              } else {
                if (this.eventInterval !== null) {
                  window.clearInterval(this.eventInterval);
                  this.eventInterval = null;
                }
              }
            }
          } else {
            if (this.eventInterval !== null) {
              window.clearInterval(this.eventInterval);
              this.eventInterval = null;
            }
          }
        },
        newTask: function() {
          this._wrapper.childStart(context.__wrapper.param(null, this.application));
        },
        waitForApplicationInNewWindow: function(onSuccess, onFailure) {
          onSuccess();
        },
        interrupt: function() {
          this._wrapper.interrupt(context.__wrapper.param(null, this.application));
        },
        close: function() {
          this._wrapper.close(context.__wrapper.param(null, this.application));
        },
        destroy: function() {
          if (this._wrapperReceiveHandler) {
            this._wrapperReceiveHandler();
          }
          if (this.eventInterval !== null) {
            window.clearInterval(this.eventInterval);
            this.eventInterval = null;
          }
          let param = context.__wrapper.param(null, this.application);
          this.application = null;
          this.eventQueue = null;
          this._wrapper.close(param);
          this.directProtocol = null;
        },

        read: function(cb) {
          if (this._incomingData.length) {
            // don't use requestAnimationFrame because of background webview behavior
            window.setTimeout(function() {
              cb(this._incomingData.shift());
            }.bind(this), 0);
          } else {
            setTimeout(function() {
              this.read(cb);
            }.bind(this), 10);
          }
        },
        write: function(data, options) {
          context.LogService.networkProtocol.log(`{${this.application.procId}} ⇑ UR REQUEST\n`, "-> NATIVE SEND", data);
          this._wrapper.send(context.__wrapper.param(data, this.application), options);
        },
        _onReceive: function(event, src, data) {
          context.LogService.networkProtocol.log(`{${this.application.procId}} ⇓ HTTP RESPONSE\n`, "<- NATIVE RECEIVE", data);
          this._incomingData.push(data);
          if (!this.application.isProcessing()) {
            if (!this.directProtocol.transition) {
              this.directProtocol.readOrder();
            } else {
              // if pending transition delay the readOrder
              window.setTimeout(() => {
                if (this.directProtocol) {
                  this.directProtocol.readOrder();
                }
              }, 50);

            }
          }
        },

        /**
         * Check if the protocol has still some data to process
         * @returns {boolean} - true if data still exist in the queue
         */
        hasIncomingData: function() {
          return this._incomingData.length > 0;
        }

      };
    });

  })(gbc, gbc.classes);
