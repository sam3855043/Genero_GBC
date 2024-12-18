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

modulum('DVMApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {
    /**
     * Application Service to manage DVM interactions for an application
     *
     * @class DVMApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.DVMApplicationService = context.oo.Class(cls.ApplicationServiceBase,
      function($super) {
        return /** @lends classes.DVMApplicationService.prototype */ {

          __name: "DVMApplicationService",
          $static: /** @lends classes.DVMApplicationService */ {
            nodesIgnoringStyleCompute: ["FunctionCall", "FunctionCallParameter"]
          },
          /** Indicator to know if DVM is idle (interactive) or not */
          idle: true,
          _managingOrders: false,
          processed: false,
          /** @type {Boolean} **/
          /*- tell if json protocol is used */
          jsonAuiProtocol: false,
          /**
           * @constructs
           * @param app
           */
          constructor: function(app) {
            $super.constructor.call(this, app);
            this.jsonAuiProtocol = window.isURLParameterEnabled("json") || context.ThemeService.getValue("aui-json-protocol");
            context.LogService.networkProtocol.info("DVM order PARSER :", this.jsonAuiProtocol ? "JSON" : "TCL");
          },

          destroy: function() {
            $super.destroy.call(this);
          },

          updateProcessingStatus: function() {
            const menu = this._getMenu("runtimeStatus");
            if (menu) {
              let uiWidget = this._application.getUI().getWidget();
              if (this.idle) {
                menu.setIdle();
                uiWidget.domAttributesMutator(() => uiWidget.removeClass("processing"));
              } else {
                menu.setProcessing();
                uiWidget.domAttributesMutator(() => uiWidget.addClass("processing"));
              }
            }
          },

          setIdle: function(isIdle) {
            this.idle = isIdle;
            if (!this.processed && this.idle) {
              this.processed = true;
            }
            this.updateProcessingStatus();
            this.emit(context.constants.baseEvents.idleChanged);
          },

          onOrdersManaged: function(hook, once) {
            return this.when(context.constants.baseEvents.ordersManaged, hook, once);
          },

          onIdleChanged: function(hook) {
            return this.when(context.constants.baseEvents.idleChanged, hook);
          },

          manageAuiOrders: function(data, callback) {
            this._managingOrders = true;

            const treeModificationTrack = new cls.TreeModificationTracker(),
              nodesWithDom = [];

            // Consider default data to be correctly encoded
            let vmMessages = data;

            // In case of not parsed yet
            if (typeof data === "string") {
              if (this.jsonAuiProtocol && data.slice(0, 2) !== "om") { // if first 2 chars are "om", it's not json
                vmMessages = data

                  .split("\n")
                  .filter(om => om.length > 0)
                  .map(om => JSON.parse(om));
              } else {
                // Use old way to decode messages
                vmMessages = cls.AuiProtocolReader.translate(data);
              }
            }
            context.styler.bufferize();
            this._application.getUI().getWidget().bufferizeDom(true);
            let needLayout = false;
            let hasAddedRemovedNodes = false;
            let hasAddedRemovedStylableNodes = false;
            let containsRipWidget = false;
            const initialOrder = vmMessages.length && vmMessages[0] && vmMessages[0].id === 0 && vmMessages[0];
            // 1. readOrder : create nodes
            let order = {};

            while (vmMessages.length) {
              if (this._application) {
                const om = vmMessages.shift();

                if (this.jsonAuiProtocol && Array.isArray(om)) {
                  if (om.length === 3 && om[0] === "om") {
                    order.type = om[0];
                    order.id = om[1];
                    order.operations = om[2];
                  } else {
                    throw new Error("Received auiTree bad format : " + order);
                  }
                } else {
                  order = om;
                }

                if (order.type !== "om") {
                  throw new Error("Received auiTree bad format : " + order);
                }

                const result = this.manageAuiOrder(order, treeModificationTrack, nodesWithDom);
                containsRipWidget = containsRipWidget || result.containRipWidget;
                needLayout = needLayout || result.needLayout;
                hasAddedRemovedNodes = hasAddedRemovedNodes || result.hasAddedRemovedNodes;
                hasAddedRemovedStylableNodes = hasAddedRemovedStylableNodes || result.hasAddedRemovedStylableNodes;
                if (vmMessages.length !== 0 && treeModificationTrack.isNodeAttributeChanged(0, 'runtimeStatus')) {
                  // We don't apply behaviors before reading all VM orders
                  // except for runtimeStatus which must be managed immediately
                  // to handle the transitive 'childstart' status
                  const runtimeStatusTracker = new cls.TreeModificationTracker();
                  runtimeStatusTracker.attributeChanged(0, 'runtimeStatus');
                  this._application.getNode(0).applyBehaviors(runtimeStatusTracker);
                }
              }
            }

            let callbackDone = false;
            const rootNode = this._application && this._application.getNode(0);

            if (rootNode) {
              if (containsRipWidget) {
                this._application.fail(i18next.t('gwc.app.ripWidgetFound'));
                this._application.scheduler.emptyCommandsQueue(); // cancel all command and send only the destroyEvent
                const event = new cls.VMDestroyEvent(-3, i18next.t('gwc.app.ripWidgetFound')); // -3 = bad AUI (see spec in VM DestroyEvent.js)
                this._application.scheduler.eventVMCommand(event);
              }

              treeModificationTrack.attributeChanged(0, "runtimeStatus");

              const runtimeStatus = rootNode.attribute('runtimeStatus');
              if (runtimeStatus === "childstart" || runtimeStatus === "processing") {
                callbackDone = true;
                if (callback) {
                  callback();
                }
              }

              if (initialOrder) {
                treeModificationTrack.attributeChanged(0, "focus");
              }

              const nodes = this._application.model.nodeHash;
              for (const node of nodes) {
                if (node && cls.DVMApplicationService.nodesIgnoringStyleCompute.indexOf(node.getTag()) < 0) {
                  if (treeModificationTrack.isNodeCreated(node._id) || treeModificationTrack.isNodeAttributeChanged(node._id, "style")) {
                    node.getApplication().styleAttributesChanged.push(node);
                  }

                  node.resetActivePseudoSelectors();
                }
              }

              // 2. update styles
              if (this._application.styleListsChanged || this._application.styleAttributesChanged.length || hasAddedRemovedStylableNodes) {
                rootNode.updateApplicableStyles(true, this._application.styleListsChanged,
                  this._application.styleAttributesChanged, treeModificationTrack);
                this._application.usedStyleAttributes = {};
                const styleLists = rootNode.getChildren('StyleList');
                for (const styleList of styleLists) {
                  const styles = styleList.getChildren();
                  for (const style of styles) {
                    const styleAttributes = style.getChildren();
                    for (const attr of styleAttributes) {
                      this._application.usedStyleAttributes[attr.attribute('name')] = true;
                    }
                  }
                }
                for (const node of nodes) {
                  if (node) {
                    node.resetPseudoSelectorsUsedInSubTree();
                  }
                }
                for (const node of nodes) {
                  if (node) {
                    node.updatePseudoSelectorsUsedInSubTree();
                  }
                }
                treeModificationTrack.forEach(function(mods, idRef) {
                  if (mods.created && !mods.removed) {
                    const node = this._application.getNode(idRef);
                    if (node) {
                      node.setInitialStyleAttributes();
                    }
                  }
                }.bind(this));
              }

              // 3. create controllers + widgets
              this._createControllers(treeModificationTrack);
              this._notifyUpdatedAttributes(treeModificationTrack);

              if (this._application.styleListsChanged || this._application.styleAttributesChanged.length || hasAddedRemovedStylableNodes) {
                for (const node of nodes) {
                  if (node) {
                    const controller = node.getController();
                    if (controller) {
                      controller.setStyleBasedBehaviorsDirty(true, true);
                    }
                  }
                }
              }

              this._application.styleListsChanged = false;
              this._application.styleAttributesChanged = [];

              let stillDirty = true;
              // 4. Apply behaviors
              while (stillDirty) {
                stillDirty = rootNode.applyBehaviors(treeModificationTrack, true);
              }

              // 5. Add root widget to DOM
              for (const domNode of nodesWithDom) {
                if (!domNode.getParentNode()) {
                  if (domNode.getController()) {
                    this._application.attachRootWidget(domNode.getController().getWidget());
                  }
                }
              }
            }
            this._application.getUI().getWidget().bufferizeDom(false); // calls context.styler.flush() in requestAnimationFrame
            context.styler.flush(); // removing this generates a regression on GBC-1637
            if (!callbackDone) {
              if (callback) {
                callback();
              }
            }
            if (this._application) {
              this._application.scheduler.validateLastCommand();
              // create restore focus command (if not previously created in validateLastCommand) to make sure we restore focus (if needed) after each VM response
              this._application.scheduler.restoreFocusCommand(false);
            }

            this._managingOrders = false;
            this.emit(context.constants.baseEvents.ordersManaged, data);
          },

          manageAuiOrder: function(order, treeModificationTrack, nodesWithDom) {
            const result = {
              needLayout: false,
              hasAddedRemovedNodes: false,
              hasAddedRemovedStylableNodes: false,
              containRipWidget: false
            };
            let node;
            let i;
            for (const operation of order.operations) {
              const isJsonOperation = Array.isArray(operation);

              // cmd is operation if not json protocol
              let cmd = this.jsonAuiProtocol && isJsonOperation ? {
                type: operation[0]
              } : operation;
              switch (cmd.type) {
                case "update":
                case "u":
                  if (this.jsonAuiProtocol && isJsonOperation) {
                    cmd.id = operation[1];
                    cmd.attributes = operation[2];
                  }
                  result.needLayout = this._application.model.commandUpdate(cmd, treeModificationTrack) || result.needLayout;
                  this._application.getNode(0).auiSerial = order.id;
                  break;
                case "add":
                case "a":
                  if (this.jsonAuiProtocol && isJsonOperation) {
                    cmd.parent = operation[1];
                    cmd.node = {
                      id: operation[3],
                      type: operation[2], // same as tag
                      attributes: operation[4],
                      children: operation[5]
                    };
                  }
                  node = this._application.model.commandAdd(cmd, treeModificationTrack);
                  result.containRipWidget = gbc.classes.NodeFactory.ripWidgetCreated();
                  if (node) {
                    nodesWithDom.push(node);
                    result.needLayout = result.needLayout || Boolean(cls.LayoutTriggerAttributes[cmd.type][node._tag]);
                    result.hasAddedRemovedNodes = true;
                    if (cls.DVMApplicationService.nodesIgnoringStyleCompute.indexOf(node.getTag()) < 0) {
                      result.hasAddedRemovedStylableNodes = true;
                    }
                  }
                  if (this._application) {
                    this._application.getNode(0).auiSerial = order.id;
                  }
                  break;
                case "remove":
                case "r":
                  if (this.jsonAuiProtocol && isJsonOperation) {
                    cmd.id = operation[1];
                  }
                  node = null;
                  for (i = 0; i < nodesWithDom.length; ++i) {
                    if (nodesWithDom[i].getId() === cmd.id) {
                      nodesWithDom.splice(i, 1);
                      break;
                    }
                  }
                  const toDestroy = this._application.getNode(cmd.id);
                  treeModificationTrack.nodeRemoved(cmd.id, toDestroy ? toDestroy._tag : null);
                  if (toDestroy) {
                    if (cls.DVMApplicationService.nodesIgnoringStyleCompute.indexOf(toDestroy.getTag()) < 0) {
                      result.hasAddedRemovedStylableNodes = true;
                    }
                    // detach from DOM first and then destroy recursively
                    if (toDestroy.getController()) {
                      const widget = toDestroy.getController().getWidget();
                      if (widget) {
                        widget.detach();
                      }
                    }

                    treeModificationTrack.clean(toDestroy);
                    toDestroy.destroy();
                  }
                  if (cmd.id === 0) {
                    this._application.setEnding();
                    this.emit(context.constants.baseEvents.gotRN0);
                  } else {
                    this._application.getNode(0).auiSerial = order.id;
                  }
                  result.needLayout = result.needLayout || Boolean(cls.LayoutTriggerAttributes[cmd.type][toDestroy._tag]);
                  result.hasAddedRemovedNodes = true;
                  break;
                default:
                  node = null;
                  context.LogService.error("dvm.manageAuiOrder: Invalid command (" + cmd.type + ")");
              }
            }

            return result;
          },

          /**
           * Call update attributes callback for modified attributes
           * @param {classes.TreeModificationTracker} treeModificationTrack tree modifications log
           * @private
           */
          _notifyUpdatedAttributes: function(treeModificationTrack) {
            treeModificationTrack.forEach(function(mods, nodeId) {
              const node = this._application.getNode(nodeId);
              if (node) {
                const attrs = Object.keys(mods.updatedAttributes);
                for (const attr of attrs) {
                  const eventName = cls.NodeBase.attributeChangedEventName(attr);
                  if (node.hasEventListeners(eventName)) {
                    const oldValue = node.previousAttribute(attr);
                    const newValue = node.attribute(attr);
                    node.emit(eventName, {
                      node: node,
                      attr: attr,
                      old: oldValue,
                      new: newValue,
                      changed: newValue !== oldValue
                    });
                  }
                }
              }
            }.bind(this));
          },

          /**
           * Create controllers for created nodes
           * @param {classes.TreeModificationTracker} treeModificationTrack tree modifications log
           * @private
           */
          _createControllers: function(treeModificationTrack) {
            treeModificationTrack.forEach(function(mods, nodeId) {
              if (mods.createdSubTreeRoot) {
                const node = this._application.getNode(nodeId);
                if (node && !node._destroyed) {
                  node.createController();
                  node.attachUI();
                }
              }
            }.bind(this));
          },

          /**
           * Get a menu item by name
           * @param {String} name of the action to get
           * @return {boolean|*}
           * @private
           */
          _getMenu: function(name) {
            let menu = null;
            const uiWidget = this._application.getUI().getWidget().getUserInterfaceWidget();
            if (uiWidget) {
              menu = uiWidget.getChromeBarWidget();
              return menu ? menu.getGbcMenuItem(name) : false;
            } else {
              return false;
            }
          }
        };
      });
    cls.ApplicationServiceFactory.register("Dvm", cls.DVMApplicationService);
  });
