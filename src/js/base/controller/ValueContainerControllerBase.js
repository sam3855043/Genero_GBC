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

modulum('ValueContainerControllerBase', ['ControllerBase'],
  function(context, cls) {
    /**
     * Base controller for an AUI node.
     * Manages client side life cycle representation of the node.
     * @class ValueContainerControllerBase
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.ValueContainerControllerBase = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.ValueContainerControllerBase.prototype */ {
        __name: "ValueContainerControllerBase",

        /**
         * @inheritDoc
         */
        _initBehaviors: function() {
          $super._initBehaviors.call(this);
          if (this.isInStack() && !(this.isInMatrix() || this.isInTable())) {
            this._addBehavior(cls.StackLabelVMBehavior);
          }
        },

        /**
         * Creates a new widget depending on the dialog type
         * @returns {classes.WidgetBase} the widget
         */
        createWidget: function() {
          if (!this._widget && this.autoCreateWidget()) {
            let dialogType = null;

            // Determine the widget kind of a valueNode
            if (this.getAnchorNode()) {
              dialogType = this.getAnchorNode().attribute('dialogType');
            }
            if (!dialogType && this.getNodeBindings().decorator) {
              dialogType = this.getNodeBindings().decorator.attribute('dialogType');
            }
            if (!dialogType && this.getNodeBindings().container) {
              dialogType = this.getNodeBindings().container.attribute('dialogType');
            }

            const type = this._getWidgetType(dialogType);

            this._widgetKind = dialogType;
            this._widgetType = type;

            this._widget = this._createWidget(type);
          }
          return this._widget;
        },

        /**
         *
         * @inheritDoc
         * @protected
         * @virtual
         */
        _createWidget: function(type) {
          return cls.WidgetFactory.createWidget(type, {
            appHash: this.getAnchorNode().getApplication().applicationHash,
            appWidget: this.getAnchorNode().getApplication().getUI().getWidget(),
            auiTag: this.getAnchorNode().getId(),
            inTable: this.isInTable(),
            inFirstTableRow: this.isInFirstTableRow(),
            inMatrix: this.isInMatrix(),
            inScrollGrid: this.isInScrollGrid()
          }, this.getNodeBindings().decorator);
        },

        /**
         * Strategy method which returns widget value in VM ready format
         * @returns {string} the widget value
         * @protected
         */
        getWidgetValue: function(newValue = null) {
          const decoratorNode = this.getNodeBindings().decorator;
          const widget = this.getWidget();
          let value = newValue !== null ? newValue : widget.getValue();

          if (value === null || value === undefined) {
            value = "";
          } else {
            value = value.toString();
          }
          value = this._shiftConversion(value, widget, decoratorNode);

          // Validate value, if not valid, rollback to old VM's value!
          if (widget instanceof cls.FieldWidgetBase && !widget.validateValue()) {
            value = widget._oldValue; // don't touch this, or it will break spinedit min value initialisation when out of allowed range
            widget.setValue(value);
          }
          return value;
        },

        /**
         * Strategy method which returns AUI value in VM ready format
         * @returns {string} the AUI value
         */
        getAuiValue: function() {
          const valueNode = this.getNodeBindings().anchor;
          return valueNode.attribute("value").toString();
        },

        /**
         * Get the value depending on the shift attribute
         * @param {string} value - value to process
         * @param {classes.WidgetBase} widget - concerned widget
         * @param {classes.NodeBase} decoratorNode - concerned Node
         * @return {string} - the updated value
         * @private
         */
        _shiftConversion: function(value, widget, decoratorNode) {
          // manage upshift & downshift case
          if (decoratorNode && decoratorNode.isAttributeSetByVM('shift')) {
            let shiftAttr = decoratorNode.attribute('shift');
            if (this.getWidget() && this.getWidget().getTextTransform) {
              shiftAttr = this.getWidget().getTextTransform();
            }
            if (shiftAttr !== "none" && (widget.isEditing && widget.isEditing())) {
              switch (shiftAttr) {
                case 'up':
                  value = value.toUpperCase();
                  break;
                case 'down':
                  value = value.toLowerCase();
                  break;
              }
            }
          }
          return value;
        },

        /**
         * @inheritDoc
         */
        sendWidgetValue: function(newValue = null) {
          const anchorNode = this.getAnchorNode();
          const widgetValue = this.getWidgetValue(newValue);
          anchorNode.getApplication().scheduler.valueVMCommand(anchorNode, widgetValue);
        },

        /**
         * @inheritDoc
         */
        sendWidgetCursors: function() {
          const widget = this.getWidget();
          if (!widget || !widget.hasCursors()) {
            return;
          }
          const cursors = widget.getCursors();
          const anchorNode = this.getAnchorNode();
          const widgetValueLength = this.getWidgetValue().length;
          anchorNode.getApplication().scheduler.cursorsVMCommand(anchorNode, cursors.start, cursors.end, widgetValueLength);
        },

        /**
         * @inheritDoc
         */
        hasActiveDropDown: function() {
          if (this._widget) {
            return !!this._widget.getDropDown && !!this._widget.getDropDown() && this._widget.getDropDown().isVisible();
          }
          return $super.hasActiveDropDown.call(this);
        }
      };
    });
  });
