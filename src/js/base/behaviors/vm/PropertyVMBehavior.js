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

modulum('PropertyVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's Property
     * @class PropertyVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.PropertyVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.PropertyVMBehavior.prototype */ {
        __name: "PropertyVMBehavior",

        /**
         * Updates the widget's visibility depending on the AUI tree information
         * @param {classes.WebComponentController} controller
         * @param {*} data
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setProperty) {
            const webComponentNode = controller.getNodeBindings().decorator;
            const children = webComponentNode.getChildren();
            if (children.length > 0) {
              const property = this._propertyToJson(children[0]);
              controller.bufferizeProperties(property);
            }
          }
        },

        _attach: function(controller, data) {
          const node = controller.getNodeBindings().decorator;
          data.nodeCreatedHandler = node.onNodeCreated(this._onNodeCreated.bind(this, controller, data), "Property");
          const webComponentNode = controller.getNodeBindings().decorator;
          const children = webComponentNode.getDescendants("Property");
          if (children.length > 0) {
            if (!data._attrChangedHandlers) {
              data._attrChangedHandlers = [];
            }
            children.forEach(function(propChild) {
              data._attrChangedHandlers.push(propChild.onAttributeChanged("value", function(event, node, data) {
                this._apply(controller, data);
              }.bind(this)));

            }.bind(this));
          }
        },

        _detach: function(controller, data) {
          if (data._attrChangedHandlers) {
            data._attrChangedHandlers.forEach(function(attrChangedHandle) {
              attrChangedHandle();
            });
            data._attrChangedHandlers.length = 0;
            data._attrChangedHandlers = null;
          }
          if (data.nodeCreatedHandler) {
            data.nodeCreatedHandler();
            data.nodeCreatedHandler = null;
          }
        },

        _onNodeCreated: function(controller, data, event, src, node) {
          node.onNodeCreated(this._onNodeCreated.bind(this, controller, data));
          if (!data._attrChangedHandlers) {
            data._attrChangedHandlers = [];
          }
          data._attrChangedHandlers.push(node.onAttributeChanged("value", function(event, node, data) {
            this._apply(controller, data);
          }.bind(this)));
          this._apply(controller, data);
        },

        /**
         * Convert PropertyDict node to JSON property
         * @param node
         * @returns {{}}
         * @private
         */
        _propertyToJson: function(node) {
          const jsonProperties = {};
          let childNode = null;
          const children = node.getChildren();
          const count = children && children.length || 0;
          for (let i = 0; i < count; i++) {
            childNode = children[i];
            if (childNode._tag === "Property") {
              jsonProperties[childNode.attribute("name")] = childNode.attribute("value");
            } else if (childNode._tag === "PropertyArray") {
              jsonProperties[childNode.attribute("name")] = this._propertyArrayToJson(childNode);
            } else if (childNode._tag === "PropertyDict") {
              jsonProperties[childNode.attribute("name")] = this._propertyToJson(childNode);
            }
          }
          return jsonProperties;
        },

        /**
         * Convert PropertyArray node to JSON property
         * @param node
         * @returns {Array}
         * @private
         */
        _propertyArrayToJson: function(node) {
          const propertyArray = [];
          let childNode = null;
          const children = node.getChildren();
          const count = children && children.length || 0;
          for (let i = 0; i < count; i++) {
            childNode = children[i];
            propertyArray.push(childNode.attribute("value"));
          }
          return propertyArray;
        }
      };
    });
  });
