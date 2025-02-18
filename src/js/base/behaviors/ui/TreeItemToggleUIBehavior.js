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

modulum('TreeItemToggleUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class TreeItemToggleUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.TreeItemToggleUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.TreeItemToggleUIBehavior.prototype */ {
        __name: "TreeItemToggleUIBehavior",

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const treeViewWidget = controller.getWidget();
          if (treeViewWidget) {
            data.onClickHandle = treeViewWidget.when(context.constants.widgetEvents.toggleClick, this._toggleState.bind(this,
              controller, data));
          }

        },

        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.onClickHandle) {
            data.onClickHandle();
            data.onClickHandle = null;
          }
        },

        /**
         *
         * @param controller
         * @param data
         * @param event
         * @param sender
         * @param {number} index
         * @private
         */
        _toggleState: function(controller, data, event, sender, index) {
          const tableNode = controller.getAnchorNode();
          const treeItemNode = tableNode.findNodeWithAttribute("TreeItem", "row", index);

          if (treeItemNode.attribute('hasChildren') !== 0) {
            let expanded = treeItemNode.attribute('expanded');
            if (expanded === 0) {
              expanded = 1;
            } else {
              expanded = 0;
            }
            const vmEvent = new cls.VMConfigureEvent(treeItemNode.getId(), {
              expanded: expanded
            });
            treeItemNode.getApplication().scheduler.eventVMCommand(vmEvent, treeItemNode);
          }
        }
      };
    });
  });
