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

modulum('KeyboardApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {
    /**
     * @class KeyboardApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.KeyboardApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.KeyboardApplicationService.prototype */ {
        __name: "KeyboardApplicationService",
        $static: /** @lends classes.KeyboardApplicationService */ {
          keymap: {
            8: 'backspace',
            9: 'tab',
            13: 'enter',
            16: 'shift',
            17: 'ctrl',
            18: 'alt',
            19: 'pause',
            20: 'capslock',
            27: 'esc',
            32: 'space',
            33: 'pageup',
            34: 'pagedown',
            35: 'end',
            36: 'home',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            45: 'ins',
            46: 'del',
            91: 'meta',
            92: 'meta',
            93: 'contextmenu',
            112: 'f1',
            113: 'f2',
            114: 'f3',
            115: 'f4',
            116: 'f5',
            117: 'f6',
            118: 'f7',
            119: 'f8',
            120: 'f9',
            121: 'f10',
            122: 'f11',
            123: 'f12',
            144: 'numlock',
            145: 'scrolllock',
            224: 'meta',
          },

          navigationKeys: [
            'up',
            'down',
            'left',
            'right'
          ],

          /**
           * For composed keys (shift+key) and (ctrl+alt+key) where key.length = 1
           * transform keyString into the keyEvent.key char
           * Ex (shift+a --> 'A' or 'ctrl+alt+e' --> €)
           * @param {String} keyString - key string ex "shift+a"
           * @param {Object} keyEvent - dom key event
           * @returns {String} char for composed keys or unchanged keyString
           */
          getCharIfComposedKey: function(keyString, keyEvent) {
            if (keyEvent.key.length === 1 && (keyEvent.shiftKey || (keyEvent.ctrlKey && keyEvent.altKey))) {
              return keyEvent.key;
            }
            return keyString;
          }
        },

        /** @type {String} */
        _bufferedKeys: null,
        /** @type {Boolean} */
        _keyDownProcessed: false,

        /**
         * @inheritDoc
         */
        constructor: function(app) {
          $super.constructor.call(this, app);
          this._application.dvm.onOrdersManaged(this._bindKeyboardEvents.bind(this), true);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._bufferedKeys = null;
          this._unbindKeyboardEvents();
          $super.destroy.call(this);
        },

        /**
         * Bind keydown & keyup events on the ui and listen to them to catch all keys
         * @private
         */
        _bindKeyboardEvents: function() {
          const uiWidget = this._application.getUI().getWidget();
          if (uiWidget) {
            const uiElement = uiWidget.getElement();
            uiElement.on("keydown.UserInterfaceWidget", this._onKeyDown.bind(this));
            uiElement.on("keyup.UserInterfaceWidget", this._onKeyUp.bind(this));
          }
        },

        /**
         * Unbind keydown & keyup events of the ui
         * @private
         */
        _unbindKeyboardEvents: function() {
          const uiWidget = this._application.getUI().getWidget();
          if (uiWidget) {
            const uiElement = uiWidget.getElement();
            uiElement.off("keydown.UserInterfaceWidget");
            uiElement.off("keyup.UserInterfaceWidget");
          }
        },

        /**
         * Used the DBFormat definition to replace the keypad '.' by the good one
         * @param event
         * @returns {boolean} true if the translation is done
         * @private
         */
        _translateKeyAccordingDBFormat: function(event) {
          const userInterfaceNode = this._application.getNode(0);

          if (!userInterfaceNode.isAttributeSetByVM("decimalSeparator")) {
            return false;
          }

          const decimalSeparator = userInterfaceNode.attribute("decimalSeparator");

          if (event.key === "." && decimalSeparator !== event.key && event.code === "NumpadDecimal") {
            event.stopPropagation();
            event.preventCancelableDefault();

            const newEvent = new cls.DelayedKeyCommand(this._application, decimalSeparator, event);
            this._keyDownProcessed = this.processKey(decimalSeparator, event, false);

            if (!this._keyDownProcessed) {
              const focusedNode = this._application.getFocusedVMNodeAndValue(true);
              const widget = focusedNode && focusedNode.getWidget();

              if (widget) {
                newEvent.simulateBrowserBehaviorOnWidget(widget);
              }
            }

            this.executeKeyUp(decimalSeparator, event);

            return true;
          }

          return false;
        },

        /**
         * Keydown handler bound on UserInterface widget. Catch all keydown events and propagate it to the corresponding widget.
         * We detect the key combination and execute all actions bound to it. Otherwise, we let widget manage the key
         * @param event
         * @private
         */
        _onKeyDown: function(event) {
          if (!this._canProcessEvent()) {
            return;
          }

          event.gbcKey = this.getNormalizedKey(event);

          if (this._translateKeyAccordingDBFormat(event)) {
            return;
          }

          let combi = this.translateKeys(event, event.gbcKey);

          if (gbc.androidEmulationDebug === true) {
            // Try to emulate android behavior

            if (combi === "tab") {
              // try to emulate "next field" virtual keyboard key
              event.preventCancelableDefault();
              event.stopPropagation();
              this._emulateAndroidNextFieldVirtualKey();

            } // keyDown keyCode are not raised correctly on android, so set key as "unidentified"
            combi = "unidentified";
          }

          // if user keep pressing same key without releasing it and typeahead is flagged as frozen, we don't push event
          this._keyDownProcessed = false;

          const repeatKey = this._bufferedKeys === combi;

          if (combi && !combi.includes("unidentified")) {
            this._bufferedKeys = combi;
            context.LogService.keyboard.log("KEY USED onKeyDown saved as bufferedKeys : ", this._bufferedKeys, event.key);

            window.isCapslock(event);

            const focusedNode = this._application.getFocusedVMNodeAndValue(true);
            // Add delayed keys when (vm is processing or when there are already pending commands) and no webcomponent is inside the current focused node.
            // They may be background process such as current focused node being destroyed when checking on webcomponent
            if (!this._application.scheduler.hasNoCommandToProcess() && (!focusedNode || focusedNode.getFirstChild(
                'WebComponent') === null)) {
              event.stopPropagation();
              event.preventCancelableDefault();

              if (!repeatKey) { // don't delay repeated key, simply ignore it
                context.LogService.keyboard.log("Delayed key captured : ", this._bufferedKeys);
                this._application.scheduler.delayedKeyCommand(this._bufferedKeys, event);
              }
            } else {
              this._keyDownProcessed = this.processKey(this._bufferedKeys, event, repeatKey);
              if (this._keyDownProcessed) {
                context.LogService.keyboard.log("onKeyDown processed event.key : ", event.key);
              }
            }
          }
        },

        /**
         * Try to emulate "Next field" virtual keyboard behavior
         * @private
         */
        _emulateAndroidNextFieldVirtualKey: function() {
          const focusedNode = this._application.getFocusedVMNodeAndValue(true);
          const focusedWidget = focusedNode.getWidget();

          let found = false;
          if (focusedWidget.getInputElement()) {
            // go through all element of the FORM
            for (const field of focusedWidget.getInputElement().form) {
              // if field is after the current one, and is not readonly focus it
              if (found && !field.hasAttribute("readonly")) {
                field.focus();
                break;
              }
              // search current field
              if (field === focusedWidget.getInputElement()) {
                found = true;
              }
            }
          }
        },

        /**
         * Keyup handler bound on UserInterface widget. Catch all keyup events and propagate it to the corresponding widget.
         * Key combination previously detected in Keydown is passed as parameter
         * @param event
         * @private
         */
        _onKeyUp: function(event) {
          if (!this._canProcessEvent()) {
            return;
          }

          const key = this.getNormalizedKey(event);
          if (!key.toLowerCase().includes("unidentified")) {
            // if scheduler isn't finished, don't manage key up it will be done by DelayedKey command
            if (!this._application.scheduler.hasNoCommandToProcess()) {
              event.stopPropagation();
              event.preventCancelableDefault();
            } else {
              event.gbcKey = key;
              this.executeKeyUp(this._bufferedKeys, event);
            }
          }
          this._bufferedKeys = null;
        },

        /**
         * @param {String} keyString string corresponding to the key
         * @param {Object} keyEvent keyDown js event
         */
        executeKeyUp: function(keyString, keyEvent) {
          const focusedNode = this._application.getFocusedVMNodeAndValue(true);
          const widget = focusedNode && focusedNode.getWidget();
          if (widget) {
            // we pass bufferedKeys as parameter in order to be able to be sure to manage previously typed combination.
            widget.manageKeyUp(keyString, keyEvent);
          }
        },

        /**
         * Check if key is a basic modifier (ctrl, shift, alt)
         * @param {string} key
         * @returns {boolean} returns true if key is a basic modifier
         */
        isBasicModifier: function(key) {
          const k = key.toLowerCase();
          return k === 'shift' || k === 'ctrl' || k === 'alt' || k === 'meta' || k === 'dead';
        },

        /**
         * Normalize DOM event key using VM modifier common names
         * @param event
         * @returns {*|string} returns normalized key
         */
        getNormalizedKey: function(event) {
          let key = cls.KeyboardApplicationService.keymap[event.which] || "";

          // Difference between Numpad keys and "normal" keys
          if (key === "enter" && event.code !== "NumpadEnter") {
            key = "return";
          } else if (key === "del" && event.code !== "NumpadDecimal") {
            key = "delete";
          } else if (key === "ins" && event.code !== "Numpad0") {
            key = "insert";
          }

          if (!key) {
            key = event.key;
          }

          if (!key) {
            key = String.fromCharCode(event.which || event.code);
          }

          return key;
        },

        /**
         * Get the combination of keys (modifiers included) being typed
         * @param event
         * @param {string} normalizedKey
         * @returns {string} returns normalized keys combination
         */
        translateKeys: function(event, normalizedKey) {
          const ctrlKey = event.ctrlKey;
          const altKey = event.altKey;
          const shiftKey = event.shiftKey;
          const metaKey = event.metaKey;

          let keys = "";
          if (!this.isBasicModifier(normalizedKey)) {
            if (metaKey) {
              if (keys.length !== 0) {
                keys += '+';
              }
              keys += "meta";
            }
            // use that order : ctrl+shift+alt
            if (ctrlKey) {
              if (keys.length !== 0) {
                keys += '+';
              }
              keys += "ctrl";
            }
            if (altKey) {
              if (keys.length !== 0) {
                keys += '+';
              }
              keys += "alt";
            }
            if (shiftKey) {
              if (keys.length !== 0) {
                keys += '+';
              }
              keys += "shift";
            }
            if (keys.length !== 0) {
              keys += '+';
            }
            keys += normalizedKey;
          }
          return keys.length === 1 ? keys : keys.toLowerCase();
        },

        /**
         *
         * @param {String} keyString - string of the key (including combination, ctrl+, shift+, ...)
         * @param {KeyboardEvent} event - dom key event
         * @param {boolean} repeat - true if key is being pressed
         * @returns {boolean} true if the key has been processed, false otherwise
         */
        processKey: function(keyString, event, repeat) {
          let processed = false;

          const app = this._application;
          const focusedNode = app.getFocusedVMNodeAndValue(true);
          const activeDropDownWidget = app.focus.getActiveDropDownWidget();

          // Search widget
          let widget = focusedNode && focusedNode.getWidget();
          if (!widget) {
            // If focused node is a matrix look for scrollgrid widget
            // because there is no Matrix widget
            if (focusedNode.getTag() === "Matrix") {
              let scrollGridNode = focusedNode.getAncestor("ScrollGrid");
              if (scrollGridNode) {
                widget = scrollGridNode.getWidget();
              }
            }
          }

          // TODO gbc-3832 : this special case, initially created for tables, is maybe not needed anymore
          // 1. Special case CTRL+C, if there is a text selection and the current VM focus has not DOM focus
          if (keyString === "ctrl+c" || keyString === "meta+c") {
            // Case where the RTable is not active but the selection is made on it
            const tableWithItemsSelection = cls.RTableWidget.getTableWithItemsSelection();
            if (tableWithItemsSelection) {
              tableWithItemsSelection._copySelectionInClipboard();
              processed = true;
            } else {
              const selectionText = window.getSelectionText();
              const domFocus = widget.hasDOMFocus();
              if (!domFocus && selectionText && selectionText !== "") {
                // return false, to let the browser manage CTRL+C
                return false;
              }
            }
          }

          // 2. Priority key managed by the widget before any action
          if (!processed && activeDropDownWidget) { // first widget with an active DropDown catches the keys
            processed = activeDropDownWidget.managePriorityKeyDown(keyString, event, repeat);
          }
          if (!processed && widget && !widget.isHidden()) {
            processed = widget.managePriorityKeyDown(keyString, event, repeat);
          }

          // 3. Try to process action for combination key
          if (!processed) {
            processed = this._processAction(keyString);
          }
          // 4. If there is no accelerator defined on combination when shift key is pressed,
          // we try to process action on shifted key directly but only for key which can be displayed.
          // Example : we need this to manage ? accelerator
          if (!processed && event.shiftKey === true && event.key && event.key.length === 1) {
            processed = this._processAction(event.key);
          }

          // 5. if key not processed, ask widget to manage it
          if (!processed && activeDropDownWidget) { // first widget with an active DropDown catches the keys
            processed = activeDropDownWidget.manageKeyDown(keyString, event, repeat);
          }
          if (!processed && widget && !widget.isHidden()) {
            processed = widget.manageKeyDown(keyString, event, repeat);
          }

          // 6. Check if key must be sent to VM (for specific nodes and specific keys we always send to VM)
          if (!processed) {
            let vmKey = cls.KeyboardHelper.convertBrowserKeyToVMKey(keyString);
            let createKeyEvent = false;

            if (widget && !widget.isHidden()) {
              if (widget.isInstanceOf(cls.FieldWidgetBase)) {
                if (keyString === "tab" || keyString === "shift+tab") {
                  createKeyEvent = true;
                }
              } else if (widget.isInstanceOf(cls.TableWidgetBase) || widget.isInArray()) {
                if (keyString === "up" || keyString === "down" || keyString === "tab" || keyString === "shift+tab") {
                  createKeyEvent = true;
                } else {
                  // transform "shift+a" vmKey into "A" to send the correct key at VM
                  // TODO we should probably do this more globally
                  vmKey = cls.KeyboardApplicationService.getCharIfComposedKey(vmKey, event);

                  // letter should be sent to VM for "search" feature
                  createKeyEvent = (focusedNode.attribute("dialogType") === "DisplayArray" && vmKey.length === 1 && (cls
                    .KeyboardHelper
                    .isLetter(vmKey) || cls.KeyboardHelper.isNumeric(vmKey)));
                }
              }
            }
            if (focusedNode.getTag() === "MenuAction") {
              // first letter of actions and nav keys should be sent to VM to navigate in the menu
              createKeyEvent = (this._isMenuActionShortcutKey(focusedNode.getParentNode(), vmKey) ||
                cls.KeyboardApplicationService.navigationKeys.indexOf(keyString) >= 0);
            }

            if (createKeyEvent) {
              context.LogService.keyboard.log("processKey send KeyEvent for key : ", vmKey);
              app.action.sendKey(vmKey, focusedNode);
              processed = true;
            }
          }

          // Handle keys for UR (like F11 to toggle full screen)
          if (!processed) {
            // nativeCall return might be undefined on old UR versions -> undefined means false here
            // Note that GBC browser implementation returns false, the next statement won't consider key as processed
            processed = !!context.__wrapper.nativeCall(context.__wrapper.param({
              name: "keyEvent",
              args: {
                key: keyString
              }
            }, app));
          }

          // 7. Manage dom event, stopPropagation preventDefault if key has been processed
          if (event) {
            if (processed) {
              event.stopPropagation();
              if (event.gbcDontPreventDefault !== true) {
                event.preventCancelableDefault();
              }
            } else {
              // check if existing modal menu
              const uiNode = app.uiNode();
              const currentWindow = uiNode && app.getNode(uiNode.attribute('currentWindow'));
              const modalMenu = currentWindow && currentWindow.getFirstChildWithAttribute('Menu', 'active', 1);
              if (modalMenu) {
                const modalType = modalMenu.attribute("style");
                if (modalType === "winmsg" || modalType === "dialog") {
                  // dialog detected, we need to prevent default to avoid focus being moved to another application
                  event.stopPropagation();
                  event.preventCancelableDefault();
                }
              }
            }
          }

          return processed;
        },

        /**
         * Check if key is a menu action shortcut
         * @param {classes.NodeBase} menuNode
         * @param {string} key
         * @returns {boolean} returns true if key is a shortcut of the passed menu node
         * @private
         */
        _isMenuActionShortcutKey: function(menuNode, key) {
          const menuActions = menuNode.getChildren('MenuAction');
          for (let i = 0; i < menuActions.length; ++i) {
            const menuAction = menuActions[i];
            if (menuAction.attribute('active')) {
              let text = menuAction.isAttributeSetByVM('text') ? menuAction.attribute('text') : menuAction.attribute('name');
              text = text.toString().toLocaleLowerCase();
              if (text && text.length !== 0 && text[0] === key) {
                return true;
              }
            }
          }
          return false;
        },

        /**
         * Find and execute VM action corresponding to key
         * @param {string} keyString - string of the key (including combination, ctrl+, shift+, ...)
         * @returns {boolean} true if the key has been processed, false otherwise
         */
        _processAction: function(keyString) {

          const vmKey = cls.KeyboardHelper.convertBrowserKeyToVMKey(keyString);
          const actionService = this._application.action;

          // Try to find corresponding action in active dialog actions list
          const actionNode = actionService.getActiveDialogActionForKey(vmKey);
          if (actionNode) {
            const cmd = actionService.executeAction(actionNode, {
              sendValue: true
            });
            return cmd !== null;
          }

          // if no action in active dialog, try to process a local action
          return this._processLocalAction(keyString);
        },

        /**
         * Find and execute VM local action corresponding to key
         * @param {string} keyString - string of the key (including combination, ctrl+, shift+, ...)
         * @returns {boolean} true if the key has been processed, false otherwise
         */
        _processLocalAction: function(keyString) {
          let actionNode = null;
          let actionName = null;

          const vmKey = cls.KeyboardHelper.convertBrowserKeyToVMKey(keyString);
          const app = this._application;
          const focusedNode = app.getFocusedVMNodeAndValue(true);
          const actionService = this._application.action;

          const activeForm = focusedNode && focusedNode.getAncestor("Form");

          // 1. Try to find corresponding action in current form action defaults list
          if (activeForm) {
            actionNode = actionService.getDefaultActionForKey(vmKey, activeForm);
            actionName = actionNode?.attribute('name');
          }

          // 2. Try to find corresponding action in application global action defaults list
          if (!actionNode) {
            actionNode = actionService.getDefaultActionForKey(vmKey, this._application.uiNode());
            if (actionNode) {
              actionName = actionNode.attribute('name');
              if (activeForm && actionService.getDefaultActionForName(actionName, activeForm)) {
                context.LogService.keyboard.log("detected a global ActionDefault for this VM key but is override in a sub form : do nothing",
                  vmKey);
                return true; // return true to be sure that key will not be processed after
              }
            }
          }

          // 3. Try to find corresponding action from localAction GBC list
          if (!actionNode) {
            actionName = cls.ActionApplicationService.getLocalActionName(vmKey);
          }

          return actionService.executeLocalAction(actionName);
        },

        /**
         * @return {boolean} false if the application is waiting in background
         * @private
         */
        _canProcessEvent: function() {
          const curSession = context.SessionService.getCurrent();
          const application = curSession && curSession.getCurrentApplication();

          if (application) {
            return application.canProcessEvent();
          }

          return true;
        }
      };
    });
    cls.ApplicationServiceFactory.register("Keyboard", cls.KeyboardApplicationService);
  });
