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

modulum('CursorsVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class CursorsVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.CursorsVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.CursorsVMBehavior.prototype */ {
        __name: "CursorsVMBehavior",

        watchedAttributes: {
          container: ['cursor', 'cursor2', 'currentRow', 'offset', 'currentColumn', 'dialogType'],
          ui: ['focus'],
          table: ['currentRow', 'currentColumn', 'offset', 'dialogType']
        },

        /**
         * Get container node
         * @param {classes.NodeBase} containerNode - basic container node
         * @returns {classes.NodeBase} returns container node
         * @private
         */
        _getMainArrayContainer: function(containerNode) {
          switch (containerNode.getTag()) {
            case 'TableColumn':
              return containerNode.getParentNode();
            case 'Matrix':
              return containerNode;
            default:
              return null;
          }
        },

        /**
         * Set cursors position to the widget input field
         * @param controller
         * @param data
         * @private
         */
        _apply: function(controller, data) {
          let widget = null;
          const anchorNode = controller.getAnchorNode();
          const containerNode = controller.getNodeBindings().container;
          const app = anchorNode.getApplication();
          const uiNode = app.uiNode();
          const focusedNodeId = uiNode.attribute('focus');

          const arrayContainer = this._getMainArrayContainer(containerNode);
          if (arrayContainer) {
            // Table or Matrix
            if (focusedNodeId === arrayContainer._id) {
              const currentRow = arrayContainer.attribute("currentRow");
              const offset = arrayContainer.attribute("offset");
              const anchorRowIndex = anchorNode.getIndex();
              if (anchorRowIndex === currentRow - offset) {
                if (arrayContainer.getTag() === "Table") { // consider also currentColumn for table
                  const currentColumn = arrayContainer.attribute("currentColumn");
                  const anchorColumnIndex = containerNode.getIndex();
                  if (anchorColumnIndex === currentColumn) {
                    widget = controller.getWidget();
                  }
                } else {
                  widget = controller.getWidget();
                }
              }
            }
          } else {
            // FormField
            if (focusedNodeId === anchorNode.getId()) {
              widget = controller.getWidget();
            }
          }

          if (widget?.hasCursors()) {

            const cursor = containerNode.attribute('cursor');
            const cursor2 = containerNode.attribute('cursor2');

            let widgetValue = "";
            let auiValue = "";
            // convert both widget and aui value as string to compare without any type conflict
            if (controller.getAuiValue && controller.getWidgetValue) { // focus on a ValueContainerBaseController
              auiValue = controller.getAuiValue();
              widgetValue = controller.getWidgetValue();
            }
            if (widget?.isEnabled() && widgetValue === auiValue) {
              if (widget?.getInputElement && document.activeElement !== widget?.getInputElement()) {
                // if cursors have been updated and focused field doesn't have dom focus anymore (can happen if user clicked somewhere else before) then we flag the next restore focus command to restore dom focus
                app.scheduler.restoreFocusCommand(true);
              }
              widget?.setCursors(cursor, cursor2);
            }
          }
        }
      };
    });
  });
