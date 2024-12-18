/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('DelayedKeyCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Delayed key command.
     * @class DelayedKeyCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.DelayedKeyCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.DelayedKeyCommand.prototype */ {
        __name: "DelayedKeyCommand",

        /** @type String */
        _keyString: null,

        /** @type Object */
        _keyEvent: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {String} keyString string corresponding to the key
         * @param {Object} keyEvent keyDown js event
         */
        constructor: function(app, keyString, keyEvent) {
          $super.constructor.call(this, app, null);
          this._keyString = keyString;
          this._keyEvent = keyEvent;
          this._executeImmediately = true;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          let processed = false;
          const focusedVMNode = this._app.getFocusedVMNodeAndValue();
          if (focusedVMNode) {
            const controller = focusedVMNode.getController();
            if (controller) {
              processed = this._app.keyboard.processKey(this._keyString, this._keyEvent, false);
              if (!processed) {
                context.LogService.scheduler.log("DelayedKeyCommand execute function on", controller);
                processed = this._simulateBrowserBehavior(controller);
              }

              this._app.keyboard.executeKeyUp(this._keyString, this._keyEvent);
            }
          }
          return processed;
        },

        /**
         * Try mimic browser behavior on a widget
         * @param {classes.WidgetBase} widget - widget on which we try to execute the key
         * @returns {boolean} true if key has been processed
         */
        simulateBrowserBehaviorOnWidget: function(widget) {
          if (!(widget instanceof cls.FieldWidgetBase)) {
            return false;
          }

          if (!widget.hasInputElement() || !widget.hasCursors() || widget.isReadOnly() || widget.isNotEditable()) {
            return false;
          }

          let consumed = false;
          let value = widget.getValue().toString();
          let keyString = this._keyString;
          const keyEvent = this._keyEvent;
          const cursors = widget.getCursors();

          const ctrlA = window.browserInfo.isSafari ? 'meta+a' : 'ctrl+a';
          if (keyString === 'space') { // needed for IE
            keyString = ' '; // replace "space" by " "
          } else {
            keyString = cls.KeyboardApplicationService.getCharIfComposedKey(keyString, keyEvent);
          }
          if (cls.KeyboardHelper.isChar(keyString)) { // value key
            const firstPart = value.substr(0, cursors.start);
            const secondPart = value.substr(cursors.end);
            value = firstPart + keyString;
            const newCursorPos = value.length;
            value += secondPart;
            cursors.start = cursors.end = newCursorPos;
            consumed = true;
          } else switch (keyString) { // modifier key
            case widget.getStart():
              cursors.start = cursors.start > 0 ? cursors.start - 1 : 0;
              cursors.end = cursors.start;
              consumed = true;
              break;
            case widget.getEnd():
              cursors.start = cursors.end < value.length ? cursors.end + 1 : value.length;
              cursors.end = cursors.start;
              consumed = true;
              break;
            case 'home':
              cursors.start = cursors.end = 0;
              consumed = true;
              break;
            case 'end':
              cursors.start = cursors.end = value.length;
              consumed = true;
              break;
            case 'shift+' + widget.getStart():
              cursors.start = cursors.start > 0 ? cursors.start - 1 : 0;
              consumed = true;
              break;
            case 'shift+' + widget.getEnd():
              cursors.end = cursors.end < value.length ? cursors.end + 1 : value.length;
              consumed = true;
              break;
            case ctrlA:
              cursors.start = 0;
              cursors.end = value.length;
              consumed = true;
              break;
            case 'backspace':
              if (cursors.end > 0 && value) {
                if (cursors.start === cursors.end) {
                  value = value.slice(0, cursors.start - 1) + value.slice(cursors.start);
                  cursors.start = cursors.end = cursors.end - 1;
                } else {
                  value = value.slice(0, cursors.start) + value.slice(cursors.end);
                }
              }
              consumed = true;
              break;
            case 'del':
            case 'delete':
              if (cursors.end > -1 && value) {
                if (cursors.start === cursors.end) {
                  value = value.slice(0, cursors.start) + value.slice(cursors.start + 1);
                } else {
                  value = value.slice(0, cursors.start) + value.slice(cursors.end);
                }
              }
              consumed = true;
              break;
          }

          if (consumed) {
            widget.setValue(value, false);
            widget.setCursors(cursors.start, cursors.end);
            // Because we simulate a key input, we need to call manageInput
            widget.manageInput();
          }

          return consumed;
        },

        /**
         * Try mimic browser behavior on a controller widget
         * @param {classes.ControllerBase} controller - controller on which we try to execute the key
         * @returns {boolean} true if key has been processed
         */
        _simulateBrowserBehavior: function(controller) {
          if (!controller || !controller.getWidget()) {
            return false;
          }

          const widget = controller.getWidget();
          return this.simulateBrowserBehaviorOnWidget(widget);
        },

        /**
         * @inheritDoc
         */
        checkIntegrity: function() {
          return true;
        }
      };
    });
  }
);
