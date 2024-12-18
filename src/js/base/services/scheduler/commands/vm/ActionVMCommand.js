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

modulum('ActionVMCommand', ['CommandVMBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Command VM action.
     * @class ActionVMCommand
     * @memberOf classes
     * @extends classes.CommandVMBase
     */
    cls.ActionVMCommand = context.oo.Class(cls.CommandVMBase, function($super) {
      return /** @lends classes.ActionVMCommand.prototype */ {
        __name: "ActionVMCommand",

        /** @type boolean */
        _noUserActivity: false,

        /** @type boolean */
        _dialogTouched: false,

        /** @type null|classes.NodeBase */
        _conflictNode: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.NodeBase} node action
         * @param {Object} options - add options
         */
        constructor: function(app, node, options) {
          $super.constructor.call(this, app, node);
          this._noUserActivity = Boolean(options.noUserActivity);
          this._dialogTouched = node && (node.attribute('name') === 'dialogtouched');
          this._actionName = options.actionName;

          this._needsVmSync = true;
        },

        /**
         * @inheritDoc
         */
        canBeExecuted: function() {
          // If the action has to be executed by its name, retrieve the action name before
          if (this._actionName) {
            this._node = this._app.action.getAction(this._actionName);
            this._actionName = null; // set back to null to avoid searching again for the same action node
          }

          let sendActionEvent = false;

          if (this._node) {
            switch (this._node.getTag()) {
              case "StartMenuCommand":
                sendActionEvent = (this._node.attribute('disabled') !== 1);
                break;
              case "IdleAction":
                sendActionEvent = true;
                break;
              default:
                let parentNode = this._node.getParentNode();
                if (parentNode.getTag() === "TableColumn") {
                  parentNode = parentNode.getParentNode(); // we want the table node
                }
                // Check if action is active
                const hasActionActiveAttr = this._node.isAttributeSetByVM('actionActive');
                const hasActiveAttr = this._node.isAttributeSetByVM('active');
                const hasParentActiveAttr = parentNode && parentNode.isAttributeSetByVM('active');

                let active = false;
                if (hasActionActiveAttr) {
                  active = this._node.attribute('actionActive');
                } else if (hasActiveAttr) {
                  active = this._node.attribute('active');
                }

                if (hasParentActiveAttr && parentNode.attribute('active')) {
                  active = active && parentNode.attribute('active');
                }

                sendActionEvent = active;

                if (sendActionEvent) {
                  // check if any conflict can exist with current action
                  this._conflictNode = this._getConflictNode(this._node);
                }
            }
          }

          return sendActionEvent;
        },

        /**
         * Check if current action can be in conflict with another node action
         * @param node
         * @returns {null|classes.NodeBase}
         * @private
         */
        _getConflictNode: function(node) {
          // image specific
          // if we resolve Image node as having a valid action to send to VM, then flag parent Table/ScrollGris not to send
          if (node.getTag() === "Image" && (node.isInTable() || node.isInScrollGrid())) {
            return node.getAncestor("Table") || node.getAncestor("ScrollGrid");
          }
          return null;
        },

        /**
         * @inheritDoc
         */
        execute: function() {

          if (this.canBeExecuted()) {

            const events = [];

            let actionEvent = new cls.VMActionEvent(this._node.getId());
            actionEvent.noUserActivity = this._noUserActivity;
            events.push(actionEvent);

            if (events.length > 0) {
              // if we send an Action or Key event, check if we are in a PagedScrollGrid
              let focusedNode = this._node.getApplication().getFocusedVMNode();
              let scrollGridNode = focusedNode.getAncestor("ScrollGrid");
              let isPagedScrollGrid = scrollGridNode && scrollGridNode.getController().isPagedScrollGrid();

              if (isPagedScrollGrid) {
                // in a PagedScrollGrid send offset to force VM to not change it,
                // it is only frontend which can change offset
                let offset = focusedNode.attribute('offset');
                events.push(new cls.VMConfigureEvent(focusedNode.getId(), {
                  offset: offset
                }));
              }
            }

            if (events.length > 0) {
              this._vmEvents = events;
            }
          }

          return this._vmEvents && this._vmEvents.length > 0;
        },

      };
    });
  }
);
