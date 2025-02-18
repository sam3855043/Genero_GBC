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

/**
 * @typedef {Function} Hook
 * @param {classes.Event} event event object
 * @param {Object} src event emitter
 * @param {...any} additional data
 */
/**
 * @typedef {Function} HandleRegistration
 */

modulum('EventListener', ['Event'],
  function(context, cls) {
    //// debug list unregistered listeners
    //  window.reged = {};
    /**
     * A base class to support eventing
     * @class EventListener
     * @memberOf classes
     * @publicdoc Base
     */
    cls.EventListener = context.oo.Class(function() {
      return /** @lends classes.EventListener.prototype */ {
        /**
         * Literal class name.
         * @type {string}
         * @protected
         */
        __name: "EventListener",

        /**
         * Registered events
         * @type {Map.<string, Array<function>>}
         * @protected
         */
        _events: null,

        /**
         * Handlers for asynchronous calls
         * @type Object[]
         * @protected
         */
        _asyncHandlers: null,

        /**
         * Indicates if object has been destroyed
         * @type {boolean}
         * @protected
         */
        _destroyed: false,

        /**
         * @constructs
         */
        constructor: function() {
          this._events = new Map();
          this._asyncHandlers = [];
        },

        /**
         * Destroy the object and free memory
         * @param {boolean} [forceDestroy] force destroy (must not be delayed)
         */
        destroy: function(forceDestroy) {
          if (!this._destroyed && this._events) {
            this._destroyed = true;
            this._events.clear();
            this._events = null;
            this._clearAllAsyncCalls();
            this._asyncHandlers = null;
          } else {
            context.LogService.warn("Trying to destroy a destroyed Object " + this.__name);
          }
        },

        /**
         * Returns if the node is destroyed
         * @return {boolean} true if node is destroyed
         * @publicdoc
         */
        isDestroyed: function() {
          return this._destroyed;
        },

        /**
         * Emit an event
         * @param {string} type event type to emit
         * @param {...*} args - arguments (excluding type) will be set in event.data
         * @publicdoc
         */
        emit: function(type, ...args) {
          if (this._events) {
            const handlers = this._events.get(type);
            if (handlers && handlers.length) {
              const event = new cls.Event(type);
              event.data = [...args];
              const list = handlers.slice();
              for (const handler of list) {
                if (handler && !event.cancel) {
                  handler.call(this, event, this, ...args);
                }
              }
            }
          }
        },

        /**
         * Registers a handler for this event type
         * @param {string} type - event type (e.g. "attribute changed")
         * @param {function} handler - handler to trigger when the event type is emitted
         * @param {boolean=} once - if true, will only fire once
         * @returns {HandleRegistration} a registration handle (for unbind purpose)
         * @publicdoc
         */
        when: function(type, handler, once) {
          if (this._destroyed) {
            context.LogService.warn("EventListener - Trying to register an event from a destroyed Object: " + type);
            return Function.noop;
          }
          let handlers = this._events.get(type);
          if (!handlers) {
            handlers = [];
            this._events.set(type, handlers);
          }
          let hdlr = handler;
          if (once) {
            hdlr = function(event, src, ...args) {
              this._off(type, hdlr);
              handler.call(this, event, src, ...args);
            }.bind(this);
          }
          handlers.push(hdlr);
          return this._off.bind(this, type, hdlr);
        },

        /**
         * Checks if an event handler has been registered for the given type
         * @param {string} type - event type
         * @return {boolean} true if an event handler has been registered for the given type, false otherwise
         */
        hasEventListeners: function(type) {
          if (this._events) {
            const handlers = this._events.get(type);
            return Boolean(handlers) && handlers.length;
          }
          return false;
        },

        /**
         * Removes an event
         * @param {string} type event type to remove
         * @param {function} handler - event handler id
         * @private
         */
        _off: function(type, handler) {
          //// debug list unregistered listeners
          // if (window.reged[type] && window.reged[type][this.__name]) {
          //   window.reged[type][this.__name]--;
          //   if (!window.reged[type][this.__name]) {
          //     delete window.reged[type][this.__name];
          //   }
          //   if (!Object.keys(window.reged[type]).length) {
          //     delete window.reged[type];
          //
          //   }
          // } else {
          //   console.warn("could not _off event", type, this.__name);
          // }
          if (!this._destroyed) {
            const handlers = this._events.get(type);
            if (handlers) {
              const pos = handlers.indexOf(handler);
              if (pos === -1) {
                gbc.error("We are trying to destroy the wrong event listener ! Please check " + this.__name + " " + type +
                  " event listener bindings and definitions in the project and customizations");
              } else {
                handlers.splice(pos, 1);
                if (handlers.length === 0) {
                  this._events.delete(type);
                }
              }
            } else {
              gbc.error(this.__name + " " + type +
                " event listener has already been destroyed previously. We shouldn't try to remove it again. Please check references and calls of this event listener."
              );
            }
          }
        },

        /**
         * Create a handler of timeout
         * @param {function} callback - function to execute after given time
         * @param {number} time - time in ms before execution
         * @return {?number} - handler
         * @protected
         */
        _registerTimeout: function(callback, time) {
          if (!this._asyncHandlers) {
            return null;
          }
          const timeout = {
            type: "timeout"
          };
          this._asyncHandlers.push(timeout);
          const id = window.setTimeout(function() {
            this._asyncHandlers.remove(timeout);
            callback();
          }.bind(this), time);
          timeout.id = id;
          return id;
        },

        /**
         * Create a handler for requestAnimationFrame
         * @param {function} callback - function to execute after the animation frame
         * @return {number} - handler
         * @protected
         */
        _registerAnimationFrame: function(callback) {
          const requestAnimationFrame = {
            type: "requestAnimationFrame"
          };
          this._asyncHandlers.push(requestAnimationFrame);
          const id = window.requestAnimationFrame(function() {
            this._asyncHandlers.remove(requestAnimationFrame);
            callback();
          }.bind(this));
          requestAnimationFrame.id = id;

          return id;
        },

        _clearTimeout: function(id) {
          if (this._asyncHandlers) {
            this._asyncHandlers.removeMatching(function(handler) {
              return handler.type === "timeout" && handler.id === id;
            });
          }
          window.clearTimeout(id);
        },

        _clearAnimationFrame: function(id) {
          if (this._asyncHandlers) {
            this._asyncHandlers.removeMatching(function(handler) {
              return handler.type === "requestAnimationFrame" && handler.id === id;
            });
          }
          window.cancelAnimationFrame(id);
        },

        /**
         * Clear all asynchronous calls
         * @private
         */
        _clearAllAsyncCalls: function() {
          if (this._asyncHandlers && this._asyncHandlers.length > 0) {
            this._asyncHandlers.forEach(function(handler) {
              if (handler.type === "timeout") {
                window.clearTimeout(handler.id);
              }
              if (handler.type === "requestAnimationFrame") {
                window.cancelAnimationFrame(handler.id);
              }
            });
            this._asyncHandlers = [];
          }
        },
      };
    });
  });
