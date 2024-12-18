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

modulum('ValueVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Value VM command
     * This class updates the value of a widget
     * @class ValueVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.ValueVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.ValueVMCommand.prototype */ {
        __name: "ValueVMCommand",

        /** @type {?string} */
        _newValue: null,
        /** @type {boolean} */
        _canBeExecuted: true,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.NodeBase} node - target node
         * @param {string} newValue - current value of the node
         * @param {boolean} [canBeExecuted] - true if the current command can be executed, false otherwise
         * @param {boolean} [vmSync] - by default value command requires a VM sync meaning generated command won't be merged with another command
         */
        constructor: function(app, node, newValue, canBeExecuted, vmSync = true) {
          $super.constructor.call(this, app, node);
          this._newValue = newValue;
          this._canBeExecuted = canBeExecuted;
          this._needsVmSync = vmSync;
        },

        /**
         * @inheritDoc
         */
        checkIntegrity: function() {
          let ok = false;

          // check integrity
          if (this._node && this._node.getController()) {

            // if value has not changed, no need to check focusVMNode for integrity
            if (!this._hasValueChanged(this._node.getController())) {
              return $super.checkIntegrity.call(this);
            }

            const focusedVMNode = this._app.getFocusedVMNode();

            // integrity is ok if:
            // value node is in the focused table
            ok = (this._node.getAncestor("Table") === focusedVMNode);
            // value node is in the focused matrix
            ok = ok || (this._node.getAncestor("Matrix") === focusedVMNode);
            // value node is in a webcomponent (this a special case because value can be sent even if webcomponent has the focus, specially when it is not active
            ok = ok || (this._node.getController() instanceof cls.WebComponentController);
            // In the case of richtext widget, it's a webcomponent and must be considered as previous case
            ok = ok || (this._node.getWidget().isInstanceOf(cls.WebComponentWidget));
            // or if value node is the focused one
            ok = ok || (focusedVMNode === this._node);
          }

          return ok && $super.checkIntegrity.call(this);
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          const ctrl = this._node.getController();

          if (ctrl) {
            if (this._hasValueChanged(ctrl)) {

              if (this._isValueNode) {
                const tableNode = this._node.getAncestor("Table");
                // if we send a value in a table, update table cached data model with this new value
                if (tableNode) {
                  const tableWidgetBase = /** @type classes.TableWidgetBase */ tableNode.getWidget();
                  const tableCachedDataModel = tableWidgetBase.getCachedDataModel();
                  if (tableCachedDataModel) {
                    tableCachedDataModel.updateDataFromValueNode( /** @type classes.ValueNode */ this._node, "value", this._newValue);
                  }
                }
              }

              const valueObj = {
                value: this._newValue,
              };
              const event = new cls.VMConfigureEvent(this._node.getId(), valueObj);
              this._vmEvents = [event];
            }
          }
          return this._vmEvents && this._vmEvents.length > 0;
        },

        /**
         * Checks if the value has changed
         * @returns {boolean} true if the value has changed, false otherwise
         * @private
         */
        _hasValueChanged: function(controller) {
          return this._newValue !== controller.getAuiValue();
        },

        /**
         * @inheritDoc
         */
        canBeExecuted: function() {
          return this._canBeExecuted;
        },

      };
    });
  }
);
