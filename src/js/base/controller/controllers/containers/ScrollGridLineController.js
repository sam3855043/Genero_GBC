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

modulum('ScrollGridLineController', ['EventListener'],
  function(context, cls) {
    /**
     * This class need to be refactored and removed
     * @class ScrollGridLineController
     * @memberOf classes
     * @extends classes.EventListener
     */
    cls.ScrollGridLineController = context.oo.Class(cls.EventListener, function($super) {
      return /** @lends classes.ScrollGridLineController.prototype */ {
        __name: "ScrollGridLineController",
        /**
         * Controller widget
         * @type {classes.WidgetBase}
         */
        _widget: null,

        /**
         * @type {number}
         */
        _index: -1,
        _scrollGridNode: null,
        _childrenControllers: null,

        constructor: function(scrollGridNode, index) {
          this._scrollGridNode = scrollGridNode;
          this._childrenControllers = [];
          this._index = index;
          this._widget = cls.WidgetFactory.createWidget('StretchableScrollGridLine',
            scrollGridNode.getController().getWidget().getBuildParameters());
          // we need to track row index of the widget because we may not be able to retrieve it from node later on (static image)
          this._widget.setRowIndex(index);
          const children = this._scrollGridNode.getChildren();
          for (const element of children) {
            this._createControllers(element, this._widget);
          }
        },

        destroy: function() {
          this._recursiveRemove(this._scrollGridNode);
          this._widget.destroy();
        },

        _applyBehaviors: function() {
          for (const ctrl of this._childrenControllers) {
            if (ctrl._behaviors !== null) {
              ctrl.applyBehaviors(null, true);
            }
          }
        },

        /**
         * Makes sure each child has controllers
         */
        updateControllers: function() {
          for (let element of this._scrollGridNode.getChildren()) {
            this._createControllers(element, this._widget);
          }
        },

        _createControllers: function(node, parentWidget) {
          let ctrl = null;
          let widget = null;
          if (node.getTag() === "Matrix") {
            if (node._controller === null) {
              node._controller = node._createController();
            }
            const valueList = node.getFirstChild("ValueList");
            if (valueList) {
              const valueNode = valueList.getChildren()[this._index];
              if (valueNode) {
                ctrl = valueNode.getController();
                if (!ctrl) {
                  ctrl = valueNode._createController({
                    scrollGridLineController: this
                  });
                  valueNode._controller = ctrl;
                  widget = ctrl.createWidget();
                  ctrl.applyBehaviors();
                  parentWidget.addChildWidget(widget);
                  ctrl._attachWidget();

                  this._childrenControllers.push(ctrl);
                }
              }
            }
          } else {
            let ctrlGroup = null;
            const nodeController = node._controller;
            if (!nodeController) {
              ctrlGroup = new cls.ControllerGroup(node);
              node._controller = ctrlGroup;
            } else if (nodeController.isInstanceOf(cls.ControllerGroup)) {
              ctrlGroup = nodeController;
            } else {
              return; // if controller is already created and if it is not a ControllerGroup, nothing to do
            }
            ctrl = node._createController({
              scrollGridLineController: this
            });
            if (ctrl) {
              ctrlGroup.addController(ctrl);
              widget = ctrl.createWidget();
              ctrl.applyBehaviors();
              parentWidget.addChildWidget(widget);
              ctrl._attachWidget();
              if (node.getTag() === "HBox" || node.getTag() === "Group") {
                const nodeChildren = node.getChildren();
                for (const element of nodeChildren) {
                  this._createControllers(element, widget);
                }
              }
            }
          }
        },

        _recursiveRemove: function(node) {
          const children = node.getChildren();
          for (const element of children) {
            this._recursiveRemove(element, this._index);
          }
          if (node._controller) {
            if (node._controller instanceof cls.ControllerGroup) {
              const ctrls = node._controller.getControllers();
              if (ctrls[this._index]) {
                ctrls[this._index].destroy();
              }
              ctrls.splice(this._index);
            } else if (node.getTag() === "Value" && node.getIndex() === this._index) {
              node._controller.destroy();
              node._controller = null;
            }
          }
        },

        getWidget: function() {
          return this._widget;
        },

        getIndex: function() {
          return this._index;
        },
      };
    });
  });
