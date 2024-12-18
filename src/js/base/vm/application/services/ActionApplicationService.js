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

modulum('ActionApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {
    /**
     * @class ActionApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.ActionApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      /** @lends classes.ActionApplicationService.prototype */
      return {
        __name: "ActionApplicationService",
        $static: /** @lends classes.ActionApplicationService */ {
          /**
           * list of local actions with corresponding key accelerator
           * @type {Object}
           */
          _localActions: {
            'nextfield': 'tab',
            'prevfield': 'shift-tab',
            'nextrow': 'down',
            'prevrow': 'up',
            'firstrow': 'home',
            'lastrow': 'end',
            'nextpage': 'next',
            'prevpage': 'prior',
            'nexttab': 'control-tab',
            'prevtab': 'control-shift-tab',
            'guisnapshot': 'alt-f12'
          },

          /**
           * Returns local action names
           *  @returns {String[]}
           */
          getLocalActionNames: function() {
            return Object.keys(this._localActions);
          },

          /**
           * Returns local action accelerators
           *  @returns {String[]}
           */
          getLocalActionAccelerators: function() {
            return Object.values(this._localActions);
          },

          /**
           * Returns default keyboard accelerator for a local action
           * @param {string} actionName
           * @returns {?string} accelerator
           */
          getLocalActionAccelerator: function(actionName) {
            return this._localActions[actionName];
          },

          /** Returns local action name for an accelerator
           * @param {string} acc
           * @returns {?string} actionName
           */
          getLocalActionName: function(acc) {
            const accelerators = this.getLocalActionAccelerators();
            const names = this.getLocalActionNames();
            for (let i = 0; i < accelerators.length; ++i) {
              if (acc === accelerators[i]) {
                return names[i];
              }
            }
            return null;
          },

          /**
           * Browser native actions
           * @type {String[]}
           */
          browserNativeActions: ["editcopy", "editcut", "editpaste"],

          /**
           * static list of special actions
           * @type {Map<string, Object>}
           */
          specialActions: new Map(),

          /**
           * Add special action in the list
           * @param {string} name - action name
           * @param {Object} ctor - action class typeref
           */
          registerSpecialAction: function(name, ctor) {
            this.specialActions.set(name, ctor);
          },
        },
        /**
         * list of special actions
         * @type {Map<string, Object>}
         */
        _specialActions: null,

        /**
         * list of actions
         * @type {Map<string, classes.ActionNode>}
         */
        _actions: null,

        /**
         * list of actions defaults
         * @type {Map<string, classes.ActionDefaultNode>}
         */
        _actionDefaults: null,

        /**
         * List of bound actions filtered by browser key
         * @type {Map<string, Array>}
         */
        _boundActions: null,

        /**
         * List of interrupt widgets
         * @type {Array}
         */
        _interruptWidgets: null,

        /**
         * @inheritDoc
         */
        constructor: function(app) {
          $super.constructor.call(this, app);
          this._interruptWidgets = [];
          this._actionDefaults = new Map();
          this._boundActions = new Map();
          this._actions = new Map();
          this._specialActions = new Map();
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._specialActions.clear();
          this._actions.clear();
          this._actionDefaults.clear();
          this._boundActions.clear();

          this._interruptWidgets = null;
          this._specialActions = null;
          this._actions = null;
          this._actionDefaults = null;
          this._boundActions = null;

          $super.destroy.call(this);
        },
        /**
         * Add a new action to this App Service
         * @param {classes.ActionNode} action node
         */
        registerAction: function(action) {
          let actionName = action.attribute("name");
          this._actions.set(actionName, action);

          this._bindAccelerators(action);
          if (cls.ActionApplicationService.specialActions.has(actionName)) {
            let actionConstructor = cls.ActionApplicationService.specialActions.get(actionName);
            this._specialActions.set(actionName, new actionConstructor(this));
          }
          if (actionName === "interrupt") {
            for (const element of this._interruptWidgets) {
              element.setInterruptable(false);
            }
          }

          let applicationWidget = this._application.getUI().getWidget();

          // Do not add to contextMenu/rowbound if not an Action/MenuAction
          if (applicationWidget && ["Action", "MenuAction"].contains(action.getTag())) {

            // Add action to application contextMenu
            if (applicationWidget.getContextMenu()) {
              let actionOrder = action.getIndex();
              let contextMenuWidget = applicationWidget.getContextMenu();
              let contextMenu = action.attribute('contextMenu');
              let addInCtxMenu = contextMenu === 'yes' || contextMenu === 'auto';
              if (addInCtxMenu) {
                let actionText = action.attribute("text").replace(/&(.)/g, "$1"); // Filter ampersand
                contextMenuWidget.addAction(actionName,
                  actionText,
                  this._application.wrapResourcePath(action.attribute("image")),
                  action.attribute("acceleratorName").toString(), {
                    clickCallback: function() {
                      contextMenuWidget.hide();
                      action.getWidget().emit(gbc.constants.widgetEvents.click);
                    },
                    hidden: action.attribute("hidden"),
                    order: actionOrder
                  });
              }
            }

            // Add action to application rowBound
            if (applicationWidget.getRowBoundMenu()) {
              let actionOrder = action.getIndex();
              let rowBoundWidget = applicationWidget.getRowBoundMenu();
              let context = action.attribute('context');
              let addInRowBound = context === 'row';

              if (addInRowBound) {
                let actionText = action.attribute("text").replace(/&(.)/g, "$1"); // Filter ampersand
                rowBoundWidget.addAction(actionName,
                  actionText === "" ? actionName : actionText,
                  action.attribute("image"),
                  action.attribute("acceleratorName").toString(), {
                    clickCallback: function() {
                      rowBoundWidget.hide();
                      action.execute();
                    },
                    hidden: action.attribute("hidden"),
                    order: actionOrder
                  });
              }
            }
          }
        },

        /**
         * Add a new actionDefault to this App Service
         * @param {classes.NodeBase} action node
         */
        registerActionDefault: function(action) {
          this._actionDefaults.set(action.attribute("name"), action);

          this._bindAccelerators(action);
        },

        /**
         * Bind an action to VM accelerators
         * @param {classes.NodeBase} action node
         */
        _bindAccelerators: function(action) {
          // TODO : why do we need to convert VMKey when storing accelerators since we are retrieving them in scheduler doing the opposite ? old implementation ?
          const key1 = cls.KeyboardHelper.convertVMKeyToBrowserKey(action.attribute("acceleratorName"));
          const key2 = cls.KeyboardHelper.convertVMKeyToBrowserKey(action.attribute("acceleratorName2"));
          const key3 = cls.KeyboardHelper.convertVMKeyToBrowserKey(action.attribute("acceleratorName3"));
          const key4 = cls.KeyboardHelper.convertVMKeyToBrowserKey(action.attribute("acceleratorName4"));

          if (key1) {
            this._bindAccelerator(key1, action);
          }
          // we make sure to not bind same action two times :
          // for example, Enter and Return VM accelerators are both considered as Enter key from browser
          // so we only have to bind one action to this key even if there are two accelerators defined on it
          if (key2 && key2 !== key1) {
            this._bindAccelerator(key2, action);
          }
          if (key3 && key3 !== key1 && key3 !== key2) {
            this._bindAccelerator(key3, action);
          }
          if (key4 && key4 !== key1 && key4 !== key2 && key4 !== key3) {
            this._bindAccelerator(key4, action);
          }
        },

        /**
         * Bind action to browser key
         * @param {string} key - DOM key combination
         * @param {classes.NodeBase} action node
         */
        _bindAccelerator: function(key, action) {
          //erase previous action to keep the last one
          this._boundActions.set(key, []);
          const actions = this._boundActions.get(key);
          if (!actions.contains(action._id)) {
            // push new action in the list
            actions.push(action._id);
          }
        },

        /**
         * Unbind an action from VM accelerators
         * @param {classes.NodeBase} action node
         */
        _unbindAccelerators: function(action) {
          // Remove all accelerator bound for this action...
          const key1 = cls.KeyboardHelper.convertVMKeyToBrowserKey(action.attribute("acceleratorName"));
          const key2 = cls.KeyboardHelper.convertVMKeyToBrowserKey(action.attribute("acceleratorName2"));
          const key3 = cls.KeyboardHelper.convertVMKeyToBrowserKey(action.attribute("acceleratorName3"));
          const key4 = cls.KeyboardHelper.convertVMKeyToBrowserKey(action.attribute("acceleratorName4"));

          if (key1) {
            this._unbindAccelerator(key1, action);
          }
          // we make sure to not unbind same action two times :
          // for example, Enter and Return VM accelerators are both considered as Enter key from browser
          // so we only have to unbind one action from this key even if there are two accelerators defined on it
          if (key2 && key2 !== key1) {
            this._unbindAccelerator(key2, action);
          }
          if (key3 && key3 !== key1 && key3 !== key2) {
            this._unbindAccelerator(key3, action);
          }
          if (key4 && key4 !== key1 && key4 !== key2 && key4 !== key3) {
            this._unbindAccelerator(key4, action);
          }
        },

        /**
         * Unbind action from browser key
         * @param {string} key browser key
         * @param {classes.NodeBase} action node
         */
        _unbindAccelerator: function(key, action) {
          const keyActionIdArray = this._boundActions.get(key);
          if (keyActionIdArray) {
            // remove action id from our active actions list
            keyActionIdArray.remove(action._id);
            if (keyActionIdArray.length === 0) {
              this._boundActions.delete(key);
            }
          }
        },

        /**
         * Get the action by its name
         * @param {?string} name of the action
         * @returns {classes.NodeBase} action node
         */
        getAction: function(name) {
          return this._actions.get(name);
        },

        /**
         * Test if the action is registered
         * @param {string} name of the action
         * @returns {boolean} action node
         */
        hasAction: function(name) {
          return this._actions.has(name);
        },

        /**
         * Remove the action and unbind accelerators
         * @param {classes.NodeBase} action
         */
        destroyAction: function(action) {
          this._unbindAccelerators(action);

          let name = action.attribute("name");
          this._actions.delete(name);
          if (this._specialActions.has(name)) {
            this._specialActions.get(name).destroy();
            this._specialActions.delete(name);
          }

          let applicationWidget = this._application.getUI().getWidget();

          // Remove action from app contextMenu
          if (applicationWidget && applicationWidget.getContextMenu()) {
            let contextMenu = applicationWidget.getContextMenu();
            contextMenu.removeAndDestroyAction(name, false);
          }

          // Remove action from rowbound
          if (applicationWidget && applicationWidget.getRowBoundMenu()) {
            let rowBoundWidget = applicationWidget.getRowBoundMenu();
            rowBoundWidget.removeAndDestroyAction(name, false);
          }
        },

        /**
         * Remove the actionDefault and unbind accelerators
         * @param {classes.NodeBase} action
         */
        destroyActionDefault: function(action) {
          this._unbindAccelerators(action);

          const acceleratorName = action.attribute("name");
          this._actionDefaults.delete(acceleratorName);
        },

        /**
         * Send a keyEvent to VM
         * @param {String} vmKey
         * @param {classes.NodeBase} [node] if specified send current cursors and value of this node
         */
        sendKey: function(vmKey, node = null) {
          const vmEvent = new cls.VMKeyEvent(vmKey);

          if (node) {
            const ctrl = node.getController();
            if (ctrl) {
              ctrl.sendWidgetCursors();
              ctrl.sendWidgetValue();
            }
          }
          this._application.scheduler.eventVMCommand(vmEvent);
        },

        /**
         * Execute an action by knowing its name
         * @param {string} name of the action
         * @param {Object} [options]
         * @returns {classes.CommandBase} the created command to execute the action
         */
        executeActionByName: function(name, options = {}) {
          const actionNode = this.getAction(name);
          return this.executeAction(actionNode, options);
        },

        /**
         * Execute an action with its ID
         * @param {number} idRef of the action
         * @param {Object} [options]
         * @returns {classes.CommandBase} the created command to execute the action
         */
        executeActionById: function(idRef, options = {}) {
          const actionNode = this._application.getNode(idRef);
          return this.executeAction(actionNode, options);
        },

        /**
         * Execute an action
         * @param {classes.NodeBase} actionNode 
         * @param {Object} [options]
         * @returns {classes.CommandBase} the created command to execute the action
         */
        executeAction: function(actionNode, options = {}) {

          if (!actionNode) {
            return null;
          }

          if (options.sendValue) {
            const sendValueNode = options.sendValueNode || this._application.getFocusedVMNodeAndValue(true);
            const sendValueCtrl = sendValueNode?.getController();
            if (sendValueCtrl) {
              const isDialogTouchedAction = actionNode.attribute('name') === "dialogtouched";
              // Send value only if node is in input mode
              // Don't send value if a dropDown is opened for the widget (expect for dialogtouched)
              const reallySendValue = sendValueCtrl.isInputKindDialogType() && (!sendValueCtrl.hasActiveDropDown() || isDialogTouchedAction);
              if (reallySendValue) {
                const group = this._application.scheduler.startGroupCommand();
                sendValueCtrl.sendWidgetCursors();
                sendValueCtrl.sendWidgetValue(options.newValue);
                this._application.scheduler.actionVMCommand(actionNode, {
                  noUserActivity: Boolean(options.noUserActivity)
                });
                this._application.scheduler.finishGroupCommand();
                return group;
              }
            }
          }

          return this._application.scheduler.actionVMCommand(actionNode, {
            noUserActivity: Boolean(options.noUserActivity)
          });
        },

        /**
         * Execute a local action
         * @param {String} actionName
         * @returns {boolean} true if local action has been processed
         */
        executeLocalAction: function(actionName) {

          if (!actionName) {
            return false;
          }

          let processed = false;

          if (cls.ActionApplicationService.browserNativeActions.contains(actionName)) {
            context.LogService.keyboard.log("processKey found copy/cut/paste Action");
            // do nothing, for browser native actions (should be managed by the browser itself)
            return false;
          }

          const focusedNode = this._application.getFocusedVMNodeAndValue(true);

          let widget = null;
          let sendKey = false;

          switch (actionName) {
            case "guisnapshot":
              if (gbc.DebugService.isActive() || gbc.LogService.isRecordingEnabled()) {
                this._sendLogEvent("snapshot");
                processed = true;
              }
              break;
            case "nextfield":
            case "prevfield":
              // ignore these local actions for Table in DisplayArray
              sendKey = !(focusedNode.getTag().startsWith("Table") && focusedNode.attribute("dialogType") === "DisplayArray");
              break;
            case "prevpage":
            case "nextpage":
              widget = focusedNode.getWidget();
              // For table, widget process action
              if (widget?.getTableWidgetBase()) {
                widget.getTableWidgetBase().manageLocalAction(actionName);
                processed = true;
              } else { // For other widgets, send key to VM
                sendKey = true;
              }
              break;
            case "prevtab":
            case "nexttab":
              widget = focusedNode.getWidget();
              if (widget?.getFolderWidget()) {
                widget.getFolderWidget().manageLocalAction(actionName);
                processed = true;
              }
              break;
          }

          if (!processed && sendKey) {
            this.sendKey(cls.ActionApplicationService.getLocalActionAccelerator(actionName), focusedNode);
            processed = true;
          }

          return processed;
        },

        registerInterruptWidget: function(widget) {
          this._interruptWidgets.push(widget);
          widget.setInterruptableActive(this._application.isProcessing());
        },

        unregisterInterruptWidget: function(widget) {
          widget.setInterruptableActive(false);
          this._interruptWidgets.remove(widget);
        },

        setInterruptablesActive: function(isActive) {
          for (const element of this._interruptWidgets) {
            element.setInterruptableActive(isActive);
          }
        },

        /**
         * Return the action node of active dialog for a given action name
         * @param actionName the name of the action
         * @returns {?classes.NodeBase} an action node
         */
        getActiveDialogActionForName: function(actionName) {
          const uiNode = this._application.uiNode();
          if (uiNode) {
            const window = this._application.getVMWindow();
            if (window) { // search the action in the current dialog
              const dialog = window.getActiveDialog();
              if (dialog) {
                const actions = dialog.getChildren();
                for (const element of actions) {
                  const action = element;
                  const isActive = action.attribute("active") !== 0;
                  if (isActive) {
                    if (action.attribute("name") === actionName) {
                      return action;
                    }
                  }
                }
              }
            }
          }
          return null;
        },

        /**
         * Return the action node of active dialog according to vmKey param
         * @param {String} vmKey
         * @returns {classes.ActionNode} action node
         */
        getActiveDialogActionForKey: function(vmKey) {

          let actionNode = null;
          const window = this._application.getVMWindow();
          let acceleratorName = null;
          let acceleratorName2 = null;
          let acceleratorName3 = null;
          let acceleratorName4 = null;

          if (window) { // search the action in the current dialog
            const dialog = window.getActiveDialog();
            if (dialog) {
              const actions = /** @type {classes.ActionNode[]} */ dialog.getChildren();
              for (const action of actions) {
                const isActive = (action.attribute("active") !== 0);
                if (isActive) {
                  acceleratorName = action.attribute("acceleratorName");
                  acceleratorName2 = action.attribute("acceleratorName2");
                  acceleratorName3 = action.attribute("acceleratorName3");
                  acceleratorName4 = action.attribute("acceleratorName4");
                  if (acceleratorName && acceleratorName.toString().toLowerCase() === vmKey ||
                    acceleratorName2 && acceleratorName2.toString().toLowerCase() === vmKey ||
                    acceleratorName3 && acceleratorName3.toString().toLowerCase() === vmKey ||
                    acceleratorName4 && acceleratorName4.toString().toLowerCase() === vmKey) {
                    actionNode = action;
                  }
                }
              }
            }
          }
          return actionNode;
        },

        /**
         * Return the action node of default action list according to vmKey param
         * @param {String} vmKey
         * @param {classes.NodeBase} containerNode - node where to search for default action (FORM or UI)
         * @returns {classes.ActionDefaultNode} action default node
         */
        getDefaultActionForKey: function(vmKey, containerNode) {
          let acceleratorName = null;
          let acceleratorName2 = null;
          let acceleratorName3 = null;
          let acceleratorName4 = null;

          // search the action in the action default list
          if (containerNode) {
            const actionDefaultList = containerNode.getFirstChild("ActionDefaultList");
            if (actionDefaultList) {
              const actionDefaults = actionDefaultList.getChildren();
              for (const actionDefault of actionDefaults) {
                acceleratorName = actionDefault.attribute("acceleratorName");
                acceleratorName2 = actionDefault.attribute("acceleratorName2");
                acceleratorName3 = actionDefault.attribute("acceleratorName3");
                acceleratorName4 = actionDefault.attribute("acceleratorName4");
                if (acceleratorName && acceleratorName.toString().toLowerCase() === vmKey ||
                  acceleratorName2 && acceleratorName2.toString().toLowerCase() === vmKey ||
                  acceleratorName3 && acceleratorName3.toString().toLowerCase() === vmKey ||
                  acceleratorName4 && acceleratorName4.toString().toLowerCase() === vmKey) {
                  return /** @type {classes.ActionDefaultNode} */ actionDefault;
                }
              }
            }
          }
          return null;
        },

        /**
         * Return default action with provided name and optionally declared in form node
         * @param {String} name
         * @param {classes.NodeBase} containerNode - node where to search for default action (FORM or UI)
         * @returns {classes.ActionDefaultNode} action default node
         */
        getDefaultActionForName: function(name, containerNode) {
          const actionDefaultList = containerNode.getFirstChild("ActionDefaultList");
          if (actionDefaultList) {
            const actionDefaults = actionDefaultList.getChildren();
            for (const actionDefault of actionDefaults) {
              if (name === actionDefault.attribute("name")) {
                return /** @type {classes.ActionDefaultNode} */ actionDefault;
              }
            }
          }
          return null;
        },

        /**
         * Sends a log event command
         * @param {string} text you want to add to your log
         * @private
         */
        _sendLogEvent: function(text) {
          // Flash app and display message
          this._application.getUI().getWidget().flash(300);
          const messageService = this._application.message;
          const userInterfaceNode = this._application.getNode(0);
          const userInterfaceWidget = userInterfaceNode.getController().getWidget();
          const msgWidget = userInterfaceWidget.getMessageWidget();
          msgWidget.setText("GUI snapshot");
          msgWidget.addClass("warning");
          msgWidget.setHidden(false);
          messageService.addMessage("guisnapshot", msgWidget);
          messageService.handlePositions();
          this._registerTimeout(function() {
            msgWidget.setHidden(true);
          }, 3000);

          let jsonData = {
            type: text
          };
          this._application.scheduler.eventVMCommand(new cls.VMLogEvent(JSON.stringify(jsonData)));
        },
      };
    });
    cls.ApplicationServiceFactory.register("Action", cls.ActionApplicationService);
  });
