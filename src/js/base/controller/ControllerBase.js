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
 * @typedef {Object} ControllerBindings
 * @property {classes.NodeBase} anchor
 * @property {?classes.NodeBase} decorator
 * @property {?classes.NodeBase} container
 * @property {?Object} additionalBindings
 */

modulum('ControllerBase', ['EventListener'],
  /**
   * @namespace Controllers
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Base controller for an AUI node.
     * Manages client side life cycle representation of the node.
     * @class ControllerBase
     * @memberOf classes
     * @extends classes.EventListener
     */
    cls.ControllerBase = context.oo.Class(cls.EventListener, function($super) {
      return /** @lends classes.ControllerBase.prototype */ {
        __name: "ControllerBase",
        /**
         * list of controller's node binding
         * @type {?ControllerBindings}
         */
        _nodeBindings: null,
        /**
         * list of controller's node binding ids
         * @type {number[]}
         */
        _nodeBindingsIds: null,
        /**
         * list of controller's node binding ids
         * @type {Set<string>}
         */
        _watchedNodeBindings: null,
        /**
         * list of controller's node binding ids
         * @type {Set<string>}
         */
        _watchedNodeBindingsAttributes: null,
        _watchesStyleNodeBinding: false,
        /**
         * linked behaviors
         * @type {Object[]}
         */
        _behaviors: null,
        /**
         * controller's widget
         * @type {classes.WidgetBase}
         */
        _widget: null,
        /**
         * controller's widget kind
         * @type {?string}
         */
        _widgetKind: null,
        /**
         * controller's widget active status
         * @type {?boolean}
         */
        _widgetActive: null,
        /**
         * controller's widget nbmp
         * @type {?string}
         */
        _widgetType: null,
        /**
         * if false, don't create controller's widget automatically
         * @type {boolean}
         */
        _autoCreateWidget: true,

        /**
         * Controller unique id
         * @type {number}
         */
        //_id: null,

        /**
         * List of the virtual widgets known by the real controller (not the placeholder controller)
         */
        _virtualWidgets: null,

        /**
         * Index of the current virtual widget (used by getWidget), -1 otherwise
         */
        _virtualWidgetsIdx: null,

        /**
         * Behaviors name to apply to the virtual widgets
         * @type {Set}
         */
        _behaviorToApplytoVirtualWidgets: null,

        /**
         * Behavior name list of the current controller
         * @type {Set}
         */
        _behaviorsNameList: null,

        /**
         * List of the placeholder controller known by the parent controller (ex: MenuController, DialogController)
         * @type {Map}
         */
        _placeholderControllers: null,

        /**
         * @constructs
         * @param {ControllerBindings} bindings
         */
        constructor: function(bindings) {
          $super.constructor.call(this);
          this._nodeBindings = bindings;
          this._watchedNodeBindings = new Set();
          this._watchedNodeBindingsAttributes = new Set();
          this._behaviors = [];
          this._widget = null;

          this._virtualWidgets = [];
          this._virtualWidgetsIdx = -1;
          this._behaviorToApplytoVirtualWidgets = new Set();
          this._behaviorsNameList = new Set();
          this._placeholderControllers = new Map();

          this.createWidget();
          this._initBehaviors();
          this.updateNodeBindingsIds();
          if (gbc.qaMode) {
            this._addBehavior(cls.QAInfoVMBehavior);
          }
          this._addBehavior(cls.AuiNameVMBehavior);
        },

        _initWidgetKind: function() {
          if (this._nodeBindings.container) {
            this._widgetKind = this._nodeBindings.container.attribute("dialogType");
            this._widgetActive = this._nodeBindings.container.attribute("active");
          }
          this._widgetType = this._getWidgetType(this._widgetKind, this._widgetActive);
        },

        isInMatrix: function() {
          return this.getAnchorNode() && this.getAnchorNode().isInMatrix();
        },

        isInTable: function() {
          return this.getAnchorNode() && this.getAnchorNode().isInTable();
        },

        isInFirstTableRow: function() {
          return this.getAnchorNode() && this.getAnchorNode().isInFirstTableRow();
        },

        isInStack: function() {
          return this.getAnchorNode() && this.getAnchorNode().isInStack();
        },

        isInScrollGrid: function() {
          return this.getAnchorNode() && this.getAnchorNode().isInScrollGrid();
        },

        isInToolBar: function() {
          return this.getAnchorNode() && this.getAnchorNode().isInToolBar();
        },

        /**
         * init behaviors: override in children class
         * @protected
         * @abstract
         */
        _initBehaviors: function() {},

        /**
         * Link behavior to the controller
         * @param {Function} BehaviorClass the behavior class to link
         * @param {*} [config] configuration object
         * @protected
         */
        _addBehavior: function(BehaviorClass, config) {
          const behaviorContainer = {
            _behavior: BehaviorClass,
            dirty: true,
            appliedOnce: false
          };

          if (BehaviorClass.watchedAttributes) {
            Object.keys(BehaviorClass.watchedAttributes).forEach(binding => {
              this._watchedNodeBindings.add(binding);
              BehaviorClass.watchedAttributes[binding].forEach(attr => this._watchedNodeBindingsAttributes.add(attr));
            });
          }
          if (BehaviorClass.usedStyleAttributes && BehaviorClass.usedStyleAttributes.length) {
            this._watchesStyleNodeBinding = true;
          }
          if (BehaviorClass.setup) {
            BehaviorClass.setup(this, behaviorContainer, config);
          }
          this._behaviors.push(behaviorContainer);
          BehaviorClass.firstAttach(this, behaviorContainer);

          this._behaviorsNameList.add(behaviorContainer._behavior.__name);
        },

        /**
         * Applies all behaviors attached to this controller
         * @param {classes.TreeModificationTracker} treeModificationTrack list of nodes where behaviors were applied
         * @param {?boolean} force true force apply all
         * @return {boolean} true if behaviors went dirty
         */
        applyBehaviors: function(treeModificationTrack, force) {
          let remainingDirty = false,
            invalidatesFollowing = false;
          const len = this._behaviors.length;

          for (let i = 0; i < len; i++) {
            const behaviorContainer = this._behaviors[i];
            const behavior = behaviorContainer._behavior;
            if (behavior === cls.QAInfoVMBehavior || behavior === cls.AuiNameVMBehavior) {
              behavior.apply(this, behaviorContainer);
              if (this._widget) {
                this._widget.addAppliedBehavior(behavior.__name);
              }

            } else {
              if (force || invalidatesFollowing || behaviorContainer.dirty ||
                (!treeModificationTrack || treeModificationTrack.hasOne(this.getNodeBindingsIds(),
                  this._watchedNodeBindingsAttributes, this._watchesStyleNodeBinding)) &&
                behavior.canApply(this, behaviorContainer, treeModificationTrack)) {
                invalidatesFollowing = behavior.apply(this, behaviorContainer) || invalidatesFollowing;

                if (this._widget) {
                  this._widget.addAppliedBehavior(behavior.__name);
                }

                //Placeholder management
                if (this._behaviorToApplytoVirtualWidgets.has(behavior.__name)) {
                  //Apply behavior on virtual widget
                  for (this._virtualWidgetsIdx = 0; this._virtualWidgetsIdx < this._virtualWidgets.length; this._virtualWidgetsIdx++) {
                    const authBehaviors = this._virtualWidgets[this._virtualWidgetsIdx].commonBehaviorsName;
                    if (authBehaviors.has(behavior.__name)) {
                      let virtualWidget = this.getWidget();
                      behavior.apply(this, behaviorContainer);
                      virtualWidget.addAppliedBehavior(behavior.__name);
                    }
                  }
                  this._virtualWidgetsIdx = -1;
                }
              }
              remainingDirty = remainingDirty || behavior.dirty;
            }
          }

          return remainingDirty;
        },

        /**
         * Reapply behaviours to all the virtual widgets that are not yet applied once
         */
        reapplyBehaviourToVirtualWidgets: function() {
          let len = this._behaviors.length;

          for (let i = 0; i < len; i++) {
            let behaviorContainer = this._behaviors[i];
            let behavior = behaviorContainer._behavior;

            if (behaviorContainer.appliedOnce && this._behaviorToApplytoVirtualWidgets.has(behavior.__name)) {
              for (this._virtualWidgetsIdx = 0; this._virtualWidgetsIdx < this._virtualWidgets.length; this._virtualWidgetsIdx++) {
                let authBehaviors = this._virtualWidgets[this._virtualWidgetsIdx].commonBehaviorsName;
                let virtualWidegt = this.getWidget();

                if (!virtualWidegt.isAppliedBehavior(behavior.__name) && authBehaviors.has(behavior.__name)) {
                  behavior.apply(this, behaviorContainer);
                }
              }
            }
          }

          this._virtualWidgetsIdx = -1;
        },

        /**
         * attach widget
         * @protected
         */
        _attachWidget: function() {
          for (const element of this._behaviors) {
            const behaviorContainer = element;
            behaviorContainer._behavior.attachWidget(this, behaviorContainer);
          }
        },
        /**
         * detach widget
         * @protected
         */
        _detachWidget: function() {
          for (const element of this._behaviors) {
            const behaviorContainer = element;
            behaviorContainer._behavior.detachWidget(this, behaviorContainer);
          }
        },
        /**
         * destroy behaviors
         * @protected
         */
        _destroyBehaviors: function() {
          for (const element of this._behaviors) {
            const behaviorContainer = element;
            behaviorContainer._behavior.cleanup(this, behaviorContainer);
            behaviorContainer._behavior = null;
          }
          this._behaviors.length = 0;
          this._behaviors = null;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this.emit(context.constants.controllerEvents.beforeDestroy);

          this._destroyBehaviors();
          this.detachUI();
          this._nodeBindings = null;
          this._widget = null;

          this._behaviorsNameList.clear();
          this._behaviorToApplytoVirtualWidgets.clear();
          for (const element of this._virtualWidgets) {
            element.commonBehaviorsName.clear();
          }
          this._virtualWidgets.length = 0;
          this._virtualWidgets = null;

          this._placeholderControllers.clear();
          this._placeholderControllers = null;

          $super.destroy.call(this);
        },

        /**
         * Get the anchor node
         * @returns {classes.NodeBase} the anchor node
         */
        getAnchorNode: function() {
          return this._nodeBindings && this._nodeBindings.anchor;
        },
        /**
         * Get the application node
         * @returns {classes.NodeBase} the ui node
         */
        getUINode: function() {
          return this._nodeBindings && this._nodeBindings.ui;
        },
        /**
         * get the nodes linked to the controller
         * @returns {ControllerBindings} the nodes
         */
        getNodeBindings: function() {
          return this._nodeBindings;
        },
        /**
         * get the nodes linked to the controller
         * @returns {ControllerBindings} the nodes
         */
        getNodeBindingsIds: function() {
          return this._nodeBindingsIds;
        },
        /**
         * update the nodes ids linked to the controller
         */
        updateNodeBindingsIds: function() {
          let keys = this._nodeBindings && Object.keys(this._nodeBindings) || [];
          this._nodeBindingsIds = keys.map(k => {
            if (this._watchedNodeBindings.has(k)) {
              let id = this._nodeBindings[k] && this._nodeBindings[k].getId();
              return Object.isNumber(id) ? id : -1;
            }
            return -1;
          });
        },
        /**
         * create widget
         * @returns {classes.WidgetBase} the widget
         */
        createWidget: function() {
          if (!this._widget && this.autoCreateWidget()) {
            this._initWidgetKind();
            this._widget = this._createWidget(this._widgetType);
          }
          return this._widget;
        },

        /**
         * create widget from given type
         * @param {string} widgetType the widget type
         * @returns {classes.WidgetBase} the widget
         */
        createWidgetFromType: function(widgetType) {
          if (!this._widget) {
            this._widgetType = widgetType;
            this._widget = this._createWidget(this._widgetType);
          }
          return this._widget;
        },

        /**
         * Check if the widget should be automatically created.
         * @return {boolean} true if controller will create widget automatically
         */
        autoCreateWidget: function() {
          return this._autoCreateWidget;
        },

        /**
         * Set if widget should be automatically created
         * @param {boolean} b true if widget should be automatically created
         */
        setAutoCreateWidget: function(b) {
          this._autoCreateWidget = b;
        },

        /**
         * Basic widget types depending on dialogType. To override for specific rules
         * @param {string} kind widget dialogType
         * @param {boolean} [active] is dialog active ?
         * @returns {string} widget type
         * @protected
         */
        _getWidgetType: function(kind, active) {
          return this.__name.replace("Controller", "");
        },

        /**
         * create widget
         * @param {string} [type] the widget type
         * @returns {classes.WidgetBase} the created widget
         * @protected
         */
        _createWidget: function(type) {
          return cls.WidgetFactory.createWidget(type, {
            realWidget: this._widget,
            appHash: this.getAnchorNode().getApplication().applicationHash,
            appWidget: this.getAnchorNode().getApplication().getUI().getWidget(),
            auiTag: this.getAnchorNode().getId(),
            inTable: this.isInTable(),
            inMatrix: this.isInMatrix(),
            inScrollGrid: this.isInScrollGrid(),
            inToolBar: this.isInToolBar()
          }, this.getAnchorNode());
        },

        /**
         * create a virtual widget
         * @param {classes.ControllerPlaceholderBase} placeholderController controller of the placeholder
         * @param {string} type the widget type
         * @returns {classes.WidgetBase} the created widget
         * @protected
         */
        createVirtualWidget: function(placeholderController, type) {
          const infoVirtualWidget = this._virtualWidgets.find(i => i.placeholderController === placeholderController);

          if (infoVirtualWidget) {
            return null;
          }

          const widget = this._createWidget(type);
          const info = {
            placeholderController: placeholderController,
            widget: widget,
            commonBehaviorsName: placeholderController._commonBehaviors(this)
          };

          //Update commons bevahiors
          info.commonBehaviorsName.forEach((behaviorName) => {
            this._behaviorToApplytoVirtualWidgets.add(behaviorName);
          });

          this._virtualWidgets.push(info);

          let hdl = widget.when(context.constants.widgetEvents.destroyed, (event) => {
            if (hdl) {
              hdl();
              hdl = null;
            }

            if (this._virtualWidgets) {
              this._virtualWidgets = this._virtualWidgets.filter(i => i !== info);
            }
          });

          return widget;
        },
        /**
         * Recreate widget depending on dialogType
         * @param {string} kind widget kind
         * @param {boolean} active is dialog active ?
         */
        changeWidgetKind: function(kind, active) {
          if ((kind !== this._widgetKind || active !== this._widgetActive) && this.autoCreateWidget()) {
            this._widgetKind = kind;
            this._widgetActive = active;
            const type = this._getWidgetType(kind, active);
            if (type !== this._widgetType) {
              this._widgetType = type;
              const oldWidget = this._widget;
              this._detachWidget();
              this._widget = this._createWidget(type);
              if (this._widget) {
                if (oldWidget) {
                  oldWidget.replaceWith(this._widget);
                } else {
                  // No older widget to replace, attach new one
                  this.attachUI();
                }
              }

              if (oldWidget) {
                oldWidget.destroy();
              }
              this._attachWidget();
              return true;
            } else if (this._widget.setWidgetMode) {
              this._widget.setWidgetMode(kind, active);
            }
          }
          return false;
        },

        /**
         * attach UI
         */
        attachUI: function() {
          const anchorNode = this.getAnchorNode();
          cls.NodeHelper.addToParentWidget(anchorNode, null);

          //Real widget controller attach virtual widgets in the placeholder
          if (this._virtualWidgets.length > 0) {
            const position = anchorNode.getIndex();
            const parentNode = anchorNode.getParentNode();

            const parentController = parentNode.getController();
            const parentId = parentNode.getId();

            for (this._virtualWidgetsIdx = 0; this._virtualWidgetsIdx < this._virtualWidgets.length; this._virtualWidgetsIdx++) {
              const info = this._virtualWidgets[this._virtualWidgetsIdx];
              const placeholderWidget = info.placeholderController.getWidget();

              placeholderWidget.setPositionInParent(info.placeholderController.getAnchorNode().getVirtualIndex());
              placeholderWidget.addVirtualChildWidget(parentId, info.widget, position);
              parentController._addPlaceholderController(info.placeholderController);
            }

            this._virtualWidgetsIdx = -1;
          }
        },

        /**
         * detach UI
         */
        detachUI: function() {
          if (this._widget) {
            if (this.autoCreateWidget()) { // if auto create --> auto destroy
              this._widget.destroy();
            }
            this._widget = null;
          }

          for (this._virtualWidgetsIdx = 0; this._virtualWidgetsIdx < this._virtualWidgets.length; this._virtualWidgetsIdx++) {
            const info = this._virtualWidgets[this._virtualWidgetsIdx];

            info.widget.destroy();
            info.commonBehaviorsName.clear();
            //TODO Maybe refresh the commonBehavior list (don't know if it is usefull in real life)
          }

          this._virtualWidgets.length = 0;
          this._virtualWidgetsIdx = -1;
        },

        /**
         * get the widget
         * @returns {classes.WidgetBase} the widget
         */
        getWidget: function() {
          if (this._virtualWidgetsIdx >= 0) {
            return this._virtualWidgets[this._virtualWidgetsIdx].widget;
          }

          return this._widget;
        },

        /**
         * Returns current internal widget (in table or matrix)
         * @returns {classes.WidgetBase} current internal widget
         * @public
         */
        getCurrentInternalWidget: function() {
          let widget = null;
          const node = this.getAnchorNode();
          if (node.getCurrentValueNode) {
            const valueNode = node.getCurrentValueNode(false);
            if (valueNode) {
              const controller = valueNode.getController();
              if (controller) {
                widget = controller.getWidget();
              }
            }
          }
          return widget;
        },

        /**
         * Ensures the widget corresponding to this controller is visible to the user
         * @param {boolean} [executeAction] - true to execute action linked (e.g. for a page, the linked action when showing)
         * @return {boolean} true if a layout is needed after that
         */
        ensureVisible: function(executeAction) {
          let p = this.getAnchorNode().getParentNode(),
            result = false;
          while (p !== null) {
            const controller = p.getController();
            if (controller !== null) {
              result = result || controller.ensureVisible(executeAction);
              break;
            }
            p = p.getParentNode();
          }
          return result;
        },

        /**
         * Try to set focus to controller's widget
         */
        setFocus: function() {
          if (this._widget && this._widget.setFocus) {
            this._widget.setFocus();
            this._widget.emit(context.constants.widgetEvents.focus);
          }
          // Hide filter menu item from chrome bar
          this.getUINode().getController().getWidget().showChromeBarFilterMenuItem(false);
        },

        /**
         * update dirty state of style application behaviors
         *
         * @param {boolean} noUsageCheck if false or not defined, set as dirty in all cases
         * @param {boolean} noRecurse if false or not defined, do it recursively
         * @param {boolean} fromPseudoSelection
         * @protected
         */
        setStyleBasedBehaviorsDirty: function(noUsageCheck, noRecurse, fromPseudoSelection) {
          const app = this.getAnchorNode().getApplication();
          for (const element of this._behaviors) {
            const behaviorContainer = element;
            const behavior = behaviorContainer._behavior,
              len = behavior.usedStyleAttributes && behavior.usedStyleAttributes.length;
            if (fromPseudoSelection) {
              behaviorContainer.dirty = true;
            } else if (len) {
              if (noUsageCheck) {
                behaviorContainer.dirty = true;
              } else {
                for (let j = 0; j < len; ++j) {
                  if (app.usedStyleAttributes[behavior.usedStyleAttributes[j]]) {
                    behaviorContainer.dirty = true;
                    break;
                  }
                }
              }
            }
          }
          if (!noRecurse) {
            const children = this.getAnchorNode().getRawChildren();
            for (const child of children) {
              const ctrl = child.getController();
              if (ctrl) {
                ctrl.setStyleBasedBehaviorsDirty(noUsageCheck, null, fromPseudoSelection);
              }
            }
          }
        },

        /**
         * Set stored setting for this controller
         * @param key {string} Setting key
         * @param value {*} Setting value
         */
        setStoredSetting: function(key, value) {},

        /**
         * Get stored setting for this controller
         * @param key {string} Setting key
         * @returns {*} the stored settings object, if any
         */
        getStoredSetting: function(key) {
          return null;
        },

        /**
         * Sends the updated value to the DVM
         * @param {?string} [newValue] - new value to send to VM. If not specified we send current widget value.
         */
        sendWidgetValue: function(newValue = null) {},

        /**
         * Sends the updated cursors to the DVM
         */
        sendWidgetCursors: function() {},

        /**
         * Check if Widget should be display in chromebar or keep the default behavior
         * @return {Boolean} true if it's displayed in the chromebar
         */
        isInChromeBar: function() {
          const anchor = this.getAnchorNode();
          const ancestorWindow = anchor.getAncestor("Window");
          const isInTabbedContainer = anchor.getApplication().getSession().isInTabbedContainerMode();
          const ancestorMenu = anchor.getAncestor("Menu");
          const isMenuWinMsg = ancestorMenu && ancestorMenu._vmStyles.indexOf("winmsg") >= 0 || anchor._vmStyles.indexOf("winmsg") >=
            0; //menu item in winmsg
          const isDialogMenu = ancestorMenu && ancestorMenu._vmStyles.indexOf("dialog") >= 0;
          const isPopupMenu = ancestorMenu && ancestorMenu._vmStyles.indexOf("popup") >= 0 || anchor._vmStyles.indexOf("popup") >=
            0; //menu item in popup
          const isWinMsg = ancestorWindow && ancestorWindow._vmStyles.indexOf("winmsg") >= 0; //menu item in winmsg
          const isWinModal = ancestorWindow && ancestorWindow.getStyleAttribute("windowType") === "modal"; //menu item in modal window

          // Position style for all MENU (and MENU items under this instruction)
          let ringMenuPositionStyle = ancestorWindow && (ancestorWindow._initialStyleAttributes.ringMenuPosition || gbc.ThemeService
            .getValue("gbc-WindowWidget-defaultRingMenuPosition"));
          // Position style for all ACTIONs in a DIALOG
          let actionPanelPositionStyle = ancestorWindow && (ancestorWindow._initialStyleAttributes.actionPanelPosition || gbc
            .ThemeService
            .getValue("gbc-WindowWidget-defaultActionPanelPosition"));

          // Position style for TOOLBAR
          // For the window toolbar, get the parent window style
          // For a global toolbar, get the first window style in userInterface node
          const tbWindow = ancestorWindow || anchor.getAncestor("UserInterface").getChildren("Window")[0];
          let toolbarPositionStyle = tbWindow && (tbWindow._initialStyleAttributes.toolBarPosition || gbc.ThemeService.getValue(
            "gbc-WindowWidget-defaultToolBarPosition"));
          //Override if chrome position is set at toolbar level
          const toolBarNode = this.isInstanceOf(cls.ToolBarItemController) ? this.getAnchorNode().getParentNode() : this.getAnchorNode();
          toolbarPositionStyle = toolBarNode._initialStyleAttributes.position ?? toolbarPositionStyle;
          // In tabbed container mode, override the default theme / 4ST to never use the chromebar
          if (isInTabbedContainer) {
            toolbarPositionStyle = toolbarPositionStyle === "chrome" ? "top" : toolbarPositionStyle;
            ringMenuPositionStyle = ringMenuPositionStyle === "chrome" ? "right" : ringMenuPositionStyle;
            actionPanelPositionStyle = actionPanelPositionStyle === "chrome" ? "right" : actionPanelPositionStyle;
          }

          // This final step defines if the position is in chromeBar
          let position4STChrome = false;
          if (this.isInstanceOf(cls.ToolBarController) || this.isInstanceOf(cls.ToolBarItemController) || this.isInstanceOf(cls
              .ToolBarAutoItemsController)) {
            position4STChrome = toolbarPositionStyle === "chrome";
          } else if (this.isInstanceOf(cls.MenuActionController) || this.isInstanceOf(cls.MenuController)) {
            position4STChrome = ringMenuPositionStyle === "chrome";
          } else if (this.isInstanceOf(cls.ActionController)) {
            position4STChrome = actionPanelPositionStyle === "chrome";
          } else if (this.isInstanceOf(cls.DialogController)) {
            position4STChrome = actionPanelPositionStyle === "chrome";
          }

          // Don't display menus as chromebar on modal or popup
          return position4STChrome && !isDialogMenu && !isMenuWinMsg && !isPopupMenu && !isWinMsg && !isWinModal;
        },

        /**
         * Register a placeholder controller
         * @param {classes.ControllerPlaceholderBase} controller
         * @private
         */
        _addPlaceholderController: function(controller) {
          let hdl = controller.getWidget().when(context.constants.widgetEvents.destroyed, (event) => {
            if (hdl) {
              hdl();
              hdl = null;
            }

            if (this._placeholderControllers) {
              this._placeholderControllers.delete(controller.getWidget().getUniqueIdentifier());
            }
          });

          this._placeholderControllers.set(controller.getWidget().getUniqueIdentifier(), controller);
        },

        /**
         * Get the placeholder controller Map
         * @return {Map}
         */
        getPlaceholderControllers: function() {
          return this._placeholderControllers;
        },

        /**
         * Returns true if the widget has an associated dropdown opened
         * @returns {boolean}
         */
        hasActiveDropDown: function() {
          return false;
        },

        /**
         * Returns true if this controller is in an input kind dialog type
         * @returns {boolean}
         */
        isInputKindDialogType: function() {
          const dialogType = this._nodeBindings.anchor?.attribute('dialogType') ||
            this._nodeBindings.container?.attribute('dialogType');

          return (['Input', 'InputArray', 'Construct'].contains(dialogType));
        }
      };
    });
  });
